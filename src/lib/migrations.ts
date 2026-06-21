import supabase from './supabase';
import {
  loadLeads,
  loadBuilders,
  loadUsedHomes,
  loadFavoritePins,
  loadProfile,
  loadAppointments,
  loadPinLayerPrefs,
  loadWallPosts,
  loadOpenHouseRequests,
} from './storage';

export type MigrationResult = {
  key: string;
  table: string;
  countLocal: number;
  inserted: number;
  skipped: number;
  errors: string[];
};

// Mapping AsyncStorage keys -> loader function and target table name
const KEY_MAPPING: Record<
  string,
  { loader: () => Promise<any[]> | Promise<any | null>; table: string }
> = {
  PR_leads_v8_hybrid: { loader: loadLeads, table: 'leads' },
  PR_builders_v8_inventory: { loader: loadBuilders, table: 'builders' },
  PR_used_homes_v7_inventory: { loader: loadUsedHomes, table: 'used_homes' },
  PR_pins_v7_inventory: { loader: loadFavoritePins, table: 'favorite_pins' },
  PR_profile_v8_hybrid: { loader: loadProfile, table: 'users' },
  PR_appointments_v1: { loader: loadAppointments, table: 'appointments' },
  PR_pin_prefs_v1: { loader: loadPinLayerPrefs, table: 'pin_prefs' },
  PR_wall_posts_v1: { loader: loadWallPosts, table: 'wall_posts' },
  PR_open_house_requests_v1: { loader: loadOpenHouseRequests, table: 'open_house_requests' },
};

function isArrayLike(v: any): v is any[] {
  return Array.isArray(v);
}

export async function countLocalRecords(key: string): Promise<number> {
  const map = KEY_MAPPING[key];
  if (!map) throw new Error(`Unknown AsyncStorage key: ${key}`);
  const data = await map.loader();
  if (data == null) return 0;
  return isArrayLike(data) ? data.length : 1;
}

export function validateRequiredFields(table: string, item: any): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (table === 'users') {
    if (!item?.email && !(item?.profile && item.profile.email)) missing.push('email');
  } else if (table === 'leads') {
    if (!item?.buyerName && !item?.title) missing.push('buyerName/title');
    if (!item?.createdAt) missing.push('createdAt');
  } else if (table === 'builders') {
    if (!item?.name && !item?.communityName) missing.push('name/communityName');
    if (!item?.locationLat || !item?.locationLon) missing.push('locationLat/locationLon');
  } else if (table === 'used_homes') {
    if (!item?.id && !item?.title) missing.push('id/title');
    if (!item?.latitude || !item?.longitude) missing.push('latitude/longitude');
  }
  // For other tables, be permissive; payload jsonb will store the full object.
  return { ok: missing.length === 0, missing };
}

export function prepareUpsertPayload(table: string, item: any) {
  // Prefer explicit columns when available, fallback to payload jsonb
  switch (table) {
    case 'users':
      return {
        email: item?.email || item?.profile?.email || null,
        profile: item?.profile ?? item,
      };
    case 'leads':
      return {
        title: item?.buyerName || item?.title || null,
        payload: item,
        created_at: item?.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    case 'builders':
      return {
        name: item?.name || item?.communityName || null,
        community_name: item?.communityName || null,
        min_price: item?.minPrice ?? null,
        max_price: item?.maxPrice ?? null,
        schools: item?.schools ?? null,
        location_lat: item?.locationLat ?? null,
        location_lon: item?.locationLon ?? null,
        payload: item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    case 'used_homes':
      return {
        title: item?.title ?? null,
        price: item?.price ?? null,
        beds: item?.beds ?? null,
        baths: item?.baths ?? null,
        sqft: item?.sqft ?? null,
        latitude: item?.latitude ?? null,
        longitude: item?.longitude ?? null,
        payload: item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    case 'favorite_pins':
      return {
        title: item?.title ?? null,
        subtitle: item?.subtitle ?? null,
        category: item?.category ?? null,
        latitude: item?.latitude ?? null,
        longitude: item?.longitude ?? null,
        payload: item,
        created_at: new Date().toISOString(),
      };
    case 'appointments':
      return {
        at: item?.at ? new Date(item.at).toISOString() : null,
        date: item?.date ?? null,
        time: item?.time ?? null,
        builder_name: item?.builderName ?? null,
        lead_name: item?.leadName ?? null,
        payload: item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    case 'pin_prefs':
      return {
        prefs: item ?? {},
        updated_at: new Date().toISOString(),
      };
    case 'wall_posts':
      return {
        created_at: item?.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        author_name: item?.authorName ?? null,
        author_brokerage: item?.authorBrokerage ?? null,
        category: item?.category ?? null,
        role: item?.role ?? null,
        title: item?.title ?? null,
        body: item?.body ?? null,
        payload: item,
      };
    case 'open_house_requests':
      return {
        created_at: item?.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        builder_name: item?.builderName ?? null,
        community_name: item?.communityName ?? null,
        requested_date: item?.requestedDate ?? null,
        requested_time: item?.requestedTime ?? null,
        notes: item?.notes ?? null,
        status: item?.status ?? null,
        payload: item,
        updated_at: new Date().toISOString(),
      };
    default:
      return { payload: item };
  }
}

export async function recordMigrationStatus(key: string, meta: any, dryRun = true) {
  const payload = { key, migrated_at: new Date().toISOString(), meta };
  if (dryRun) {
    // do not write to DB in dry-run
    // eslint-disable-next-line no-console
    console.log('[dry-run] recordMigrationStatus', payload);
    return { error: null };
  }
  return supabase.from('migrations_asyncstorage').upsert(payload);
}

export async function migrateKey(
  key: string,
  options: { dryRun?: boolean; ownerId?: string; requesterId?: string } = {}
): Promise<MigrationResult> {
  const dryRun = !!options.dryRun;
  const map = KEY_MAPPING[key];
  if (!map) throw new Error(`Unknown key mapping for ${key}`);

  const data = await map.loader();
  const items = isArrayLike(data) ? data : data == null ? [] : [data];
  const result: MigrationResult = { key, table: map.table, countLocal: items.length, inserted: 0, skipped: 0, errors: [] };

  for (const item of items) {
    try {
      const v = validateRequiredFields(map.table, item);
      if (!v.ok) {
        result.skipped += 1;
        result.errors.push(`missing_fields:${v.missing.join(',')}`);
        continue;
      }

      const payload = prepareUpsertPayload(map.table, item);

      // inject optional ownership fields when provided via options
      if (map.table === 'favorite_pins' && options.ownerId) {
        payload.owner_id = options.ownerId;
      }
      if (map.table === 'used_homes' && options.ownerId) {
        payload.owner_id = options.ownerId;
      }
      if (map.table === 'appointments' && options.ownerId) {
        payload.owner_id = options.ownerId;
      }
      if (map.table === 'open_house_requests' && options.requesterId) {
        payload.requester_id = options.requesterId;
      }

      // special handling: pin_prefs requires owner_id (PK) — skip real insert unless provided
      if (map.table === 'pin_prefs' && !options.ownerId) {
        if (dryRun) {
          // eslint-disable-next-line no-console
          console.warn('[dry-run] pin_prefs would be skipped for real migration unless owner_id is provided');
          result.inserted += 0;
        } else {
          result.skipped += 1;
          result.errors.push('pin_prefs_missing_owner_id');
        }
        continue;
      }

      // warn in dry-run if required FK ownership is missing for certain tables
      if (dryRun && (map.table === 'favorite_pins' || map.table === 'used_homes' || map.table === 'appointments' || map.table === 'open_house_requests')) {
        const needOwner = map.table === 'open_house_requests' ? !!options.requesterId : !!options.ownerId;
        if (!needOwner) {
          // eslint-disable-next-line no-console
          console.warn(`[dry-run] Note: ${map.table} migration may require owner_id/requester_id; none supplied`);
        }
      }

      if (dryRun) {
        // eslint-disable-next-line no-console
        console.log('[dry-run] would upsert into', map.table, payload);
        result.inserted += 1;
      } else {
        // Use upsert to avoid duplicate-insert failures; conflict handling is DB-side.
        const { error } = await supabase.from(map.table).upsert(payload as any);
        if (error) {
          result.errors.push(String(error.message || error));
        } else {
          result.inserted += 1;
        }
      }
    } catch (err: any) {
      result.errors.push(String(err?.message || err));
    }
  }

  // record migration summary
  await recordMigrationStatus(key, { summary: result }, dryRun);
  return result;
}

export async function runMigration(keys: string[], options: { dryRun?: boolean } = {}) {
  const results: MigrationResult[] = [];
  for (const key of keys) {
    // eslint-disable-next-line no-console
    console.log(`Migrating key: ${key} (dryRun=${!!options.dryRun})`);
    const r = await migrateKey(key, options);
    results.push(r);
    // eslint-disable-next-line no-console
    console.log('Result:', r);
  }
  return results;
}

export const AVAILABLE_KEYS = Object.keys(KEY_MAPPING);

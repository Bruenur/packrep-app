import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultBuilders } from "../data/builders";
import type { PinCategory } from "../data/demoMapPins";

const KEY_LEADS = "PR_leads_v8_hybrid";
const KEY_BUILDERS = "PR_builders_v8_inventory";
const LEGACY_KEY_BUILDERS = "PR_builders_v7_inventory";
const KEY_USED_HOMES = "PR_used_homes_v7_inventory";
const KEY_PINS = "PR_pins_v7_inventory";
const KEY_PROFILE = "PR_profile_v8_hybrid";
const KEY_APPOINTMENTS = "PR_appointments_v1";
const KEY_PIN_PREFS = "PR_pin_prefs_v1";
const KEY_WALL_POSTS = "PR_wall_posts_v1";
const KEY_OPEN_HOUSE_REQUESTS = "PR_open_house_requests_v1";

export type PackFlags = {
  salesCounselor: boolean;
  creditRepair: boolean;
  loanOfficer: boolean;
  builder: boolean;
  custom: boolean;
  customLabel?: string;
};

export type MembershipTier = "free" | "verified" | "pro";
export type VerificationStatus = "unverified" | "pending" | "verified";
export type ProfileRole = "realtor" | "builder";

export function normalizeProfileRole(role?: string | null): ProfileRole {
  return role === "builder" ? "builder" : "realtor";
}

export type LeadActivity = {
  id: string;
  type: "call" | "email" | "share" | "note";
  at: string;
  label: string;
};

export type Lead = {
  id: string;
  createdAt: string;
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  city?: string;
  zip?: string;
  state?: string;
  county?: string;
  zipCodes?: string[];
  distributionMode?: "builders" | "referral";
  distributionTargets?: string[];
  priceMax?: string;
  bedsMin?: string;
  bathsMin?: string;
  buildType?: string;
  builderRadiusMiles?: number;
  locationLat?: number;
  locationLon?: number;
  notes?: string;
  facebookUrl?: string;
  buyerPhotoUrl?: string;
  followUpAt?: string;
  realtorName?: string;
  realtorEmail?: string;
  realtorPhone?: string;
  brokerage?: string;
  pack: PackFlags;
  activity?: LeadActivity[];
};

export type Builder = {
  id: string;
  name: string;
  communityName: string;
  minPrice: number;
  maxPrice: number;
  minBeds: number;
  maxBeds: number;
  bathsMin: number;
  sqftMin: number;
  sqftMax: number;
  schools: string[];
  utilityType: "Gas" | "Electric" | "Mixed";
  taxRate: number;
  hoa: string;
  quickAppeal: string;
  address: string;
  salesCounselorName?: string;
  salesCounselorEmail?: string;
  salesCounselorPhone?: string;
  colorKey?: string;
  sponsored?: boolean;
  locationLat: number;
  locationLon: number;
  active?: boolean;
  dest?: string;
  notes?: string;
  hidden?: boolean;
  engagement?: "cold" | "warm" | "hot";
  acceptsOpenHouseRequests?: boolean;
};

export type UsedHome = {
  id: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  sqft?: number;
  yearBuilt?: number;
  address: string;
  city?: string;
  listingAgent?: string;
  link?: string;
  photoUrl?: string;
  notes?: string;
  latitude: number;
  longitude: number;
  active?: boolean;
  hidden?: boolean;
};

export type FavoritePin = {
  id: string;
  title: string;
  subtitle?: string;
  category: PinCategory;
  latitude: number;
  longitude: number;
};

export type WallPost = {
  id: string;
  createdAt: string;
  authorName: string;
  authorBrokerage?: string;
  category: "Builder" | "Realtor" | "Loan Officer" | "Credit Repair" | "Open House" | "Question";
  role: "Realtor" | "Builder" | "OSC" | "Loan Officer" | "Credit Repair" | "Marketing";
  title: string;
  body: string;
};

export type OpenHouseRequest = {
  id: string;
  createdAt: string;
  builderId: string;
  builderName: string;
  communityName: string;
  requestedDate: string;
  requestedTime: string;
  notes?: string;
  expectedTraffic?: string;
  realtorName?: string;
  brokerage?: string;
  email?: string;
  phone?: string;
  status: "pending" | "approved" | "ignored" | "declined";
};

export type PinLayerPrefs = {
  builders: boolean;
  usedHomes: boolean;
  school: boolean;
  grocery: boolean;
  police: boolean;
  fire: boolean;
  hospital: boolean;
  pharmacy: boolean;
  postal: boolean;
  park: boolean;
  coffee: boolean;
  favorite: boolean;
};

export const DEFAULT_PIN_PREFS: PinLayerPrefs = {
  builders: true,
  usedHomes: false,
  school: true,
  grocery: false,
  police: false,
  fire: false,
  hospital: false,
  pharmacy: false,
  postal: false,
  park: false,
  coffee: false,
  favorite: true,
};


export type Appointment = {
  id: string;
  at: string;
  date: string;
  time: string;
  builderId?: string;
  builderName?: string;
  communityName?: string;
  leadId?: string;
  leadName?: string;
  notes?: string;
};

export type Profile = {
  name?: string;
  brokerage?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  defaultArea?: string;
  defaultState?: string;
  defaultBuilderRadiusMiles?: number;
  membershipTier?: MembershipTier;
  verificationStatus?: VerificationStatus;
  role?: ProfileRole;
};

function normalizeProfile(profile: Profile | null | undefined): Profile | null {
  if (!profile) return null;
  return {
    ...profile,
    role: normalizeProfileRole(profile.role),
  };
}

export function isProfileComplete(profile: Profile | null | undefined): boolean {
  const values = [profile?.name, profile?.brokerage, profile?.licenseNumber, profile?.phone, profile?.email];
  return values.every((value) => !!String(value || "").trim());
}

const defaultUsedHomes: UsedHome[] = [
  {
    id: "used-olmos-park-demo",
    title: "Used Home • Olmos Park Area",
    price: 489000,
    beds: 3,
    baths: 2,
    sqft: 1860,
    yearBuilt: 1988,
    address: "Olmos Park Area, San Antonio, TX",
    city: "San Antonio",
    listingAgent: "Local Listing Agent",
    link: "https://example.com/listing",
    notes: "Starter demo used-home layer so Realtors can compare resale vs new build.",
    latitude: 29.4748,
    longitude: -98.4875,
    active: true,
  },
  {
    id: "used-schertz-demo",
    title: "Used Home • Schertz Area",
    price: 329900,
    beds: 4,
    baths: 2,
    sqft: 2025,
    yearBuilt: 2004,
    address: "Schertz Area, TX",
    city: "Schertz",
    listingAgent: "Local Listing Agent",
    link: "https://example.com/listing-2",
    notes: "Second demo resale layer for side-by-side map comparison.",
    latitude: 29.5536,
    longitude: -98.2743,
    active: true,
  },
];

const defaultWallPosts: WallPost[] = [
  {
    id: "wall_1",
    createdAt: nowStamp(),
    authorName: "Verified Builder Partner",
    authorBrokerage: "Builder Team",
    category: "Open House",
    role: "Builder",
    title: "Need a Realtor to host an inventory open house this weekend",
    body: "Paid verified Realtors can request this opportunity through PackRep. Builder approval required.",
  },
  {
    id: "wall_2",
    createdAt: nowStamp(),
    authorName: "Verified Realtor",
    authorBrokerage: "San Antonio Realty",
    category: "Question",
    role: "Realtor",
    title: "Looking for a lender contact for VA buyers in the NW side",
    body: "Need a strong lender contact who responds quickly and can work with military buyers.",
  },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isValidCoord(lat?: number, lon?: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180;
}

function normalizeBuilder(builder: Builder): Builder {
  return {
    ...builder,
    schools: Array.isArray(builder.schools) ? builder.schools : [],
    hidden: !!builder.hidden,
    engagement: builder.engagement || "warm",
    active: builder.active !== false,
    acceptsOpenHouseRequests: builder.acceptsOpenHouseRequests !== false,
  };
}

function mergeSeedBuilders(existing: Builder[]) {
  const byId = new Map(existing.map((b) => [b.id, normalizeBuilder(b)]));
  const seeded = defaultBuilders.map((seed) => {
    const prev = byId.get(seed.id);
    if (!prev) return normalizeBuilder({ ...seed });
    return normalizeBuilder({
      ...seed,
      salesCounselorName: prev.salesCounselorName || seed.salesCounselorName,
      salesCounselorEmail: prev.salesCounselorEmail || seed.salesCounselorEmail,
      salesCounselorPhone: prev.salesCounselorPhone || seed.salesCounselorPhone,
      dest: prev.dest || seed.dest,
      sponsored: prev.sponsored ?? seed.sponsored,
      active: prev.active ?? seed.active,
      hidden: prev.hidden,
      engagement: prev.engagement,
      notes: prev.notes || seed.notes,
      acceptsOpenHouseRequests: prev.acceptsOpenHouseRequests ?? seed.acceptsOpenHouseRequests ?? true,
      address: prev.address || seed.address,
      locationLat: isValidCoord(prev.locationLat, prev.locationLon) ? prev.locationLat : seed.locationLat,
      locationLon: isValidCoord(prev.locationLat, prev.locationLon) ? prev.locationLon : seed.locationLon,
    });
  });

  const seedIds = new Set(defaultBuilders.map((b) => b.id));
  const customs = existing.filter((b) => !seedIds.has(b.id)).map(normalizeBuilder);
  return [...seeded, ...customs].filter((b) => isValidCoord(b.locationLat, b.locationLon));
}

export function makeId(prefix = "ID") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

export function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function parseFollowUpDate(v?: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function distanceMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function loadBuilders(): Promise<Builder[]> {
  const raw = await AsyncStorage.getItem(KEY_BUILDERS);
  const current = safeParse<Builder[]>(raw, []);
  if (current.length) {
    const merged = mergeSeedBuilders(current);
    await AsyncStorage.setItem(KEY_BUILDERS, JSON.stringify(merged));
    return merged;
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY_BUILDERS);
  const legacy = safeParse<Builder[]>(legacyRaw, []);
  const merged = mergeSeedBuilders(legacy);
  await AsyncStorage.setItem(KEY_BUILDERS, JSON.stringify(merged));
  return merged;
}

export async function upsertBuilder(builder: Builder) {
  const all = await loadBuilders();
  const next = normalizeBuilder(builder);
  const idx = all.findIndex((b) => b.id === next.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await AsyncStorage.setItem(KEY_BUILDERS, JSON.stringify(all));
}

export async function deleteBuilder(id: string) {
  const all = await loadBuilders();
  await AsyncStorage.setItem(KEY_BUILDERS, JSON.stringify(all.filter((x) => x.id !== id)));
}

export async function loadUsedHomes(): Promise<UsedHome[]> {
  const raw = await AsyncStorage.getItem(KEY_USED_HOMES);
  const stored = safeParse<UsedHome[]>(raw, []);
  if (!stored.length) {
    await AsyncStorage.setItem(KEY_USED_HOMES, JSON.stringify(defaultUsedHomes));
    return defaultUsedHomes;
  }
  return stored.filter((x) => isValidCoord(x.latitude, x.longitude));
}

export async function upsertUsedHome(home: UsedHome) {
  const all = await loadUsedHomes();
  const idx = all.findIndex((x) => x.id === home.id);
  if (idx >= 0) all[idx] = home;
  else all.unshift(home);
  await AsyncStorage.setItem(KEY_USED_HOMES, JSON.stringify(all));
}

export async function deleteUsedHome(id: string) {
  const all = await loadUsedHomes();
  await AsyncStorage.setItem(KEY_USED_HOMES, JSON.stringify(all.filter((x) => x.id !== id)));
}

function normalizeLead(lead: Lead): Lead {
  return {
    ...lead,
    pack: lead.pack || { salesCounselor: true, creditRepair: false, loanOfficer: false, builder: true, custom: false },
    activity: Array.isArray(lead.activity) ? lead.activity : [],
  };
}

export async function loadLeads(): Promise<Lead[]> {
  const raw = await AsyncStorage.getItem(KEY_LEADS);
  return safeParse<Lead[]>(raw, []).map(normalizeLead);
}

export async function upsertLead(lead: Lead) {
  const all = await loadLeads();
  const next = normalizeLead(lead);
  const idx = all.findIndex((x) => x.id === next.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await AsyncStorage.setItem(KEY_LEADS, JSON.stringify(all));
  return next;
}

export async function deleteLead(id: string) {
  const all = await loadLeads();
  await AsyncStorage.setItem(KEY_LEADS, JSON.stringify(all.filter((x) => x.id !== id)));
}

export async function addLeadActivity(leadId: string, activity: Omit<LeadActivity, "id" | "at"> & Partial<Pick<LeadActivity, "id" | "at">>) {
  const all = await loadLeads();
  const idx = all.findIndex((x) => x.id === leadId);
  if (idx < 0) return;
  const nextActivity: LeadActivity = {
    id: activity.id || makeId("A"),
    at: activity.at || nowStamp(),
    type: activity.type,
    label: activity.label,
  };
  const item = all[idx];
  item.activity = [nextActivity, ...(item.activity || [])].slice(0, 25);
  all[idx] = item;
  await AsyncStorage.setItem(KEY_LEADS, JSON.stringify(all));
}

export async function loadFavoritePins(): Promise<FavoritePin[]> {
  const raw = await AsyncStorage.getItem(KEY_PINS);
  return safeParse<FavoritePin[]>(raw, []).filter((x) => isValidCoord(x.latitude, x.longitude));
}

export async function addFavoritePin(pin: FavoritePin) {
  const all = await loadFavoritePins();
  all.unshift(pin);
  await AsyncStorage.setItem(KEY_PINS, JSON.stringify(all));
}

export async function deleteFavoritePin(id: string) {
  const all = await loadFavoritePins();
  await AsyncStorage.setItem(KEY_PINS, JSON.stringify(all.filter((x) => x.id !== id)));
}

export async function loadProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(KEY_PROFILE);
  return normalizeProfile(safeParse<Profile | null>(raw, null));
}

export async function saveProfile(profile: Profile) {
  const normalized = normalizeProfile(profile);
  await AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(normalized));
}

export async function loadAppointments(): Promise<Appointment[]> {
  const raw = await AsyncStorage.getItem(KEY_APPOINTMENTS);
  return safeParse<Appointment[]>(raw, []);
}

export async function upsertAppointment(appt: Appointment) {
  const all = await loadAppointments();
  const idx = all.findIndex((x) => x.id === appt.id);
  if (idx >= 0) all[idx] = appt;
  else all.unshift(appt);
  await AsyncStorage.setItem(KEY_APPOINTMENTS, JSON.stringify(all));
}

export async function deleteAppointment(id: string) {
  const all = await loadAppointments();
  await AsyncStorage.setItem(KEY_APPOINTMENTS, JSON.stringify(all.filter((x) => x.id !== id)));
}

export function buildPackText(lead: Lead) {
  const packs = [
    lead.pack.salesCounselor ? "Sales Counselor" : null,
    lead.pack.creditRepair ? "Credit Repair" : null,
    lead.pack.loanOfficer ? "Loan Officer" : null,
    lead.pack.builder ? "Builder" : null,
    lead.pack.custom ? lead.pack.customLabel || "Custom Pack" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `PackRep Lead: ${lead.buyerName}`,
    `Created: ${lead.createdAt}`,
    lead.realtorName ? `Realtor: ${lead.realtorName}${lead.brokerage ? ` • ${lead.brokerage}` : ""}` : null,
    lead.city ? `Area: ${lead.city}` : null,
    lead.county ? `County: ${lead.county}` : null,
    lead.state ? `State: ${lead.state}` : null,
    lead.zip ? `ZIP: ${lead.zip}` : null,
    lead.priceMax ? `Max Price: $${Number(String(lead.priceMax).replace(/[^\d]/g, "") || 0).toLocaleString()}` : null,
    lead.bedsMin ? `Beds: ${lead.bedsMin}+` : null,
    lead.bathsMin ? `Baths: ${lead.bathsMin}+` : null,
    lead.buildType ? `Build Type: ${lead.buildType}` : null,
    lead.buyerPhone ? `Phone: ${lead.buyerPhone}` : null,
    lead.buyerEmail ? `Email: ${lead.buyerEmail}` : null,
    packs ? `Pack: ${packs}` : null,
    lead.facebookUrl ? `Link: ${lead.facebookUrl}` : null,
    lead.notes ? `Notes: ${lead.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function loadPinLayerPrefs(): Promise<PinLayerPrefs> {
  const raw = await AsyncStorage.getItem(KEY_PIN_PREFS);
  const current = safeParse<Partial<PinLayerPrefs> | null>(raw, null) || {};
  return { ...DEFAULT_PIN_PREFS, ...current };
}

export async function savePinLayerPrefs(prefs: PinLayerPrefs) {
  await AsyncStorage.setItem(KEY_PIN_PREFS, JSON.stringify(prefs));
}

export async function loadWallPosts(): Promise<WallPost[]> {
  const raw = await AsyncStorage.getItem(KEY_WALL_POSTS);
  const stored = safeParse<WallPost[]>(raw, []);
  if (!stored.length) {
    await AsyncStorage.setItem(KEY_WALL_POSTS, JSON.stringify(defaultWallPosts));
    return defaultWallPosts;
  }
  return stored;
}

export async function addWallPost(post: WallPost) {
  const all = await loadWallPosts();
  all.unshift(post);
  await AsyncStorage.setItem(KEY_WALL_POSTS, JSON.stringify(all.slice(0, 100)));
}

export async function loadOpenHouseRequests(): Promise<OpenHouseRequest[]> {
  const raw = await AsyncStorage.getItem(KEY_OPEN_HOUSE_REQUESTS);
  return safeParse<OpenHouseRequest[]>(raw, []);
}

export async function addOpenHouseRequest(item: OpenHouseRequest) {
  const all = await loadOpenHouseRequests();
  all.unshift(item);
  await AsyncStorage.setItem(KEY_OPEN_HOUSE_REQUESTS, JSON.stringify(all));
}

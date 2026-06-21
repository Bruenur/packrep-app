# AsyncStorage → Supabase Migration Guide (Phase 1)

Goal

Preserve the existing AsyncStorage-based flows while adding Supabase as a cloud-backed option. Migration should be incremental, reversible, and non-destructive.

High-level strategy

1. Introduce Supabase tables (see `supabase/schema.sql`) that mirror the shape of data currently stored in AsyncStorage.
2. Add migration utilities that read AsyncStorage keys and upsert corresponding rows into Supabase. Track migration status per key/item with a small migration tracking table.
3. Use a read-through strategy: keep existing reads from AsyncStorage as the source of truth until a successful cloud sync exists. New reads may optionally prefer cloud if available.
4. Implement conflict resolution rules: last-write-wins by timestamp for Phase 1; record provenance in audit fields.

Suggested incremental steps

- Step 0 (safety): Add backups/export tooling for AsyncStorage before running any migration.
- Step 1: Add the Supabase client wrapper (`src/lib/supabase.ts`) and API helpers (`src/lib/api.ts`). Do not wire into screens.
- Step 2: Create migration scripts that:
  - iterate AsyncStorage keys of interest,
  - read the stored JSON payload,
  - upsert into Supabase tables with an `original_key` or `source` column,
  - insert an entry in `migrations_asyncstorage` to mark the key/item migrated.
- Step 3: Run migration in a development environment and verify data integrity in Supabase dashboard.
- Step 4: Add optional background sync that periodically reconciles AsyncStorage → Supabase and Supabase → AsyncStorage deltas.

Mapping guidance

- Map simple objects to a single table row and complex objects to a JSONB `payload` column if the schema is uncertain.
- Example mapping:
  - AsyncStorage key `user_profile` → `users` table (columns: `id`, `email`, `profile jsonb`)
  - AsyncStorage key `leads_*` → `leads` table (columns: `id`, `owner_id`, `payload jsonb`)

Conflict resolution (Phase 1)

- Prefer deterministic, simple rules for now:
  - If remote row timestamp > local timestamp, overwrite local.
  - Else, push local to remote (upsert).
- Record `migrated_at` and `source` fields so future logic can be more sophisticated.

Rollback plan

- Keep local AsyncStorage data until you’ve verified Supabase rows are complete. If an issue occurs, clear the `migrations_asyncstorage` table to allow re-run, or use exported AsyncStorage backups to restore state.

Testing

- Test migrations on a small dataset first. Verify each migrated item in Supabase and the `migrations_asyncstorage` table.

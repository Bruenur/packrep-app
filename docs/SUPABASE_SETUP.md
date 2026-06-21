# Supabase Setup for PackRep (Phase 1)

This document explains how to create a Supabase project and configure the environment variables used by this repo.

Required environment variables (Expo app):

- `EXPO_PUBLIC_SUPABASE_URL` — the Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — the anon/public API key

Quick steps

1. Create a Supabase project at https://app.supabase.com/.
2. Open the project and go to Settings → API. Copy the `URL` and the `anon` key.
3. Add these values to your Expo environment configuration. For local development you can use a `.env` file or your preferred environment mechanism. Example (local reference):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Applying the schema

- The minimal SQL schema for Phase 1 is in `supabase/schema.sql`. You can run it from the Supabase SQL editor or with psql against your Supabase database.

Notes and recommendations

- Phase 1 purpose: add Supabase authentication and cloud database support without removing the existing AsyncStorage flows. Do not wire client code into UI screens yet.
- We are intentionally not installing packages or changing existing screens in Phase 1 — the provided `src/lib/supabase.ts` and `src/lib/api.ts` expect the env vars above to be present at runtime.
- For production, enable Row Level Security (RLS) and use service role keys only on secure server-side code. Do not expose service role keys in the client.
- For migrating data, see `docs/ASYNCSTORAGE_TO_SUPABASE_MIGRATION.md`.

Useful links

- Supabase docs: https://supabase.com/docs
- Auth guides: https://supabase.com/docs/guides/auth
- SQL editor: Supabase Dashboard → SQL Editor

Required package (developer note)

- The client library used by `src/lib/supabase.ts` and the auth scaffolding is `@supabase/supabase-js`.
- Install before running auth or migration scripts (do not install automatically during Phase 1 without approval).

Install examples:

```bash
# npm
npm install @supabase/supabase-js

# yarn
yarn add @supabase/supabase-js
```

Notes:

- If you run the TypeScript migration scripts or use the auth helpers locally, ensure `@supabase/supabase-js` is present in `package.json`.
- The project intentionally avoids installing packages in Phase 1; follow your team's policy for introducing dependencies and run tests after adding the package.

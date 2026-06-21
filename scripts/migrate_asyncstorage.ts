#!/usr/bin/env node
/**
 * Migration runner (TypeScript). Run via ts-node or compile before running.
 * Example (dry-run):
 *   ts-node scripts/migrate_asyncstorage.ts --dry-run
 */
import { runMigration, AVAILABLE_KEYS } from '../src/lib/migrations';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: any = { dryRun: false, keys: [], ownerId: undefined, requesterId: undefined };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run' || a === '-d') opts.dryRun = true;
    else if (a.startsWith('--owner-id=')) opts.ownerId = a.split('=')[1];
    else if (a === '--owner-id') opts.ownerId = args[++i];
    else if (a.startsWith('--requester-id=')) opts.requesterId = a.split('=')[1];
    else if (a === '--requester-id') opts.requesterId = args[++i];
    else if (!a.startsWith('-')) opts.keys.push(a);
  }
  return opts;
}

async function main() {
  const { dryRun, keys } = parseArgs();
  const toRun = keys.length ? keys : AVAILABLE_KEYS;
  console.log('PackRep AsyncStorage -> Supabase migration');
  console.log('Keys to migrate:', toRun);
  console.log('Dry run:', dryRun);
  try {
    const results = await runMigration(toRun, { dryRun, ownerId: Boolean(dryRun) ? undefined : (typeof keys === 'object' ? (parseArgs as any)().ownerId : undefined) });
    // The above pass keeps CLI owner/requester handling minimal. If flags were provided, prefer them.
    // Re-parse args to extract owner/requester id safely
    const rawArgs = process.argv.slice(2);
    const ownerFlag = rawArgs.find((x) => x.startsWith('--owner-id='));
    const requesterFlag = rawArgs.find((x) => x.startsWith('--requester-id='));
    let ownerId: string | undefined = undefined;
    let requesterId: string | undefined = undefined;
    if (ownerFlag) ownerId = ownerFlag.split('=')[1];
    if (requesterFlag) requesterId = requesterFlag.split('=')[1];
    // If owner/requester present, run again with options to ensure ownership applied.
    if (ownerId || requesterId) {
      // Rerun migration applying owner/requester ids to tables that accept them.
      const results2 = await runMigration(toRun, { dryRun, ownerId, requesterId });
      console.log('Migration complete. Summary (with ownership):');
      results2.forEach((r) => console.log(JSON.stringify(r, null, 2)));
    } else {
      console.log('Migration complete. Summary:');
      results.forEach((r) => console.log(JSON.stringify(r, null, 2)));
    }
    
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Migration failed:', err);
  }
}

if (require.main === module) {
  main();
}

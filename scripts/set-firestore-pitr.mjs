/**
 * Turn Firestore point-in-time recovery on or off.
 *
 * Without PITR, Firestore keeps only about an hour of document versions. That
 * hour is the only reason the binder wiped on 2026-08-28 was recoverable at
 * all. With PITR the window is 7 days.
 *
 * Usage:
 *   node scripts/set-firestore-pitr.mjs                 # show current state
 *   node scripts/set-firestore-pitr.mjs --enable        # turn it on
 *   node scripts/set-firestore-pitr.mjs --disable       # turn it off
 *
 * Note: enabling is not retroactive. The window starts at one hour before the
 * moment you enable, and only reaches a full 7 days after PITR has been on for
 * a week.
 */
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

function findServiceAccountKey() {
  const file = fs
    .readdirSync(ROOT)
    .find((f) => f.includes('firebase-adminsdk') && f.endsWith('.json'));
  if (!file) throw new Error('service account key not found in the project root');
  return path.join(ROOT, file);
}

const sa = JSON.parse(fs.readFileSync(findServiceAccountKey(), 'utf8'));
const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();
const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)`;

async function show(label) {
  const { data } = await client.request({ url });
  console.log(`${label}`);
  console.log(`  pointInTimeRecoveryEnablement: ${data.pointInTimeRecoveryEnablement}`);
  console.log(`  earliestVersionTime          : ${data.earliestVersionTime}`);
  console.log(`  deleteProtectionState        : ${data.deleteProtectionState}`);
  return data;
}

const enable = process.argv.includes('--enable');
const disable = process.argv.includes('--disable');

await show(`project ${sa.project_id} — current:`);

if (!enable && !disable) {
  console.log('\n(no change requested — pass --enable or --disable)');
  process.exit(0);
}

const target = enable ? 'POINT_IN_TIME_RECOVERY_ENABLED' : 'POINT_IN_TIME_RECOVERY_DISABLED';
console.log(`\nsetting pointInTimeRecoveryEnablement=${target} ...`);

await client.request({
  url: `${url}?updateMask=pointInTimeRecoveryEnablement`,
  method: 'PATCH',
  data: { pointInTimeRecoveryEnablement: target },
});

await show('\nafter:');

if (enable) {
  console.log(
    '\nReminder: this is not retroactive. Right now you can read back to one hour\n' +
      'before enablement; the window grows to the full 7 days after a week.'
  );
}

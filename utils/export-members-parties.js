/**
 * Export members + parties data from the PMG database into src/data/members-parties.csv
 *
 * WHY THIS EXISTS
 * --------------
 * The overview page renders member names, party, profile pics, gender, DOB and
 * committee-membership counts from src/data/members-parties.csv. That file was
 * previously maintained by hand and went stale (missing 100+ members who appear
 * in attendance.csv), which caused blank names/parties in the "Members ordered
 * by meetings attended" table.
 *
 * This script regenerates the file from the database:
 *   - `id`, `member`, `profile_pic`, `party_id` come from the `member` table.
 *   - `memberships_Count` comes from `committee_members`.
 *   - The remaining columns (`gender`, `date_of_birth`, `slug`, `legal_name`,
 *     `ID_y`, `updated`, `created`, `title`, `family_name`, `given_name`) are
 *     NOT in the database — they are preserved from the existing CSV for members
 *     already present, and left blank for newly added members.
 *
 * The output contains every member in the existing file PLUS every member who
 * appears in src/data/attendance.csv (the members the overview actually shows).
 *
 * Usage:
 *   node utils/export-members-parties.js
 *
 * Requires: .env with DATABASE_URL (same as update-attendance-data.js).
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const { parse } = require('csv-parse');
const { format } = require('@fast-csv/format');

const MEMBERS_CSV_PATH = './src/data/members-parties.csv';
const ATTENDANCE_CSV_PATH = './src/data/attendance.csv';

// Column order must match what the frontend expects (see src/components/overview/index.js).
const COLUMNS = [
  'ID_y', 'id', 'member', 'profile_pic', 'party_id', 'gender',
  'date_of_death', 'date_of_birth', 'slug', 'legal_name', 'updated',
  'created', 'title', 'family_name', 'given_name', 'memberships_Count'
];

function readCsv(path) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(path)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function exportMembersParties() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set in .env file');
  }

  console.log('\n📇 Exporting members-parties data...');

  // 1. Existing file — preserves gender/DOB/etc. that the DB does not have.
  const existingRows = await readCsv(MEMBERS_CSV_PATH);
  const existingById = new Map(existingRows.map(r => [String(r.id), r]));
  console.log(`   Existing members-parties.csv: ${existingRows.length} rows`);

  // 2. Attendance member ids — the members the overview page actually shows.
  const attendanceRows = await readCsv(ATTENDANCE_CSV_PATH);
  const attendanceIds = new Set(attendanceRows.map(r => String(r.member_id)));
  console.log(`   attendance.csv: ${attendanceIds.size} distinct members`);

  // 3. Members + membership counts from the DB.
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let dbRows;
  let memberships;
  try {
    const membersRes = await client.query(`
      SELECT id, name, profile_pic_url, party_id, house_id, current
      FROM member
      ORDER BY id
    `);
    dbRows = membersRes.rows;

    const membershipsRes = await client.query(`
      SELECT member_id, count(*)::int AS c
      FROM committee_members
      GROUP BY member_id
    `);
    memberships = new Map(membershipsRes.rows.map(r => [String(r.member_id), r.c]));
  } finally {
    await client.end();
  }
  console.log(`   DB members: ${dbRows.length}`);

  // 4. Build the output rows.
  const rows = [];
  const seen = new Set();

  // 4a. Existing members first — keep all their columns untouched.
  existingRows.forEach(row => {
    const id = String(row.id);
    seen.add(id);
    rows.push({
      ...row,
      // Refresh the membership count from the DB where available.
      memberships_Count: memberships.has(id) ? String(memberships.get(id)) : (row.memberships_Count || '')
    });
  });

  // 4b. DB members who appear in attendance but are missing from the file.
  let added = 0;
  dbRows.forEach(m => {
    const id = String(m.id);
    if (seen.has(id)) return;
    if (!attendanceIds.has(id)) return;
    seen.add(id);
    added++;
    rows.push({
      ID_y: '',
      id,
      member: m.name || '',
      profile_pic: m.profile_pic_url || '',
      party_id: m.party_id != null ? String(m.party_id) : '',
      gender: '',
      date_of_death: '',
      date_of_birth: '',
      slug: '',
      legal_name: '',
      updated: '',
      created: '',
      title: '',
      family_name: '',
      given_name: '',
      memberships_Count: memberships.has(id) ? String(memberships.get(id)) : ''
    });
  });

  // 5. Write the CSV.
  const ws = fs.createWriteStream(MEMBERS_CSV_PATH, { encoding: 'utf8' });
  const csvStream = format({ headers: COLUMNS, delimiter: ',' });
  csvStream.pipe(ws);
  rows.forEach(r => csvStream.write(r));
  csvStream.end();
  await new Promise((resolve, reject) => {
    ws.on('finish', resolve);
    ws.on('error', reject);
  });

  console.log(`✅ members-parties.csv written: ${rows.length} rows (${added} added, ${existingRows.length} kept)`);
  return rows.length;
}

// Run directly: node utils/export-members-parties.js
if (require.main === module) {
  exportMembersParties()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Error exporting members-parties:', err.message);
      process.exit(1);
    });
}

module.exports = { exportMembersParties };
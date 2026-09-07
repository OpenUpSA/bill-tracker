require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const { format } = require('@fast-csv/format');
const { parse } = require('csv-parse');
const lookup = require('../src/data/lookup.json');
const { processMeetingsData } = require('../data/process-meetings.js');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set in .env file');
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════
// CONFIGURATION — edit this to set the data end date.
// All exports (meetings + all-time attendance) will include data
// up to and including this date, and the frontend data-cutoff
// (src/data/data-cutoff.js) will be set to this month/year.
// Format: 'YYYY-MM-DD'
// ══════════════════════════════════════════════════════════════
const DATA_END_DATE = '2026-08-31';

// Optional CLI override: node utils/update-attendance-data.js 'YYYY-MM-DD'
const endDate = process.argv[2] || DATA_END_DATE;
console.log(`📅 Filtering data up to: ${endDate}`);

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
});

const parliaments = lookup['parliaments'];
const data = {};

function dateToEpoch(thedate) {
  const time = thedate.getTime();
  return time - (time % 86400000);
}

function lookupParliamentFromCreatedAt(createdAt) {
  let foundKey = undefined;
  Object.keys(parliaments).forEach((key) => {
    const parliament = parliaments[key];
    const startDate = dateToEpoch(new Date(parliament.start));
    const endDate = dateToEpoch(new Date(parliament.end));
    if (createdAt >= startDate && createdAt <= endDate) {
      foundKey = key;
    }
  });
  return foundKey;
}

function exportDataToJsonFile() {
  fs.writeFileSync(
    './src/data/attendance/all-time.json',
    JSON.stringify(data, null, 2),
    'utf8'
  );
  console.log('✅ JSON export completed: all-time.json');
}

// Frontend data-cutoff config file.
const DATA_CUTOFF_FILE = './src/data/data-cutoff.js';

/**
 * Update src/data/data-cutoff.js so the frontend "Data till" badge and default
 * month/year reflect the end date of the export.
 */
function updateDataCutoff() {
  const [year, month] = endDate.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) {
    console.error(`❌ Could not parse end date "${endDate}" (expected YYYY-MM-DD)`);
    process.exit(1);
  }

  let content = fs.readFileSync(DATA_CUTOFF_FILE, 'utf8');

  content = content.replace(
    /export const DATA_CUTOFF_MONTH = \d+;.*/,
    `export const DATA_CUTOFF_MONTH = ${month};   // 1–12`
  );
  content = content.replace(
    /export const DATA_CUTOFF_YEAR = \d+;.*/,
    `export const DATA_CUTOFF_YEAR = ${year};`
  );

  fs.writeFileSync(DATA_CUTOFF_FILE, content, 'utf8');
  console.log(`✅ Frontend data cutoff updated: ${DATA_CUTOFF_FILE} (${month}/${year})`);
}

// Meetings data window (matches the Metabase export query in UPDATE-PROCEDURE.md).
// The end boundary is the script's `endDate` argument.
const MEETINGS_START_DATE = '2024-05-20';
const MEETINGS_CSV_PATH = './data/meetings.csv';
const ATTENDANCE_CSV_PATH = './src/data/attendance.csv';

/**
 * Export meetings data straight from the DB (replaces the manual Metabase
 * download), then process it into src/data/attendance.csv via process-meetings.js.
 */
async function exportMeetingsData() {
  console.log(`\n📅 Exporting meetings data (${MEETINGS_START_DATE} → ${endDate})...`);

  const meetingsClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await meetingsClient.connect();

  try {
    const query = `
      SELECT
        "public"."committee_meeting_attendance"."meeting_id" AS "meeting_id",
        "public"."committee_meeting_attendance"."member_id" AS "member_id",
        "public"."committee_meeting_attendance"."alternate_member" AS "alternate",
        "public"."committee_meeting_attendance"."attendance" AS "attendance",
        "Event - Meeting"."date" AS "event_date",
        "Event - Meeting"."committee_id" AS "committee_id",
        left("Event - Meeting"."actual_end_time"::text, 5) AS "actual_end_time",
        left("Event - Meeting"."actual_start_time"::text, 5) AS "actual_start_time",
        left("Event - Meeting"."scheduled_end_time"::text, 5) AS "scheduled_end_time",
        left("Event - Meeting"."scheduled_start_time"::text, 5) AS "scheduled_start_time",
        "Member"."party_id" AS "party_id"
      FROM
        "public"."committee_meeting_attendance"
        LEFT JOIN "public"."event" AS "Event - Meeting" ON "public"."committee_meeting_attendance"."meeting_id" = "Event - Meeting"."id"
        LEFT JOIN "public"."member" AS "Member" ON "public"."committee_meeting_attendance"."member_id" = "Member"."id"
        LEFT JOIN "public"."committee" AS "Committee" ON "Event - Meeting"."committee_id" = "Committee"."id"
      WHERE
        "Event - Meeting"."date" >= $1
        AND "Event - Meeting"."date" < $2
        AND "Committee"."house_id" = 3
      ORDER BY
        "Event - Meeting"."date" DESC;
    `;

    const result = await meetingsClient.query(query, [MEETINGS_START_DATE, endDate]);

    const ws = fs.createWriteStream(MEETINGS_CSV_PATH, { encoding: 'utf8' });
    const csvStream = format({ headers: true, delimiter: ',' });

    csvStream.pipe(ws);
    result.rows.forEach(row => csvStream.write(row));
    csvStream.end();

    await new Promise((resolve, reject) => {
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
    console.log(`✅ Meetings CSV export completed: ${MEETINGS_CSV_PATH} (${result.rows.length} rows)`);
  } catch (err) {
    console.error('❌ Error during meetings export:', err);
    throw err;
  } finally {
    await meetingsClient.end();
  }

  // Process meetings.csv -> attendance.csv using the existing duration logic
  processMeetingsData(MEETINGS_CSV_PATH, ATTENDANCE_CSV_PATH);
  console.log(`✅ attendance.csv export completed: ${ATTENDANCE_CSV_PATH}`);
}

// Questions data window (matches the Metabase Questions Export query in UPDATE-PROCEDURE.md).
// The end boundary is the script's `endDate` argument.
const QUESTIONS_START_DATE = '2024-05-20';
const QUESTIONS_CSV_PATH = './src/data/questions.csv';

/**
 * Export questions data straight from the DB (replaces the manual Metabase
 * download) into src/data/questions.csv with the schema the overview page
 * expects: Date, member_id, Minister → ID, Minister → Name.
 */
async function exportQuestionsData() {
  console.log(`\n📅 Exporting questions data (${QUESTIONS_START_DATE} → ${endDate})...`);

  const questionsClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await questionsClient.connect();

  try {
    const query = `
      SELECT
        "public"."committee_question"."date" AS "Date",
        "public"."committee_question"."asked_by_member_id" AS "member_id",
        "public"."committee_question"."minister_id" AS "Minister → ID",
        "Minister"."name" AS "Minister → Name"
      FROM
        "public"."committee_question"
        LEFT JOIN "public"."minister" AS "Minister" ON "public"."committee_question"."minister_id" = "Minister"."id"
      WHERE
        "public"."committee_question"."date" >= $1
        AND "public"."committee_question"."date" <= $2
      ORDER BY
        "public"."committee_question"."date" DESC;
    `;

    const result = await questionsClient.query(query, [QUESTIONS_START_DATE, endDate]);

    // Format each row's date as DD-M-YYYY (matching the existing questions.csv format)
    const formattedRows = result.rows.map(row => {
      const d = row.Date instanceof Date ? row.Date : new Date(row.Date);
      const formatted = {
        Date: `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`,
        'member_id': row['member_id'],
        'Minister → ID': row['Minister → ID'],
        'Minister → Name': row['Minister → Name'],
      };
      return formatted;
    });

    const ws = fs.createWriteStream(QUESTIONS_CSV_PATH, { encoding: 'utf8' });
    const csvStream = format({ headers: true, delimiter: ',' });

    csvStream.pipe(ws);
    formattedRows.forEach(row => csvStream.write(row));
    csvStream.end();

    await new Promise((resolve, reject) => {
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
    console.log(`✅ Questions CSV export completed: ${QUESTIONS_CSV_PATH} (${formattedRows.length} rows)`);
  } catch (err) {
    console.error('❌ Error during questions export:', err);
    throw err;
  } finally {
    await questionsClient.end();
  }
}

async function exportAttendanceAndProcess() {
  try {
    await client.connect();

    const query = `
      SELECT
        "Member"."id" AS "Member → ID",
        "Member"."name" AS "Member → Name",
        "Party"."name" AS "Party → Name",
        "Event - Meeting"."date" AS "Event - Meeting → Date",
        "public"."committee_meeting_attendance"."attendance" AS "Attendance",
        "Committee"."name" AS "Committee → Name",
        "House"."name" AS "House → Name",
        "Member"."current" AS "Member → Current",
        "public"."committee_meeting_attendance"."alternate_member" AS "Alternate Member"
      FROM
        "public"."committee_meeting_attendance"
        LEFT JOIN "public"."member" AS "Member" ON "public"."committee_meeting_attendance"."member_id" = "Member"."id"
        LEFT JOIN "public"."event" AS "Event - Meeting" ON "public"."committee_meeting_attendance"."meeting_id" = "Event - Meeting"."id"
        LEFT JOIN "public"."party" AS "Party" ON "Member"."party_id" = "Party"."id"
        LEFT JOIN "public"."committee" AS "Committee" ON "Event - Meeting"."committee_id" = "Committee"."id"
        LEFT JOIN "public"."house" AS "House" ON "Member"."house_id" = "House"."id"
      WHERE
        "Event - Meeting"."date" <= $1
      ORDER BY
        "Committee"."name" ASC;
    `;

    const result = await client.query(query, [endDate]);

    const csvPath = './data/member-attendance-all-time.csv';
    const ws = fs.createWriteStream(csvPath, { encoding: 'utf8' });
    const csvStream = format({ headers: true, delimiter: ',' });

    csvStream.pipe(ws);
    result.rows.forEach(row => csvStream.write(row));
    csvStream.end();

    ws.on('finish', () => {
      console.log('✅ CSV export completed: member-attendance-all-time.csv');
      processCsvAndExportJson(csvPath);
    });

  } catch (err) {
    console.error('❌ Error during database export:', err);
    client.end();
  }
}

function processCsvAndExportJson(csvFilePath) {
  fs.createReadStream(csvFilePath)
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', (row) => {
      const id = row[0];
      const name = row[1];
      const party = row[2];
      const createdAt = dateToEpoch(new Date(row[3]));
      let attendance = row[4];
      const committee = row[5];
      const house = row[6];
      const current = row[7];
      const alternate = row[8] === 'true';
      const parliamentKey = lookupParliamentFromCreatedAt(createdAt);

      if (!parliamentKey) return;  // Skip if no parliament match

      if (house === 'National Council of Provinces' || house === 'National Assembly') {
        if (alternate) {
          attendance = `${attendance}-AM`;
        }

        if (data[id]) {
          if (data[id]['parliamentary-record'][parliamentKey]) {
            const record = data[id]['parliamentary-record'][parliamentKey];
            const recordIndex = record.findIndex(r => r.state === attendance);
            if (recordIndex > -1) {
              record[recordIndex].count += 1;
              record[recordIndex].committees = [...new Set([...record[recordIndex].committees, committee])];
              record[recordIndex].houses = [...new Set([...record[recordIndex].houses, house])];
            } else {
              record.push({
                state: attendance,
                count: 1,
                committees: [committee],
                houses: [house]
              });
            }

            const recordAll = data[id]['parliamentary-record']['all'];
            const recordIndexAll = recordAll.findIndex(r => r.state === attendance);
            if (recordIndexAll > -1) {
              recordAll[recordIndexAll].count += 1;
            } else {
              recordAll.push({
                state: attendance,
                count: 1,
                committees: [committee],
                houses: [house]
              });
            }

          } else {
            data[id]['parliamentary-record'][parliamentKey] = [{
              state: attendance,
              count: 1,
              committees: [committee],
              houses: [house]
            }];
            data[id]['parliamentary-record']['all'] = [{
              state: attendance,
              count: 1,
              committees: [committee],
              houses: [house]
            }];
          }
        } else {
          const newMember = {
            name,
            party,
            current,
            'parliamentary-record': {}
          };
          newMember['parliamentary-record'][parliamentKey] = [{
            state: attendance,
            count: 1,
            committees: [committee],
            houses: [house]
          }];
          newMember['parliamentary-record']['all'] = [{
            state: attendance,
            count: 1,
            committees: [committee],
            houses: [house]
          }];
          data[id] = newMember;
        }
      }
    })
    .on('end', () => {
      exportDataToJsonFile();
      console.log('✅ All steps completed');
      client.end();
    })
    .on('error', (error) => {
      console.error('❌ Error processing CSV:', error);
      client.end();
    });
}

// Run the meetings export (attendance.csv) first, then the all-time attendance export.
(async () => {
  try {
    await exportMeetingsData();
    await exportAttendanceAndProcess();
    await exportQuestionsData();
    updateDataCutoff();
    console.log('\n🎉 All steps completed successfully!');
  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  }
})();


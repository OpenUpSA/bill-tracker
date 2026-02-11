require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const { format } = require('@fast-csv/format');
const { parse } = require('csv-parse');
const lookup = require('../src/data/lookup.json');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set in .env file');
  process.exit(1);
}

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
      ORDER BY
        "Committee"."name" ASC;
    `;

    const result = await client.query(query);

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

exportAttendanceAndProcess();


const fs = require('fs');
const { parse } = require('csv-parse');
const lookup = require('../src/data/lookup.json');

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

function processCsvAndExportJson(csvFilePath) {
  console.log(`📄 Reading CSV file: ${csvFilePath}`);
  
  fs.createReadStream(csvFilePath)
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', (row) => {
      const id = row[1];  // Member → ID (column 1, since column 0 is the generic ID)
      const name = row[2]; // Member → Name
      const party = row[3]; // Party → Name
      const createdAt = dateToEpoch(new Date(row[4])); // Event - Meeting → Date
      let attendance = row[5]; // Attendance
      const committee = row[6]; // Committee → Name
      const house = row[7]; // House → Name
      const current = row[8]; // Member → Current
      const alternate = row[9] === 'true'; // Alternate Member
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
      console.log('✅ Conversion completed successfully');
    })
    .on('error', (error) => {
      console.error('❌ Error processing CSV:', error);
      process.exit(1);
    });
}

// Get CSV file path from command line argument or use default
const csvFilePath = process.argv[2] || './data/member-attendance-all-time.csv';

// Check if file exists
if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ CSV file not found: ${csvFilePath}`);
  console.log('Usage: node csv-to-json.js [path-to-csv-file]');
  process.exit(1);
}

processCsvAndExportJson(csvFilePath);

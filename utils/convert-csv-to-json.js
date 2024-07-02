/* Converts to JSON the SQL CSV output of:
select
    member.id,
    member.name as member_name,
    party.name as party_name,
    committee_meeting_attendance.created_at,
    attendance
from
    committee_meeting_attendance
    inner join member on committee_meeting_attendance.member_id = member.id
    inner join party on member.party_id = party.id;
*/

const fs = require("fs");
const { parse } = require("csv-parse");

const lookup = require("../src/data/lookup.json");
const parliaments = lookup["parliaments"];
const data = {};

function exportDataToJsonFile() {
  fs.writeFileSync(
    "./src/data/attendance/all-time.json",
    JSON.stringify(data),
    "utf8"
  );
}

function lookupParliamentFromCreatedAt(createdAt) {
  let foundkey = undefined;
  // Find the parliament with a start and end date using createdAt
  Object.keys(parliaments).forEach((key) => {
    const parliament = parliaments[key];
    startDate = new Date(parliament.start);
    endDate = new Date(parliament.end);
    if (createdAt >= startDate && createdAt <= endDate) {
      console.log("Parliament found for:", createdAt, key);
      foundkey = key;
    }
  });
  return foundkey;
}

fs.createReadStream("./data/member-attendance-all-time.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
    id = row[0];
    name = row[1];
    party = row[2];
    createdAt = new Date(row[3]);
    attendance = row[4];
    profilePicUrl = row[6];
    const parliamentKey = lookupParliamentFromCreatedAt(createdAt);
    console.log(parliamentKey);

    // Add to existing member or create new one
    if (data[id]) {
      if (data[id]["parliamentary-record"][parliamentKey]) {
        const record = data[id]["parliamentary-record"][parliamentKey];
        const recordIndex = record.findIndex((r) => r.state === attendance);
        if (recordIndex > -1) {
          record[recordIndex].count += 1;
        } else {
          record.push({
            state: attendance,
            count: 1,
          });
        }

        const recordAll = data[id]["parliamentary-record"]["all"];
        const recordIndexAll = recordAll.findIndex(
          (r) => r.state === attendance
        );
        if (recordIndexAll > -1) {
          recordAll[recordIndexAll].count += 1;
        } else {
          recordAll.push({
            state: attendance,
            count: 1,
          });
        }
      } else {
        data[id]["parliamentary-record"][parliamentKey] = [
          {
            state: attendance,
            count: 1,
          },
        ];
        data[id]["parliamentary-record"]["all"] = [
          {
            state: attendance,
            count: 1,
          },
        ];
      }
    } else {
      const newMember = {
        name: name,
        party: party,
        profilePicUrl: profilePicUrl,
        "parliamentary-record": {},
      };
      newMember["parliamentary-record"][parliamentKey] = [
        {
          state: attendance,
          count: 1,
        },
      ];
      newMember["parliamentary-record"]["all"] = [
        {
          state: attendance,
          count: 1,
        },
      ];
      data[id] = newMember;
    }
    console.log(row);
  })
  .on("end", function () {
    exportDataToJsonFile();
    console.log("finished");
  })
  .on("error", function (error) {
    console.log(error.message);
  });

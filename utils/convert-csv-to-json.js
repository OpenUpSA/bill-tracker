/* Converts to JSON the SQL CSV output of:
SELECT
  "public"."committee_meeting_attendance"."attendance" AS "attendance",
  "Member"."name" AS "Member__name",
  "Member"."id" AS "Member__id",
  "Event - Meeting"."date" AS "Event - Meeting__date",
  "Party"."name" AS "Party__name",
  "Committee"."name" AS "Committee__name",
  "House"."name" AS "House__name"
FROM
  "public"."committee_meeting_attendance"
 
LEFT JOIN "public"."member" AS "Member" ON "public"."committee_meeting_attendance"."member_id" = "Member"."id"
  LEFT JOIN "public"."event" AS "Event - Meeting" ON "public"."committee_meeting_attendance"."meeting_id" = "Event - Meeting"."id"
  LEFT JOIN "public"."party" AS "Party" ON "Member"."party_id" = "Party"."id"
  LEFT JOIN "public"."committee" AS "Committee" ON "Event - Meeting"."committee_id" = "Committee"."id"
  LEFT JOIN "public"."house" AS "House" ON "Member"."house_id" = "House"."id"
ORDER BY
  "Committee"."name" ASC
*/

const fs = require("fs");
const { parse } = require("csv-parse");

const lookup = require("../src/data/lookup.json");
const parliaments = lookup["parliaments"];
const data = {};

function dateToEpoch(thedate) {
  var time = thedate.getTime();
  return time - (time % 86400000);
}

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
    startDate = dateToEpoch(new Date(parliament.start));
    endDate = dateToEpoch(new Date(parliament.end));
    if (createdAt >= startDate && createdAt <= endDate) {
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
    createdAt = dateToEpoch(new Date(row[3]));
    attendance = row[4];
    committee = row[5];
    house = row[6];
    const parliamentKey = lookupParliamentFromCreatedAt(createdAt);

    // Add to existing member or create new one
    if (data[id]) {
      if (data[id]["parliamentary-record"][parliamentKey]) {
        const record = data[id]["parliamentary-record"][parliamentKey];
        const recordIndex = record.findIndex((r) => r.state === attendance);
        if (recordIndex > -1) {
          record[recordIndex].count += 1;
          record[recordIndex].committees.push(committee);
          record[recordIndex].committees = [
            ...new Set(record[recordIndex].committees),
          ];
          record[recordIndex].houses.push(house);
          record[recordIndex].houses = [
            ...new Set(record[recordIndex].houses),
          ];
        } else {
          record.push({
            state: attendance,
            count: 1,
            committees: [committee],
            houses: [house]
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
            committees: [committee],
            houses: [house]
          });
        }
      } else {
        data[id]["parliamentary-record"][parliamentKey] = [
          {
            state: attendance,
            count: 1,
            committees: [committee],
            houses: [house]
          },
        ];
        data[id]["parliamentary-record"]["all"] = [
          {
            state: attendance,
            count: 1,
            committees: [committee],
            houses: [house]
          },
        ];
      }
    } else {
      const newMember = {
        name: name,
        party: party,
        "parliamentary-record": {},
      };
      newMember["parliamentary-record"][parliamentKey] = [
        {
          state: attendance,
          count: 1,
          committees: [committee],
          houses: [house]
        },
      ];
      newMember["parliamentary-record"]["all"] = [
        {
          state: attendance,
          count: 1,
          committees: [committee],
          houses: [house]
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

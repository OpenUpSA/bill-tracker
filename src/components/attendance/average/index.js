import React, { useEffect, useState } from "react";

import Stack from "react-bootstrap/Stack";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";

import "../index.scss";

import * as data from "../../../data/attendance/all-time.json";
import * as lookup from "../../../data/lookup.json";

function AverageAttendance(props) {
  const { selectedParliament } = props;
  const attendanceStates = lookup["attendance-states"];

  const [averageAttendance, setAverageAttendance] = useState(50);
  const [dataAttendance, setDataAttendance] = useState(null);
  const [grouping, setGrouping] = useState("party");
  const [sortedDirection, setSortedDirection] = useState("desc");

  const setupData = () => {
    let partyAttendance = {};
    let memberAttendance = {};

    Object.keys(data).forEach((id) => {
      // set memberAttendance by selectedParliament
      memberAttendance[id] = {
        label: data[id].name,
        party: data[id].party,
        attendance: data[id]["parliamentary-record"][selectedParliament],
      };

      // set partyAttendance by grouping memberAttenandance by party
      if (!partyAttendance[data[id].party]) {
        partyAttendance[data[id].party] = {
          label: data[id].party,
          party: data[id].party,
          "member-count": 0,
          attendance: [],
        };
      }
      partyAttendance[data[id].party]["member-count"] += 1;
      data[id]["parliamentary-record"][selectedParliament] &&
        data[id]["parliamentary-record"][selectedParliament].forEach(
          (attendance) => {
            const recordIndex = partyAttendance[
              data[id].party
            ].attendance.findIndex((r) => r.state === attendance.state);
            if (recordIndex > -1) {
              partyAttendance[data[id].party].attendance[recordIndex].count +=
                attendance.count;
            } else {
              partyAttendance[data[id].party].attendance.push({
                state: attendance.state,
                count: attendance.count,
              });
            }
          }
        );
    });

    let activeAttendance = [];

    // Push partyAttendance hash into activeAttendance array
    if (grouping === "party") {
      activeAttendance = Object.values(partyAttendance);
    } else {
      activeAttendance = Object.values(memberAttendance);
    }

    // Filter out attendnace.state = 'U'
    activeAttendance.forEach((row) => {
      row["attendance"] = row["attendance"]?.filter(
        (attendance) => attendance.state !== "U"
      );
    });

    // filter out empty activeAttendance.attendance
    activeAttendance = activeAttendance.filter(
      (row) => row["attendance"].length > 0
    );

    activeAttendance.forEach((item) => {
      // Total attendance.count for each item as attendance-count

      item["attendance-count"] = item.attendance.reduce(
        (total, attendance) => total + attendance.count,
        0
      );

      // Group and total item.attendance by attendanceStates.group ib item.grouped-attendance[{state: STATE, count: COUNT}]
      item["grouped-attendance"] = item.attendance.reduce(
        (grouped, attendance) => {
          if (grouped[attendanceStates[attendance.state].group]) {
            grouped[attendanceStates[attendance.state].group].count +=
              attendance.count;
          } else {
            grouped[attendanceStates[attendance.state].group] = {
              state: attendanceStates[attendance.state].group,
              count: attendance.count,
              group: attendanceStates[attendance.state].group,
            };
          }
          return grouped;
        },
        {}
      );

      // Calculate grouped-percentage of attendance-count
      Object.keys(item["grouped-attendance"]).forEach((key) => {
        item["grouped-attendance"][key].percentage =
          (item["grouped-attendance"][key].count / item["attendance-count"]) *
          100;
        if (item["grouped-attendance"][key].group === "attended") {
          item["attendance-percentage"] =
            item["grouped-attendance"][key].percentage;
        }
      });

      if (!item["attendance-percentage"]) {
        item["attendance-percentage"] = 0;
      }

      // Make grouped-attendance an array
      item["grouped-attendance"] = Object.values(item["grouped-attendance"]);
    });

    // Sort activeAttendance by attendance-percentage
    activeAttendance = activeAttendance.sort((a, b) => {
      return b["attendance-percentage"] - a["attendance-percentage"];
    });

    setDataAttendance(activeAttendance);

    // Calculate average attendance from item.attendance-percentage
    let totalAttendance = 0;
    let totalItems = 0;
    activeAttendance.forEach((item) => {
      totalAttendance += item["attendance-percentage"];
      totalItems += 1;
    });
    setAverageAttendance(totalAttendance / totalItems);
  };

  const getDifferentToAveragePercentage = (attendancePercentage) => {
    // Set difference between average and item.attendance-percentage
    return attendancePercentage - averageAttendance;
  };

  useEffect(() => {
    setupData();
  }, [data, selectedParliament, grouping]);

  const toggleSortableDirection = () => {
    if (sortedDirection === "desc") {
      setDataAttendance(
        dataAttendance.sort((a, b) => {
          return a["attendance-percentage"] - b["attendance-percentage"];
        })
      );
      setSortedDirection("asc");
    } else {
      setDataAttendance(
        dataAttendance.sort((a, b) => {
          return b["attendance-percentage"] - a["attendance-percentage"];
        })
      );
      setSortedDirection("desc");
    }
  };

  return (
    <>
      <h2>Recorded meeting attendance compared to the average</h2>
      <Stack direction="horizontal" gap={3}>
        <div className="p-2">
          <ToggleButtonGroup
            type="radio"
            name="options"
            defaultValue={1}
            value={grouping}
          >
            <ToggleButton value="party" onClick={() => setGrouping("party")}>
              Party
            </ToggleButton>
            <ToggleButton value="member" onClick={() => setGrouping("members")}>
              Members
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </Stack>
      <table className="detailed">
        <thead>
          <tr>
            <th>{grouping === "party" ? "Party" : "Member"}</th>
            <th className="no-word-break">
              {grouping === "party" ? "Members" : "Party"}
            </th>
            <th className="sortable" onClick={toggleSortableDirection}>
              <span>Attendance</span>
              <FontAwesomeIcon
                icon={sortedDirection === "desc" ? faCaretDown : faCaretUp}
              />
            </th>
            <th>
              Comparison against the average ({Math.round(averageAttendance)}%)
            </th>
          </tr>
        </thead>
        <tbody>
          {dataAttendance &&
            dataAttendance.map((row) => (
              <tr key={row.label}>
                <td className="no-word-break">{row.label}</td>
                <td className="no-word-break">
                  {grouping === "party" ? row["member-count"] : row["party"]}
                </td>
                <td className="no-word-break">
                  <span className="percentageAttendance">
                    {Math.round(row["attendance-percentage"])}%
                  </span>{" "}
                  of {row["attendance-count"].toLocaleString()}
                </td>
                <td width="100%">
                  <div
                    className={`bar-background half ${
                      getDifferentToAveragePercentage(
                        row["attendance-percentage"]
                      ) <= 0 && "align-right"
                    }`}
                  >
                    {getDifferentToAveragePercentage(
                      row["attendance-percentage"]
                    ) <= 0 && (
                      <div
                        className={`bar state-${
                          getDifferentToAveragePercentage(
                            row["attendance-percentage"]
                          ) > 0
                            ? "more-than-average"
                            : "less-than-average"
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.abs(
                              getDifferentToAveragePercentage(
                                row["attendance-percentage"]
                              )
                            ),
                            100
                          )}%`,
                        }}
                      >
                        {getDifferentToAveragePercentage(
                          row["attendance-percentage"]
                        ) > 0 && "+"}
                        {Math.round(
                          getDifferentToAveragePercentage(
                            row["attendance-percentage"]
                          )
                        )}
                        %
                      </div>
                    )}
                    &nbsp;
                  </div>
                  <div
                    className={`bar-background half ${
                      getDifferentToAveragePercentage(
                        row["attendance-percentage"]
                      ) <= 0 && "align-right"
                    }`}
                  >
                    {getDifferentToAveragePercentage(
                      row["attendance-percentage"]
                    ) > 0 && (
                      <div
                        className={`bar state-${
                          getDifferentToAveragePercentage(
                            row["attendance-percentage"]
                          ) > 0
                            ? "more-than-average"
                            : "less-than-average"
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.abs(
                              getDifferentToAveragePercentage(
                                row["attendance-percentage"]
                              )
                            ),
                            100
                          )}%`,
                        }}
                      >
                        {getDifferentToAveragePercentage(
                          row["attendance-percentage"]
                        ) > 0 && "+"}
                        {Math.round(
                          getDifferentToAveragePercentage(
                            row["attendance-percentage"]
                          )
                        )}
                        %
                      </div>
                    )}
                    &nbsp;
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}

export default AverageAttendance;

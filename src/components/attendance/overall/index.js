import "../index.scss";

import React, { useEffect, useState } from "react";

import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

import * as data from "../../../data/attendance/all-time.json";
import * as lookup from "../../../data/lookup.json";

function OverallAttendance(props) {
  const { selectedParliament } = props;
  const attendanceStates = lookup["attendance-states"];

  const [maxAttendance, setMaxAttendance] = useState(0);
  const [dataAttendance, setDataAttendance] = useState(null);
  const [grouping, setGrouping] = useState("party");
  const [detailedBreakdown, setDetailedBreakdown] = useState(false);
  const [showAsPercentage, setShowAsPercentage] = useState(false);
  const [sortedDirection, setSortedDirection] = useState("desc");
  const [sortedField, setSortedField] = useState("attendance-percentage");
  const [tooltipShown, setTooltipShown] = useState(true);
  const [tooltipAttendance, setTooltipAttendance] = useState({});
  const [tooltipMousePosition, setTooltipMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [memberSearch, setMemberSearch] = useState("");

  const AttendanceTooltip = () => {
    const attendedGroup = tooltipAttendance["grouped-attendance"]?.find(
      (a) => a.group === "attended"
    );
    const missedGroup = tooltipAttendance["grouped-attendance"]?.find(
      (a) => a.group === "missed"
    );
    return (
      <div
        className="attendance-tooltip"
        style={{
          top: tooltipMousePosition.y + 10,
          left: tooltipMousePosition.x,
        }}
      >
        <div>
          <div className="tooltip-title">
            <span className="chip">
              {tooltipAttendance.party === tooltipAttendance.label ? (
                <>Party</>
              ) : (
                <>Member</>
              )}
            </span>
            <br />
            {tooltipAttendance.label}
          </div>
          <div className="tooltip-body mt-2">
            <table>
              <tbody>
                {attendedGroup && (
                  <tr>
                    <td>Meetings attended:</td>
                    <td className="text-align-right">
                      {attendedGroup.count.toLocaleString()}
                    </td>
                    <td>({Math.round(attendedGroup.percentage)}%)</td>
                  </tr>
                )}
                {missedGroup && (
                  <tr>
                    <td>Meetings missed:</td>
                    <td className="text-align-right">
                      {missedGroup.count.toLocaleString()}
                    </td>
                    <td>({Math.round(missedGroup.percentage)}%)</td>
                  </tr>
                )}
                {detailedBreakdown && (
                  <>
                    {tooltipAttendance["attendance"].map((attendance) => (
                      <tr key={attendance.state}>
                        <td>{attendanceStates[attendance.state].label}:</td>
                        <td className="text-align-right">
                          {attendance.count.toLocaleString()}
                        </td>
                        <td>
                          (
                          {Math.round(
                            (attendance.count /
                              tooltipAttendance["attendance-count"]) *
                              100
                          )}
                          %)
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const showTooltip = (attendance) => {
    setTooltipAttendance(attendance);
    setTooltipShown(true);
  };

  const hideTooltip = () => {
    setTooltipAttendance({});
    setTooltipShown(false);
  };

  const setupData = () => {
    let partyAttendance = {};
    let memberAttendance = {};

    Object.keys(data).forEach((id) => {
      // set memberAttendance by selectedParliament
      memberAttendance[id] = {
        label: data[id].name,
        party: data[id].party,
        profilePicUrl: data[id].profilePicUrl,
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
      (row) => row["attendance"]?.length > 0
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

    // Calculate max attendance overall
    setMaxAttendance(
      activeAttendance.reduce((max, item) => {
        return item["attendance-count"] > max ? item["attendance-count"] : max;
      }, 0)
    );
  };

  useEffect(() => {
    setupData();
  }, [data, selectedParliament, grouping]);

  const setSort = (fieldToSortBy) => {
    setSortedField(fieldToSortBy);

    if (sortedDirection === "desc") {
      setDataAttendance(
        dataAttendance.sort((a, b) => {
          if (fieldToSortBy === "label" || fieldToSortBy === "party") {
            return a[fieldToSortBy].localeCompare(b[fieldToSortBy]);
          } else {
            return a[fieldToSortBy] - b[fieldToSortBy];
          }
        })
      );
      setSortedDirection("asc");
    } else {
      setDataAttendance(
        dataAttendance.sort((a, b) => {
          if (fieldToSortBy === "label" || fieldToSortBy === "party") {
            return b[fieldToSortBy].localeCompare(a[fieldToSortBy]);
          } else {
            return b[fieldToSortBy] - a[fieldToSortBy];
          }
        })
      );
      setSortedDirection("desc");
    }
  };

  const toggleShowAsPercentage = () => {
    setShowAsPercentage(!showAsPercentage);
  };

  const toggleDetailedBreakDown = () => {
    setDetailedBreakdown(!detailedBreakdown);
  };

  return (
    <>
      <h2>Overall recorded meeting attendance</h2>
      <Stack direction="horizontal" gap={3}>
        <div className="pt-2 pb-2">
          <div className="toggleButtonGroup">
            <button
              className={grouping === "party" ? "active" : ""}
              onClick={() => setGrouping("party")}
            >
              Party
            </button>
            <button
              className={grouping === "members" ? "active" : ""}
              onClick={() => setGrouping("members")}
            >
              Members
            </button>
          </div>
        </div>
        {grouping === "members" && (
          <div className="pt-2 pb-2">
            <FontAwesomeIcon className="input-pre-icon" icon={faSearch} />
            <Form.Control
              className="memberSearch"
              type="text"
              placeholder="Search for a member..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
          </div>
        )}
        <div className="p-2 ms-auto">
          <Stack direction="horizontal" gap={3}>
            <Form>
              <Form.Check
                type="switch"
                id="show-as-percentage"
                label="Show as percentage"
                onChange={toggleShowAsPercentage}
                reverse
              />
            </Form>
            <Form>
              <Form.Check
                type="switch"
                id="show-detailed-breakdown"
                label="Detailed breakdown"
                onChange={toggleDetailedBreakDown}
                reverse
              />
            </Form>
          </Stack>
        </div>
      </Stack>
      <table className={`${detailedBreakdown && "detailed"}`}>
        <thead>
          <tr>
            <th className="sortable" onClick={() => setSort("label")}>
              <span>{grouping === "party" ? "Party" : "Member"}</span>
              {sortedField === "label" && (
                <FontAwesomeIcon
                  icon={sortedDirection === "desc" ? faCaretDown : faCaretUp}
                />
              )}
            </th>
            <th
              className="no-word-break sortable"
              onClick={() =>
                setSort(grouping === "party" ? "member-count" : "party")
              }
            >
              <span>{grouping === "party" ? "Members" : "Party"}</span>
              {sortedField ===
                (grouping === "party" ? "member-count" : "party") && (
                <FontAwesomeIcon
                  icon={sortedDirection === "desc" ? faCaretDown : faCaretUp}
                />
              )}
            </th>
            <th
              className="sortable"
              onClick={() => setSort("attendance-percentage")}
            >
              <span>Attendance</span>
              {sortedField === "attendance-percentage" && (
                <FontAwesomeIcon
                  icon={sortedDirection === "desc" ? faCaretDown : faCaretUp}
                />
              )}
            </th>
            <th
              className="sortable"
              onClick={() => setSort("attendance-count")}
            >
              <span>Meetings</span>
              {sortedField === "attendance-count" && (
                <FontAwesomeIcon
                  icon={sortedDirection === "desc" ? faCaretDown : faCaretUp}
                />
              )}
            </th>
            <th>Recorded totals breakdown</th>
          </tr>
        </thead>
        <tbody>
          {dataAttendance &&
            dataAttendance
              .filter((row) => {
                if (grouping === "members") {
                  return row.label
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase());
                }
                return true;
              })
              .map((row) => (
                <tr key={row.label}>
                  <td className="no-word-break">{row.label}</td>
                  <td className="no-word-break">
                    {grouping === "party" ? row["member-count"] : row["party"]}
                  </td>
                  <td className="no-word-break">
                    <span className="percentageAttendance">
                      {Math.round(parseFloat(row["attendance-percentage"]))}%
                    </span>{" "}
                  </td>
                  <td className="no-word-break">
                    {row["attendance-count"].toLocaleString()}
                  </td>
                  <td
                    width="100%"
                    onMouseEnter={() => showTooltip(row)}
                    onMouseLeave={hideTooltip}
                    onMouseMove={(e) =>
                      setTooltipMousePosition({
                        x: e.pageX,
                        y: e.pageY,
                      })
                    }
                  >
                    <div className="bar-background">
                      {row[
                        detailedBreakdown ? "attendance" : "grouped-attendance"
                      ]
                        .sort((a, b) => {
                          return detailedBreakdown
                            ? b.state.localeCompare(a.state)
                            : a.state.localeCompare(b.state);
                        })
                        .map((attendance) => (
                          <div
                            key={attendance.state}
                            className={`bar state-${
                              attendance.state
                            } state-grouping-${
                              detailedBreakdown
                                ? attendanceStates[attendance.state].group
                                : attendance.group
                            }`}
                            style={{
                              width: `${
                                (attendance.count /
                                  (showAsPercentage
                                    ? row["attendance-count"]
                                    : maxAttendance)) *
                                100
                              }%`,
                            }}
                          >
                            {showAsPercentage
                              ? `${Math.round(
                                  parseFloat(
                                    (attendance.count /
                                      row["attendance-count"]) *
                                      100
                                  )
                                )}%`
                              : attendance.count.toLocaleString()}
                          </div>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
      {tooltipShown && <AttendanceTooltip />}
    </>
  );
}

export default OverallAttendance;

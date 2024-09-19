import "../index.scss";

import React, { useEffect, useState } from "react";

import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faArrowPointer } from "@fortawesome/free-solid-svg-icons";

import SortedColumn from "../../sortedColumn";

import * as data from "../../../data/attendance/all-time.json";
import * as lookup from "../../../data/lookup.json";

const ChartTypes = {
  "numeric-simple": {
    label: "Numeric (Simple)",
    percentage: false,
    detailed: false,
    default: false,
  },
  "numeric-detailed": {
    label: "Numeric (Detailed)",
    percentage: false,
    detailed: true,
    default: false,
  },
  "pecentage-simple": {
    label: "Percentage (Simple)",
    percentage: true,
    detailed: false,
    default: false,
  },
  "percentage-detailed": {
    label: "Percentage (Detailed)",
    percentage: true,
    detailed: true,
    default: true,
  },
  average: {
    label: "Compare to average",
    percentage: false,
    detailed: false,
    default: false,
  },
};

function OverallAttendance(props) {
  const { selectedParliament } = props;
  const attendanceStates = lookup["attendance-states"];

  const [averageAttendance, setAverageAttendance] = useState(50);
  const [maxAttendance, setMaxAttendance] = useState(0);
  const [dataAttendance, setDataAttendance] = useState(null);
  const [grouping, setGrouping] = useState("members");
  const [sortedDirection, setSortedDirection] = useState("desc");
  const [sortedField, setSortedField] = useState("attendance-count");
  const [tooltipShown, setTooltipShown] = useState(true);
  const [tooltipAttendance, setTooltipAttendance] = useState({});
  const [tooltipAttendanceState, setTooltipAttendanceState] = useState("");
  const [tooltipMousePosition, setTooltipMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedChartType, setSelectedChartType] = useState(
    Object.keys(ChartTypes).find((key) => ChartTypes[key].default)
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [highlightedAttendanceState, setHighlightedAttendanceState] =
    useState("");

  const toggleHighlightedAttendanceState = (state) => {
    if (highlightedAttendanceState === state) {
      setHighlightedAttendanceState("");
    } else {
      setHighlightedAttendanceState(state);
    }
  };

  const shortPartyName = (partyName) => {
    const match = partyName.match(/.*\((.*)\)/);
    if (match) {
      return match[1];
    } else {
      return partyName;
    }
  };

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
                {!ChartTypes[selectedChartType].detailed ? (
                  <>
                    {attendedGroup && (
                      <tr
                        className={
                          tooltipAttendanceState === "attended"
                            ? "state-attended"
                            : ""
                        }
                      >
                        <td>Meetings attended:</td>
                        <td className="text-align-right">
                          {attendedGroup.count.toLocaleString()}
                        </td>
                        <td>({Math.round(attendedGroup.percentage)}%)</td>
                      </tr>
                    )}
                    {missedGroup && (
                      <tr
                        className={
                          tooltipAttendanceState === "missed"
                            ? "state-missed"
                            : ""
                        }
                      >
                        <td>Meetings missed:</td>
                        <td className="text-align-right">
                          {missedGroup.count.toLocaleString()}
                        </td>
                        <td>({Math.round(missedGroup.percentage)}%)</td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    {tooltipAttendance["attendance"]?.map((attendance) => (
                      <tr
                        key={attendance.state}
                        className={
                          attendance.state === tooltipAttendanceState
                            ? `state-${attendance.state}`
                            : ""
                        }
                      >
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
              partyAttendance[data[id].party].committees.push(
                attendance.committees
              );
              partyAttendance[data[id].party].committees = [
                ...new Set(partyAttendance[data[id].party].committees.flat()),
              ];
              partyAttendance[data[id].party]["committees-count"] =
                partyAttendance[data[id].party].committees.length;
            } else {
              partyAttendance[data[id].party].attendance.push({
                state: attendance.state,
                count: attendance.count,
              });
              partyAttendance[data[id].party].committees =
                attendance.committees;
              partyAttendance[data[id].party]["committees-count"] =
                partyAttendance[data[id].party].committees.length;
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

      item["committees"] = [];

      item.attendance.map((attendance) =>
        item["committees"].push(attendance.committees)
      );

      item["committees"] = [...new Set(item["committees"].flat())];

      item["committees-count"] = item["committees"].length;

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
          item["attended-count"] = item["grouped-attendance"][key].count;
        }
      });

      if (!item["attendance-percentage"]) {
        item["attendance-percentage"] = 0;
      }

      if (!item["attended-count"]) {
        item["attended-count"] = 0;
      }

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

    // Sort activeAttendance by sortedField (default)
    activeAttendance = activeAttendance.sort((a, b) => {
      return b[sortedField] - a[sortedField];
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

    // Calculate max attendance overall
    setMaxAttendance(
      activeAttendance.reduce((max, item) => {
        return item["attendance-count"] > max ? item["attendance-count"] : max;
      }, 0)
    );
  };

  const getDifferentToAveragePercentage = (attendancePercentage) => {
    // Set difference between average and item.attendance-percentage
    return attendancePercentage - averageAttendance;
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

  return (
    <>
      <h2>Overall recorded meeting attendance</h2>
      <Stack direction="horizontal" gap={3}>
        <div className="pt-2 pb-2">
          <div className="toggleButtonGroup">
            <button
              className={grouping === "members" ? "active" : ""}
              onClick={() => setGrouping("members")}
            >
              Members
            </button>
            <button
              className={grouping === "party" ? "active" : ""}
              onClick={() => setGrouping("party")}
            >
              Party
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
            <Form.Select
              aria-label="Select chart type"
              defaultValue={selectedChartType}
              onChange={(e) => setSelectedChartType(e.target.value)}
              size="md"
              className="parliamentSelector"
            >
              {Object.keys(ChartTypes).map((chartType, index) => {
                return (
                  <option value={chartType} key={`chart-type-${index}`}>
                    {ChartTypes[chartType].label}
                  </option>
                );
              })}
            </Form.Select>
          </Stack>
        </div>
      </Stack>
      <table
        className={`${
          ChartTypes[selectedChartType].detailed ? "detailed" : ""
        }`}
      >
        <thead>
          <tr>
            <SortedColumn
              sortThisfield="label"
              heading={grouping === "party" ? "Party" : "Name"}
              setSort={setSort}
              sortedField={sortedField}
              sortedDirection={sortedDirection}
            />

            <SortedColumn
              sortThisfield={grouping === "party" ? "member-count" : "party"}
              heading={grouping === "party" ? "Members" : "Party"}
              setSort={setSort}
              sortedField={sortedField}
              sortedDirection={sortedDirection}
            />

            {grouping === "members" && (
              <SortedColumn
                sortThisfield="committees-count"
                heading="Committee Memberships"
                setSort={setSort}
                sortedField={sortedField}
                sortedDirection={sortedDirection}
              />
            )}

            <SortedColumn
              sortThisfield="attendance-count"
              heading="Possible Meetings"
              setSort={setSort}
              sortedField={sortedField}
              sortedDirection={sortedDirection}
            />

            <SortedColumn
              sortThisfield="attended-count"
              heading="Attended (value)"
              setSort={setSort}
              sortedField={sortedField}
              sortedDirection={sortedDirection}
            />

            <SortedColumn
              sortThisfield="attendance-percentage"
              heading="Attended (%)"
              setSort={setSort}
              sortedField={sortedField}
              sortedDirection={sortedDirection}
            />

            <th>
              Attendance breakdown - {ChartTypes[selectedChartType].label}
              {selectedChartType === "average" && (
                <> ({Math.round(averageAttendance)}%)</>
              )}
            </th>
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
                    {grouping === "party"
                      ? row["member-count"]
                      : shortPartyName(row["party"])}
                  </td>
                  {grouping === "members" && <td>{row["committees-count"]}</td>}
                  <td>{row["attendance-count"].toLocaleString()}</td>
                  <td className="no-word-break">
                    {row["attended-count"].toLocaleString()}
                  </td>
                  <td className="no-word-break">
                    <span className="percentageAttendance">
                      {Math.round(parseFloat(row["attendance-percentage"]))}%
                    </span>{" "}
                  </td>
                  {selectedChartType === "average" && (
                    <>
                      <td width="50%" className="no-padding-horizontal">
                        <div
                          className={`bar-background no-border-radius-right half ${
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
                      </td>
                      <td className="dotted-border-right">
                        <div
                          className={`bar-background no-border-radius-left no-border-radius-right`}
                        >
                          &nbsp;
                        </div>
                      </td>
                      <td width="50%" className="no-padding-horizontal">
                        <div
                          className={`bar-background no-border-radius-left half ${
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
                    </>
                  )}
                  {selectedChartType !== "average" && (
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
                      className={
                        highlightedAttendanceState !== ""
                          ? "state-highlighting-on"
                          : ""
                      }
                    >
                      <div className="bar-background">
                        {row[
                          ChartTypes[selectedChartType].detailed
                            ? "attendance"
                            : "grouped-attendance"
                        ]
                          .sort((a, b) => {
                            return ChartTypes[selectedChartType].detailed
                              ? b.state.localeCompare(a.state)
                              : a.state.localeCompare(b.state);
                          })
                          .map((attendance) => (
                            <div
                              key={attendance.state}
                              onMouseEnter={() =>
                                setTooltipAttendanceState(attendance.state)
                              }
                              onMouseLeave={() => setTooltipAttendanceState("")}
                              onClick={() =>
                                toggleHighlightedAttendanceState(
                                  attendance.state
                                )
                              }
                              className={`bar state-${
                                attendance.state
                              } state-grouping-${
                                ChartTypes[selectedChartType].detailed
                                  ? attendanceStates[attendance.state].group
                                  : attendance.group
                              } ${
                                highlightedAttendanceState === attendance.state
                                  ? "state-highlighted"
                                  : ""
                              }`}
                              style={{
                                width: `${
                                  (attendance.count /
                                    (ChartTypes[selectedChartType].percentage
                                      ? row["attendance-count"]
                                      : maxAttendance)) *
                                  100
                                }%`,
                              }}
                            >
                              {ChartTypes[selectedChartType].percentage
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
                  )}
                </tr>
              ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="100">
              <Stack direction="horizontal" gap={2}>
                <ul
                  className={
                    highlightedAttendanceState !== ""
                      ? "state-highlighting-on stateLegend"
                      : "stateLegend"
                  }
                >
                  {selectedChartType === "average" && (
                    <>
                      <li>
                        <span className="bar state-attended">Above</span> Above
                        average
                      </li>
                      <li>
                        <span className="bar state-missed">Below</span> Below
                        average
                      </li>
                      <li>
                        &mdash; Attendance average (
                        {Math.round(averageAttendance)}%)
                      </li>
                    </>
                  )}
                  {selectedChartType !== "average" &&
                    ChartTypes[selectedChartType].detailed && (
                      <>
                        {Object.keys(attendanceStates)
                          .filter((state) => state !== "U")
                          .map((state) => (
                            <li
                              key={state}
                              className={`state-${state} ${
                                highlightedAttendanceState === state
                                  ? "state-highlighted"
                                  : ""
                              }`}
                            >
                              <span
                                className={`bar state-${state} ${
                                  highlightedAttendanceState === state
                                    ? "state-highlighted"
                                    : ""
                                }`}
                              >
                                {state}
                              </span>{" "}
                              {attendanceStates[state].label}
                            </li>
                          ))}
                      </>
                    )}
                  {selectedChartType !== "average" &&
                    !ChartTypes[selectedChartType].detailed && (
                      <>
                        <li>
                          <span className="bar state-attended">Attended</span>{" "}
                          Meetings attended
                        </li>
                        <li>
                          <span className="bar state-missed">Missed</span>{" "}
                          Meetings missed
                        </li>
                      </>
                    )}
                </ul>
                {selectedChartType !== "average" &&
                  ChartTypes[selectedChartType].detailed && (
                    <>
                      <FontAwesomeIcon
                        style={{ marginLeft: "auto" }}
                        icon={faArrowPointer}
                      />
                      <div>Click to isolate a category</div>
                    </>
                  )}
              </Stack>
            </td>
          </tr>
        </tfoot>
      </table>
      {tooltipShown && <AttendanceTooltip />}
    </>
  );
}

export default OverallAttendance;

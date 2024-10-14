import React, { Fragment, useEffect, useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import Stack from "react-bootstrap/Stack";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faSquareCheck,
  faSquare,
  faArrowPointer,
  faUser,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

import "./index.scss";

import SortedColumn from "../sortedColumn";

import * as lookup from "../../data/lookup.json";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import * as data from "../../data/attendance/all-time.json";
import * as lookup from "../../data/lookup.json";

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

function Attendance() {
  const [selectedParliament, setSelectedParliament] = useState("all");
  const [filteredAttendance, setFilteredAttendance] = useState([]);

  const [allParties, setAllParties] = useState([]);
  const [allCommittees, setAllCommittees] = useState([]);

  const [filteredByParties, setFilteredByParties] = useState([]);
  const [filteredByCommittees, setFilteredByCommittees] = useState([]);

  const changeParliament = (parliament) => {
    setSelectedParliament(parliament);
  };

  const attendanceStates = lookup["attendance-states"];

  const [averageAttendance, setAverageAttendance] = useState(50);
  const [maxAttendance, setMaxAttendance] = useState(0);
  const [dataAttendance, setDataAttendance] = useState([]);
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
                <Fragment>Party</Fragment>
              ) : (
                <Fragment>Member</Fragment>
              )}
            </span>
            <br />
            {tooltipAttendance.label}
          </div>
          <div className="tooltip-body mt-2">
            <table>
              <tbody>
                {!ChartTypes[selectedChartType].detailed ? (
                  <Fragment>
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
                  </Fragment>
                ) : (
                  <Fragment>
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
                  </Fragment>
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

  const clearFilters = () => {
    setMemberSearch('');
    setFilteredByParties([]);
    setFilteredByCommittees([]);
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
                ...new Set(
                  partyAttendance[data[id].party].committees.flat(Infinity)
                ),
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

      item["committees"] = [...new Set(item["committees"].flat(Infinity))];

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

    const allPartiesSet = new Set(activeAttendance.map((r) => r.party).sort());
    setAllParties(Array.from(allPartiesSet));

    const allCommitteesSet = new Set(
      activeAttendance.map((r) => r.committees).flat(Infinity)
    );
    setAllCommittees(Array.from(allCommitteesSet).sort());
  };

  const getDifferentToAveragePercentage = (attendancePercentage) => {
    // Set difference between average and item.attendance-percentage
    return attendancePercentage - averageAttendance;
  };

  useEffect(() => {
    setupData();
  }, [data, selectedParliament, grouping]);

  useEffect(() => {
    filterAttendanceData(dataAttendance);
  }, [dataAttendance, filteredByParties, filteredByCommittees, memberSearch]);

  const filterAttendanceData = (data) => {
    setFilteredAttendance(
      data
        .filter((row) => {
          if (grouping === "members") {
            return row.label.toLowerCase().includes(memberSearch.toLowerCase());
          }
          return true;
        })
        .filter((row) => {
          return (
            filteredByParties.length === 0 ||
            filteredByParties.includes(row.party)
          );
        })
        .filter((row) => {
          return (
            filteredByCommittees.length === 0 ||
            filteredByCommittees.some((committee) =>
              row.committees.includes(committee)
            )
          );
        })
    );
  };

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
    <Fragment>
      <PMHeader />

      <PMTabs active="attendance-tracker" />
      <Container fluid className="py-5">
        <div className="bill-tracker-container">
          <Row>
            <Col>
              <h1>Overall recorded meeting attendance</h1>
            </Col>
            <Col
              style={{
                display: "flex",
                justifyContent: "right",
                paddingRight: "0",
              }}
            >
              <Stack direction="horizontal" gap={3}>
                <Form.Group as={Row}>
                  <Form.Label column md="auto" className="mt-2">
                    Parliament:
                  </Form.Label>
                  <Col>
                    <Dropdown
                      className="dropdown-select"
                      onChange={(e) => changeParliament(e.target.value)}
                    >
                      <Dropdown.Toggle>
                        <Row>
                          <Col>
                            {lookup.parliaments[selectedParliament].name}
                          </Col>
                          <Col xs="auto">
                            <FontAwesomeIcon icon={faChevronDown} />
                          </Col>
                        </Row>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {Object.keys(lookup.parliaments).map(
                          (parliament, index) => {
                            return (
                              <Dropdown.Item
                                key={lookup.parliaments[parliament].name}
                                onClick={() =>
                                  setSelectedParliament(parliament)
                                }
                              >
                                {lookup.parliaments[parliament].name}
                              </Dropdown.Item>
                            );
                          }
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                </Form.Group>

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
                    Parties
                  </button>
                </div>
              </Stack>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={2}>
              <div className="sidebar">
                <Accordion
                  className="no-button"
                  defaultActiveKey={["0", "1"]}
                  alwaysOpen
                >
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <FontAwesomeIcon icon={faFilter} /> Filter{" "}
                      {grouping === "party" ? "parties" : "members"}
                    </Accordion.Header>
                    <Accordion.Body>
                      <Stack gap={3}>
                        <label>
                          Showing: {filteredAttendance.length} of{" "}
                          {dataAttendance.length}
                        </label>

                        {grouping === "members" && (
                          <div className="form-input-container">
                            <Form.Control
                              type="text"
                              placeholder="Filter by name..."
                              className="form-input"
                              onChange={(e) => setMemberSearch(e.target.value)}
                            />
                          </div>
                        )}

                        <Dropdown
                          className="dropdown-select"
                          autoClose="outside"
                        >
                          <Dropdown.Toggle>
                            <Row>
                              <Col>
                                Party (
                                {filteredByParties.length > 0 &&
                                  `${filteredByParties.length}/`}
                                {allParties.length})
                              </Col>
                              <Col xs="auto">
                                <FontAwesomeIcon icon={faChevronDown} />
                              </Col>
                            </Row>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item
                              onClick={() => setFilteredByParties([])}
                            >
                              <FontAwesomeIcon
                                icon={
                                  filteredByParties.length == 0
                                    ? faSquareCheck
                                    : faSquare
                                }
                                className="me-2"
                              />
                              All Parties
                            </Dropdown.Item>

                            {allParties.map((party, index) => (
                              <Dropdown.Item
                                key={party}
                                onClick={() =>
                                  setFilteredByParties(
                                    filteredByParties.includes(party)
                                      ? filteredByParties.filter(
                                          (selectedParty) =>
                                            selectedParty !== party
                                        )
                                      : [...filteredByParties, party]
                                  )
                                }
                              >
                                <FontAwesomeIcon
                                  icon={
                                    filteredByParties.includes(party)
                                      ? faSquareCheck
                                      : faSquare
                                  }
                                  className="me-2"
                                />
                                {party}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>

                        {grouping === "members" && (
                          <Dropdown
                            className="dropdown-select"
                            autoClose="outside"
                          >
                            <Dropdown.Toggle>
                              <Row>
                                <Col>
                                  Committee (
                                  {filteredByCommittees.length > 0 &&
                                    `${filteredByCommittees.length}/`}
                                  {allCommittees.length})
                                </Col>
                                <Col xs="auto">
                                  <FontAwesomeIcon icon={faChevronDown} />
                                </Col>
                              </Row>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => setFilteredByCommittees([])}
                              >
                                <FontAwesomeIcon
                                  icon={
                                    filteredByCommittees.length == 0
                                      ? faSquareCheck
                                      : faSquare
                                  }
                                  className="me-2"
                                />
                                All Committees
                              </Dropdown.Item>

                              {allCommittees.map((committee, index) => (
                                <Dropdown.Item
                                  key={committee}
                                  onClick={() =>
                                    setFilteredByCommittees(
                                      filteredByCommittees.includes(committee)
                                        ? filteredByCommittees.filter(
                                            (selectedCommittee) =>
                                              selectedCommittee !== committee
                                          )
                                        : [...filteredByCommittees, committee]
                                    )
                                  }
                                  title={committee}
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      filteredByCommittees.includes(committee)
                                        ? faSquareCheck
                                        : faSquare
                                    }
                                    className="me-2"
                                  />
                                  {committee}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                        <Button variant="link" onClick={clearFilters}>
                          Clear all
                        </Button>
                      </Stack>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            </Col>
            <Col>
              <h2 className="sectionHeader">
                <FontAwesomeIcon icon={faUser} />
                List of {grouping === "party" ? "parties" : "members"} (
                {filteredAttendance.length})
              </h2>
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
                      sortThisfield={
                        grouping === "party" ? "member-count" : "party"
                      }
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

                    <th>Attendance breakdown</th>
                    <th colSpan={selectedChartType === "average" ? "2" : ""}>
                      <div style={{ width: "200px", float: "right" }}>
                        <Dropdown
                          aria-label="Select chart type"
                          className="dropdown-select size-sm"
                          onChange={(e) => setSelectedChartType(e.target.value)}
                        >
                          <Dropdown.Toggle>
                            <Row>
                              <Col>{ChartTypes[selectedChartType].label}</Col>
                              <Col xs="auto">
                                <FontAwesomeIcon icon={faChevronDown} />
                              </Col>
                            </Row>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {Object.keys(ChartTypes).map((chartType, index) => {
                              return (
                                <Dropdown.Item
                                  onClick={() =>
                                    setSelectedChartType(chartType)
                                  }
                                >
                                  {ChartTypes[chartType].label}
                                </Dropdown.Item>
                              );
                            })}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((row) => (
                    <tr key={row.label}>
                      <td className="no-word-break">{row.label}</td>
                      <td className="no-word-break">
                        {grouping === "party"
                          ? row["member-count"]
                          : shortPartyName(row["party"])}
                      </td>
                      {grouping === "members" && (
                        <td>{row["committees-count"]}</td>
                      )}
                      <td>{row["attendance-count"].toLocaleString()}</td>
                      <td className="no-word-break">
                        {row["attended-count"].toLocaleString()}
                      </td>
                      <td className="no-word-break">
                        <span className="percentageAttendance">
                          {Math.round(parseFloat(row["attendance-percentage"]))}
                          %
                        </span>{" "}
                      </td>
                      {selectedChartType === "average" && (
                        <Fragment>
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
                        </Fragment>
                      )}
                      {selectedChartType !== "average" && (
                        <td
                          colSpan="2"
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
                                  onMouseLeave={() =>
                                    setTooltipAttendanceState("")
                                  }
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
                                    highlightedAttendanceState ===
                                    attendance.state
                                      ? "state-highlighted"
                                      : ""
                                  }`}
                                  style={{
                                    width: `${
                                      (attendance.count /
                                        (ChartTypes[selectedChartType]
                                          .percentage
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
                            <Fragment>
                              <li>
                                <span className="bar state-attended">
                                  Above
                                </span>{" "}
                                Above average
                              </li>
                              <li>
                                <span className="bar state-missed">Below</span>{" "}
                                Below average
                              </li>
                              <li>
                                &mdash; Attendance average (
                                {Math.round(averageAttendance)}%)
                              </li>
                            </Fragment>
                          )}
                          {selectedChartType !== "average" &&
                            ChartTypes[selectedChartType].detailed && (
                              <Fragment>
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
                              </Fragment>
                            )}
                          {selectedChartType !== "average" &&
                            !ChartTypes[selectedChartType].detailed && (
                              <Fragment>
                                <li>
                                  <span className="bar state-attended">
                                    Attended
                                  </span>{" "}
                                  Meetings attended
                                </li>
                                <li>
                                  <span className="bar state-missed">
                                    Missed
                                  </span>{" "}
                                  Meetings missed
                                </li>
                              </Fragment>
                            )}
                        </ul>
                        {selectedChartType !== "average" &&
                          ChartTypes[selectedChartType].detailed && (
                            <Fragment>
                              <FontAwesomeIcon
                                style={{ marginLeft: "auto" }}
                                icon={faArrowPointer}
                              />
                              <div>Click to isolate a category</div>
                            </Fragment>
                          )}
                      </Stack>
                    </td>
                  </tr>
                </tfoot>
              </table>
              {tooltipShown && <AttendanceTooltip />}
            </Col>
          </Row>
        </div>
      </Container>

      <a
        className="provideFeedback"
        href="https://docs.google.com/forms/d/e/1FAIpQLSfaMxpxAx4TxaDcGZv2NySfZBir-nRblwMnNWiYhrxsnwsudg/viewform?usp=pp_url&entry.1431082534=Attendance+Tracker"
        target="_blank"
        rel="noopener noreferrer"
      >
        Povide feedback
      </a>
    </Fragment>
  );
}

export default Attendance;

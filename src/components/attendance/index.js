import React, { Fragment, useEffect, useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import Stack from "react-bootstrap/Stack";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import { SettingsModal, loadSettings } from "../../components/settings";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faSquareCheck,
  faSquare,
  faUser,
  faFilter,
  faDownload,
  faSliders
} from "@fortawesome/free-solid-svg-icons";

import "../attendance/index.scss";

import SortedColumn from "../sortedColumn";

import * as lookup from "../../data/lookup.json";
import * as allTimeData from "../../data/attendance/all-time.json";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

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
  "percentage-simple": {
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

// Get attendance states from lookup
const attendanceStates = lookup["attendance-states"];

// Process real data from all-time.json
const processAttendanceData = (parliament = "7th-parliament", groupingType = "members", includeAlternates = true, includePermanents = true) => {
  const data = [];
  
  if (groupingType === "members") {
    // Process member data
    Object.entries(allTimeData).forEach(([memberId, memberData]) => {
      if (!memberData.name) return; // Skip entries without name
      
      const parliamentRecord = memberData["parliamentary-record"]?.[parliament];
      if (!parliamentRecord || parliamentRecord.length === 0) return;
      
      // Calculate statistics
      let attendedCount = 0;
      let possibleMeetings = 0;
      let committeeMemberships = new Set();
      let houses = new Set();
      const statusCounts = {};
      
      parliamentRecord.forEach((record) => {
        const state = record.state;
        const count = record.count || 0;
        const stateConfig = attendanceStates[state];
        
        if (!stateConfig) return;
        
        // Check if we should include this record based on settings
        if (stateConfig.alternate && !includeAlternates) return;
        if (!stateConfig.alternate && !includePermanents) return;
        if (stateConfig.exclude) return;
        
        // Count possible meetings
        possibleMeetings += count;
        
        // Count attended meetings (based on group)
        if (stateConfig.group === "attended" || 
            (includeAlternates && stateConfig.group === "attended-am")) {
          attendedCount += count;
        }
        
        // Track status counts for visualization
        if (!statusCounts[state]) {
          statusCounts[state] = 0;
        }
        statusCounts[state] += count;
        
        // Track committees and houses (only from records that pass the filter)
        if (record.committees) {
          record.committees.forEach(c => committeeMemberships.add(c));
        }
        if (record.houses) {
          record.houses.forEach(h => houses.add(h));
        }
      });
      
      if (possibleMeetings === 0) return; // Skip members with no meetings
      
      const attendancePercentage = (attendedCount / possibleMeetings) * 100;
      
      // Filter attendance records based on settings
      const filteredAttendanceRecords = parliamentRecord.filter((record) => {
        const stateConfig = attendanceStates[record.state];
        if (!stateConfig || stateConfig.exclude) return false;
        if (stateConfig.alternate && !includeAlternates) return false;
        if (!stateConfig.alternate && !includePermanents) return false;
        return true;
      }).map(record => ({
        state: record.state,
        count: record.count,
        committees: record.committees,
        houses: record.houses
      }));
      
      data.push({
        id: memberId,
        label: memberData.name,
        party: memberData.party,
        current: memberData.current === "true",
        "attendance-count": possibleMeetings,
        "attended-count": attendedCount,
        "attendance-percentage": attendancePercentage,
        "possible-meetings": possibleMeetings,
        "committee-memberships": committeeMemberships.size,
        "committees-count": committeeMemberships.size,
        statusCounts,
        committees: Array.from(committeeMemberships),
        houses: Array.from(houses),
        attendance: filteredAttendanceRecords,
        "grouped-attendance": Object.entries(
          filteredAttendanceRecords.reduce((acc, record) => {
            const stateConfig = attendanceStates[record.state];
            const group = stateConfig.group;
            if (!acc[group]) acc[group] = 0;
            acc[group] += record.count || 0;
            return acc;
          }, {})
        ).map(([group, count]) => ({
          group,
          count,
          percentage: (count / possibleMeetings) * 100
        }))
      });
    });
  } else if (groupingType === "party") {
    // Group by party
    const partyGroups = {};
    
    Object.entries(allTimeData).forEach(([memberId, memberData]) => {
      if (!memberData.name || !memberData.party) return;
      
      const parliamentRecord = memberData["parliamentary-record"]?.[parliament];
      if (!parliamentRecord || parliamentRecord.length === 0) return;
      
      if (!partyGroups[memberData.party]) {
        partyGroups[memberData.party] = {
          attendedCount: 0,
          possibleMeetings: 0,
          memberCount: 0,
          statusCounts: {},
        };
      }
      
      const partyGroup = partyGroups[memberData.party];
      partyGroup.memberCount++;
      
      parliamentRecord.forEach((record) => {
        const state = record.state;
        const count = record.count || 0;
        const stateConfig = attendanceStates[state];
        
        if (!stateConfig) return;
        if (stateConfig.alternate && !includeAlternates) return;
        if (!stateConfig.alternate && !includePermanents) return;
        if (stateConfig.exclude) return;
        
        partyGroup.possibleMeetings += count;
        
        if (stateConfig.group === "attended" || 
            (includeAlternates && stateConfig.group === "attended-am")) {
          partyGroup.attendedCount += count;
        }
        
        if (!partyGroup.statusCounts[state]) {
          partyGroup.statusCounts[state] = 0;
        }
        partyGroup.statusCounts[state] += count;
      });
    });
    
    Object.entries(partyGroups).forEach(([party, stats]) => {
      if (stats.possibleMeetings === 0) return;
      
      const attendancePercentage = (stats.attendedCount / stats.possibleMeetings) * 100;
      
      // Build attendance array from statusCounts
      const attendance = Object.entries(stats.statusCounts).map(([state, count]) => ({
        state,
        count
      }));
      
      // Build grouped-attendance from statusCounts
      const groupedAttendance = Object.entries(
        attendance.reduce((acc, record) => {
          const stateConfig = attendanceStates[record.state];
          if (!stateConfig) return acc;
          const group = stateConfig.group;
          if (!acc[group]) acc[group] = 0;
          acc[group] += record.count || 0;
          return acc;
        }, {})
      ).map(([group, count]) => ({
        group,
        count,
        percentage: (count / stats.possibleMeetings) * 100
      }));
      
      data.push({
        label: party,
        party: party,
        "attendance-count": stats.possibleMeetings,
        "attended-count": stats.attendedCount,
        "attendance-percentage": attendancePercentage,
        "possible-meetings": stats.possibleMeetings,
        "member-count": stats.memberCount,
        statusCounts: stats.statusCounts,
        attendance: attendance,
        "grouped-attendance": groupedAttendance,
      });
    });
  } else if (groupingType === "committees") {
    // Group by committee
    const committeeGroups = {};
    
    Object.entries(allTimeData).forEach(([memberId, memberData]) => {
      if (!memberData.name) return;
      
      const parliamentRecord = memberData["parliamentary-record"]?.[parliament];
      if (!parliamentRecord || parliamentRecord.length === 0) return;
      
      parliamentRecord.forEach((record) => {
        const state = record.state;
        const count = record.count || 0;
        const stateConfig = attendanceStates[state];
        
        if (!stateConfig) return;
        if (stateConfig.alternate && !includeAlternates) return;
        if (!stateConfig.alternate && !includePermanents) return;
        if (stateConfig.exclude) return;
        
        if (record.committees) {
          record.committees.forEach(committee => {
            if (!committeeGroups[committee]) {
              committeeGroups[committee] = {
                attendedCount: 0,
                possibleMeetings: 0,
                statusCounts: {},
              };
            }
            
            const committeeGroup = committeeGroups[committee];
            committeeGroup.possibleMeetings += count;
            
            if (stateConfig.group === "attended" || 
                (includeAlternates && stateConfig.group === "attended-am")) {
              committeeGroup.attendedCount += count;
            }
            
            if (!committeeGroup.statusCounts[state]) {
              committeeGroup.statusCounts[state] = 0;
            }
            committeeGroup.statusCounts[state] += count;
          });
        }
      });
    });
    
    Object.entries(committeeGroups).forEach(([committee, stats]) => {
      if (stats.possibleMeetings === 0) return;
      
      const attendancePercentage = (stats.attendedCount / stats.possibleMeetings) * 100;
      
      // Build attendance array from statusCounts
      const attendance = Object.entries(stats.statusCounts).map(([state, count]) => ({
        state,
        count
      }));
      
      // Build grouped-attendance from statusCounts
      const groupedAttendance = Object.entries(
        attendance.reduce((acc, record) => {
          const stateConfig = attendanceStates[record.state];
          if (!stateConfig) return acc;
          const group = stateConfig.group;
          if (!acc[group]) acc[group] = 0;
          acc[group] += record.count || 0;
          return acc;
        }, {})
      ).map(([group, count]) => ({
        group,
        count,
        percentage: (count / stats.possibleMeetings) * 100
      }));
      
      data.push({
        label: committee,
        "attendance-count": stats.possibleMeetings,
        "attended-count": stats.attendedCount,
        "attendance-percentage": attendancePercentage,
        "possible-meetings": stats.possibleMeetings,
        statusCounts: stats.statusCounts,
        attendance: attendance,
        "grouped-attendance": groupedAttendance,
      });
    });
  }
  
  return data;
};

// Extract unique values for filters
const extractUniqueValues = () => {
  const parties = new Set();
  const committees = new Set();
  const houses = new Set();
  
  Object.values(allTimeData).forEach((memberData) => {
    if (memberData.party) {
      parties.add(memberData.party);
    }
    
    const parliamentRecord = memberData["parliamentary-record"]?.["7th-parliament"];
    if (parliamentRecord) {
      parliamentRecord.forEach((record) => {
        if (record.committees) {
          record.committees.forEach(c => committees.add(c));
        }
        if (record.houses) {
          record.houses.forEach(h => houses.add(h));
        }
      });
    }
  });
  
  return {
    parties: Array.from(parties).sort(),
    committees: Array.from(committees).sort(),
    houses: Array.from(houses).sort(),
  };
};

function Attendance() {
  const settings = loadSettings();
  const [selectedParliament, setSelectedParliament] = useState("7th-parliament");
  const [filteredAttendance, setFilteredAttendance] = useState([]);

  // Initialize with real data from all-time.json
  const uniqueValues = extractUniqueValues();
  const [allParties, setAllParties] = useState(uniqueValues.parties);
  const [allCommittees, setAllCommittees] = useState(uniqueValues.committees);
  const [allHouses, setAllHouses] = useState(uniqueValues.houses);

  const [filteredByParties, setFilteredByParties] = useState([]);
  const [filteredByCommittees, setFilteredByCommittees] = useState([]);
  const [filteredByHouses, setFilteredByHouses] = useState(['National Assembly']);
  const [filteredByCurrent, setFilteredByCurrent] = useState(true);
  const [includeAlternates, setIncludeAlternates] = useState(settings.includeAlternates);
  const [includePermanents, setIncludePermanents] = useState(settings.includePermanents);

  const changeParliament = (parliament) => {
    setSelectedParliament(parliament);
  };

  const [averageAttendance, setAverageAttendance] = useState(65);
  const [maxAttendance, setMaxAttendance] = useState(150);
  const [dataAttendance, setDataAttendance] = useState([]);
  const [grouping, setGrouping] = useState("members");
  const [modalSettingsOpen, setModalSettingsOpen] = useState(false);
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

  const downloadJSON = () => {
    const jsonString = JSON.stringify(filteredAttendance, (key, value) => {
      return (value instanceof Set ? [...value] : value)
    });

    const blob = new Blob([jsonString], { type: 'text/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'parlimeter-attendance.json';
    link.click();
  };

  const AttendanceTooltip = () => {
    const attendedGroup = tooltipAttendance["grouped-attendance"]?.find(
      (a) => a.group === "attended"
    );
    const missedGroup = tooltipAttendance["grouped-attendance"]?.find(
      (a) => a.group === "missed"
    );
    const attendedAMGroup = tooltipAttendance["grouped-attendance"]?.find(
      (a) => a.group === "attended-am"
    );
    const missedAMGroup = tooltipAttendance["grouped-attendance"]?.find(
      (a) => a.group === "missed-am"
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
                    {attendedAMGroup && (
                      <tr
                        className={
                          tooltipAttendanceState === "attended-am"
                            ? "state-attended-am"
                            : ""
                        }
                      >
                        <td>Meetings attended (alternate):</td>
                        <td className="text-align-right">
                          {attendedAMGroup.count.toLocaleString()}
                        </td>
                        <td>({Math.round(attendedAMGroup.percentage)}%)</td>
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
                    {missedAMGroup && (
                      <tr
                        className={
                          tooltipAttendanceState === "missed-am"
                            ? "state-missed-am"
                            : ""
                        }
                      >
                        <td>Meetings missed (alternate):</td>
                        <td className="text-align-right">
                          {missedAMGroup.count.toLocaleString()}
                        </td>
                        <td>({Math.round(missedAMGroup.percentage)}%)</td>
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
    setMemberSearch("");
    setFilteredByParties([]);
    setFilteredByCommittees([]);
    setFilteredByHouses(['National Assembly']);
    setFilteredByCurrent(true);
  };

  const onSettingsChange = (settings) => {
    setIncludeAlternates(settings.includeAlternates);
    setIncludePermanents(settings.includePermanents);
  }

  // Load real data from all-time.json
  useEffect(() => {
    const realData = processAttendanceData(selectedParliament, grouping, includeAlternates, includePermanents);
    setDataAttendance(realData);
    
    // Calculate average and max attendance
    if (realData.length > 0) {
      const avgAttendance = realData.reduce((sum, item) => sum + item["attendance-percentage"], 0) / realData.length;
      const maxPossible = Math.max(...realData.map(item => item["possible-meetings"]));
      setAverageAttendance(avgAttendance);
      setMaxAttendance(maxPossible);
    }
  }, [grouping, selectedParliament, includeAlternates, includePermanents]);

  useEffect(() => {
    filterAndSortAttendanceData(dataAttendance);
  }, [
    dataAttendance,
    filteredByParties,
    filteredByCommittees,
    filteredByHouses,
    filteredByCurrent,
    memberSearch,
    sortedField,
    sortedDirection,
  ]);

  const filterAndSortAttendanceData = (data) => {
    data = data
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
        if (grouping === "members") {
          // Filter by committees - member must be in at least one of the selected committees
          if (filteredByCommittees.length > 0) {
            return row.committees && row.committees.some(committee => 
              filteredByCommittees.includes(committee)
            );
          }
        }
        return true;
      })
      .filter((row) => {
        if (grouping === "members") {
          // Filter by houses - member must be in at least one of the selected houses
          if (filteredByHouses.length > 0) {
            return row.houses && row.houses.some(house => 
              filteredByHouses.includes(house)
            );
          }
        }
        return true;
      })
      .filter((row) => {
        if (grouping === "members") {
          return (
            filteredByCurrent ? row.current : true
          )
        }
        return true;
      });

    if (sortedDirection === "asc") {
      data = data.sort((a, b) => {
        if (sortedField === "label" || sortedField === "party") {
          return b[sortedField].localeCompare(a[sortedField]);
        } else {
          return a[sortedField] - b[sortedField];
        }
      });
    } else {
      data = data.sort((a, b) => {
        if (sortedField === "label" || sortedField === "party") {
          return a[sortedField].localeCompare(b[sortedField]);
        } else {
          return b[sortedField] - a[sortedField];
        }
      });
    }
    setFilteredAttendance(data);
  };

  const setSort = (fieldToSortBy) => {
    setSortedField(fieldToSortBy);
    setSortedDirection(sortedDirection === "desc" ? "asc" : "desc");
  };

  const getDifferentToAveragePercentage = (attendancePercentage) => {
    return attendancePercentage - averageAttendance;
  };

  return (
    <Fragment>
      <PMHeader />

      <PMTabs active="attendance-tracker-2" />
      <Container fluid className="py-4">
        <div className="bill-tracker-container">
          <Row className="mb-4">
            <Col>
              <h1>Overall recorded meeting attendance (v2)</h1>
            </Col>
            <Col xs="auto">
              <div className="badge text-bg-dark py-1 px-2">Data till 3 Feb 2026</div>
            </Col>
          </Row>
          <Row>
            <Col
              style={{
                display: "flex",
                justifyContent: "right",
                paddingRight: "0",
              }}
            >
              <Stack direction="horizontal" gap={3}>
                <Form.Group as={Row}>
                  <Form.Label column md="auto" className="mt-1">
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
                            {lookup.parliamentsAttendance[selectedParliament].name}
                          </Col>
                          <Col xs="auto">
                            <FontAwesomeIcon icon={faChevronDown} />
                          </Col>
                        </Row>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {Object.keys(lookup.parliamentsAttendance).map(
                          (parliament) => {
                            return (
                              <Dropdown.Item
                                key={parliament}
                                onClick={() =>
                                  setSelectedParliament(parliament)
                                }
                              >
                                {lookup.parliamentsAttendance[parliament].name}
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
                <button
                  className="toolbarButton"
                  onClick={() => setModalSettingsOpen(true)}
                >
                  <FontAwesomeIcon icon={faSliders} className="mx-2" />
                  Settings
                </button>
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
                              value={memberSearch}
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
                                key={`party-${index}-${party}`}
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
                                  key={`committee-${index}-${committee}`}
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

                        {grouping === "members" && (
                          <Dropdown
                            className="dropdown-select"
                            autoClose="outside"
                          >
                            <Dropdown.Toggle>
                              <Row>
                                <Col>
                                  House (
                                  {filteredByHouses.length > 0 &&
                                    `${filteredByHouses.length}/`}
                                  {allHouses.length})
                                </Col>
                                <Col xs="auto">
                                  <FontAwesomeIcon icon={faChevronDown} />
                                </Col>
                              </Row>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => setFilteredByHouses([])}
                              >
                                <FontAwesomeIcon
                                  icon={
                                    filteredByHouses.length == 0
                                      ? faSquareCheck
                                      : faSquare
                                  }
                                  className="me-2"
                                />
                                All Houses
                              </Dropdown.Item>

                              {allHouses.map((house, index) => (
                                <Dropdown.Item
                                  key={`house-${index}-${house}`}
                                  onClick={() =>
                                    setFilteredByHouses(
                                      filteredByHouses.includes(house)
                                        ? filteredByHouses.filter(
                                          (selectedHouse) =>
                                            selectedHouse !== house
                                        )
                                        : [...filteredByHouses, house]
                                    )
                                  }
                                  title={house}
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      filteredByHouses.includes(house)
                                        ? faSquareCheck
                                        : faSquare
                                    }
                                    className="me-2"
                                  />
                                  {house}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        )}

                        {/* <Stack direction="horizontal" gap={3}>
                          <div className="status-toggle">
                            <Form.Check
                              id="onlyCurrentMPs"
                              type="switch"
                              onChange={() => setFilteredByCurrent(!filteredByCurrent)}
                              checked={filteredByCurrent}
                            />
                          </div>
                          <label className="pt-2 fs-7" htmlFor="onlyCurrentMPs">Only Current Members</label>
                        </Stack> */}

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
                className={`${ChartTypes[selectedChartType].detailed ? "detailed" : ""
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
                        heading="CMs"
                        title="Committee Memberships"
                        setSort={setSort}
                        sortedField={sortedField}
                        sortedDirection={sortedDirection}
                      />
                    )}

                    <SortedColumn
                      sortThisfield="attendance-count"
                      heading="PMs"
                      title="Possible Meetings"
                      setSort={setSort}
                      sortedField={sortedField}
                      sortedDirection={sortedDirection}
                    />

                    <SortedColumn
                      sortThisfield="attended-count"
                      heading="Att. (v)"
                      title="Attended (value)"
                      setSort={setSort}
                      sortedField={sortedField}
                      sortedDirection={sortedDirection}
                    />

                    <SortedColumn
                      sortThisfield="attendance-percentage"
                      heading="Att. (%)"
                      title="Attended (%)"
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
                            {Object.keys(ChartTypes).map((chartType) => {
                              return (
                                <Dropdown.Item
                                  key={chartType}
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
                  {filteredAttendance.map((row, index) => (
                    <tr key={`${row.label}-${index}`}>
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
                              className={`bar-background no-border-radius-right half ${getDifferentToAveragePercentage(
                                row["attendance-percentage"]
                              ) <= 0 && "align-right"
                                }`}
                            >
                              {getDifferentToAveragePercentage(
                                row["attendance-percentage"]
                              ) <= 0 && (
                                  <div
                                    className={`bar state-${getDifferentToAveragePercentage(
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
                              className={`bar-background no-border-radius-left half ${getDifferentToAveragePercentage(
                                row["attendance-percentage"]
                              ) <= 0 && "align-right"
                                }`}
                            >
                              {getDifferentToAveragePercentage(
                                row["attendance-percentage"]
                              ) > 0 && (
                                  <div
                                    className={`bar state-${getDifferentToAveragePercentage(
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
                                if (ChartTypes[selectedChartType].detailed) {
                                  return b.state.localeCompare(a.state);
                                } else {
                                  // For grouped-attendance, sort by group
                                  return a.group.localeCompare(b.group);
                                }
                              })
                              .map((attendance) => (
                                <div
                                  key={ChartTypes[selectedChartType].detailed ? attendance.state : attendance.group}
                                  onMouseEnter={() =>
                                    setTooltipAttendanceState(
                                      ChartTypes[selectedChartType].detailed ? attendance.state : attendance.group
                                    )
                                  }
                                  onMouseLeave={() =>
                                    setTooltipAttendanceState("")
                                  }
                                  onClick={() =>
                                    toggleHighlightedAttendanceState(
                                      ChartTypes[selectedChartType].detailed ? attendance.state : attendance.group
                                    )
                                  }
                                  className={`bar state-${
                                    ChartTypes[selectedChartType].detailed ? attendance.state : attendance.group
                                  } state-grouping-${
                                    ChartTypes[selectedChartType].detailed
                                      ? attendanceStates[attendance.state].group
                                      : attendance.group
                                  } ${
                                    highlightedAttendanceState ===
                                      (ChartTypes[selectedChartType].detailed ? attendance.state : attendance.group)
                                      ? "state-highlighted"
                                      : ""
                                  }`}
                                  style={{
                                    width: `${(attendance.count / row["attendance-count"]) * 100}%`,
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
                                  .filter((state) => attendanceStates[state].legend)
                                  .map((state) => (
                                    <li
                                      key={state}
                                      className={`state-${state} ${highlightedAttendanceState === state
                                        ? "state-highlighted"
                                        : ""
                                        }`}
                                    >
                                      <span
                                        className={`bar state-${state} ${highlightedAttendanceState === state
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
                                  <span className="bar state-attended-am">
                                    Attended (alternate)
                                  </span>{" "}
                                  Meetings attended (alternate)
                                </li>
                                <li>
                                  <span className="bar state-missed">
                                    Missed
                                  </span>{" "}
                                  Meetings missed
                                </li>
                                <li>
                                  <span className="bar state-missed-am">
                                    Missed (alternate)
                                  </span>{" "}
                                  Meetings missed (alternate)
                                </li>
                              </Fragment>
                            )}
                        </ul>
                        <Button className="ml-auto" onClick={downloadJSON}>
                          <FontAwesomeIcon icon={faDownload} className="me-2" />
                          Download Data
                        </Button>
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
      <SettingsModal
        modalSettingsOpen={modalSettingsOpen}
        setModalSettingsOpen={setModalSettingsOpen}
        callback={onSettingsChange}
        settings={settings} />
    </Fragment>
  );
}

export default Attendance;

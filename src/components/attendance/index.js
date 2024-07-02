import React, { useEffect, useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";

import "./index.scss";

import * as data from "../../data/attendance/all-time.json";
import * as lookup from "../../data/lookup.json";

function Attendance() {
  const attendanceStates = lookup["attendance-states"];
  const parliaments = lookup["parliaments"];

  const [maxAttendance, setMaxAttendance] = useState(0);
  const [dataAttendance, setDataAttendance] = useState(null);
  const [grouping, setGrouping] = useState("party");
  const [detailedBreakdown, setDetailedBreakdown] = useState(false);
  const [showAsPercentage, setShowAsPercentage] = useState(false);
  const [selectedParliament, setSelectedParliament] = useState("all");
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

  const changeParliament = (parliament) => {
    setSelectedParliament(parliament);
  };

  const toggleGrouping = () => {
    if (grouping === "party") {
      setGrouping("member");
    } else {
      setGrouping("party");
    }
    setupData();
  };

  const toggleShowAsPercentage = () => {
    setShowAsPercentage(!showAsPercentage);
  };

  const toggleDetailedBreakDown = () => {
    setDetailedBreakdown(!detailedBreakdown);
  };

  return (
    <div className="attendance-tracker">
      <header className="p-5">
        <Container fluid>
          <Row>
            <Col md={8}>
              <h1>
                <FontAwesomeIcon icon={faUserCheck} /> Attendance
              </h1>
              <span>
                Which parties and members are attending the most meetings.
              </span>
            </Col>
            <Col>
              <Row>
                <Col>
                  <Form.Group as={Row}>
                    <Form.Label column md="auto">
                      Parliament
                    </Form.Label>
                    <Col>
                      <Form.Select
                        aria-label="Select Parliament"
                        defaultValue={selectedParliament}
                        onChange={(e) => changeParliament(e.target.value)}
                        size="lg"
                      >
                        {Object.keys(parliaments).map((parliament, index) => {
                          return (
                            <option
                              value={parliament}
                              key={`parliament-${index}`}
                            >
                              {lookup.parliaments[parliament].name}
                            </option>
                          );
                        })}
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </header>
      <Container fluid>
        <Row className="p-5">
          <Col md={12}>
            <h2>Overall recorded meeting attendance</h2>
            <Stack direction="horizontal" gap={3}>
              <div className="p-2">
                <ToggleButtonGroup
                  type="radio"
                  name="options"
                  defaultValue={1}
                  value={grouping}
                  onChange={toggleGrouping}
                >
                  <ToggleButton id="tbg-radio-1" value="party">
                    Party
                  </ToggleButton>
                  <ToggleButton id="tbg-radio-2" value="member">
                    Member
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>
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
                  <th>{grouping === "party" ? "Party" : "Member"}</th>
                  <th className="no-word-break">
                    {grouping === "party" ? "Members" : "Party"}
                  </th>
                  <th className="sortable" onClick={toggleSortableDirection}>
                    <span>Attendance</span>
                    <FontAwesomeIcon
                      icon={
                        sortedDirection === "desc" ? faCaretDown : faCaretUp
                      }
                    />
                  </th>
                  <th>Recorded totals breakdown</th>
                </tr>
              </thead>
              <tbody>
                {dataAttendance &&
                  dataAttendance.map((row) => (
                    <tr key={row.label}>
                      <td className="no-word-break">
                        <img
                          src="https://pa.org.za/media_root/cache/9e/f5/9ef5a6050bafc6be0d2a0a69c40f1372.jpg"
                          alt="ANC"
                          width="20"
                          height="20"
                          className="rounded-image"
                        />
                        {row.label}
                      </td>
                      <td className="no-word-break">
                        {grouping === "party"
                          ? row["member-count"]
                          : row["party"]}
                      </td>
                      <td className="no-word-break">
                        <span className="percentageAttendance">
                          {Math.round(parseFloat(row["attendance-percentage"]))}
                          %
                        </span>{" "}
                        of {row["attendance-count"].toLocaleString()}
                      </td>
                      <td width="100%">
                        <div className="bar-background">
                          {row[
                            detailedBreakdown
                              ? "attendance"
                              : "grouped-attendance"
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
            <hr />
          </Col>
        </Row>
        <Row className="p-5">
          <Col md={12}>
            <h2>Recorded meeting attendance compared to the average</h2>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Attendance;

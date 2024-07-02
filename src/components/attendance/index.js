import React, { useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCheck } from "@fortawesome/free-solid-svg-icons";

import "./index.scss";

import * as data from "../../data/attendance/attendance.json";
import * as lookup from "../../data/lookup.json";

function Attendance() {
  const partyAttendance = data;
  const attendanceStates = lookup["attendance-states"];

  const [grouping, setGrouping] = useState("party");
  const [detailedBreakdown, setDetailedBreakdown] = useState(false);
  const [showAsPercentage, setShowAsPercentage] = useState(false);
  const [selectedParliament, setSelectedParliament] = useState(null);

  // Filter out 0 attendance
  partyAttendance.forEach((party) => {
    party.attendance = party.attendance.filter(
      (attendance) => attendance.count > 0
    );
  });

  // Total party.attendance.count for each party as party-attendance-count
  partyAttendance.forEach((party) => {
    party["party-attendance-count"] = party.attendance.reduce(
      (total, attendance) => total + attendance.count,
      0
    );
  });

  // Group and total partyAttendance.party.attendance by attendanceStates.group ib partyAttendance.party.grouped-attendance[{state: STATE, count: COUNT}]
  partyAttendance.forEach((party) => {
    party["grouped-attendance"] = party.attendance.reduce(
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
  });

  // Make grouped-attendance an array
  partyAttendance.forEach((party) => {
    party["grouped-attendance"] = Object.values(party["grouped-attendance"]);
  });

  console.log(partyAttendance);

  const toggleGrouping = () => {
    if (grouping === "party") {
      setGrouping("member");
    } else {
      setGrouping("party");
    }
  };

  const toggleShowAsPercentage = () => {
    setShowAsPercentage(!showAsPercentage);
  };

  const toggleDetailedBreakDown = () => {
    setDetailedBreakdown(!detailedBreakdown);
  };

  // Calculate max attendance overall
  const maxAttendance = Math.max(
    ...partyAttendance.map((party) =>
      Math.max(...party.attendance.map((attendance) => attendance.count))
    )
  );

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
                        onChange={(e) => setSelectedParliament(e.target.value)}
                        size="lg"
                      >
                        {Object.keys(lookup.parliaments).map(
                          (parliament, index) => {
                            return (
                              <option
                                value={parliament}
                                key={`parliament-${index}`}
                              >
                                {lookup.parliaments[parliament].name}
                              </option>
                            );
                          }
                        )}
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
            {grouping === "party" && (
              <table className={`${detailedBreakdown && "detailed"}`}>
                <thead>
                  <tr>
                    <th>Party</th>
                    <th>Members</th>
                    <th>Attendance</th>
                    <th>Recorded totals breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {partyAttendance
                    .sort((a, b) => a.party.localeCompare(b.party))
                    .map((party) => (
                      <tr key={party.party}>
                        <td className="no-word-break">
                          <img
                            src="https://pa.org.za/media_root/cache/9e/f5/9ef5a6050bafc6be0d2a0a69c40f1372.jpg"
                            alt="ANC"
                            width="20"
                            height="20"
                            className="rounded-image"
                          />
                          {party.party}
                        </td>
                        <td>{party["member-count"]}</td>
                        <td className="no-word-break">
                          {party["attendance-percentage"]}% of{" "}
                          {party["party-attendance-count"]}
                        </td>
                        <td width="100%">
                          <div className="bar-background">
                            {party[
                              detailedBreakdown
                                ? "attendance"
                                : "grouped-attendance"
                            ]
                              .sort((a, b) => {
                                return b.state.localeCompare(a.state);
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
                                          ? party["party-attendance-count"]
                                          : maxAttendance)) *
                                      100
                                    }%`,
                                  }}
                                >
                                  {showAsPercentage
                                    ? `${Math.round(
                                        parseFloat(
                                          (attendance.count /
                                            party["party-attendance-count"]) *
                                            100
                                        )
                                      )}%`
                                    : attendance.count}
                                </div>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            {grouping === "member" && (
              <table>
                <tbody>
                  <tr>
                    <td>member</td>
                  </tr>
                </tbody>
              </table>
            )}
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

import React, { useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCheck } from "@fortawesome/free-solid-svg-icons";

import "./index.scss";

import * as lookup from "../../data/lookup.json";
import OverallAttendance from "./overall";

function Attendance() {
  const parliaments = lookup["parliaments"];
  const [selectedParliament, setSelectedParliament] = useState("all");

  const changeParliament = (parliament) => {
    setSelectedParliament(parliament);
  };

  return (
    <div className="attendance-tracker">
      <header className="p-5">
        <Container fluid>
          <Stack direction="horizontal" gap="3">
            <h1>
              <Stack direction="horizontal" gap="3">
                <FontAwesomeIcon icon={faUserCheck} /> <div>Attendance</div>
              </Stack>
            </h1>
            <div style={{ marginLeft: "auto" }}>Parliament:</div>
            <Form.Select
              aria-label="Select Parliament"
              defaultValue={selectedParliament}
              onChange={(e) => changeParliament(e.target.value)}
              size="md"
              className="parliamentSelector"
            >
              {Object.keys(parliaments).map((parliament, index) => {
                return (
                  <option value={parliament} key={`parliament-${index}`}>
                    {lookup.parliaments[parliament].name} (
                    {new Date(
                      lookup.parliaments[parliament].start
                    ).getFullYear()}
                    -
                    {new Date(lookup.parliaments[parliament].end).getFullYear()}
                    )
                  </option>
                );
              })}
            </Form.Select>
          </Stack>
          <span>
            Which parties and members are attending the most meetings.
          </span>
        </Container>
      </header>
      <Container fluid>
        <Row className="p-5 pb-4">
          <Col md={12}>
            <OverallAttendance selectedParliament={selectedParliament} />
          </Col>
        </Row>
      </Container>
      <a
        className="provideFeedback"
        href="https://docs.google.com/forms/d/e/1FAIpQLSfaMxpxAx4TxaDcGZv2NySfZBir-nRblwMnNWiYhrxsnwsudg/viewform?usp=pp_url&entry.1431082534=Attendance+Tracker"
        target="_blank"
        rel="noopener noreferrer"
      >
        Povide feedback
      </a>
    </div>
  );
}

export default Attendance;

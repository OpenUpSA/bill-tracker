import React, { useEffect, useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCheck } from "@fortawesome/free-solid-svg-icons";

import "./index.scss";

import * as lookup from "../../data/lookup.json";
import OverallAttendance from "./overall";
import AverageAttendance from "./average";

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
            <OverallAttendance selectedParliament={selectedParliament} />
            <hr />
          </Col>
        </Row>
        <Row className="p-5">
          <Col md={12}>
            <AverageAttendance selectedParliament={selectedParliament} />
            <hr />
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

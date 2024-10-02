import React, { useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import "./index.scss";

import * as lookup from "../../data/lookup.json";
import OverallAttendance from "./overall";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

function Attendance() {
  const [selectedParliament, setSelectedParliament] = useState("all");

  const changeParliament = (parliament) => {
    setSelectedParliament(parliament);
  };

  return (
    <>
      <PMHeader />

      <PMTabs active="attendance-tracker" />
      <Container fluid className="py-5">
        <div className="bill-tracker-container">
          <Row>
            <Col>
              <h1>Overall recorded meeting attendance</h1>
            </Col>
            <Col xs="auto">
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
                        <Col>{lookup.parliaments[selectedParliament].name}</Col>
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
                              onClick={() => setSelectedParliament(parliament)}
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
            </Col>
          </Row>
          <Row className="mt-3">
            <OverallAttendance selectedParliament={selectedParliament} />
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
    </>
  );
}

export default Attendance;

import React, { useEffect, useRef, useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import Dropdown from 'react-bootstrap/Dropdown';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFlag, faChevronDown, faCircleArrowRight } from "@fortawesome/free-solid-svg-icons";

import { BillCommenced, BillRevised, BillWithdrawn, BillRejected, BillPassed, ActCommenced } from "./icons";

import axios from "axios";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";

function BillTracker() {

    const [bills, setBills] = useState([]);


    const getBills = async () => {

        try {
            const response = await axios.get("https://api.pmg.org.za/v2/bill-tracker/");
            setBills(response.data);
        } catch (err) {
            console.error(err.message);
        }

    }

    useEffect(() => {
        getBills();
    }, []);

    useEffect(() => {
        console.log(bills);
    }, [bills]);


    return (
        <>
            <PMHeader />
            
            <PMTabs />

            <Container fluid className="py-5">

                <Row>
                    <Col>
                        <h1>Bill Tracker</h1>
                    </Col>
                </Row>

                <Row className="mt-5">
                    <Col md={3}>
                        <Accordion defaultActiveKey={[0]} alwaysOpen>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header><FontAwesomeIcon icon={faFilter} /> Group and filter bills</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <Col xs="auto" className="align-self-center">Group by:</Col>
                                        <Col>
                                            <Dropdown className="dropdown-select">
                                                <Dropdown.Toggle>
                                                    <Row>
                                                        <Col>Current Status</Col>
                                                        <Col xs="auto"><FontAwesomeIcon icon={faChevronDown} /></Col>
                                                    </Row>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                                                    <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                                                    <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <Row className="my-3">
                                        <Col xs="auto">Showing:</Col>
                                        <Col className="text-end">
                                            63 of 63 (100%)
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col>
                                            <div className="form-input-container">
                                                <Form.Control type="text" placeholder="Search for a bill..." className="form-input" />
                                            </div>
                                        </Col>
                                    </Row>


                                    <Row className="mt-4">
                                        <Col>
                                            <Dropdown className="dropdown-select">
                                                <Dropdown.Toggle>
                                                    <Row>
                                                        <Col>Bill type</Col>
                                                        <Col xs="auto"><FontAwesomeIcon icon={faChevronDown} /></Col>
                                                    </Row>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                                                    <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                                                    <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <Row className="mt-2">
                                        <Col>
                                            <Dropdown className="dropdown-select">
                                                <Dropdown.Toggle>
                                                    <Row>
                                                        <Col>Bill status</Col>
                                                        <Col xs="auto"><FontAwesomeIcon icon={faChevronDown} /></Col>
                                                    </Row>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                                                    <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                                                    <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <div className="clear-all mt-4">Clear all</div>

                                </Accordion.Body>
                            </Accordion.Item>

                            <Accordion.Item eventKey="1">
                                <Accordion.Header><FontAwesomeIcon icon={faFlag} /> Toggle bill events</Accordion.Header>
                                <Accordion.Body>

                                    <Row className="mb-4 status-toggle">
                                        <Col xs="auto">
                                            <BillCommenced />
                                        </Col>
                                        <Col className="align-self-center">Bill commenced</Col>
                                        <Col xs="auto">
                                            <Form.Check type="switch"  />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4 status-toggle">
                                        <Col xs="auto">
                                            <BillRevised />
                                        </Col>
                                        <Col className="align-self-center">Bill revised</Col>
                                        <Col xs="auto">
                                            <Form.Check type="switch" />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4 status-toggle">
                                        <Col xs="auto">
                                            <BillWithdrawn />
                                        </Col>
                                        <Col className="align-self-center">Bill withdrawn</Col>
                                        <Col xs="auto">
                                            <Form.Check type="switch" />
                                        </Col> 
                                    </Row>

                                    <Row className="mb-4 status-toggle">
                                        <Col xs="auto">
                                            <BillRejected />
                                        </Col>
                                        <Col className="align-self-center">Bill rejected</Col>
                                        <Col xs="auto">
                                            <Form.Check type="switch" />
                                        </Col>
                                    </Row>

                                    <Row className="mb-4 status-toggle">
                                        <Col xs="auto">
                                            <BillPassed />
                                        </Col>
                                        <Col className="align-self-center">Bill passed</Col>
                                        <Col xs="auto">
                                            <Form.Check type="switch" />
                                        </Col>
                                    </Row>

                                    <Row className="status-toggle">
                                        <Col xs="auto">
                                            <ActCommenced />
                                        </Col>
                                        <Col className="align-self-center">Act commenced</Col>
                                        <Col xs="auto">
                                            <Form.Check type="switch" />
                                        </Col>
                                    </Row>


                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>

                        
                    </Col>
                    <Col>

                    </Col>
                </Row>

            </Container>
        </>
    );
}

export default BillTracker;
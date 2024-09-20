import React, { useEffect, useRef, useState } from "react";

import axios from "axios";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import Dropdown from 'react-bootstrap/Dropdown';
import Stack from 'react-bootstrap/Stack';

import { SparklinesLine } from '@lueton/react-sparklines';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFlag, faChevronDown, faScroll, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import { BillCommenced, BillRevised, BillWithdrawn, BillRejected, BillPassed, ActCommenced, IconZoomIn, IconZoomOut, IconFullscreen, IconReset } from "./icons";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";

import * as lookup from "../../data/lookup.json";

function BillTracker() {

    const [bills, setBills] = useState([]);
    const [preparedBills, setPreparedBills] = useState([]);

    const [daySizeinPx, setDaySizeinPx] = useState(5);

    // Effects

    useEffect(() => {
        getBills();
    }, []);

    useEffect(() => {
        bills.length > 0 && prepareBills();
    }, [bills]);

    useEffect(() => {
        console.log(preparedBills);
    }, [preparedBills]);

    // Methods

    const getBills = async () => {
        try {
            const response = await axios.get("https://api.pmg.org.za/v2/bill-tracker/");
            console.log(response);
            setBills(response.data);
        } catch (err) {
            console.error(err.message);
        }
    };

    const prepareBills = () => {
        let filteredBills = bills;

        filteredBills.forEach((bill) => {
            bill.houses = [];
            bill.houses_time = [];
            let currentHouse = [];
            let lastHouse = null;
            bill.total_commitee_meetings = 0;

            bill.events.forEach((event) => {
                if (lastHouse === null || lastHouse == event.house) {
                    currentHouse.push(event);
                } else {
                    bill.houses.push(currentHouse);
                    currentHouse = [event];
                }

                lastHouse = event.house;

                if (event.type === "committee-meeting") {
                    bill.total_commitee_meetings++;
                }
            });

            bill.houses.push(currentHouse);

            const today = new Date();

            let dummyEvents = [];

            if (lastHouse != lookup.house_status[bill.status]) {
                if (
                    (bill.stats !== "lapsed" &&
                        bill.status !== "withdrawn" &&
                        bill.status !== "rejected",
                        bill.status !== "enacted",
                        bill.status !== "act-commenced",
                        bill.status !== "act-partly-commenced")
                ) {
                    let lastDate = bill.events[bill.events.length - 1].date;

                    let startDate = new Date(lastDate + 1);

                    dummyEvents.push([
                        {
                            date: startDate,
                            house: lookup.house_status[bill.status],
                            type: "current-house-start",
                        },
                        {
                            date: today,
                            house: lookup.house_status[bill.status],
                            type: "today",
                        },
                    ]);
                }
            } else {
                bill.houses[bill.houses.length - 1].push({
                    date: today,
                    house: lookup.house_status[bill.status],
                    type: "today",
                });
            }

            bill.houses = [...bill.houses, ...dummyEvents];

            // bill.houses.forEach((house_group,index) => {
            //     if(index > 0) {
            //         if(house_group[0].date > bill.houses[index - 1][bill.houses[index - 1].length - 1].date) {
            //             console.log('house gap', house_group[0].date, bill.houses[index - 1][bill.houses[index - 1].length - 1].date);

            //         }
            //     }
            // })

            bill.houses.forEach((house_group) => {
                if (house_group.length > 0) {
                    let daysInGroup = 1;

                    const startDate = house_group[0].date;
                    const endDate = house_group[house_group.length - 1].date;
                    daysInGroup = getDateDifferenceInDays(startDate, endDate);

                    bill.houses_time.push(daysInGroup);
                }
            });

        });

        setPreparedBills(filteredBills);
    };

    // Helpers

    const changeDaySize = (e) => {
        setDaySizeinPx(e);
    }

    const getDateDifferenceInDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };












    return (
        <>
            <PMHeader />

            <PMTabs />

            <Container fluid className="py-5">
                <div className="bill-tracker-container">

                    <Row>
                        <Col>
                            <h1>Bill Tracker</h1>
                        </Col>
                    </Row>

                    <Row className="mt-5">
                        <Col md={2}>
                            <div className="sidebar">
                                <Accordion defaultActiveKey={['0', '1']} alwaysOpen>
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
                                                    <Form.Check type="switch" />
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
                            </div>
                        </Col>
                        <Col className="page-body">
                            <Row>
                                <Col>
                                    <h2><FontAwesomeIcon icon={faScroll} /> List of bills (63)</h2>
                                </Col>
                            </Row>

                            <table className="bills-table">
                                <thead>
                                    <tr>
                                        <th className="bill-name">Bill name</th>
                                        <th className="bill-days">Days</th>
                                        <th className="bill-meetings">Meetings</th>
                                        <th className="bill-epm-trend">EPM + Trend <FontAwesomeIcon icon={faCircleInfo} /></th>
                                        <th className="bill-timeline">
                                            <Row>
                                                <Col md={8}>Timeline</Col>
                                                <Col>
                                                    <div className="form-range-container">
                                                        <Slider
                                                            included={false}
                                                            handleStyle={[{ backgroundColor: 'white', borderColor: 'black', borderWidth: '3px' }]}
                                                            min={1}
                                                            max={10}
                                                            defaultValue={5}
                                                            step={0.25}
                                                            value={daySizeinPx}
                                                            onChange={(e) => changeDaySize(e)}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col>
                                                    <div className="timeline-controls">
                                                        <div className="timeline-control zoom-out" onClick={() => daySizeinPx > 1 && setDaySizeinPx(daySizeinPx - 1)}>
                                                            <IconZoomOut />
                                                        </div>
                                                        <div className="timeline-control zoom-in" onClick={() => setDaySizeinPx(daySizeinPx + 1)}>
                                                            <IconZoomIn />
                                                        </div>
                                                        <div className="timeline-control fullscreen">
                                                            <IconFullscreen />
                                                        </div>
                                                        <div className="timeline-control reset" onClick={() => setDaySizeinPx(5)}>
                                                            <IconReset />
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th colspan="5" className="group-header">Group</th>
                                    </tr>
                                    {   
                                        preparedBills.length > 0 && preparedBills.map((bill, index) => {
                                            
                                            if (bill.houses_time.reduce((sum, time) => sum + time, 0) > 0) {
                                                return (
                                                    <tr key={`bill-${index}`} className="bill-row">
                                                        <td className="bill-name">{bill.title.length > 40 ? `${bill.title.substring(0, 40)}...` : bill.title}</td>
                                                        <td className="bill-days">1234</td>
                                                        <td className="bill-meetings">100</td>
                                                        <td className="bill-epm-trend">
                                                            <div className="epm-count">100</div>
                                                            <SparklinesLine
                                                                stroke="#999"
                                                                fill="none"
                                                                data={[5, 7, 1, 0, 3, 4, 5, 7, 8, 9, 10]}
                                                                width={100}
                                                                height={25}
                                                            />
                                                        </td>
                                                        <td className="bill-timeline">
                                                            <div className="bill-progress">
                                                                {
                                                                    bill.houses.map((house_group, index) => {
                                                                        return (
                                                                            <div key={index} className={`house-group ${house_group[0].house}`}
                                                                                style={{
                                                                                    left: bill.houses_time.slice(0, index).reduce((a, b) => a + b, 0) * daySizeinPx + 'px',
                                                                                    width: bill.houses_time[index] * daySizeinPx + 'px',
                                                                                }}></div>
                                                                        );
                                                                    })
                                                                }
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        })

                                    }
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="4">
                                            <Stack direction="horizontal" gap={2} className="bill-tracker-legend">
                                                <div className="legend-title">Time spent in:</div>
                                                <div className="legend">
                                                    <div className="legend-block NA"></div>
                                                    <div className="legend-label">National Assembly</div>
                                                </div>
                                                <div className="legend">
                                                    <div className="legend-block NCOP"></div>
                                                    <div className="legend-label">National Council of Provinced</div>
                                                </div>
                                                <div className="legend">
                                                    <div className="legend-block president"></div>
                                                    <div className="legend-label">Presidency</div>
                                                </div>
                                            </Stack>
                                        </td>
                                        <td>
                                            <div className="xAxis" style={{ width: `${100 * daySizeinPx}px` }}>
                                                <div className="tick" style={{ left: "0px" }} key={0}>
                                                    <div className="label">0</div>
                                                </div>
                                                {Array.from({ length: 100 }, (_, i) => i + daySizeinPx).map(
                                                    (day, index) => {
                                                        return (
                                                            day %
                                                            (1 < 0.5
                                                                ? 120
                                                                : daySizeinPx < 1
                                                                    ? 60
                                                                    : 30) ==
                                                            0 && (
                                                                <div
                                                                    className="tick"
                                                                    style={{ left: `${day * daySizeinPx}px` }}
                                                                    key={`day-${index}`}
                                                                >
                                                                    <div className="label">{day}</div>
                                                                </div>
                                                            )
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                        </Col>
                    </Row>

                </div>

            </Container>
        </>
    );
}

export default BillTracker;
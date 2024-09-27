import React, { useEffect, useRef, useState } from "react";

import axios from "axios";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import Dropdown from 'react-bootstrap/Dropdown';
import Stack from 'react-bootstrap/Stack';
import Modal from 'react-bootstrap/Modal';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import { SparklinesLine } from '@lueton/react-sparklines';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFlag, faChevronDown, faScroll, faCircleInfo, faSquareCheck, faSquare } from "@fortawesome/free-solid-svg-icons";

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import { Scrollbars } from "react-custom-scrollbars";

import { CommitteeMeeting, Plenary, MediaBriefing, BillIntroduced, BillUpdated, BillPassed, BillSigned, BillEnacted, BillActCommenced, IconZoomIn, IconZoomOut, IconFullscreen, IconReset } from "./icons";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";

import * as lookup from "../../data/lookup.json";
import { filter } from "d3";

function BillTracker() {

    const [bills, setBills] = useState([]);
    const [preparedBills, setPreparedBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [groupedBills, setGroupedBills] = useState([]);

    const [selectedBillTypes, setSelectedBillTypes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState(['na','ncop','president']);
    const [groupBy, setGroupBy] = useState('status');
    const [search, setSearch] = useState('');

    const hideBillsWithStatus = ["lapsed", "withdrawn", "rejected", "enacted", "act-commenced", "act-partly-commenced"];
    const [billEvents, setBillEvents] = useState(['bill-introduced', 'bill-updated', 'bill-withdrawn', 'bill-rejected', 'bill-passed', 'bill-signed', 'bill-enacted', 'bill-act-commenced']);

    const [daySizeinPx, setDaySizeinPx] = useState(5);
    const [maxDays, setMaxDays] = useState(0);
    const [timelineScroll, setTimelineScroll] = useState(0);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState({});
    const [hoveredEvent, setHoveredEvent] = useState(null);
    const [hoveredBill, setHoveredBill] = useState(null);

    

    

    // Effects

    useEffect(() => {
        getBills();
    }, []);

    useEffect(() => {
        bills.length > 0 && prepareBills();
    }, [bills]);

    useEffect(() => {
        filterBills();
    }, [preparedBills, selectedBillTypes, selectedStatuses, search]);

    useEffect(() => {
        groupBills();
    }, [filteredBills]);

    useEffect(() => {
        getMaxDays();
        setLoading(false);
    }, [groupedBills]);

    useEffect(() => {
        groupBills();
    }, [groupBy]);

    useEffect(() => {
        console.log("Max days changed", maxDays);
    }, [maxDays]);

    


    // Methods

    const getBills = async () => {
        try {
            const response = await axios.get("https://api.pmg.org.za/v2/bill-tracker/");
            setBills(response.data);
        } catch (err) {
            console.error(err.message);
        }
    };

    const prepareBills = () => {

        let billsWork = bills;

        billsWork.forEach(bill => {
            bill.houses = [];
            bill.houses_time = [];
            let currentHouse = [];
            let lastHouse = null;
            bill.total_commitee_meetings = 0;
            bill.total_days = 0;

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

        });

        billsWork.forEach(bill => {
            bill.houses.forEach((house_group) => {
                
                if (house_group.length > 0) {
                    let daysInGroup = 1;
    
                    const startDate = house_group[0].date;
                    const endDate = house_group[house_group.length - 1].date;
                    daysInGroup = getDateDifferenceInDays(startDate, endDate);
    
                    if (daysInGroup < 1) {
                        daysInGroup = 1;
                    }

                    bill.houses_time.push(daysInGroup);
                }
            });

            bill.total_days = bill.houses_time.reduce((sum, time) => sum + time, 0);
        })

        setPreparedBills(billsWork);
    };

    const filterBills = () => {
        let filteredBillsWork = preparedBills;

        if (selectedBillTypes.length > 0) {
            filteredBillsWork = filteredBillsWork.filter(bill => selectedBillTypes.includes(bill.type));
        }

        if (selectedStatuses.length > 0) {
            filteredBillsWork = filteredBillsWork.filter(bill => selectedStatuses.includes(bill.status));
        }

        if (search.length > 3) {
            filteredBillsWork = filteredBillsWork.filter((bill) =>
                bill.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        setFilteredBills(filteredBillsWork);
    };

    const groupBills = () => {
        let groupedBillsWork = [];

        let groupByValues = [];
        filteredBills.forEach(bill => {
            if (!groupByValues.includes(bill[groupBy])) {
                groupByValues.push(bill[groupBy]);
            }
        });

        groupByValues.forEach(value => {
            let group = {
                title: value,
                bills: []
            };

            let bills = filteredBills.filter(bill => bill[groupBy] === value);

            group.bills = bills;
            groupedBillsWork.push(group);
        });


        let orderedGroups = [];
        Object.keys(lookup[groupBy]).forEach(key => {
            let group = groupedBillsWork.find(group => group.title === key);
            if (group) {
                orderedGroups.push(group);
            }
        })

        setGroupedBills(orderedGroups);

    };

    // Components

    const BillTooltip = () => {
        return (
            <div className="bill-tooltip" style={{opacity: 1}}>
                <Row>
                    <Col>Bill type:</Col>
                    <Col className="text-end">{lookup.type[hoveredBill.type]}</Col>
                </Row>
                <Row>
                    <Col>Introduced by:</Col>
                    <Col className="text-end">{hoveredBill.introduced_by}</Col>
                </Row>
                <Row>
                    <Col>Currently before:</Col>
                    <Col className="text-end">{hoveredBill.status}</Col>
                </Row>

            </div>
        );
    }

    




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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;

            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    };

    const getMaxDays = () => {
        let max = 0;

        groupedBills.forEach((group) => {
            group.bills.forEach((bill) => {
                if (bill.total_days > max) {
                    max = bill.total_days;
                }
            })
        });

        setMaxDays(max);
    };

    
    const handleMouseOver = (event = null, bill = null) => {
        setHoveredEvent(event);
        setHoveredBill(bill);
    };

    const throttledHandleMouseOver = throttle(handleMouseOver, 500);
    
    const handleMouseOut = () => {
        setHoveredEvent(null);
        setHoveredBill(null);
    };

    const toggleEvents = (event) => {
        setBillEvents(billEvents.includes(event) ? billEvents.filter(e => e !== event) : [...billEvents, event]);
    };

    

    // Debug Helper
    const listValues = (key, nestedKey = null) => {
        let values = [];
        bills.forEach(bill => {

            if (nestedKey) {
                bill[nestedKey].forEach(nestedItem => {
                    if (!values.includes(nestedItem[key])) {
                        values.push(nestedItem[key]);
                    }
                });
            } else {
                if (!values.includes(bill[key])) {
                    values.push(bill[key]);
                }
            }

        })
        console.log(values);
    }


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
                                                                <Col>{groupBy === 'status' ? 'Current Status' : 'Bill Type'}</Col>
                                                                <Col xs="auto"><FontAwesomeIcon icon={faChevronDown} /></Col>
                                                            </Row>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => setGroupBy('status')}>Current Status</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => setGroupBy('type')}>Bill Type</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </Col>
                                            </Row>

                                            <Row className="my-3">
                                                <Col xs="auto">Showing:</Col>
                                                <Col className="text-end">
                                                    {filteredBills.length} of {preparedBills.length} ({(filteredBills.length / preparedBills.length * 100).toFixed(0)}%)
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col>
                                                    <div className="form-input-container">
                                                        <Form.Control type="text" placeholder="Search for a bill..." className="form-input" onChange={(e) => setSearch(e.target.value)}/>
                                                    </div>
                                                </Col>
                                            </Row>


                                            <Row className="mt-4">
                                                <Col>
                                                    <Dropdown className="dropdown-select" autoClose="outside">
                                                        <Dropdown.Toggle>
                                                            <Row>
                                                                <Col>Bill type ({selectedBillTypes.length == 0 ? 'All' : selectedBillTypes.length})</Col>
                                                                <Col xs="auto"><FontAwesomeIcon icon={faChevronDown} /></Col>
                                                            </Row>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => setSelectedBillTypes([])}>
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        selectedBillTypes.length == 0
                                                                            ? faSquareCheck
                                                                            : faSquare
                                                                    }
                                                                    className="me-2"
                                                                />
                                                                All Types
                                                            </Dropdown.Item>

                                                            {Object.keys(lookup.type).map(
                                                                (type, index) =>
                                                                    <Dropdown.Item
                                                                        key={index}
                                                                        onClick={() =>
                                                                            setSelectedBillTypes(
                                                                                selectedBillTypes.includes(type)
                                                                                    ? selectedBillTypes.filter(
                                                                                        (selectedType) => selectedType !== type
                                                                                    )
                                                                                    : [...selectedBillTypes, type]
                                                                            )
                                                                        }
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                selectedBillTypes.includes(type)
                                                                                    ? faSquareCheck
                                                                                    : faSquare
                                                                            }
                                                                            className="me-2"
                                                                        />
                                                                        {lookup.type[type]}
                                                                    </Dropdown.Item>
                                                            )}
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </Col>
                                            </Row>

                                            <Row className="mt-2">
                                                <Col>
                                                    <Dropdown className="dropdown-select" autoClose="outside">
                                                        <Dropdown.Toggle>
                                                            <Row>
                                                                <Col>Bill status ({selectedStatuses.length == 0 ? 'All' : selectedStatuses.length})</Col>
                                                                <Col xs="auto"><FontAwesomeIcon icon={faChevronDown} /></Col>
                                                            </Row>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>

                                                            <Dropdown.Item onClick={() => setSelectedStatuses([])}>
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        selectedStatuses.length == 0
                                                                            ? faSquareCheck
                                                                            : faSquare
                                                                    }
                                                                    className="me-2"
                                                                />
                                                                All Statuses
                                                            </Dropdown.Item>

                                                            {Object.keys(lookup.status).map(
                                                                (status, index) =>
                                                                    <Dropdown.Item
                                                                        key={index}
                                                                        onClick={() =>
                                                                            setSelectedStatuses(
                                                                                selectedStatuses.includes(status)
                                                                                    ? selectedStatuses.filter(
                                                                                        (selectedStatus) => selectedStatus !== status
                                                                                    )
                                                                                    : [...selectedStatuses, status]
                                                                            )
                                                                        }
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                selectedStatuses.includes(status)
                                                                                    ? faSquareCheck
                                                                                    : faSquare
                                                                            }
                                                                            className="me-2"
                                                                        />
                                                                        {lookup.status[status]}
                                                                    </Dropdown.Item>
                                                            )}
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
                                                    <CommitteeMeeting />
                                                </Col>
                                                <Col className="align-self-center">Committee meeting</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('committee-meeting')} checked={billEvents.includes('committee-meeting')} />
                                                </Col>
                                            </Row>

                                            <Row className="mb-4 status-toggle">
                                                <Col xs="auto">
                                                    <Plenary />
                                                </Col>
                                                <Col className="align-self-center">Plenary</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('plenary')} checked={billEvents.includes('plenary')} />
                                                </Col>
                                            </Row>

                                            <Row className="mb-4 status-toggle">
                                                <Col xs="auto">
                                                    <MediaBriefing/>
                                                </Col>
                                                <Col className="align-self-center">Media Briefing</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('media-briefing')} checked={billEvents.includes('media-briefing')} />
                                                </Col>
                                            </Row>

                                            <Row className="mb-4 status-toggle">
                                                <Col xs="auto">
                                                    <BillIntroduced />
                                                </Col>
                                                <Col className="align-self-center">Introduced</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" value={true} onClick={() => toggleEvents('bill-introduced')} checked={billEvents.includes('bill-introduced')} />
                                                </Col>
                                            </Row>

                                            <Row className="mb-4 status-toggle">
                                                <Col xs="auto">
                                                    <BillUpdated />
                                                </Col>
                                                <Col className="align-self-center">Updated</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('bill-updated')} checked={billEvents.includes('bill-updated')} />
                                                </Col>
                                            </Row>

                                            <Row className="mb-4 status-toggle">
                                                <Col xs="auto">
                                                    <BillPassed />
                                                </Col>
                                                <Col className="align-self-center">Passed</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('bill-passed')} checked={billEvents.includes('bill-passed')} />
                                                </Col>
                                            </Row>

                                            <Row className="mb-4 status-toggle">
                                                <Col xs="auto">
                                                    <BillSigned />
                                                </Col>
                                                <Col className="align-self-center">Signed</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('bill-signed')} checked={billEvents.includes('bill-signed')} />
                                                </Col>
                                            </Row>

                                            <Row className="mb-4 status-toggle">
                                                <Col xs="auto">
                                                    <BillEnacted />
                                                </Col>
                                                <Col className="align-self-center">Enacted</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('bill-enacted')} checked={billEvents.includes('bill-enacted')} />
                                                </Col>
                                            </Row>

                                            <Row className="status-toggle">
                                                <Col xs="auto">
                                                    <BillActCommenced />
                                                </Col>
                                                <Col className="align-self-center">Act Commenced</Col>
                                                <Col xs="auto">
                                                    <Form.Check type="switch" onClick={() => toggleEvents('bill-act-commenced')} checked={billEvents.includes('bill-act-commenced')} />
                                                </Col>
                                            </Row>


                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                                <a className="feedback-btn" target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSfaMxpxAx4TxaDcGZv2NySfZBir-nRblwMnNWiYhrxsnwsudg/viewform">Provide feedback</a>
                            </div>
                        </Col>
                        <Col className="page-body" md={10}>
                            <Row>
                                <Col>
                                    <h2><FontAwesomeIcon icon={faScroll} /> List of bills ({filteredBills.length})</h2>
                                </Col>
                            </Row>

                            {loading ? <div>Loading...</div> :
                                <table className="bills-table">
                                    <thead>
                                        <tr>
                                            <th className="bill-name">Bill name</th>
                                            <th className="bill-days">Days</th>
                                            <th className="bill-meetings">Meetings</th>
                                            {/* <th className="bill-epm-trend">EPM + Trend <OverlayTrigger overlay={<Tooltip>Hey</Tooltip>}><FontAwesomeIcon icon={faCircleInfo} /></OverlayTrigger></th> */}
                                            <th className="bill-timeline">
                                                <Row>
                                                    <Col md={8}>Timeline</Col>
                                                    <Col>
                                                        <div className="form-range-container">
                                                            <Slider
                                                                included={false}
                                                                handleStyle={[{ backgroundColor: 'white', borderColor: 'black', borderWidth: '3px', zIndex: '999' }]}
                                                                min={1}
                                                                max={10}
                                                                defaultValue={5}
                                                                step={1}
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

                                        {

                                            groupedBills.length > 0 && groupedBills.map((group, index) =>
                                                <>
                                                    <tr key={index} className="group-header">
                                                        <th colSpan="5">{lookup[groupBy][group.title]}</th>
                                                    </tr>

                                                    {
                                                        group.bills.map((bill, index) => {
                                                            
                                                            return (
                                                                <tr key={`bill-${index}`} className="bill-row" onClick={() => {
                                                                    setSelectedBill(bill); 
                                                                    setShowModal(true);
                                                                  }}
                                                                  >
                                                                    <td className="bill-name"
                                                                        onMouseOver={() => throttledHandleMouseOver(null, bill)}
                                                                        onMouseOut={() => handleMouseOut()}
                                                                    >{bill.title.length > 40 ? `${bill.title.substring(0, 40)}...` : bill.title}{
                                                                        hoveredBill === bill && <BillTooltip />
                                                                    }</td>
                                                                    <td className="bill-days">{bill.total_days}</td>
                                                                    <td className="bill-meetings">{bill.total_commitee_meetings}</td>
                                                                    {/* <td className="bill-epm-trend">
                                                                        <div className="epm-count">100</div>
                                                                        <SparklinesLine
                                                                            stroke="#999"
                                                                            fill="none"
                                                                            data={[5, 7, 1, 0, 3, 4, 5, 7, 8, 9, 10]}
                                                                            width={100}
                                                                            height={25}
                                                                        />
                                                                    </td> */}
                                                                    <td className="bill-timeline">
                                                                        <div className="bill-progress" style={{left: `-${maxDays*daySizeinPx * timelineScroll}px`, width: `${maxDays * daySizeinPx}px`}}>
                                                                            {
                                                                                bill.houses.map((house_group, index) => {
                                                                                    return (
                                                                                        <div key={index} className={`house-group ${house_group[0].house}`}
                                                                                            style={{
                                                                                                left: bill.houses_time.slice(0, index).reduce((a, b) => a + b, 0) * daySizeinPx + 'px',
                                                                                                width: bill.houses_time[index] * daySizeinPx + 'px',
                                                                                            }}>
                                                                                            {
                                                                                                house_group.map((event, index) => {
                                                                                                    return (
                                                                                                    billEvents.includes(event.type) &&
                                                                                                        (
                                                                                                            <div key={index} className="event"
                                                                                                                style={{left: `${getDateDifferenceInDays(bill.houses[0][0].date, event.date) * daySizeinPx}px`}}
                                                                                                                onMouseOver={() => throttledHandleMouseOver(event, bill)}
                                                                                                                onMouseOut={() => handleMouseOut()}
                                                                                                            >
                                                                                                                {
                                                                                                                    event.type === 'committee-meeting' ? <CommitteeMeeting /> :
                                                                                                                    event.type === 'plenary' ? <Plenary /> :
                                                                                                                    event.type === 'media-briefing' ? <MediaBriefing /> :

                                                                                                                    event.type === 'bill-introduced' ? <BillIntroduced /> :
                                                                                                                    event.type === 'bill-updated' ? <BillUpdated /> :
                                                                                                                    event.type === 'bill-passed' ? <BillPassed /> :
                                                                                                                    event.type === 'bill-signed' ? <BillSigned /> :

                                                                                                                    event.type === 'bill-enacted' ? <BillEnacted /> :
                                                                                                                    event.type === 'bill-act-commenced' ? <BillActCommenced /> : ''
                                                                                                                }

                                                                                                            </div>
                                                                                                        )
                                                                                                    )
                                                                                                })
                                                                                            }
                                                                                            </div>
                                                                                    );
                                                                                })
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                            
                                                        })
                                                    }
                                                </>)

                                        }
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3">
                                                <Stack direction="horizontal" gap={2} className="bill-tracker-legend">
                                                    <div className="legend">
                                                        <div className="legend-block NA"></div>
                                                        <div className="legend-label">National Assembly</div>
                                                    </div>
                                                    <div className="legend">
                                                        <div className="legend-block NCOP"></div>
                                                        <div className="legend-label">National Council of Provinces</div>
                                                    </div>
                                                    <div className="legend">
                                                        <div className="legend-block Joint"></div>
                                                        <div className="legend-label">Joint</div>
                                                    </div>
                                                    <div className="legend">
                                                        <div className="legend-block president"></div>
                                                        <div className="legend-label">Presidency</div>
                                                    </div>
                                                </Stack>
                                            </td>
                                            <td className="footer-timeline">
                                                <div className="footer-timeline-wrapper">
                                                    <Slider
                                                        className=""
                                                        included={false}
                                                        railStyle={{ height: '10px' }}
                                                        handleStyle={[{ backgroundColor: 'black', borderColor: 'black', borderWidth: '0px', borderRadius: '5px', height: '10px', width: '15px', marginTop: '0' }]}
                                                        min={0}
                                                        max={1}
                                                        defaultValue={0}
                                                        step={0.01}
                                                        value={timelineScroll}
                                                        onChange={(e) => setTimelineScroll(e)}
                                                    />
                                                    
                                                    <div className="xAxis" style={{ width: `${maxDays*daySizeinPx}px`,left: `-${maxDays*daySizeinPx * timelineScroll}px` }}>
                                                        <div className="tick" style={{ left: "0px" }} key={0}>
                                                            <div className="label">0</div>
                                                        </div>
                                                        {Array.from({ length: maxDays }, (_, i) => i + daySizeinPx).map(
                                                            (day, index) => {
                                                                return (
                                                                    day %
                                                                    (daySizeinPx < 0.5
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
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            }
                        </Col>
                    </Row>

                </div>

            </Container>

            {/* MODAL */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedBill.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bill-stats">
                    <Row>
                        <Col className="bill-stats-heading">Bill Id:</Col>
                        <Col>{selectedBill.id}</Col>
                    </Row>
                    <Row>
                        <Col className="bill-stats-heading">Bill Type:</Col>
                        <Col>{selectedBill.type}</Col>
                    </Row>
                    <Row>
                        <Col className="bill-stats-heading">Status:</Col>
                        <Col>{selectedBill.status}</Col>
                    </Row>
                    <Row>
                        <Col className="bill-stats-heading">Date of Introduction:</Col>
                        <Col>{formatDate(selectedBill.date_of_introduction)}</Col>
                    </Row>
                    <Row>
                        <Col className="bill-stats-heading">Introduced By</Col>
                        <Col>{selectedBill.introduced_by}</Col>
                    </Row>
                    <Row>
                        <Col className="bill-stats-heading">Total Days:</Col>
                        <Col>{selectedBill.total_days}</Col>
                    </Row>
                    <Row>
                        <Col className="bill-stats-heading">
                            Total Committee Meetings:
                        </Col>
                        <Col>{selectedBill.total_commitee_meetings}</Col>
                    </Row>
                    <h4 className="mt-4">Events</h4>
                    <Scrollbars style={{ height: "400px" }}>
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>House</th>
                                    <th>Type</th>
                                    <th width="300">Title</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBill.events?.map((event, index) => {
                                    return (
                                        <tr key={`event-${index}`}>
                                            <td>{formatDate(event.date)}</td>
                                            <td>{event.house}</td>
                                            <td>{event.type}</td>
                                            <td>{event.title}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Scrollbars>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default BillTracker;
import React, { useEffect, useRef, useState } from 'react';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';

import { Scrollbars } from 'react-custom-scrollbars';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faPenToSquare, faClock, faComments } from '@fortawesome/free-regular-svg-icons';
import { faHandshakeSimple, faPenNib, faSquareCheck, faSquare, faGear, faBarsStaggered } from '@fortawesome/free-solid-svg-icons';



import './BillTracker.scss';

import * as billsData from '../data/bill-tracker.json';
import * as lookup from '../data/lookup.json';

function BillTracker() {
    const [bills, setBills] = useState([]);
    const [billGroups, setBillGroups] = useState([]);
    const houses = [
        {
            house: "NA",
            name: "National Assembly",
            color: "#B1DBFF",
            active_color: "#7AB8EE"
        },
        {
            house: "NCOP",
            name: "National Council of Provinces",
            color: "#BCF1A4",
            active_color: "#8AE561"
        },
        {
            house: "President",
            name: "President",
            color: "#FFC8BD",
            active_color: "#FFA08D"
        },
        {
            house: "Joint",
            name: "Joint",
            color: "rgb(23, 160, 140)"
        }
    ];
    const [daySizeinPx, setDaySizeinPx] = useState(0.5);
    const [maxDays, setMaxDays] = useState(0);
    const [groupBillsBy, setGroupBillsBy] = useState('status');
    const [selectedParliament, setSelectedParliament] = useState('6th-parliament');
    const groupBillsByOptions = [
        {
            value: 'status',
            label: 'Status'
        }
    ];
    const viewOptions = [
        { value: 'committee-meeting', label: 'Committee Meetings' },
        { value: 'plenary', label: 'Plenaries' },
        { value: 'bill-updated', label: 'Bill updates' },
        { value: 'bill-signed', label: 'Bill Signings' },
        { value: 'bill-introduced', label: 'Bill Introductions' },
        { value: 'bill-passed', label: 'Bill Passings' },
        { value: 'bill-enacted', label: 'Bill Enactments' },
        { value: 'bill-act-commenced', label: 'Act Commencements' },
        // { value: 'current-house-start', label: 'Current House Start' },
        { value: 'today', label: 'Today' }

    ];
    const statusOptions = [
        { value: 'na', label: 'National Assembly' },
        { value: 'ncop', label: 'National Council of Provinces' },
        { value: 'president', label: 'President' },
        {value: '', label: '----'},
        {value: 'act-partly-commenced', label: 'Act Partly Commenced'},
        {value: 'act-commenced', label: 'Act Commenced'},
        {value: 'enacted', label: 'Enacted'},
        {value: 'draft', label: 'Draft'},
        {value: '', label: '----'},
        {value: 'lapsed', label: 'Lapsed'},
        {value: 'withdrawn', label: 'Withdrawn'},
        {value: 'rejected', label: 'Rejected'}
    ];

    const [selectedViewOptions, setSelectedViewOptions] = useState(['bill-introduced', 'bill-passed', 'bill-updated', 'bill-signed']);
    const [selectedStatuses, setSelectedStatuses] = useState(['na', 'ncop', 'president']);
    const [showModal, setShowModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState({});
    const [hoveredEvent, setHoveredEvent] = useState(null);
    const [hoveredBill, setHoveredBill] = useState(null);

    const [search, setSearch] = useState('');
    const [analysis, setAnalysis] = useState({
        'na': 0,
        'ncop': 0,
        'joint': 0,
        'president': 0,
    })
    

    useEffect(() => {

        getBills();

    }, []);

    useEffect(() => {


        let filteredBills = bills;

        // Filter by status
        if (selectedStatuses.length > 0) {
            filteredBills = filteredBills.filter(bill => selectedStatuses.includes(bill.status));
        }

        if (search.length > 3) {
            filteredBills = filteredBills.filter(bill => bill.title.toLowerCase().includes(search.toLowerCase()));
        } else {
            filteredBills = filteredBills;
        }

        if (selectedParliament !== 'all') {
            filteredBills = filteredBills.filter(bill => bill.date_of_introduction >= lookup.parliaments[selectedParliament].start && bill.date_of_introduction <= lookup.parliaments[selectedParliament].end);
        }

        let groupedBills = [];

        if (groupBillsBy === 'status') {
            const statuses = [...new Set(filteredBills.map(bill => bill.status))];
            statuses.forEach(status => {
                const billsByStatus = filteredBills.filter(bill => bill.status === status);
                groupedBills.push({
                    name: status,
                    bills: billsByStatus
                });
            });
        }

        // reorder the groups so that the statuses are in the order defined in the statusOptions array
        const orderedGroups = [];
        statusOptions.forEach(option => {
            const group = groupedBills.find(g => g.name === option.value);
            if (group) {
                orderedGroups.push(group);
            }
        });

        setBillGroups(orderedGroups);

        getMaxDays();

    }, [bills, selectedParliament, search, selectedStatuses, groupBillsBy]);


    const billWork = () => {
        console.log(billsData);

        let all_statuses = [];

        let all_event_types = [];

        billsData.forEach(bill => {
            if (!all_statuses.includes(bill.status)) {
                all_statuses.push(bill.status);
            }

            bill.events.forEach(event => {
                if (!all_event_types.includes(event.type)) {
                    all_event_types.push(event.type);
                }
            })
        })

        console.log(all_statuses);
        console.log(all_event_types);



    }

    const getMaxDays = () => {

        let max = 0;

        billGroups.forEach(group => {
            group.bills.forEach(bill => {
                let total = 0;
                bill.houses_time.forEach(time => {
                    total += time;
                });
                bill.total_days = total;
                if (total > max) {
                    max = total;
                }
            });
        });

        setMaxDays(max);

    }

    

    const getDateDifferenceInDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Function to calculate event position
    const getEventPosition = (eventDate, billStartDate) => {
        const daysFromStart = getDateDifferenceInDays(billStartDate, eventDate);
        return daysFromStart * daySizeinPx;
    };


    const getBills = () => {

        let filteredBills = billsData;

        filteredBills.forEach((bill) => {
            bill.houses = [];
            bill.houses_time = [];
            let currentHouse = [];
            let lastHouse = null;
            bill.total_commitee_meetings = 0;

            bill.events.forEach(event => {

                if (lastHouse === null || lastHouse == event.house) {
                    currentHouse.push(event);
                } else {
                    bill.houses.push(currentHouse);
                    currentHouse = [event];
                }

                lastHouse = event.house;

                if (event.type === 'committee-meeting') {
                    bill.total_commitee_meetings++;
                }

            })

            bill.houses.push(currentHouse);

            const today = new Date();

            let dummyEvents = [];

            if (lastHouse != lookup.house_status[bill.status]) {

                if(bill.stats !== 'lapsed' && bill.status !== 'withdrawn' && bill.status !== 'rejected', bill.status !== 'enacted', bill.status !== 'act-commenced', bill.status !== 'act-partly-commenced') {

                    let lastDate = bill.events[bill.events.length - 1].date;

                    let startDate = new Date(lastDate + 1);

                    dummyEvents.push([{
                        date: startDate,
                        house: lookup.house_status[bill.status],
                        type: 'current-house-start'
                    }, {
                        date: today,
                        house: lookup.house_status[bill.status],
                        type: 'today'
                    }]);

                }

            } else {
                bill.houses[bill.houses.length - 1].push({
                    date: today,
                    house: lookup.house_status[bill.status],
                    type: 'today'
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


            bill.houses.forEach(house_group => {
                if (house_group.length > 0) {
                    let daysInGroup = 1;

                    const startDate = house_group[0].date;
                    const endDate = house_group[house_group.length - 1].date;
                    daysInGroup = getDateDifferenceInDays(startDate, endDate);

                    bill.houses_time.push(daysInGroup);
                }
            })

        });



        setBills(filteredBills);

    }

    useEffect(() => {
        getMaxDays();

      
        billGroups.forEach(group => {
            group.bills.forEach(bill => {

            });
        })
    }, [billGroups])

    const getBillCount = () => {

        let count = 0;
        billGroups.forEach(group => {
            count += group.bills.length;
        });

        return count;

    }

    const getAvgDays = () => {

        let total = 0;
        let count = 0;
        billGroups.forEach(group => {
            group.bills.forEach(bill => {
                total += bill.total_days;
                count++;
            });
        });

        return Math.round(total / count);


    }

    const getAvgMeetings = () => {

        let total = 0;
        let count = 0;
        billGroups.forEach(group => {
            group.bills.forEach(bill => {
                total += bill.total_commitee_meetings;
                count++;
            });
        });

        return Math.round(total / count);

    }

    const getPublicParticipation = () => {

        let total = 0;
        let count = 0;
        billGroups.forEach(group => {
            group.bills.forEach(bill => {
                bill.events.forEach(event => {
                    if (event.public_participation) {
                        total++;
                    }
                });
                count++;
            });
        });

        return Math.round(total / count);

    }

    const getRevisions = () => {

        let total = 0;
        let count = 0;

        billGroups.forEach(group => {
            group.bills.forEach(bill => {
                total += bill.versions.length;
                count++;
            });
        });



        return Math.round(total / count);

    }

    const Tooltip = ({ event = null, bill = null }) => {


        return (
            <div className="bill-tracker-tooltip">
                {event ? (
                    <div className="event-tooltip">
                        <div className="tooltip-title">{event.title}</div>
                        <div className="tooltip-body mt-4">
                            <Row>
                                <Col xs="4">Date:</Col>
                                <Col xs="8">{formatDate(event.date)}</Col>
                            </Row>
                            <Row>
                                <Col xs="4">House:</Col>
                                <Col xs="8">{houses.find(h => h.house === event.house)?.name}</Col>
                            </Row>
                            <Row>
                                <Col xs="4">Type:</Col>
                                <Col xs="8">{event.type}</Col>
                            </Row>
                        </div>
                    </div>
                ) : (
                    <div className="bill-tracker-tooltip">
                        <div className="tooltip-title">{bill.title}</div>
                        <div className="tooltip-body mt-4">
                            <Row>
                                <Col xs="4">Status:</Col>
                                <Col xs="8">{bill.status}</Col>
                            </Row>
                            <Row>
                                <Col xs="4">Date of Introduction:</Col>
                                <Col xs="8">{formatDate(bill.date_of_introduction)}</Col>
                            </Row>
                            <Row>
                                <Col xs="4">Total Days:</Col>
                                <Col xs="8">{bill.total_days}</Col>
                            </Row>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handleViewOptionsChange = (option) => {

        setSelectedViewOptions((prevSelectedOptions) => {
            if (prevSelectedOptions.includes(option)) {
                return prevSelectedOptions.filter(o => o !== option);
            } else {
                return [...prevSelectedOptions, option];
            }
        });
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const changeDaySize = (e) => {
        const value = parseFloat(e.target.value);
        if (value >= 0.25 && value <= 10) {
            setDaySizeinPx(value);
        }
    };

    const handleMouseOver = (event = null, bill = null) => {
        setHoveredEvent(event);
        setHoveredBill(bill);
    };

    const handleMouseOut = () => {
        setHoveredEvent(null);
        setHoveredBill(null);
    };




    return (
        <div className="bill-tracker">
            <header className="p-5">
                <Container fluid>
                    <Row className="justify-content-between">
                        <Col md={8}>
                            <h1><FontAwesomeIcon icon={faPenNib} /> Progress of Bills</h1>
                            <span>How long does it take for a bill to go from being introduced to being signed into law by the president.</span>
                        </Col>
                        <Col>
                            <Row>
                                <Col>
                                    <Form.Group as={Row}>
                                        <Form.Label column md="auto">Time period</Form.Label>
                                        <Col>
                                            <select aria-label="Select time-period" size="lg">
                                                <option value="parliament">Parliament</option>
                                            </select>
                                        </Col>
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group as={Row}>
                                        <Form.Label column md="auto">Parliament</Form.Label>
                                        <Col>
                                            <select aria-label="Select Parliament" defaultValue={selectedParliament} onChange={(e) => setSelectedParliament(e.target.value)} size="lg">
                                                {
                                                    Object.keys(lookup.parliaments).map((parliament, index) => {
                                                        return (
                                                            <option value={parliament} key={`parliament-${index}`} >{lookup.parliaments[parliament].name}</option>
                                                        )
                                                    })
                                                }
                                            </select>
                                        </Col>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </header>
            <section className="p-5">
                <Container fluid>
                    <Row>
                        <Col>
                            <div className="widget">
                                <Row>
                                    <Col xs="auto">
                                        <FontAwesomeIcon icon={faFileLines} size="3x" />
                                    </Col>
                                    <Col>
                                        <h2>{getBillCount()} bills</h2>
                                        <span>currently before parliament</span>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                        <Col>
                            <div className="widget">
                                <Row>
                                    <Col xs="auto">
                                        <FontAwesomeIcon icon={faClock} size="3x" />
                                    </Col>
                                    <Col>
                                        <h2>{getAvgDays()} days</h2>
                                        <span>avg time in parliament</span>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                        <Col>
                            <div className="widget">
                                <Row>
                                    <Col xs="auto">
                                        <FontAwesomeIcon icon={faComments} size="3x" />
                                    </Col>
                                    <Col>
                                        <h2>{getAvgMeetings()} meetings</h2>
                                        <span>avg for current bills</span>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                        <Col>
                            <div className="widget">
                                <Row>
                                    <Col xs="auto">
                                        <FontAwesomeIcon icon={faHandshakeSimple} size="3x" />
                                    </Col>
                                    <Col>
                                        <h2>{getPublicParticipation()} sessions</h2>
                                        <span>avg public participation</span>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                        <Col>
                            <div className="widget">
                                <Row>
                                    <Col xs="auto">
                                        <FontAwesomeIcon icon={faPenToSquare} size="3x" />
                                    </Col>
                                    <Col>
                                        <h2>{getRevisions()} revisions</h2>
                                        <span>avg for current bills</span>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
            <section className="px-5">
                <Container fluid>
                    <Row className="mb-5">
                        <Col xs="auto" className="search-controls">
                            <Form.Range
                                className="mt-2"
                                min={0.25}
                                max={10}
                                step={0.25}
                                value={daySizeinPx}
                                onChange={(e) => changeDaySize(e)}
                                variant="dark"
                            />
                        </Col>

                        <Col xs={2}>
                            <Form.Control type="search" size="lg" placeholder="Search for a bill..." onChange={e => setSearch(e.target.value)} />
                        </Col>
                        
                            
                        <Col xs={6}></Col>
                        <Col>
                            <Row>
                                <Col>
                                    <Dropdown className="dropdown-btn" variant="info" autoClose="outside">
                                        <Dropdown.Toggle size="lg">
                                            <FontAwesomeIcon icon={faGear} />  View Options
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {viewOptions.map((option, index) => (
                                                <Dropdown.Item key={index} onClick={() => handleViewOptionsChange(option.value)}>
                                                    <FontAwesomeIcon icon={selectedViewOptions.includes(option.value) ? faSquareCheck : faSquare} /> {option.label}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>
                                <Col>
                                    <Dropdown className="dropdown-btn" variant="dark" autoClose="outside">
                                        <Dropdown.Toggle size="lg">
                                            <FontAwesomeIcon icon={faBarsStaggered} /> Status
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {statusOptions.map((option, index) => (
                                                <Dropdown.Item key={index} onClick={() => setSelectedStatuses((prevSelectedOptions) => {
                                                    if (prevSelectedOptions.includes(option.value)) {
                                                        return prevSelectedOptions.filter(o => o !== option.value);
                                                    } else {
                                                        return [...prevSelectedOptions, option.value];
                                                    }
                                                })}>
                                                    {
                                                        option.value === '' ? <hr /> : <><FontAwesomeIcon icon={selectedStatuses.includes(option.value) ? faSquareCheck : faSquare} /> {option.label}</>
                                                    }
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>


                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col>




                            <div className="bill-tracker-viz">
                                    


                                    {
                                        billGroups?.length > 0 && billGroups?.map((group, index) => {
                                            return (
                                                <div className="bill-group" key={`bill-group-${index}`}>
                                                    <h2>{lookup.groupby[group.name]} ({group.bills.length})</h2>
                                                    {
                                                        group?.bills?.length > 0 && group?.bills?.map((bill, index) => {

                                                            return (
                                                                <div className="bill-row" key={`bill-${index}`}>
                                                                    <div className="bill-title-container" onClick={() => { setSelectedBill(bill); setShowModal(true) }} key={`bill-${index}`}>
                                                                        <div className="bill-title" title={bill.title}>
                                                                            {bill.title}
                                                                        </div>
                                                                    </div>
                                                                    <div className="bill-progress">
                                                                        {
                                                                            bill.houses.map((house_group, index) => {

                                                                                return (
                                                                                    <div className="house-group" key={`house-group-${index}`}>
                                                                                        <div 
                                                                                            className="house-group-bar" 
                                                                                            style={{ width: `${bill.houses_time[index] * daySizeinPx}px`, backgroundColor: houses.find(h => h.house == bill.houses[index][0].house)?.color }}
                                                                                            // onMouseOver={() => handleMouseOver(null, bill)}
                                                                                            // onMouseOut={handleMouseOut}
                                                                                        >
                                                                                            {

                                                                                                bill.houses[index].map((event, index) => {
                                                                                                    const eventPosition = getEventPosition(event.date, house_group[0].date);
                                                                                                    return (
                                                                                                        selectedViewOptions?.includes(event.type) &&
                                                                                                        <div
                                                                                                            className="event"
                                                                                                            key={`event-${index}`}
                                                                                                            style={{ left: `${eventPosition}px`, backgroundColor: houses.find(h => h.house == event.house)?.active_color }}
                                                                                                            onMouseOver={() => handleMouseOver(event)}
                                                                                                            onMouseOut={handleMouseOut}
                                                                                                        >
                                                                                                            {hoveredEvent === event && <Tooltip event={event} />}
                                                                                                        </div>

                                                                                                    )
                                                                                                })
                                                                                            }
                                                                                            {hoveredBill === bill && <Tooltip bill={bill} />}
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            })
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )

                                                        })
                                                    }

                                                </div>
                                            )
                                        })
                                    }



                                    {
                                        maxDays > 0 && (
                                            <div className="xAxis" style={{ width: `${maxDays * daySizeinPx}px` }}>
                                                <div className="tick" style={{ left: '0px' }} key={0}>
                                                    <div className="label">0</div>
                                                </div>
                                                {
                                                    Array.from({ length: maxDays }, (_, i) => i + 1).map((day, index) => {
                                                        return (
                                                            day % (daySizeinPx < 0.5 ? 120 : daySizeinPx < 1 ? 60 : 30) == 0 && (
                                                                <div className="tick" style={{ left: `${day * daySizeinPx}px` }} key={`day-${index}`}>
                                                                    <div className="label">
                                                                        {day}
                                                                    </div>
                                                                </div>
                                                            )


                                                        )
                                                    })
                                                }
                                            </div>
                                        )
                                    }
                                
                                
                            </div>
                        </Col>
                        {/* <Col md={3}>
                            <div className="analysis">
                                <h2>Where these bills have spent the most time</h2>

                                <h2>Where meetings for these bills happened</h2>
                            </div>
                        </Col> */}


                    </Row>
                    <Row className="my-4">
                        <Col xs="auto" className="align-self-end">
                            <a className="feedback-btn" target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSfaMxpxAx4TxaDcGZv2NySfZBir-nRblwMnNWiYhrxsnwsudg/viewform">
                                    Provide feedback
                            </a>
                        </Col>
                    </Row>
                    
                </Container>
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
                            <Col className="bill-stats-heading">Total Committee Meetings:</Col>
                            <Col>{selectedBill.total_commitee_meetings}</Col>
                        </Row>
                        <h4 className='mt-4'>Events</h4>
                        <Scrollbars style={{ height: '400px' }}>
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
                                    {
                                        selectedBill.events.map((event, index) => {
                                            return (
                                                <tr key={`event-${index}`}>
                                                    <td>{formatDate(event.date)}</td>
                                                    <td>{event.house}</td>
                                                    <td>{event.type}</td>
                                                    <td>{event.title}</td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        </Scrollbars>
                    </Modal.Body>

                </Modal>
            </section>

        </div>
    )
}

export default BillTracker;

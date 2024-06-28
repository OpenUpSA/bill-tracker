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

import ReactJson from '@microlink/react-json-view'

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
    const [zoom, setZoom] = useState(1);
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
        {value: 'events', label: 'Show Events'}
    ];
    const statusOptions = [
        {value: 'na', label: 'National Assembly'},
        {value: 'ncop', label: 'National Council of Provinces'},
        {value: 'president', label: 'President'},
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
        
    const [selectedViewOptions, setSelectedViewOptions] = useState(['events']);
    const [selectedStatuses, setSelectedStatuses] = useState(['na', 'ncop', 'president']);
    const [showModal, setShowModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState({});
    
    const [search, setSearch] = useState('');

    const svgRef = useRef();
    

    useEffect(() => {

        getBills();

    }, []);

    useEffect(() => {

        let filteredBills = bills;

        // Filter by status
        if (selectedStatuses.length > 0) {
            filteredBills = filteredBills.filter(bill => selectedStatuses.includes(bill.status));
        }

        if(search.length > 3) {
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

    useEffect(() => {
    }, [maxDays]);

    const getDateDifferenceInDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Function to calculate event position
    const getEventPosition = (eventDate, billStartDate, zoom) => {
        const daysFromStart = getDateDifferenceInDays(billStartDate, eventDate);
        return daysFromStart * zoom;
    };


    const getBills = () => {

        let filteredBills = billsData;

        billsData.forEach((bill, index) => {
            bill.houses = [];
            bill.houses_time = [];
            let currentHouse = [];
            let lastHouse = null;
            bill.total_commitee_meetings = 0;

            

            bill.events.forEach(event => {
                if (event.house !== undefined) {
                    if (lastHouse === null || event.house === lastHouse) {
                        currentHouse.push(event);
                    } else {
                        // Push the current group to bill.houses
                        if (currentHouse.length > 0) {
                            bill.houses.push(currentHouse);
                            const startDate = currentHouse[0].date;
                            const endDate = currentHouse[currentHouse.length - 1].date;
                            const daysInGroup = getDateDifferenceInDays(startDate, endDate);
                            bill.houses_time.push(daysInGroup);
                        }
                        // Start a new group
                        currentHouse = [event];
                    }
                    lastHouse = event.house;
                    if (event.type === 'committee-meeting') {
                        bill.total_commitee_meetings++;
                    }
                }
            });

           
            // Push the last group to bill.houses and calculate the days difference
            if (currentHouse.length > 0) {
                bill.houses.push(currentHouse);
                const startDate = currentHouse[0].date;
                const current_date = new Date();
                
                currentHouse.push({
                    "title": "Today",
                    "date": current_date,
                    
                })

                let endDate = currentHouse[currentHouse.length - 1].date;
               
                const daysInGroup = getDateDifferenceInDays(startDate, endDate);
                bill.houses_time.push(daysInGroup);

            } 

                

            if(currentHouse[0]?.house != lookup.house_status[bill.status]) {
                if(bill.events.length > 0) {

                    let startDate = bill.events[bill.events.length - 1].date;
                    const today = new Date();

                    bill.houses.push([
                        {
                            "title": "Dummy Start",
                            "date": startDate,
                            "type": "dummy",
                            "house": lookup.house_status[bill.status]
                           
                        },
                        {
                            "title": "Dummy End",
                            "date": today,
                            "type": "dummy",
                            "house": lookup.house_status[bill.status]
                            
                        }
                    ])

                    bill.houses_time.push(getDateDifferenceInDays(startDate, today));

                }
                
            }
          

            

        });

        setBills(filteredBills);

    }

    useEffect(() => {
        getMaxDays();
        console.log(billGroups);
    },[billGroups])

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
                    if(event.public_participation) {
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

    const Tooltip = ({ event }) => {
        return (
            <div className="event-tooltip">
                <div className="tooltip-title">{event.title}</div>
                <div className="tooltip-body mt-4">
                    <Row>
                        <Col xs="4">Date:</Col>
                        <Col xs="8">{formatDate(event.date)}</Col>    
                    </Row>
                    <Row>
                        <Col xs="4">House:</Col>
                        <Col xs="8">{houses.find(h => h.house == event.house)?.name}</Col>
                    </Row>
                    <Row>
                        <Col xs="4">Type:</Col>
                        <Col xs="8">{event.type}</Col>
                    </Row>
                </div>
                
            </div>
        )
    }

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

    

    return (
        <div className="bill-tracker">
            <header className="p-5">
                <Container fluid>
                    <Row>
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
                                            <Form.Select aria-label="Select time-period" size="lg">
                                                <option value="parliament">Parliament</option>
                                            </Form.Select>
                                        </Col>
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group as={Row}>
                                        <Form.Label column md="auto">Parliament</Form.Label>
                                        <Col>
                                            <Form.Select aria-label="Select Parliament" defaultValue={selectedParliament} onChange={(e) => setSelectedParliament(e.target.value)} size="lg">
                                                {
                                                    Object.keys(lookup.parliaments).map((parliament, index) => {
                                                        return (
                                                            <option value={parliament} key={`parliament-${index}`} >{lookup.parliaments[parliament].name}</option>
                                                        )
                                                    })
                                                }
                                            </Form.Select>
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
                                        <FontAwesomeIcon icon={faFileLines} size="3x"/>
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
                                        <FontAwesomeIcon icon={faClock} size="3x"/>
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
                                        <FontAwesomeIcon icon={faComments} size="3x"/>
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
                                        <FontAwesomeIcon icon={faHandshakeSimple} size="3x"/>
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
                                        <FontAwesomeIcon icon={faPenToSquare} size="3x"/>
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
            <section className="p-5">
                <Container fluid>
                    <Row className="mb-5">
                        <Col xs="auto" className="search-controls">
                            <div className="zoom-btns">
                                <div className="zoom-btn" onClick={() => zoom > 1 && setZoom(zoom - 1)}>-</div>
                                <div className="zoom-btn" onClick={() => setZoom(zoom + 1)}>+</div>
                            </div>
                            
                        </Col>
                        <Col xs={2}>
                            <Form.Control type="search" size="lg" placeholder="Search for a bill..." onChange={e => setSearch(e.target.value)} />
                        </Col>
                        <Col xs={6}></Col>
                        <Col>
                            <Row>
                                <Col>
                                    <Dropdown className="dropdown-btn">  
                                        <Dropdown.Toggle  size="lg">
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
                                    <Dropdown className="dropdown-btn">  
                                        <Dropdown.Toggle  size="lg">
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




                            <div className="bill-tracker">
                                <Scrollbars className="bills" style={{ height: 400 }}>
                                    
                                    
                                        {
                                            billGroups?.length > 0 && billGroups?.map((group, index) => {
                                                return (
                                                    <div className="bill-group" key={`bill-group-${index}`}>
                                                        <h2>{lookup.groupby[group.name]} ({group.bills.length})</h2>
                                                        {
                                                            group?.bills?.length > 0 && group?.bills?.map((bill, index) => {

                                                                return (
                                                                    <div className="bill-row" key={`bill-${index}`}>
                                                                        <div className="bill-title-container"  onClick={() => {setSelectedBill(bill); setShowModal(true)}} key={`bill-${index}`}>
                                                                            <div className="bill-title">
                                                                                {bill.title}
                                                                            </div>
                                                                        </div>
                                                                        <div className="bill-progress">
                                                                            {
                                                                                bill.houses.map((house_group, index) => {
                                                                                    
                                                                                    return (
                                                                                        <div className="house-group" key={`house-group-${index}`}>
                                                                                            <div className="house-group-bar" style={{ width: `${bill.houses_time[index] * zoom}px`, backgroundColor: houses.find(h => h.house == bill.houses[index][0].house)?.color}}>
                                                                                                {
                                                                                                    selectedViewOptions?.includes('events') && 
                                                                                                        bill.houses[index].map((event, index) => {
                                                                                                            const eventPosition = getEventPosition(event.date, house_group[0].date, zoom);
                                                                                                            return(
                                                                                                                <div className="event" key={`event-${index}`} style={{ left: `${eventPosition}px`, backgroundColor: houses.find(h => h.house == event.house)?.active_color }}>
                                                                                                                    <Tooltip event={event} />
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
                                            <div className="xAxis" style={{ width: `${maxDays * zoom}px` }}>
                                                {
                                                    Array.from({ length: maxDays }, (_, i) => i + 1).map((day, index) => {
                                                        return (
                                                                    day % (zoom > 3 ? 10 : 50) == 0 && (
                                                                        <div className="tick" style={{ left: `${day * zoom}px` }} key={`day-${index}`}>
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
                                </Scrollbars>
                            </div>
                        </Col>

                        
                    </Row>
                </Container>
                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{selectedBill.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <pre>
                        {JSON.stringify(selectedBill, null, 1)}
                        </pre>
                    </Modal.Body>
                    
                </Modal>
            </section>

        </div>
    )
}

export default BillTracker;

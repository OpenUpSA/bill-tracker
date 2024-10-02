import React, { useEffect, useRef, useState } from "react";

import axios from "axios";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import Stack from "react-bootstrap/Stack";
import Modal from "react-bootstrap/Modal";

import { SparklinesLine } from "@lueton/react-sparklines";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faFlag,
  faChevronDown,
  faScroll,
  faCircleInfo,
  faSquareCheck,
  faSquare,
  faCaretDown,
  faCaretUp,
  faTableColumns,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import { Scrollbars } from "react-custom-scrollbars";

import {
  CommitteeMeeting,
  Plenary,
  MediaBriefing,
  BillIntroduced,
  BillUpdated,
  BillPassed,
  BillSigned,
  BillEnacted,
  BillActCommenced,
  IconZoomIn,
  IconZoomOut,
  IconFullscreen,
  IconReset,
  IconMaximise,
} from "./icons";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";

import * as lookup from "../../data/lookup.json";

function BillTracker() {
  const [bills, setBills] = useState([]);
  const [preparedBills, setPreparedBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [groupedBills, setGroupedBills] = useState([]);

  const [selectedParliament, setSelectedParliament] = useState("all");
  const [selectedBillTypes, setSelectedBillTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([
    "na",
    "ncop",
    "president",
  ]);

  const [groupBy, setGroupBy] = useState("status");
  const [search, setSearch] = useState("");

  const hideBillsWithStatus = [
    "lapsed",
    "withdrawn",
    "rejected",
    "enacted",
    "act-commenced",
    "act-partly-commenced",
  ];
  const [billEvents, setBillEvents] = useState([
    "today",
    "bill-introduced",
    "bill-updated",
    "bill-withdrawn",
    "bill-rejected",
    "bill-passed",
    "bill-signed",
    "bill-enacted",
    "bill-act-commenced",
  ]);

  const [daySizeinPx, setDaySizeinPx] = useState(1);
  const [minDaySizeInPx, setMinDaySizeInPx] = useState(1);
  const [maxDays, setMaxDays] = useState(0);
  const [timelineScroll, setTimelineScroll] = useState(0);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState({});
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoveredBill, setHoveredBill] = useState(null);
  const [hoveredEPM, setHoveredEPM] = useState(false);
  const [sortOrder, setSortOrder] = useState("dec");
  const [maximise, setMaximise] = useState(false);
  const [tableColumns, setTableColumns] = useState(["days", "meetings", "epm"]);
  const [selectedTableColumns, setSelectedTableColumns] = useState([
    "days",
    "meetings",
    "epm",
  ]);

  const timelineRef = useRef(null);

  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

  // Effects

  useEffect(() => {
    getBills();
  }, []);

  useEffect(() => {
    console.log(bills);
    prepareBills();
  }, [bills]);

  useEffect(() => {
    filterBills();
  }, [
    preparedBills,
    selectedBillTypes,
    selectedStatuses,
    search,
    selectedParliament,
  ]);

  useEffect(() => {
    groupBills();
  }, [filteredBills, sortOrder]);

  useEffect(() => {
    getMaxDays();
    setLoading(false);
  }, [groupedBills]);

  useEffect(() => {
    groupBills();
  }, [groupBy]);

  useEffect(() => {
    updateMinDaySizeInPx();
  }, [maxDays]);

  // Methods

  const getBills = async () => {
    try {
      const response = await axios.get(
        "https://api.pmg.org.za/v2/bill-tracker/"
      );
      setBills(response.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const prepareBills = () => {
    let billsWork = bills;

    billsWork.forEach((bill) => {
      bill.houses = [];
      bill.houses_time = [];
      let currentHouse = [];
      let lastHouse = null;
      bill.total_commitee_meetings = 0;
      bill.total_days = 0;
      bill.epm_count = 0;
      bill.epm = [];

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

      bill.houses.forEach((house_group, index) => {
        if (index > 0) {
          let last_house_last_event_date = new Date(
            bill.houses[index - 1][bill.houses[index - 1].length - 1].date
          );
          let this_house_first_event_date = new Date(house_group[0].date);

          if (last_house_last_event_date < this_house_first_event_date) {
            let dummyEvent = {
              date: new Date(last_house_last_event_date + 1),
              house: house_group[0].house,
              type: "current-house-start",
            };
            house_group.unshift(dummyEvent);
          }
        }
      });

      // This is to add a dummy event for the current house if the last event is not the current house
      // This is to ensure that the current house is always shown on the timeline
      // It is still ongoing and needs to show today.

      if (["na", "ncop", "president"].includes(bill.status)) {
        if (lastHouse.toLowerCase() != bill.status.toLowerCase()) {
          // add a house
          let lastDate = bill.events[bill.events.length - 1]?.date;
          let startDate = new Date(lastDate + 1);
          let dummyEvents = [
            {
              date: startDate,
              house: lookup.status[bill.status],
              type: "current-house-start",
            },
            {
              title: "Today",
              date: new Date(),
              house: lookup.status[bill.status],
              type: "today",
            },
          ];

          bill.houses.push(dummyEvents);
        } else {
          bill.houses[bill.houses.length - 1].push({
            date: new Date(),
            house: lookup.status[bill.status],
            type: "today",
          });
        }
      }
    });

    billsWork.forEach((bill) => {
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

      // EPM Calculation

      let epm_count = 0;

      let months = bill.total_days / 30;

      months = months < 1 ? 1 : months;

      epm_count = (bill.events.length / months).toFixed(2);

      bill.epm_count = epm_count;

      // EPM Trend
      let counts = {};
      bill.events.forEach((event) => {
        let eventDate = new Date(event.date);
        let year = eventDate.getFullYear();
        let month = eventDate.getMonth(); // 0-based index
        let key = `${year}-${month}`;
        counts[key] = (counts[key] || 0) + 1;
      });

      let eventDates = bill.events.map((e) => new Date(e.date));
      let earliestDate = new Date(Math.min(...eventDates));
      let latestDate = new Date(Math.max(...eventDates));

      // Generate month keys between earliestDate and latestDate
      let monthKeys = [];
      let date = new Date(
        earliestDate.getFullYear(),
        earliestDate.getMonth(),
        1
      );
      while (date <= latestDate) {
        let key = `${date.getFullYear()}-${date.getMonth()}`;
        monthKeys.push(key);
        date.setMonth(date.getMonth() + 1);
      }

      let epm_trend = [];
      monthKeys.forEach((key) => {
        let count = counts[key] || 0;
        epm_trend.push(count);
      });

      bill.epm_trend = epm_trend;
    });

    setPreparedBills(billsWork);
  };

  const filterBills = () => {
    let filteredBillsWork = preparedBills;

    if (selectedParliament !== "all") {
      filteredBillsWork = filteredBillsWork.filter(
        (bill) =>
          bill.date_of_introduction >=
            lookup.parliaments[selectedParliament].start &&
          bill.date_of_introduction <=
            lookup.parliaments[selectedParliament].end
      );
    }

    if (selectedBillTypes.length > 0) {
      filteredBillsWork = filteredBillsWork.filter((bill) =>
        selectedBillTypes.includes(bill.type)
      );
    }

    if (selectedStatuses.length > 0) {
      filteredBillsWork = filteredBillsWork.filter((bill) =>
        selectedStatuses.includes(bill.status)
      );
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
    filteredBills.forEach((bill) => {
      if (!groupByValues.includes(bill[groupBy])) {
        groupByValues.push(bill[groupBy]);
      }
    });

    groupByValues.forEach((value) => {
      let group = {
        title: value,
        bills: [],
      };

      let bills = filteredBills.filter((bill) => bill[groupBy] === value);

      group.bills = bills;
      groupedBillsWork.push(group);
    });

    groupedBillsWork.forEach((group) => {
      group.bills.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.total_days - b.total_days;
        } else {
          return b.total_days - a.total_days;
        }
      });
    });

    let orderedGroups = [];
    Object.keys(lookup[groupBy]).forEach((key) => {
      let group = groupedBillsWork.find((group) => group.title === key);
      if (group) {
        orderedGroups.push(group);
      }
    });

    setGroupedBills(orderedGroups);
  };

  // Components

  const BillTooltip = () => {
    return (
      <div
        className="bill-tooltip"
        style={{
          opacity: 1,
          left: `${tooltipPosition.left}px`,
          top: `${tooltipPosition.top}px`,
        }}
      >
        <h2 className="mb-4">{hoveredBill.title}</h2>
        <table className="w-100">
          <tr>
            <th>Bill type:</th>
            <td>{lookup.type[hoveredBill.type]}</td>
          </tr>
          <tr>
            <th>Introduced by:</th>
            <td>{hoveredBill.introduced_by}</td>
          </tr>
          <tr>
            <th>Currently before:</th>
            <td>{lookup.status[hoveredBill.status]}</td>
          </tr>
          <tr>
            <th>Days in parliament:</th>
            <td>{hoveredBill.total_days}</td>
          </tr>
          <tr>
            <th>Committee Meetings (total):</th>
            <td>{hoveredBill.total_commitee_meetings}</td>
          </tr>
          <tr>
            <th>Days since last event:</th>
            <td>
              {getDateDifferenceInDays(
                hoveredBill.events[hoveredBill.events.length - 1].date,
                new Date()
              )}
            </td>
          </tr>
        </table>
      </div>
    );
  };

  const EventTooltip = () => {
    return (
      <div
        className="event-tooltip"
        style={{
          opacity: 1,
          left: `${tooltipPosition.left}px`,
          top: `${tooltipPosition.top}px`,
        }}
      >
        <h2 className="mb-4">{lookup.event_types[hoveredEvent.type]}</h2>

        {hoveredEvent.type === "today" && (
          <div>{formatDate(hoveredEvent.date)}</div>
        )}

        {hoveredEvent.type != "today" && (
          <>
            <div className="mb-3">{hoveredEvent.title}</div>

            <table className="w-100">
              <tr>
                <th>Date:</th>
                <td>{formatDate(hoveredEvent.date)}</td>
              </tr>
              <tr>
                <th>House:</th>
                <td>{lookup.house[hoveredEvent.house]}</td>
              </tr>
              <tr>
                <th>Days since event:</th>
                <td>
                  {getDateDifferenceInDays(hoveredEvent.date, new Date())}
                </td>
              </tr>
            </table>
          </>
        )}
      </div>
    );
  };

  const EPMTooltip = () => {
    return (
      <div
        className="epm-tooltip"
        style={{
          opacity: 1,
          left: `${tooltipPosition.left}px`,
          top: `${tooltipPosition.top}px`,
        }}
      >
        <h2>Events per month (EPM)</h2>
        <p>
          This metric is used to show how much parliamentary activity has taken
          place around a bill. The trend helps to show where the activity has
          taken place over the life of a bill.
        </p>
      </div>
    );
  };

  const getAvgDays = () => {
    let total = 0;
    let count = 0;
    groupedBills.forEach((group) => {
      group.bills.forEach((bill) => {
        total += bill.total_days;
        count++;
      });
    });

    return Math.round(total / count);
  };

  const getAvgMeetings = () => {
    let total = 0;
    let count = 0;
    groupedBills.forEach((group) => {
      group.bills.forEach((bill) => {
        total += bill.total_commitee_meetings;
        count++;
      });
    });

    return Math.round(total / count);
  };

  const getPublicParticipation = () => {
    let total = 0;
    let count = 0;
    groupedBills.forEach((group) => {
      group.bills.forEach((bill) => {
        bill.events.forEach((event) => {
          if (event.public_participation) {
            total++;
          }
        });
        count++;
      });
    });

    return Math.round(total / count);
  };

  const getRevisions = () => {
    let total = 0;
    let count = 0;

    groupedBills.forEach((group) => {
      group.bills.forEach((bill) => {
        total += bill.versions.length;
        count++;
      });
    });

    return Math.round(total / count);
  };

  // Helpers

  const changeDaySize = (e) => {
    setDaySizeinPx(e);
  };

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
      });
    });

    setMaxDays(max);
  };

  const updateMinDaySizeInPx = () => {
    if (timelineRef.current) {
      let width = timelineRef.current.offsetWidth;
      let calculatedDaySize = width / maxDays;
      setMinDaySizeInPx(calculatedDaySize);
    }
  };

  const toggleMax = () => {
    setMaximise(!maximise);
  };

  // Bill Hovers

  const handleMouseOver = (bill) => {
    setHoveredBill(bill);
  };

  const throttledHandleMouseOver = throttle(handleMouseOver, 500);

  const handleMouseOut = () => {
    setHoveredBill(null);
  };

  // Event Hovers

  const handleEventMouseOver = (event) => {
    setHoveredEvent(event);
  };

  const throttledHandleEventMouseOver = throttle(handleEventMouseOver, 500);

  const handleEventMouseOut = () => {
    setHoveredEvent(null);
  };

  const handleMouseMove = (e) => {
    setTooltipPosition({
      left: e.pageX,
      top: e.pageY,
    });
  };

  const toggleEvents = (event) => {
    setBillEvents(
      billEvents.includes(event)
        ? billEvents.filter((e) => e !== event)
        : [...billEvents, event]
    );
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "dec" : "asc");
  };

  // Debug Helper
  const listValues = (key, nestedKey = null) => {
    let values = [];
    bills.forEach((bill) => {
      if (nestedKey) {
        bill[nestedKey].forEach((nestedItem) => {
          if (!values.includes(nestedItem[key])) {
            values.push(nestedItem[key]);
          }
        });
      } else {
        if (!values.includes(bill[key])) {
          values.push(bill[key]);
        }
      }
    });
    console.log(values);
  };

  return (
    <>
      <PMHeader />
      <PMTabs active="bill-tracker" />
      <Container fluid className="py-5">
        <div className="bill-tracker-container">
          <Row>
            <Col>
              <h1>Bill Tracker</h1>
            </Col>
            <Col xs="auto">
              <Form.Group as={Row}>
                <Form.Label column md="auto" className="mt-2">
                  Parliament:
                </Form.Label>
                <Col>
                  <Dropdown className="dropdown-select">
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
            <Col md={2} className={maximise ? "d-none" : ""}>
              <div className="sidebar">
                <Accordion defaultActiveKey={["0", "1"]} alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <FontAwesomeIcon icon={faFilter} /> Group and filter bills
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col xs="auto" className="align-self-center">
                          Group by:
                        </Col>
                        <Col>
                          <Dropdown className="dropdown-select">
                            <Dropdown.Toggle>
                              <Row>
                                <Col>
                                  {groupBy === "status"
                                    ? "Current Status"
                                    : "Bill Type"}
                                </Col>
                                <Col xs="auto">
                                  <FontAwesomeIcon icon={faChevronDown} />
                                </Col>
                              </Row>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => setGroupBy("status")}
                              >
                                Current Status
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => setGroupBy("type")}>
                                Bill Type
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>
                      </Row>

                      <Row className="my-3">
                        <Col xs="auto">Showing:</Col>
                        <Col className="text-end">
                          {filteredBills.length} of {preparedBills.length} (
                          {(
                            (filteredBills.length / preparedBills.length) *
                            100
                          ).toFixed(0)}
                          %)
                        </Col>
                      </Row>

                      <Row>
                        <Col>
                          <div className="form-input-container">
                            <Form.Control
                              type="text"
                              placeholder="Search for a bill..."
                              className="form-input"
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row className="mt-4">
                        <Col>
                          <Dropdown
                            className="dropdown-select"
                            autoClose="outside"
                          >
                            <Dropdown.Toggle>
                              <Row>
                                <Col>
                                  Bill type (
                                  {selectedBillTypes.length == 0
                                    ? "All"
                                    : selectedBillTypes.length}
                                  )
                                </Col>
                                <Col xs="auto">
                                  <FontAwesomeIcon icon={faChevronDown} />
                                </Col>
                              </Row>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => setSelectedBillTypes([])}
                              >
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

                              {Object.keys(lookup.type).map((type, index) => (
                                <Dropdown.Item
                                  key={index}
                                  onClick={() =>
                                    setSelectedBillTypes(
                                      selectedBillTypes.includes(type)
                                        ? selectedBillTypes.filter(
                                            (selectedType) =>
                                              selectedType !== type
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
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>
                      </Row>

                      <Row className="mt-2">
                        <Col>
                          <Dropdown
                            className="dropdown-select"
                            autoClose="outside"
                          >
                            <Dropdown.Toggle>
                              <Row>
                                <Col>
                                  Bill status (
                                  {selectedStatuses.length == 0
                                    ? "All"
                                    : selectedStatuses.length}
                                  )
                                </Col>
                                <Col xs="auto">
                                  <FontAwesomeIcon icon={faChevronDown} />
                                </Col>
                              </Row>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => setSelectedStatuses([])}
                              >
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
                                (status, index) => (
                                  <Dropdown.Item
                                    key={index}
                                    onClick={() =>
                                      setSelectedStatuses(
                                        selectedStatuses.includes(status)
                                          ? selectedStatuses.filter(
                                              (selectedStatus) =>
                                                selectedStatus !== status
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
                                )
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>
                      </Row>

                      <div className="clear-all mt-4">Clear all</div>
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="1">
                    <Accordion.Header>
                      <FontAwesomeIcon icon={faFlag} /> Toggle bill events
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <CommitteeMeeting />
                        </Col>
                        <Col className="align-self-center">
                          Committee meeting
                        </Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("committee-meeting")}
                            checked={billEvents.includes("committee-meeting")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <Plenary />
                        </Col>
                        <Col className="align-self-center">Plenary</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("plenary")}
                            checked={billEvents.includes("plenary")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <MediaBriefing />
                        </Col>
                        <Col className="align-self-center">Media Briefing</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("media-briefing")}
                            checked={billEvents.includes("media-briefing")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <BillIntroduced />
                        </Col>
                        <Col className="align-self-center">Introduced</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            value={true}
                            onClick={() => toggleEvents("bill-introduced")}
                            checked={billEvents.includes("bill-introduced")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <BillUpdated />
                        </Col>
                        <Col className="align-self-center">Updated</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("bill-updated")}
                            checked={billEvents.includes("bill-updated")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <BillPassed />
                        </Col>
                        <Col className="align-self-center">Passed</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("bill-passed")}
                            checked={billEvents.includes("bill-passed")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <BillSigned />
                        </Col>
                        <Col className="align-self-center">Signed</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("bill-signed")}
                            checked={billEvents.includes("bill-signed")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-4 status-toggle">
                        <Col xs="auto">
                          <BillEnacted />
                        </Col>
                        <Col className="align-self-center">Enacted</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("bill-enacted")}
                            checked={billEvents.includes("bill-enacted")}
                          />
                        </Col>
                      </Row>

                      <Row className="status-toggle">
                        <Col xs="auto">
                          <BillActCommenced />
                        </Col>
                        <Col className="align-self-center">Act Commenced</Col>
                        <Col xs="auto">
                          <Form.Check
                            type="switch"
                            onClick={() => toggleEvents("bill-act-commenced")}
                            checked={billEvents.includes("bill-act-commenced")}
                          />
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
                <a
                  className="feedback-btn"
                  target="_blank"
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfaMxpxAx4TxaDcGZv2NySfZBir-nRblwMnNWiYhrxsnwsudg/viewform"
                >
                  Provide feedback
                </a>
              </div>
            </Col>
            <Col
              className={`page-body ${maximise ? "maximise" : ""}`}
              md={maximise ? 12 : 8}
            >
              <Row>
                <Col>
                  <h2>
                    <FontAwesomeIcon icon={faScroll} /> List of bills (
                    {filteredBills.length})
                  </h2>
                </Col>
              </Row>

              {loading ? (
                <div>Loading...</div>
              ) : (
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th className="bill-name">Bill name</th>

                      {selectedTableColumns.includes("days") && (
                        <th
                          className="bill-days"
                          onClick={() => toggleSortOrder()}
                        >
                          Days{" "}
                          <FontAwesomeIcon
                            icon={sortOrder == "dec" ? faCaretDown : faCaretUp}
                          />
                        </th>
                      )}
                      {selectedTableColumns.includes("meetings") && (
                        <th className="bill-meetings">Meetings</th>
                      )}
                      {selectedTableColumns.includes("epm") && (
                        <th className="bill-epm-trend">
                          EPM + Trend
                          <FontAwesomeIcon
                            onMouseMove={handleMouseMove}
                            onMouseOver={() => setHoveredEPM(true)}
                            onMouseOut={() => setHoveredEPM(false)}
                            icon={faCircleInfo}
                          />
                        </th>
                      )}

                      <th className="bill-timeline" ref={timelineRef}>
                        <Row>
                          <Col md={5}>Timeline</Col>
                          <Col>
                            <div className="form-range-container">
                              <Slider
                                included={false}
                                handleStyle={[
                                  {
                                    backgroundColor: "white",
                                    borderColor: "black",
                                    borderWidth: "3px",
                                    zIndex: "999",
                                  },
                                ]}
                                min={1}
                                max={10}
                                defaultValue={5}
                                step={1}
                                value={daySizeinPx}
                                onChange={(e) => changeDaySize(e)}
                              />
                            </div>
                          </Col>
                          <Col md="auto">
                            <div className="timeline-controls">
                              <div
                                className="timeline-control zoom-out"
                                onClick={() =>
                                  daySizeinPx > 1 &&
                                  setDaySizeinPx(daySizeinPx - 1)
                                }
                              >
                                <IconZoomOut />
                              </div>
                              <div
                                className="timeline-control zoom-in"
                                onClick={() => setDaySizeinPx(daySizeinPx + 1)}
                              >
                                <IconZoomIn />
                              </div>
                              <div
                                className="timeline-control fullscreen"
                                onClick={() => setDaySizeinPx(minDaySizeInPx)}
                              >
                                <IconFullscreen />
                              </div>
                              <div
                                className="timeline-control reset"
                                onClick={() => setDaySizeinPx(1)}
                              >
                                <IconReset />
                              </div>
                              <div
                                className="timeline-control maximise"
                                onClick={() => toggleMax()}
                              >
                                <IconMaximise />
                              </div>
                              <div className="timeline-control">
                                <Dropdown
                                  className="dropdown-select"
                                  autoClose="outside"
                                >
                                  <Dropdown.Toggle>
                                    <FontAwesomeIcon icon={faTableColumns} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    {tableColumns.map((column, index) => (
                                      <Dropdown.Item
                                        key={index}
                                        onClick={() =>
                                          setSelectedTableColumns(
                                            selectedTableColumns.includes(
                                              column
                                            )
                                              ? selectedTableColumns.filter(
                                                  (selectedColumn) =>
                                                    selectedColumn !== column
                                                )
                                              : [
                                                  ...selectedTableColumns,
                                                  column,
                                                ]
                                          )
                                        }
                                      >
                                        <FontAwesomeIcon
                                          icon={
                                            selectedTableColumns.includes(
                                              column
                                            )
                                              ? faSquareCheck
                                              : faSquare
                                          }
                                          className="me-2"
                                        />
                                        {column}
                                      </Dropdown.Item>
                                    ))}
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedBills.length > 0 &&
                      groupedBills.map((group, index) => (
                        <>
                          <tr key={index} className="group-header">
                            <th colSpan="5">{lookup[groupBy][group.title]}</th>
                          </tr>

                          {group.bills.map((bill, index) => {
                            return (
                              <tr
                                key={`bill-${index}`}
                                className="bill-row"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setShowModal(true);
                                }}
                              >
                                <td
                                  className="bill-name"
                                  onMouseMove={handleMouseMove}
                                  onMouseOver={() =>
                                    throttledHandleMouseOver(bill)
                                  }
                                  onMouseOut={() => handleMouseOut()}
                                >
                                  {bill.title.length > 40
                                    ? `${bill.title.substring(0, 40)}...`
                                    : bill.title}
                                </td>

                                {selectedTableColumns.includes("days") && (
                                  <td className="bill-days">
                                    {bill.total_days}
                                  </td>
                                )}
                                {selectedTableColumns.includes("meetings") && (
                                  <td className="bill-meetings">
                                    {bill.total_commitee_meetings}
                                  </td>
                                )}
                                {selectedTableColumns.includes("epm") && (
                                  <td className="bill-epm-trend">
                                    <div className="epm-count">
                                      {bill.epm_count}
                                    </div>
                                    <SparklinesLine
                                      stroke="#999"
                                      fill="none"
                                      data={bill.epm_trend}
                                      width={maximise ? 120 : 70}
                                      height={20}
                                    />
                                  </td>
                                )}
                                <td className="bill-timeline">
                                  <div
                                    className="bill-progress"
                                    style={{
                                      left: `-${
                                        maxDays * daySizeinPx * timelineScroll
                                      }px`,
                                      width: `${maxDays * daySizeinPx}px`,
                                    }}
                                  >
                                    <>
                                      {bill.houses.length > 0 &&
                                        bill.houses.map(
                                          (house_group, index) => {
                                            return (
                                              <div
                                                key={index}
                                                className={`house-group ${house_group[0]?.house}`}
                                                style={{
                                                  left:
                                                    bill.houses_time
                                                      .slice(0, index)
                                                      .reduce(
                                                        (a, b) => a + b,
                                                        0
                                                      ) *
                                                      daySizeinPx +
                                                    "px",
                                                  width:
                                                    bill.houses_time[index] *
                                                      daySizeinPx +
                                                    "px",
                                                }}
                                              ></div>
                                            );
                                          }
                                        )}
                                    </>
                                    <>
                                      {
                                        // events
                                        bill.houses.length > 0 &&
                                          bill.houses.map(
                                            (house_group, index) => {
                                              return house_group.map(
                                                (event, index) => {
                                                  return (
                                                    billEvents.includes(
                                                      event.type
                                                    ) && (
                                                      <div
                                                        key={
                                                          event.id
                                                            ? event.id
                                                            : index
                                                        }
                                                        className="event"
                                                        style={{
                                                          left: `${
                                                            getDateDifferenceInDays(
                                                              bill.houses[0][0]
                                                                .date,
                                                              event.date
                                                            ) * daySizeinPx
                                                          }px`,
                                                        }}
                                                        onMouseMove={
                                                          handleMouseMove
                                                        }
                                                        onMouseOver={() =>
                                                          throttledHandleEventMouseOver(
                                                            event
                                                          )
                                                        }
                                                        onMouseOut={() =>
                                                          handleEventMouseOut()
                                                        }
                                                      >
                                                        {event.type ===
                                                        "today" ? (
                                                          <div className="today"></div>
                                                        ) : event.type ===
                                                          "current-house-start" ? (
                                                          <div className="dummy-event"></div>
                                                        ) : event.type ===
                                                          "committee-meeting" ? (
                                                          <CommitteeMeeting />
                                                        ) : event.type ===
                                                          "plenary" ? (
                                                          <Plenary />
                                                        ) : event.type ===
                                                          "media-briefing" ? (
                                                          <MediaBriefing />
                                                        ) : event.type ===
                                                          "bill-introduced" ? (
                                                          <BillIntroduced />
                                                        ) : event.type ===
                                                          "bill-updated" ? (
                                                          <BillUpdated />
                                                        ) : event.type ===
                                                          "bill-passed" ? (
                                                          <BillPassed />
                                                        ) : event.type ===
                                                          "bill-signed" ? (
                                                          <BillSigned />
                                                        ) : event.type ===
                                                          "bill-enacted" ? (
                                                          <BillEnacted />
                                                        ) : event.type ===
                                                          "bill-act-commenced" ? (
                                                          <BillActCommenced />
                                                        ) : (
                                                          ""
                                                        )}
                                                      </div>
                                                    )
                                                  );
                                                }
                                              );
                                            }
                                          )
                                      }
                                    </>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={selectedTableColumns.length + 1}>
                        <Stack
                          direction="horizontal"
                          gap={2}
                          className="bill-tracker-legend"
                        >
                          <div className="legend">
                            <div className="legend-block NA"></div>
                            <div className="legend-label">
                              National Assembly
                            </div>
                          </div>
                          <div className="legend">
                            <div className="legend-block NCOP"></div>
                            <div className="legend-label">
                              National Council of Provinces
                            </div>
                          </div>
                          <div className="legend">
                            <div className="legend-block Joint"></div>
                            <div className="legend-label">Joint</div>
                          </div>
                          <div className="legend">
                            <div className="legend-block President"></div>
                            <div className="legend-label">Presidency</div>
                          </div>
                        </Stack>
                      </td>
                      <td className="footer-timeline">
                        <div className="footer-timeline-wrapper">
                          <Slider
                            className=""
                            included={false}
                            railStyle={{ height: "10px" }}
                            handleStyle={[
                              {
                                backgroundColor: "black",
                                borderColor: "black",
                                borderWidth: "0px",
                                borderRadius: "5px",
                                height: "10px",
                                width: "15px",
                                marginTop: "0",
                              },
                            ]}
                            min={0}
                            max={1}
                            defaultValue={0}
                            step={0.01}
                            value={timelineScroll}
                            onChange={(e) => setTimelineScroll(e)}
                          />

                          <div
                            className="xAxis"
                            style={{
                              width: `${maxDays * daySizeinPx}px`,
                              left: `-${
                                maxDays * daySizeinPx * timelineScroll
                              }px`,
                            }}
                          >
                            <div
                              className="tick"
                              style={{ left: "0px" }}
                              key={0}
                            >
                              <div className="label">0</div>
                            </div>
                            {Array.from(
                              { length: maxDays },
                              (_, i) => i + daySizeinPx
                            ).map((day, index) => {
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
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </Col>
            <Col className={maximise ? "d-none" : ""} md={2}>
              <div className="insights-box">
                <h2>
                  <FontAwesomeIcon icon={faLightbulb} /> Insights for listed
                  bills
                </h2>
                <table className="w-100">
                  <tr>
                    <th>Avg days in parliament:</th>
                    <td>{getAvgDays()}</td>
                  </tr>
                  <tr>
                    <th>Avg committee meetings:</th>
                    <td>{getAvgMeetings()}</td>
                  </tr>
                  <tr>
                    <th>Public participation:</th>
                    <td>{getPublicParticipation()}%</td>
                  </tr>
                  <tr>
                    <th>Avg revisions:</th>
                    <td>{getRevisions()}</td>
                  </tr>
                </table>
              </div>
            </Col>
          </Row>
          {hoveredBill && <BillTooltip />}
          {hoveredEvent && <EventTooltip />}
          {hoveredEPM && <EPMTooltip />}
        </div>
      </Container>

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedBill.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bill-stats">
          <div className="alert">
            <Row>
              <Col>Data for this bill is provided by PMG</Col>
              <Col xs="auto">
                <a
                  href={`https://pmg.org.za/bill/${selectedBill.id}`}
                  target="_blank"
                >
                  View Bill on PMG
                </a>
              </Col>
            </Row>
          </div>

          <table className="w-100 stats-table">
            <tr>
              <th>Bill Id:</th>
              <td>{selectedBill.id}</td>
            </tr>
            <tr>
              <th>Bill Type:</th>
              <td>{lookup.type[selectedBill.type]}</td>
            </tr>
            <tr>
              <th>Status:</th>
              <td>{lookup.status[selectedBill.status]}</td>
            </tr>
            <tr>
              <th>Date of Introduction:</th>
              <td>{formatDate(selectedBill.date_of_introduction)}</td>
            </tr>
            <tr>
              <th>Introduced By:</th>
              <td>{selectedBill.introduced_by}</td>
            </tr>
            <tr>
              <th>Total Days:</th>
              <td>{selectedBill.total_days}</td>
            </tr>
            <tr>
              <th>Total Committee Meetings:</th>
              <td>{selectedBill.total_commitee_meetings}</td>
            </tr>
          </table>

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

import React, { Fragment, useEffect, useRef, useState } from "react";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";

import * as lookup from "../../data/lookup.json";

import axios from "axios";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowUp,
    faArrowDown,
    faChevronDown
} from "@fortawesome/free-solid-svg-icons";

import { Scrollbars } from "react-custom-scrollbars";

import Papa from "papaparse";

import BarChart from "../charts/BarChart";
import CalendarDays from "../charts/CalendarDays";
import MeetingTimes from "../charts/MeetingTimes";
import AttendanceChart from "../charts/AttendanceChart";




import { DashboardCard, CardTitle, CardParty, CardSubtitle, CardSparkline, CardContent, CardBar } from "../dashboardcard";
import { use } from "react";




function PartyPill(props) {

    if (props.party == "") {
        return null;
    }

    return <div className="party-pill">{props.party}</div>;
}

function Badge(props) {

    return <div className="party_member_badge" style={{backgroundImage: `url(https://static.pmg.org.za/${props.pic})`}}></div>;
}


function Overview() {
    const attendance_data_csv = "/committee-meeting-with-attendance-and-time.csv";
    const members_data_csv = "/members.csv";
    const [attendanceData, setAttendanceData] = useState([]);
    const [membersData, setMembersData] = useState([]);

    const [party, setParty] = useState("");
    const [period, setPeriod] = useState(30);
    const [endDate, setEndDate] = useState(new Date(2024, 10, 1));

    const minDate = "2024-06-21"; 
    const maxDate = "2025-01-31";

    const [avgMeetings_Breakdown, setAvgMeetings_Breakdown] = useState([]);
    const [avgMeetings_Party_Breakdown, setAvgMeetings_Party_Breakdown] = useState([]);

    const [totalMeetings, setTotalMeetings] = useState(0);

    const [avgMeetings, setAvgMeetings] = useState(0);
    const [avgMeetings_Party, setAvgMeetings_Party] = useState(0);

    const [meetingsPerCommittee_Breakdown, setMeetingsPerCommittee_Breakdown] = useState([]);
    const [avgMeetingsperCommittee, setAvgMeetingsPerCommittee] = useState(0);

    const [committeesWithBestAttendance, setCommitteesWithBestAttendance] = useState([]);
    const [committeesWithBestAttendance_Party, setCommitteesWithBestAttendance_Party] = useState([]);

    const [avgLengthOfMeetings, setAvgLengthOfMeetings] = useState(0);
    const [avgLengthOfMeetings_Breakdown, setAvgLengthOfMeetings_Breakdown] = useState([]);
    const [avgLengthOfMeetings_Party_Breakdown, setAvgLengthOfMeetings_Party_Breakdown] = useState(0);
    

    const [committeeMeetingsOverlapped_Breakdown, setCommitteeMeetingsOverlapped_Breakdown] = useState([]);
    const [committeeMeetingsOverlapped_Party, setCommitteeMeetingsOverlapped_Party] = useState([]);
    const [totalMeetingsOverlapped, setTotalMeetingsOverlapped] = useState(0);

    const [partiesAttendance, setPartiesAttendance] = useState([]);

    const [membersAttendance, setMembersAttendance] = useState([]);

    const [avgTimeInMeeting_Breakdown, setAvgTimeInMeeting_Breakdown] = useState([]);
    const [avgTimeInMeeting_Party_Breakdown, setAvgTimeInMeeting_Party_Breakdown] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [modalMetric, setModalMetric] = useState("Representation in meetings");


    const attendance_by_gender = [
        { gender: "Male", members: 200, meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8] },
        { gender: "Female", members: 200, meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8] },
        { gender: "Other", members: 0, meetings: 0, present: 0, vs_avg: 0, trend: [10, 0, 6, 8] }
    ]

    const attendance_by_age = [
        { age: "18-24", meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8] },
        { age: "25-34", meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8] },
        { age: "35-49", meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8] },
        { age: "50-64", meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8] },
        { age: "65-80", meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8] }
    ];



    function loadAttendanceData() {
        fetch(attendance_data_csv)
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                        processAttendanceData(result.data);
                    },
                });
            })
    }

    function loadMembersData() {
        fetch(members_data_csv)
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                        processMembersData(result.data);
                    },
                });
            })
    }



    function CardHelp(props) {
        return (
            <div className="card-help" onClick={() => toggleModal(true, props.metric)}>
                <div className="question">?</div>
            </div>
        )
    }

    function toggleModal(show, metric = "") {
        setModalMetric(metric);
        setShowModal(show);
    }

    function calc_AvgMeetings(byParty) {

        let attendanceDataCalc = attendanceData;

        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }

        let memberMeetings = {};
        let totalMeetings = 0;
        let uniqueMembers = new Set();

        attendanceDataCalc.forEach(row => {
            if (row["alternate_member"] === "False") {
                let memberId = row["member_id"];
                uniqueMembers.add(memberId);

                if (!memberMeetings[memberId]) {
                    memberMeetings[memberId] = 0;
                }

                memberMeetings[memberId]++;
                totalMeetings++;
            }
        });

        let avgMeetings = uniqueMembers.size > 0 ? (totalMeetings / uniqueMembers.size).toFixed(2) : 0;

        let bins;

        if (byParty) {

            bins = Array.from({ length: 25 }, (_, i) => ({ category: i + 1, set2: 0 }));

            Object.values(memberMeetings).forEach(meetingCount => {

                if (meetingCount > 25) {
                    meetingCount = 25;
                }
                bins[meetingCount - 1].set2 += 1;
            });

        } else {

            bins = Array.from({ length: 25 }, (_, i) => ({ category: i + 1, all: 0 }));

            Object.values(memberMeetings).forEach(meetingCount => {

                if (meetingCount > 25) {
                    meetingCount = 25;
                }
                bins[meetingCount - 1].all += 1;
            });

        }

        return {
            average: parseInt(avgMeetings),
            memberMeetings: bins
        };
    }

    function calc_ActualMeetingTime(byParty) {
        let attendanceDataCalc = attendanceData;
    
        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }
    
        let memberTimes = {};
        let uniqueMembers = new Set();
    
        attendanceDataCalc.forEach(row => {
            if (row["alternate_member"] === "False") {
                let memberId = row["member_id"];
                uniqueMembers.add(memberId);
    
                let actualTime = parseFloat(row["actual_time"]);
    
                if (!memberTimes[memberId]) {
                    memberTimes[memberId] = 0;
                }
    
                memberTimes[memberId] += actualTime;
            }
        });
    
        // Convert time from minutes to hours
        Object.keys(memberTimes).forEach(memberId => {
            memberTimes[memberId] = memberTimes[memberId] / 60;
        });
    
        let bins;
    
        if (byParty) {
            bins = Array.from({ length: 26 }, (_, i) => ({ category: i, set2: 0 }));
    
            Object.values(memberTimes).forEach(timeSpent => {
                let binIndex = Math.min(25, Math.floor(timeSpent)); // Clamp to 25+
                bins[binIndex].set2 += 1;
            });
    
        } else {
            bins = Array.from({ length: 26 }, (_, i) => ({ category: i, all: 0 }));
    
            Object.values(memberTimes).forEach(timeSpent => {
                let binIndex = Math.min(25, Math.floor(timeSpent)); // Clamp to 25+
                bins[binIndex].all += 1;
            });
        }
    
        return {
            memberTimes: memberTimes,
            bins: bins
        };
    }

    function calc_TotalMeetings(byParty) {
        let attendanceDataCalc = attendanceData;

        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }

        // set by meeting_id
        let uniqueMeetings = new Set();

        attendanceDataCalc.forEach(row => {
            let meetingId = row["meeting_id"];
            uniqueMeetings.add(meetingId);
        })

        return uniqueMeetings.size;

    }

    function calc_MeetingsPerCommittee(byParty) {
        let attendanceDataCalc = attendanceData;

        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }

        let committeeMeetings = {};
        let uniqueMeetings = new Set();

        attendanceDataCalc.forEach(row => {
            let committeeName = row["committee"];
            let meetingDate = row["meeting_date"];
            let totalTime = parseInt(row["actual_time"], 10) || 0;
            let uniqueKey = `${committeeName}_${meetingDate}`;

            if (committeeName && !uniqueMeetings.has(uniqueKey)) {
                uniqueMeetings.add(uniqueKey);

                if (!committeeMeetings[committeeName]) {
                    committeeMeetings[committeeName] = { count: 0, total_time: 0 };
                }
                committeeMeetings[committeeName].count++;
                committeeMeetings[committeeName].total_time += totalTime;
            }
        });

        let committee_meetings_total = Object.keys(committeeMeetings).map(committee => ({
            committee,
            count: committeeMeetings[committee].count,
            total_time: committeeMeetings[committee].total_time
        }));

        // get average of committee meetings count
        let avg_committee_meetings = 0;
        let avg_commitee_time = 0;
        if (committee_meetings_total.length > 0) {
            let total_committee_meetings = committee_meetings_total.reduce((acc, curr) => acc + curr.count, 0);
            let total_committee_time = committee_meetings_total.reduce((acc, curr) => acc + curr.total_time, 0);
            avg_committee_meetings = (total_committee_meetings / committee_meetings_total.length).toFixed(2);
            avg_commitee_time = `${Math.floor(total_committee_time / 60)}h${total_committee_time % 60 < 10 ? '0' : ''}${total_committee_time % 60}`;
        }

        // sort
        return {
            meetings_total: committee_meetings_total.sort((a, b) => b.count - a.count),
            average: parseInt(avg_committee_meetings),
            average_time: avg_commitee_time
        }
    }

    function calc_CommitteesWithBestAttendance(byParty) {
        let attendanceDataCalc = attendanceData;

        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }

        let committeeAttendance = {};

        attendanceDataCalc.forEach(row => {
            let committeeName = row["committee"];
            let isPresent = row["attendance"] === "P";

            if (!committeeAttendance[committeeName]) {
                committeeAttendance[committeeName] = { present: 0, total: 0, meetings: new Set() };
            }
            committeeAttendance[committeeName].total++;
            committeeAttendance[committeeName].meetings.add(row["meeting_date"]); // Track unique meetings
            if (isPresent) {
                committeeAttendance[committeeName].present++;
            }
        });

        return Object.keys(committeeAttendance).map(committee => {
            let { present, total, meetings } = committeeAttendance[committee];
            return {
                committee,
                attendance_count: present,
                attendance_percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0%",
                meeting_count: meetings.size // Count of unique meetings
            };
        }).sort((a, b) => b.attendance_percentage - a.attendance_percentage);
    }

    function calc_OverlappingMeetings(byParty) {
        let attendanceDataCalc = attendanceData;

        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }

        let committeeMeetings = {};

        // Group meetings by committee and date (keeping only the day, month, and year)
        attendanceDataCalc.forEach(row => {
            let committeeName = row["committee"];
            let meetingDate = row["meeting_date"].split(",").slice(0, 2).join(",").trim(); // Extract day, month, and year
            let startTime = row["actual_start_time"];
            let endTime = row["actual_end_time"];

            let uniqueKey = `${committeeName}_${meetingDate}`;

            if (!committeeMeetings[uniqueKey]) {
                committeeMeetings[uniqueKey] = { committee: committeeName, date: meetingDate, start: startTime, end: endTime, count: 1 };
            } else {
                // Update start and end times if necessary
                committeeMeetings[uniqueKey].start = committeeMeetings[uniqueKey].start < startTime ? committeeMeetings[uniqueKey].start : startTime;
                committeeMeetings[uniqueKey].end = committeeMeetings[uniqueKey].end > endTime ? committeeMeetings[uniqueKey].end : endTime;
                committeeMeetings[uniqueKey].count++;
            }
        });

        let overlappingMeetings = {};

        // Initialize overlap counts
        Object.values(committeeMeetings).forEach(meeting => {
            if (!overlappingMeetings[meeting.committee]) {
                overlappingMeetings[meeting.committee] = { count: 0, meetings: 0, meetings_with_overlap: 0 };
            }
            overlappingMeetings[meeting.committee].meetings++;
        });

        let meetingsArray = Object.values(committeeMeetings);

        // Check for overlaps between different committees
        for (let i = 0; i < meetingsArray.length; i++) {
            let meetingA = meetingsArray[i];
            let hasOverlap = false;

            for (let j = i + 1; j < meetingsArray.length; j++) {
                let meetingB = meetingsArray[j];

                if (meetingA.date === meetingB.date) { // Only compare meetings on the same date
                    if (
                        (meetingA.start < meetingB.end && meetingA.end > meetingB.start) // Overlap condition
                    ) {
                        overlappingMeetings[meetingA.committee].count++;
                        overlappingMeetings[meetingB.committee].count++;
                        hasOverlap = true;
                    }
                }
            }

            if (hasOverlap) {
                overlappingMeetings[meetingA.committee].meetings_with_overlap++;
            }
        }

        let overlapping_meetings_total = Object.keys(overlappingMeetings).map(committee => ({
            committee,
            overlap_count: overlappingMeetings[committee].count,
            meetings: overlappingMeetings[committee].meetings,
            meetings_with_overlap: overlappingMeetings[committee].meetings_with_overlap
        }));

        // Sort results by highest overlap count
        return overlapping_meetings_total.sort((a, b) => b.overlap_count - a.overlap_count);
    }

    function calc_partiesAttendance(byParty) {
        let attendanceDataCalc = attendanceData;

        // if (byParty) {
        // }

        let partyAttendance = {};

        attendanceDataCalc.forEach(row => {
            let partyName = row["party"];
            let isPresent = row["attendance"] === "P";
            let meetingDate = row["meeting_date"];

            if (!partyAttendance[partyName]) {
                partyAttendance[partyName] = { present: 0, total: 0, meetings: new Set() };
            }

            partyAttendance[partyName].total++;
            partyAttendance[partyName].meetings.add(meetingDate);
            if (isPresent) {
                partyAttendance[partyName].present++;
            }
        });

        return Object.keys(partyAttendance).map(party => {
            let { present, total, meetings } = partyAttendance[party];
            return {
                party,
                attendance_count: present,
                attendance_percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0%",
                meeting_count: meetings.size // Count of unique meetings
            };
        }).sort((a, b) => b.attendance_percentage - a.attendance_percentage);
    }

    function calc_membersAttendance(byParty) {
        let attendanceDataCalc = attendanceData;

        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }

        let memberAttendance = {};

        attendanceDataCalc.forEach(row => {
            let memberName = row["member_name"];
            let isPresent = row["attendance"] === "P";
            let meetingDate = row["meeting_date"];

            if (!memberAttendance[memberName]) {
                memberAttendance[memberName] = { present: 0, total: 0, meetings: new Set(), profile_pic: row["member_profile_pic"], party: row["party"] };
            }

            memberAttendance[memberName].total++;
            memberAttendance[memberName].meetings.add(meetingDate);
            if (isPresent) {
                memberAttendance[memberName].present++;
            }
        });

        return Object.keys(memberAttendance).map(member => {

            let { present, total, meetings } = memberAttendance[member];
            return {
                member,
                member_name: member,
                member_party: memberAttendance[member].party,
                profile_pic: memberAttendance[member].profile_pic,
                attendance_count: present,
                attendance_percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0%",
                meeting_count: meetings.size // Count of unique meetings
            };
        }).sort((a, b) => b.attendance_percentage - a.attendance_percentage);
    }

    function calculateAvgLengthOfMeeting(byParty) {
        let attendanceDataCalc = attendanceData;
    
        if (byParty) {
            attendanceDataCalc = attendanceData.filter(row => row["party"] === party);
        }
    
        let meetingDurations = {};
        let totalTime = 0;
        let uniqueMeetings = new Set();
    
        attendanceDataCalc.forEach(row => {
            let meetingId = row["meeting_id"];
            let actualTime = parseInt(row["actual_time"], 10);
    
            if (!isNaN(actualTime)) {
                uniqueMeetings.add(meetingId);
    
                // Only keep the first instance of the meeting_id to avoid duplicates
                if (!meetingDurations.hasOwnProperty(meetingId)) {
                    meetingDurations[meetingId] = actualTime;
                }
            }
        });
    
        Object.values(meetingDurations).forEach(time => {
            totalTime += time;
        });
    
        let avgTimePerMeeting = uniqueMeetings.size > 0 ? (totalTime / uniqueMeetings.size).toFixed(2) : 0;
    
        let bins;

        if (byParty) {

            bins = [
                { category: "0-30", set2: 0 },
                { category: "31-60", set2: 0 },
                { category: "61-90", set2: 0 },
                { category: "91-120", set2: 0 },
                { category: "121-150", set2: 0 },
                { category: "151-180", set2: 0 }
            ];
        
            Object.values(meetingDurations).forEach(time => {
                if (time >= 0 && time <= 30) bins[0].set2++;
                else if (time >= 31 && time <= 60) bins[1].set2++;
                else if (time >= 61 && time <= 90) bins[2].set2++;
                else if (time >= 91 && time <= 120) bins[3].set2++;
                else if (time >= 121 && time <= 150) bins[4].set2++;
                else if (time >= 151 && time <= 180) bins[5].set2++;
            });
        
        } else {

            bins = [
                { category: "0-30", all: 0 },
                { category: "31-60", all: 0 },
                { category: "61-90", all: 0 },
                { category: "91-120", all: 0 },
                { category: "121-150", all: 0 },
                { category: "151-180", all: 0 }
            ];
        
            Object.values(meetingDurations).forEach(time => {
                if (time >= 0 && time <= 30) bins[0].all++;
                else if (time >= 31 && time <= 60) bins[1].all++;
                else if (time >= 61 && time <= 90) bins[2].all++;
                else if (time >= 91 && time <= 120) bins[3].all++;
                else if (time >= 121 && time <= 150) bins[4].all++;
                else if (time >= 151 && time <= 180) bins[5].all++;
            });

        }

    
        return {
            average: parseFloat(avgTimePerMeeting),
            meetingDurations: bins
        };
    }

    

    function processAttendanceData(data) {

        let specific_date = endDate;
        let end_date = new Date(specific_date);

        let offsetDaysFixed = new Date(specific_date);
        offsetDaysFixed.setDate(specific_date.getDate() - period);

       

        data = data.filter(row => {
            let meetingDate = new Date(row["meeting_date"]);

            return meetingDate >= offsetDaysFixed && meetingDate <= end_date;
        });

        setAttendanceData(data);
    }



    useEffect(() => {

        console.log(attendanceData);

        // Meetings per member

        let avgMeetings_Calc = calc_AvgMeetings(false);
        

        setAvgMeetings_Breakdown(avgMeetings_Calc.memberMeetings);
        setAvgMeetings(avgMeetings_Calc.average);

        if (party != "") {
            let avgMeetings_Party_Calc = calc_AvgMeetings(true);
            setAvgMeetings_Party_Breakdown(avgMeetings_Party_Calc.memberMeetings);
            setAvgMeetings_Party(avgMeetings_Party_Calc.average);
        }

        // Meetings per committee

        let meetingsPerCommittee_Calc = calc_MeetingsPerCommittee(false);
        

        if (party != "") {
            let meetingsPerCommittee_Party_Calc = calc_MeetingsPerCommittee(true);
            setMeetingsPerCommittee_Breakdown(meetingsPerCommittee_Party_Calc.meetings_total);
            setAvgMeetingsPerCommittee(meetingsPerCommittee_Party_Calc.average);
        } else {
            setMeetingsPerCommittee_Breakdown(meetingsPerCommittee_Calc.meetings_total);
            setAvgMeetingsPerCommittee(meetingsPerCommittee_Calc.average);
        }


        // Meetings with best attendance

        let committeesWithBestAttendance_Calc = calc_CommitteesWithBestAttendance(false);
        

        if (party != "") {
            let committeesWithBestAttendance_Party_Calc = calc_CommitteesWithBestAttendance(true);
            setCommitteesWithBestAttendance(committeesWithBestAttendance_Party_Calc);

        } else {
            setCommitteesWithBestAttendance(committeesWithBestAttendance_Calc);
        }

        // Overlapping meetings

        let committeeMeetingsOverlapped_Calc = calc_OverlappingMeetings(false);
        

        if (party != "") {
            let committeeMeetingsOverlapped_Party_Calc = calc_OverlappingMeetings(true);
            setCommitteeMeetingsOverlapped_Breakdown(committeeMeetingsOverlapped_Party_Calc);
        } else {
            setCommitteeMeetingsOverlapped_Breakdown(committeeMeetingsOverlapped_Calc);
        }

        // Parties attendance

        let partiesAttendance_Calc = calc_partiesAttendance(false);
        setPartiesAttendance(partiesAttendance_Calc);

        // Total meetings

        setTotalMeetings(calc_TotalMeetings(false));

        // Members attendance

        let membersAttendance_Calc = calc_membersAttendance(false);
        

        if (party != "") {
            let membersAttendance_Party_Calc = calc_membersAttendance(true);
            setMembersAttendance(membersAttendance_Party_Calc);
        } else {
            setMembersAttendance(membersAttendance_Calc);
        }



        // Avg length of meetings

        let avgLengthOfMeetings_Calc = calculateAvgLengthOfMeeting(false);
        

        setAvgLengthOfMeetings_Breakdown(avgLengthOfMeetings_Calc.meetingDurations);
        setAvgLengthOfMeetings(avgLengthOfMeetings_Calc.average);

        if(party != "") {
            let avgLengthOfMeetings_Party_Calc = calculateAvgLengthOfMeeting(true);
            setAvgLengthOfMeetings_Party_Breakdown(avgLengthOfMeetings_Party_Calc.meetingDurations);
            setAvgLengthOfMeetings(avgLengthOfMeetings_Party_Calc.average);
        }

        // Avg time spent in meetings

        let avgTimeInMeeting_Calc = calc_ActualMeetingTime(false);
        
        console.log(avgTimeInMeeting_Calc);

        setAvgTimeInMeeting_Breakdown(avgTimeInMeeting_Calc.memberTimes);
        

        if (party != "") {
            let avgTimeInMeeting_Party_Calc = calc_ActualMeetingTime(true);
            setAvgTimeInMeeting_Party_Breakdown(avgTimeInMeeting_Party_Calc.memberTimes);
        }



    }, [attendanceData, party]);



    useEffect(() => {
        if (party == "") {
            setAvgMeetings_Party_Breakdown([]);
            setAvgMeetings_Party(0);
            setMeetingsPerCommittee_Breakdown([]);
            setAvgLengthOfMeetings_Breakdown(calculateAvgLengthOfMeeting(false));

        }
    }, [party]);


    useEffect(() => {

        loadAttendanceData();
        loadMembersData();
        

    }, [endDate, period]);


    return (
        <Fragment>
            <PMHeader />
            <PMTabs active="overview" />
            <Container fluid className="py-4">
                <div className="overview-container">
                 

                    <Row className="mt-3 justify-content-between">
                        <Col>
                            <h1>Parliamentary Overview</h1>
                        </Col>
                        <Col>
                            <Row className="justify-content-end">
                                <Col xs="auto" className="d-flex align-items-center"><span className="form-label">Party:</span></Col>
                                <Col xs={3}>
                                    <Dropdown className="dropdown-select">
                                        <Dropdown.Toggle>
                                            <Row>
                                                <Col>{party == "" ? 'All parties' : <PartyPill party={party} />}</Col>
                                                <Col xs="auto">
                                                    <FontAwesomeIcon icon={faChevronDown} />
                                                </Col>
                                            </Row>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => setParty("")}>All parties</Dropdown.Item>
                                            {lookup.parties.map(
                                                (party, index) => {
                                                    return (
                                                        <Dropdown.Item
                                                            key={index}
                                                            onClick={() => setParty(party.party)}
                                                        >
                                                            {party.party}
                                                        </Dropdown.Item>
                                                    );
                                                }
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>
                            </Row>
                        </Col>
                        <Col xs="auto">
                            <Row>
                                <Col className="d-flex align-items-center justify-content-end text-nowrap"><span className="form-label">Period:</span></Col>
                                <Col>
                                    <div className="toggleButtonGroup">
                                        <button className={period === 30 ? "active" : ""} onClick={() => setPeriod(30)}>30 Days</button>
                                        <button className={period === 180 ? "active" : ""} onClick={() => setPeriod(180)}>180 Days</button>
                                    </div>
                                </Col>
                                
                               
                            </Row>
                        </Col>
                    </Row>

                    <section className="mt-5">
                        <h2>Committee meetings in the period</h2>
                        <Row className="mt-4">
                            <Col>
                                <DashboardCard fade="true">
                                    
                                    <CardTitle>Representation in meetings</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span> of <span className="card-big-text">{totalMeetings}</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="chart-container">
                                            <h3>Representation in meetings</h3>
                                            <CalendarDays />
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Avg. meetings per member</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">{party != "" ? avgMeetings_Party : avgMeetings} meetings</span>
                                        {/* <div className="card-badge"><FontAwesomeIcon icon={faArrowDown} /> 42% below average</div> */}
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="chart-container">
                                            <h3>Scheduled meetings per member</h3>
                                            {avgMeetings_Breakdown.length > 0 && <BarChart x_label="Number of scheduled meetings" y_label="Members" data={avgMeetings_Breakdown} data2={avgMeetings_Party_Breakdown} x_bins={25} x_scale={[1, 5, 10, 15, 20, 25]} />}
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>

                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Avg.length of meeting</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />    
                                        <div className="chart-container">
                                            <h3>Length of scheduled meetings</h3>
                                            {avgLengthOfMeetings_Breakdown.length > 0 && <BarChart x_label="Length of scheduled meeting (in minutes)" y_label="Meetings" data={avgLengthOfMeetings_Breakdown} data2={avgLengthOfMeetings_Party_Breakdown} x_bins={7} x_scale={["0-30","31-60","61-90","91-120","121-150","151-180"]} />}
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>

                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Avg.time spent in meetings</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="chart-container">
                                            <h3>Time spent in meetings per member</h3>
                                            {avgLengthOfMeetings_Breakdown.length > 0 && <BarChart x_label="Hours in meetings" y_label="Members" data={avgLengthOfMeetings_Breakdown} data2={avgLengthOfMeetings_Party_Breakdown} x_bins={26} x_scale={[0,5,10,15,20,25]} />}
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>



                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <DashboardCard fade="true">
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Number of meetings that ended late</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span> of <span className="card-big-text">{totalMeetings}</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="chart-container">
                                            <h3>Scheduled meetings per member</h3>
                                            <MeetingTimes />
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Avg. meetings per committee</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">{avgMeetingsperCommittee} meetings</span>
                                        {/* <div className="card-badge"><FontAwesomeIcon icon={faArrowUp} /> 6%</div> */}
                                    </CardSubtitle>

                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Committee</th>
                                                            <th>Meetings</th>
                                                            <th>Total time</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            meetingsPerCommittee_Breakdown?.map((committee, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committee.committee}</td>
                                                                    <td className="text-end">{committee.count}</td>
                                                                    <td className="text-end">{`${Math.floor(committee.total_time / 60)}h${committee.total_time % 60 < 10 ? '0' : ''}${committee.total_time % 60}`}</td>
                                                                    <td></td>
                                                                </tr>)
                                                        }
                                                    </tbody>
                                                </Table>
                                            </Scrollbars>
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Number of meetings that overlapped</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span> of <span className="card-big-text">{totalMeetings}</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                       <CardHelp metric="Representation in meetings" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Committee</th>
                                                            <th>Meetings</th>
                                                            <th>Overlap</th>
                                                            <th>Count</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            committeeMeetingsOverlapped_Breakdown.map((committee, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committee.committee}</td>
                                                                    <td className="text-end">{committee.meetings}</td>
                                                                    <td className="text-end">{committee.meetings_with_overlap}</td>
                                                                    <td className="text-end">{committee.overlap_count}</td>
                                                                    <td></td>
                                                                </tr>
                                                            )
                                                        }
                                                    </tbody>
                                                </Table>
                                            </Scrollbars>
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>
                        </Row>

                    </section>

                    <section className="mt-4">
                        <h2>Attendance of committee meetings in the period</h2>

                        <Row className="mt-4">
                            <Col>
                                <DashboardCard fade="true">
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Overall Attendance</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">-- present</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="chart-container">
                                            <h3>Attendance of committee meetings</h3>
                                            <AttendanceChart />
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Committees with the best attendance</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "200px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Committee</th>
                                                            <th>Meetings</th>
                                                            <th>Present</th>
                                                            <th>% vs avg</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            committeesWithBestAttendance.map((committee, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committee.committee}</td>
                                                                    <td className="text-end">{committee.meeting_count}</td>
                                                                    <td className="text-end">{committee.attendance_percentage}%</td>
                                                                    <td><CardBar value={committee.attendance_percentage} mark={70} /></td>
                                                                    <td></td>
                                                                </tr>
                                                            )
                                                        }
                                                    </tbody>
                                                </Table>
                                            </Scrollbars>
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Parties with the best attendance</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span> of <span className="card-big-text">{totalMeetings}</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "200px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Party</th>
                                                            <th>Meetings</th>
                                                            <th>Present</th>
                                                            <th>% vs avg</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>

                                                        {
                                                            partiesAttendance.map((party, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td><Badge party={party.party} />{party.party}</td>
                                                                    <td>{party.meeting_count}</td>
                                                                    <td>{party.attendance_percentage}%</td>
                                                                    <td><CardBar value={party.attendance_percentage} mark={70} /></td>
                                                                    <td></td>
                                                                </tr>
                                                            )
                                                        }
                                                    </tbody>
                                                </Table>
                                            </Scrollbars>
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>

                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Members with the best attendance</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span> of <span className="card-big-text">{totalMeetings}</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "200px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Member</th>
                                                            <th>Party</th>
                                                            <th>Meetings</th>
                                                            <th>Present</th>
                                                            <th>% vs avg</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            membersAttendance.map((member, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td><Badge pic={member.profile_pic}/>{member.member_name}</td>
                                                                    <td>{member.member_party}</td>
                                                                    <td className="text-end">{member.meeting_count}</td>
                                                                    <td className="text-end">{member.attendance_percentage}%</td>
                                                                    <td><CardBar value={member.attendance_percentage} mark={70} /></td>
                                                                    <td></td>
                                                                </tr>
                                                            )
                                                        }
                                                    </tbody>
                                                </Table>
                                            </Scrollbars>
                                        </div>
                                    </CardContent>

                                </DashboardCard>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <DashboardCard fade="true">
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Attendance by gender</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span> of <span className="card-big-text">{totalMeetings}</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />
                                        <Table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50%' }}>Gender</th>
                                                    <th>members</th>
                                                    <th>Meetings</th>
                                                    <th>Present</th>
                                                    <th>% vs avg</th>
                                                    <th>Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    attendance_by_gender.map((gender, index) =>
                                                        <tr>
                                                            <td>{gender.gender}</td>
                                                            <td>{gender.members}</td>
                                                            <td>{gender.meetings}</td>
                                                            <td>{gender.present}</td>
                                                            <td><CardBar value={80} mark={70} /></td>
                                                            <td><CardSparkline data={[10, 0, 6, 8]} /></td>
                                                        </tr>
                                                    )
                                                }
                                            </tbody>
                                        </Table>

                                    </CardContent>
                                </DashboardCard>
                            </Col>
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Attendance by age</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">--</span> of <span className="card-big-text">{totalMeetings}</span>
                                    </CardSubtitle>
                                    {/* <CardSparkline data={[10, 0, 6, 8]} /> */}
                                    <CardContent>
                                        <CardHelp metric="Representation in meetings" />

                                        <Table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50%' }}>Age Group</th>
                                                    <th>members</th>
                                                    <th>Meetings</th>
                                                    <th>Present</th>
                                                    <th>% vs avg</th>
                                                    <th>Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    attendance_by_age.map((age, index) =>
                                                        <tr>
                                                            <td>{age.age}</td>
                                                            <td>{age.members}</td>
                                                            <td>{age.meetings}</td>
                                                            <td>{age.present}</td>
                                                            <td><CardBar value={80} mark={70} /></td>
                                                            <td><CardSparkline data={[10, 0, 6, 8]} /></td>
                                                        </tr>
                                                    )
                                                }
                                            </tbody>
                                        </Table>


                                    </CardContent>
                                </DashboardCard>
                            </Col>
                        </Row>

                    </section>

                </div>
            </Container>
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                centered
                dark
            >
                <Modal.Header closeButton>
                    <h4>{lookup.help.find(h => h.metric === modalMetric).title}</h4>
                </Modal.Header>
                <Modal.Body>
                    
                    <p>{lookup.help.find(h => h.metric === modalMetric).body}</p>
                </Modal.Body>
               
            </Modal>
        </Fragment>
    );

}

export default Overview;

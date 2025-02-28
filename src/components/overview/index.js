import React, { Fragment, useEffect, useRef, useState } from "react";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";

import * as lookup from "../../data/lookup.json";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { DashboardCard, CardTitle, CardParty, CardSubtitle, CardContent, CardHelp } from "../dashboardcard";


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowUp,
    faArrowDown,
    faArrowLeft,
    faArrowRight,
    faChevronDown
} from "@fortawesome/free-solid-svg-icons";

import { Scrollbars } from "react-custom-scrollbars";

import Papa from "papaparse";

import LineChart from "../charts/LineChart";
import BubbleChart from "../charts/BubbleChart";
import StackedBarChart from "../charts/StackedBarChart";
import { SparklinesLine } from "@lueton/react-sparklines";

function Overview() {
    const attendance_data_csv = "/data/attendance.csv";
    const members_data_csv = "/data/members-parties.csv";
    const parties_data_csv = "/data/parties.csv";
    const committees_data_csv = "/data/committees.csv";

    const [attendanceData, setAttendanceData] = useState([]);
    const [membersData, setMembersData] = useState([]);
    const [partiesData, setPartiesData] = useState([]);
    const [committeesData, setCommitteesData] = useState([]);

    const [dateRange, setDateRange] = useState();
    const [historicalDateRange, setHistoricalDateRange] = useState();

    const [filteredData, setFilteredData] = useState([]);
    const [filteredData_allParties, setFilteredData_allParties] = useState([]);
    const [historicalData, setHistoricalData] = useState([]);
    const [historicalData_allParties, setHistoricalData_allParties] = useState([]);

    const [block_totalScheduledMeetings, setBlock_totalScheduledMeetings] = useState([
        {
            total: 0,
            by_date: [],
            data: [],
            per_day: 0,
            month_days: 0
        },
        {
            total: 0,
            by_date: [],
            data: [],
            per_day: 0,
            month_days: 0
        }
    ]);

    const [block_lengthOfMeeting, setBlock_lengthOfMeeting] = useState([
        {
            avg_actual: 0,
            avg_scheduled: 0,
            data_scheduled: []
        },
        {
            avg_actual: 0,
            avg_scheduled: 0,
            data_scheduled: []
        }
    ]);

    const [block_meetingsThatEndedLate, setBlock_meetingsThatEndedLate] = useState([
        {
            late_count: 0,
            data: []
        },
        {
            late_count: 0,
            data: []
        }
    ]);

    const [block_meetingsPerCommittee, setBlock_meetingsPerCommittee] = useState({
        avg: 0,
        avg_time: 0,
        committees: [],
        sparklineData: []
    });

    const [block_meetingsPerMember, setBlock_meetingsPerMember] = useState([
        {
            avg: 0,
            data: []
        },
        {
            avg: 0,
            data: []
        }
    ]);

    const [block_meetingsThatOverlapped, setBlock_meetingsThatOverlapped] = useState({
        avg: 0,
        counts: []
    });

    const [block_overallAttendance, setBlock_overallAttendance] = useState({
        data: [],
        title: ''
    });

    const [block_committeesWithBestAttendance, setBlock_committeesWithBestAttendance] = useState({
        committees: [],
        avg: 0
    });

    const [block_partiesWithBestAttendance, setBlock_partiesWithBestAttendance] = useState({
        parties: [],
        avg: 0
    });

    const [block_membersWithBestAttendance, setBlock_membersWithBestAttendance] = useState({
        members: [],
        avg: 0
    });

    const [block_AttendanceByGender, setBlock_AttendanceByGender] = useState({
        data: []
    });


    const [party, setParty] = useState("All");

    const [selectedMonth, setSelectedMonth] = useState(1);
    const [selectedYear, setSelectedYear] = useState(2025);

    const months = [
        { month: 1, name: "January" },
        { month: 2, name: "February" },
        { month: 3, name: "March" },
        { month: 4, name: "April" },
        { month: 5, name: "May" },
        { month: 6, name: "June" },
        { month: 7, name: "July" },
        { month: 8, name: "August" },
        { month: 9, name: "September" },
        { month: 10, name: "October" },
        { month: 11, name: "November" },
        { month: 12, name: "December" }
    ];

    const years = [
        2024, 2025
    ];

    const [showModal, setShowModal] = useState(false);
    const [modalMetric, setModalMetric] = useState("Representation in meetings");

    const dummyData = [
        { label: 'Attended', value: 2371, color: 'lightgreen' },
        { label: 'Arrived Late', value: 300, color: 'purple' },
        { label: 'Departed Early', value: 200, color: 'blue' },
        { label: 'Absent', value: 1251, color: 'salmon' },
    ];


    // Sub Components //////////////////

    function PartyPill(props) {

        return <div className={`party-pill ${props.party == 'All' && 'all-parties'}`}>{props.children}</div>;
    }

    function Badge(props) {

        if (props.party) {

            let pic = props.pic;

            if (props.pic == 'Al Jama-ah') {
                pic = 'ALJ';
            } else if (props.pic == 'RISE Mzansi') {
                pic = 'RISE';
            } else if (props.pic == 'Action SA') {
                pic = 'ASA';
            }

            return <div className="party_member_badge" style={{ backgroundImage: `url(../assets/party-logos/${pic}.png)` }}></div>;
        }

        return <div className="party_member_badge" style={{ backgroundImage: `url(https://static.pmg.org.za/${props.pic})` }}></div>;
    }

    function CardHelp(props) {



        return (

            <OverlayTrigger placement="top" delay={{ show: 250, hide: 400 }}
                overlay={<Tooltip>
                    {
                        lookup.help.find(h => h.metric === props.metric) ? lookup.help.find(h => h.metric === props.metric).body : "No description available"
                    }
                </Tooltip>}
            >
                <div className="card-help">
                    <div className="question">?</div>
                </div>
            </OverlayTrigger>

        )
    }

    function CardBar(props) {
        return (
            <div className="card-bar">
                <div className="card-bar-fill" style={{ width: `${parseFloat(props.value)}%` }}></div>
                <div className="card-bar-mark" style={{ left: `${parseFloat(props.avg)}%` }}></div>
            </div>
        );
    }

    function CardSparkline(props) {


        let sparklineData = [];

        sparklineData = props.data.map(d => parseFloat(d.avg));


        // return 'hi';

        return <SparklinesLine
            stroke="#999"
            fill="none"
            data={sparklineData.length > 0 ? sparklineData : [0]}
            height={20}
            width={40}

        />
    }

    // Functions //////////////////

    function toggleModal(show, metric = "") {
        setModalMetric(metric);
        setShowModal(show);
    }

    function loadData(csv_set) {
        fetch(csv_set)
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                        if (csv_set === attendance_data_csv) {
                            setAttendanceData(result.data);
                        } else if (csv_set === members_data_csv) {
                            setMembersData(result.data);
                        } else if (csv_set === parties_data_csv) {
                            setPartiesData(result.data);
                        } else if (csv_set === committees_data_csv) {
                            setCommitteesData(result.data);
                        }
                    },
                });
            })
    }

    function getMemberCount() {
        if (party === "All") {
            return membersData.length;
        } else {
            return membersData.filter(member => member.party_id === party).length;
        }
    }

    function filterData() {

        let filteredData_Calc;

        // filter by selected month and year
        filteredData_Calc = attendanceData.filter(attendance => {
            let [day, month, year] = attendance.event_date.split('-');
            return parseInt(month, 10) === selectedMonth && parseInt(year, 10) === selectedYear;
        });

        setFilteredData_allParties(filteredData_Calc);

        if (party === "All") {
            setFilteredData(filteredData_Calc);
        } else {
            let partyMembers = membersData.filter(member => member.party_id === party);
            let partyMemberIds = partyMembers.map(member => member.id);
            filteredData_Calc = filteredData_Calc.filter(attendance => partyMemberIds.includes(attendance.member_id));
            setFilteredData(filteredData_Calc);
        }


    }

    function filterHistoricalData() {

        if (!historicalDateRange) {
            return;
        }

        let historical_earliest_month = parseInt(historicalDateRange.earliest.split('-')[0], 10);
        let historical_earliest_year = parseInt(historicalDateRange.earliest.split('-')[1], 10);
        let historical_latest_month = parseInt(historicalDateRange.latest.split('-')[0], 10);
        let historical_latest_year = parseInt(historicalDateRange.latest.split('-')[1], 10);

        let filteredData_Calc;

        // filter by historical date range
        filteredData_Calc = attendanceData.filter(attendance => {
            let [day, month, year] = attendance.event_date.split('-');
            return (parseInt(month, 10) >= historical_earliest_month && parseInt(year, 10) >= historical_earliest_year) && (parseInt(month, 10) <= historical_latest_month && parseInt(year, 10) <= historical_latest_year);
        });

        setHistoricalData_allParties(filteredData_Calc);

        if (party === "All") {
            setHistoricalData(filteredData_Calc);
        } else {
            let partyMembers = membersData.filter(member => member.party_id === party);
            let partyMemberIds = partyMembers.map(member => member.id);
            filteredData_Calc = filteredData_Calc.filter(attendance => partyMemberIds.includes(attendance.member_id));
            setHistoricalData(filteredData_Calc);
        }

    }

    function changeMonth(month) {
        let minYear = parseInt(dateRange.earliest.split('-')[1], 10);
        let minMonth = parseInt(dateRange.earliest.split('-')[0], 10);
        let maxYear = parseInt(dateRange.latest.split('-')[1], 10);
        let maxMonth = parseInt(dateRange.latest.split('-')[0], 10);
        let currentYear = parseInt(selectedYear, 10);
        let newMonth = month;

        // Prevent going below the earliest limit
        if (currentYear === minYear && newMonth < minMonth) {
            return;
        }

        // Prevent going beyond the latest limit
        if (currentYear === maxYear && newMonth > maxMonth) {
            return;
        }

        // Handle month underflow and overflow
        if (newMonth < 1) {
            newMonth = 12;
            currentYear -= 1;
        } else if (newMonth > 12) {
            newMonth = 1;
            currentYear += 1;
        }

        setSelectedMonth(newMonth);
        setSelectedYear(currentYear);
    }

    function changeYear(year) {
        let minYear = parseInt(dateRange.earliest.split('-')[1], 10);
        let minMonth = parseInt(dateRange.earliest.split('-')[0], 10);
        let maxYear = parseInt(dateRange.latest.split('-')[1], 10);
        let maxMonth = parseInt(dateRange.latest.split('-')[0], 10);
        let newYear = parseInt(year, 10);
        let newMonth = selectedMonth;


        if (newYear === minYear && newMonth < minMonth) {
            newMonth = minMonth;
        }


        if (newYear === maxYear && newMonth > maxMonth) {
            newMonth = maxMonth;
        }

        setSelectedYear(newYear);
        setSelectedMonth(newMonth);
    }

    function calc_dateRange() {
        if (attendanceData.length === 0) {
            return;
        }

        const parseDate = (dateStr) => {
            let [day, month, year] = dateStr.split('-');
            return new Date(`${year}-${month}-${day}`);
        };

        let earliest = parseDate(attendanceData[0].event_date);
        let latest = parseDate(attendanceData[0].event_date);

        attendanceData.forEach(attendance => {
            let date = parseDate(attendance.event_date);
            if (date < earliest) {
                earliest = date;
            }
            if (date > latest) {
                latest = date;
            }
        });



        earliest = `${earliest.getMonth() + 1}-${earliest.getFullYear()}`;
        latest = `${latest.getMonth() + 1}-${latest.getFullYear()}`;

        setDateRange({ earliest, latest });
    }

    function calc_historical_dateRange() {

        if (!dateRange) {
            return;
        }

        let [earliestMonth, earliestYear] = dateRange.earliest.split('-').map(Number);

        let selectedDate = new Date(selectedYear, selectedMonth - 1, 1);

        let historicalStart = new Date(selectedDate);
        historicalStart.setMonth(historicalStart.getMonth() - 6);

        let earliestAvailable = new Date(earliestYear, earliestMonth - 1, 1);
        if (historicalStart < earliestAvailable) {
            historicalStart = earliestAvailable;
        }

        let formattedHistoricalStart = `${historicalStart.getMonth() + 1}-${historicalStart.getFullYear()}`;

        setHistoricalDateRange({ earliest: formattedHistoricalStart, latest: selectedMonth + "-" + selectedYear });

    }

    function groupMeetings(data) {

        let groupedMeetings = {};

        data.forEach(attendance => {
            let { meeting_id, event_date, committee_id, actual_end_time, actual_start_time, scheduled_end_time, scheduled_start_time, actual_length, scheduled_length, member_id, alternate, attendance: status } = attendance;

            if (!groupedMeetings[meeting_id]) {

                groupedMeetings[meeting_id] = {
                    meeting_id,
                    event_date,
                    committee_id,
                    actual_end_time,
                    actual_start_time,
                    scheduled_end_time,
                    scheduled_start_time,
                    actual_length,
                    scheduled_length,
                    attendance: []
                };
            }

            groupedMeetings[meeting_id].attendance.push({
                member_id,
                alternate,
                attendance: status
            });
        });

        return Object.values(groupedMeetings);
    }

    function groupByDate(data) {
        let grouped_meetings = groupMeetings(data);
        let grouped_by_date = {};

        grouped_meetings.forEach(meeting => {
            let { event_date } = meeting;
            if (!grouped_by_date[event_date]) {
                grouped_by_date[event_date] = [];
            }
            grouped_by_date[event_date].push(meeting);
        });

        return grouped_by_date;
    }

    function calc_scheduled_meetings(data) {
        let period_array = [];

        for (let i = 1; i <= new Date(selectedYear, selectedMonth, 0).getDate(); i++) {
            let new_date = `${selectedMonth}/${i}/${selectedYear}`;
            period_array.push({
                date: new_date,
                x: i,
                y: 0
            });
        }

        let groupedByDate = groupByDate(data);

        Object.keys(groupedByDate).forEach(date => {
            let corrected_date = date.split('-');
            let new_date = `${corrected_date[1]}/${corrected_date[0]}/${corrected_date[2]}`;

            let index = period_array.findIndex(item => item.date === new_date);

            if (index >= 0) {
                period_array[index].y = groupedByDate[date].length;
            }
        });

        let grouped_meetings = groupMeetings(data);
        let days_in_period = new Date(selectedYear, selectedMonth, 0).getDate();

        return {
            total: grouped_meetings.length,
            by_date: groupedByDate,
            data: period_array.length > 0 ? period_array : [],
            per_day: parseFloat(grouped_meetings.length / days_in_period).toFixed(2),
            month_days: days_in_period
        };
    }

    function calc_meetings_per_member(data) {
        let grouped_meetings = data.reduce((acc, meeting) => {
            const { member_id } = meeting;
            if (!acc[member_id]) {
                acc[member_id] = { member_id, count: 0 };
            }
            acc[member_id].count += 1;
            return acc;
        }, {});

        // Structure into the bubble chart format
        let countMap = Object.values(grouped_meetings).reduce((acc, { member_id, count }) => {
            if (!acc[count]) {
                acc[count] = { x: count, y: 5, size: 0, members: [] };
            }
            acc[count].size += 1;
            acc[count].members.push(member_id);
            return acc;
        }, {});

        let result = Object.values(countMap);

        let avgMeetings = result.length > 0 ? result.reduce((sum, r) => sum + r.x, 0) / result.length : 0;

        return {
            avg: avgMeetings,
            data: result
        };
    }

    function calc_length_of_meeting(data) {
        let grouped_meetings = groupMeetings(data);
        let total_meetings = grouped_meetings.length;
    
        let total_meetings_actual_length = 0;
        let total_meetings_scheduled_length = 0;
    
        let chart_data = {
            actual: [],
            scheduled: []
        };
    
       
        function binValue(value) {
            return Math.round(value / 30) * 30; 
        }
    
        grouped_meetings.forEach(meeting => {
            let length_actual = parseFloat(meeting.actual_length);
            let length_scheduled = parseFloat(meeting.scheduled_length);
    
            if (isNaN(length_actual) || length_actual < 0) length_actual = 0;
            if (isNaN(length_scheduled) || length_scheduled < 0) length_scheduled = 0;
    
            total_meetings_actual_length += length_actual;
            total_meetings_scheduled_length += length_scheduled;
    
            function updateChartData(array, value) {
                let binnedValue = binValue(value);
                let entry = array.find(d => d.x === binnedValue);
                if (entry) {
                    entry.size += 1;
                } else {
                    array.push({ x: binnedValue, y: 5, size: 1 });
                }
            }
    
            updateChartData(chart_data.actual, length_actual);
            updateChartData(chart_data.scheduled, length_scheduled);
        });
    
        return {
            avg_actual: total_meetings > 0 ? parseInt(total_meetings_actual_length / total_meetings) : 0,
            avg_scheduled: total_meetings > 0 ? parseInt(total_meetings_scheduled_length / total_meetings) : 0,
            data_actual: chart_data.actual,
            data_scheduled: chart_data.scheduled
        };
    }

    function calc_meetings_that_ended_late(data) {
        // Group meetings by unique meeting_id
        let grouped_meetings = groupMeetings(data);
    
        // Helper function to bin values into 30-minute intervals
        function binValue(value) {
            return Math.round(value / 30) * 30; // Round to nearest multiple of 30 minutes (can be negative)
        }
    
        // Store binned results
        let lateMeetingsMap = new Map();
        let late_count = 0; // Initialize late count
    
        grouped_meetings.forEach(meeting => {
            let actual_length = parseFloat(meeting.actual_length) || 0;
            let scheduled_length = parseFloat(meeting.scheduled_length) || 0;
            
            let diff = actual_length - scheduled_length; // Can be negative if the meeting ended early
    
            if (diff > 0) late_count++; // Only count meetings that ended late
    
            let binnedValue = binValue(diff);
    
            if (lateMeetingsMap.has(binnedValue)) {
                lateMeetingsMap.get(binnedValue).size += 1; // Count more meetings in this bin
            } else {
                lateMeetingsMap.set(binnedValue, { x: binnedValue, y: 5, size: 1 });
            }
        });
    
        return {
            data: Array.from(lateMeetingsMap.values()), // Convert Map to Array for BubbleChart
            late_count 
        };
    }
    
    
    


    // Block Calculations //////////////////

    function block_total_scheduled_meetings() {
        const result = [
            calc_scheduled_meetings(filteredData),
            calc_scheduled_meetings(filteredData_allParties)
        ];



        setBlock_totalScheduledMeetings(result);
    }

    function block_length_of_meeting() {
        const result = [
            calc_length_of_meeting(filteredData),
            calc_length_of_meeting(filteredData_allParties)
        ];

        setBlock_lengthOfMeeting(result);
    }

    function block_meetings_per_member() {
        const result = [
            calc_meetings_per_member(filteredData),
            calc_meetings_per_member(filteredData_allParties)
        ];

        setBlock_meetingsPerMember(result);
    }

    function block_meetings_that_ended_late() {
        const result = [
            calc_meetings_that_ended_late(filteredData),
            calc_meetings_that_ended_late(filteredData_allParties)
        ];

        console.log(result);

        setBlock_meetingsThatEndedLate(result);
    }

    function block_meetings_per_committee() {
        let grouped_meetings = groupMeetings(filteredData);
        let meetings_committee = {};

        grouped_meetings.forEach(meeting => {
            let { committee_id, actual_length } = meeting;
            if (!meetings_committee[committee_id]) {
                meetings_committee[committee_id] = {
                    committee: committee_id,
                    meetings: [],
                    count: 0,
                    total_time: 0
                };
            }
            meetings_committee[committee_id].meetings.push(meeting);
            meetings_committee[committee_id].count += 1;
            meetings_committee[committee_id].total_time += parseFloat(actual_length) || 0;
        });

        let committees = Object.values(meetings_committee);
        let total_meetings = committees.reduce((sum, c) => sum + c.count, 0);
        let avg = committees.length > 0 ? total_meetings / committees.length : 0;
        let avg_time = committees.length > 0 ? committees.reduce((sum, c) => sum + c.total_time, 0) / committees.length : 0;

        // Calculate historical averages for sparkline
        let historicalAverages = {};

        let historical_grouped_meetings = groupMeetings(historicalData);

        historical_grouped_meetings.forEach(meeting => {
            let [day, month, year] = meeting.event_date.split('-').map(Number);
            let key = `${year}-${month}`;

            if (!historicalAverages[key]) {
                historicalAverages[key] = { count: 0, committees: new Set() };
            }

            historicalAverages[key].count += 1;
            historicalAverages[key].committees.add(meeting.committee_id);
        });

        let sparklineData = Object.keys(historicalAverages).map(key => {
            let { count, committees } = historicalAverages[key];
            let avgPerCommittee = committees.size > 0 ? count / committees.size : 0;
            return { date: key, avg: avgPerCommittee };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        setBlock_meetingsPerCommittee({
            avg,
            avg_time,
            committees,
            sparklineData
        });

    }

    function block_meetings_that_overlapped() {
        let grouped_meetings = groupMeetings(filteredData);
        let seen_pairs = new Set();
        let unique_overlapping_meetings = new Set();

        grouped_meetings.forEach((meeting, i) => {
            let { event_date, scheduled_start_time, scheduled_end_time, meeting_id } = meeting;
            let formatted_date = event_date.split('-').reverse().join('-');
            let start_time = new Date(`${formatted_date} ${scheduled_start_time}`);
            let end_time = new Date(`${formatted_date} ${scheduled_end_time}`);

            grouped_meetings.forEach((other_meeting, j) => {
                if (i === j) return; // Skip self-comparison

                let { event_date: other_date, scheduled_start_time: other_start_time, scheduled_end_time: other_end_time, meeting_id: other_id } = other_meeting;
                let other_formatted_date = other_date.split('-').reverse().join('-');
                let other_start = new Date(`${other_formatted_date} ${other_start_time}`);
                let other_end = new Date(`${other_formatted_date} ${other_end_time}`);

                let pair_key = [meeting_id, other_id].sort().join('-'); // Ensure unique pair tracking

                if (start_time < other_end && end_time > other_start && !seen_pairs.has(pair_key)) {
                    seen_pairs.add(pair_key); // Mark pair as counted
                    unique_overlapping_meetings.add(meeting_id);
                    unique_overlapping_meetings.add(other_id);
                }
            });
        });

        let overlap_counts = {};

        unique_overlapping_meetings.forEach(meeting_id => {
            let meeting = grouped_meetings.find(m => m.meeting_id === meeting_id);
            let { committee_id } = meeting;
            if (!overlap_counts[committee_id]) {
                overlap_counts[committee_id] = 0;
            }
            overlap_counts[committee_id] += 1;
        });

        let overlap_array = Object.keys(overlap_counts).map(committee => {
            return {
                committee: committee,
                count: overlap_counts[committee]
            };
        }).sort((a, b) => b.count - a.count);

        setBlock_meetingsThatOverlapped({
            count: unique_overlapping_meetings.size, // Correct count of unique meetings that overlapped
            counts: overlap_array
        });
    }

    function block_overall_attendance() {

        let grouped_attendance = [
            {
                P: 0,
                U: 0,
                A: 0,
                AP: 0,
                DE: 0,
                L: 0,
                LDE: 0
            },
            {
                P: 0,
                U: 0,
                A: 0,
                AP: 0,
                DE: 0,
                L: 0,
                LDE: 0
            }
        ];

        filteredData.forEach(attendance => {
            let { attendance: status } = attendance;

            grouped_attendance[0][status] += 1;
        });

        filteredData_allParties.forEach(attendance => {
            let { attendance: status } = attendance;

            grouped_attendance[1][status] += 1;
        });

        let total = grouped_attendance[0].P + grouped_attendance[0].U + grouped_attendance[0].A + grouped_attendance[0].AP + grouped_attendance[0].DE + grouped_attendance[0].L + grouped_attendance[0].LDE;
        let present_percentage = parseFloat(((grouped_attendance[0].P + grouped_attendance[0].L + grouped_attendance[0].DE + grouped_attendance[0].LDE) / total) * 100).toFixed(2);

        setBlock_overallAttendance({
            avg: present_percentage,
            data: grouped_attendance
        })
    }

    function block_committees_with_best_attendance() {
        let grouped_meetings = groupMeetings(filteredData);

        let attendance_present = ['P', 'DE', 'L', 'LDE'];

        grouped_meetings.forEach(meeting => {
            meeting.attendance_count = 0;
            meeting.absent_count = 0;

            let { attendance } = meeting;
            attendance.forEach(member => {
                if (attendance_present.includes(member.attendance)) {
                    meeting.attendance_count += 1;
                } else {
                    meeting.absent_count += 1;
                }
            });
        });

        let committees = {};
        grouped_meetings.forEach(meeting => {
            let { committee_id, attendance_count, absent_count } = meeting;
            if (!committees[committee_id]) {
                committees[committee_id] = {
                    committee: committee_id,
                    meetings: 0,
                    attended: 0,
                    absent: 0,
                    percentage: 0
                };
            }
            committees[committee_id].attended += attendance_count;
            committees[committee_id].absent += absent_count;
            committees[committee_id].meetings += 1;
            committees[committee_id].percentage = parseFloat((committees[committee_id].attended / (committees[committee_id].attended + committees[committee_id].absent)) * 100).toFixed(2);
        });

        committees = Object.values(committees);


        let avg = committees.reduce((sum, c) => sum + parseFloat(c.percentage), 0) / committees.length;
        avg = parseFloat(avg.toFixed(2));

        setBlock_committeesWithBestAttendance({
            committees: committees,
            avg: avg
        });

    }

    function block_parties_with_best_attendance() {

        let grouped_attendance_parties = {};

        filteredData_allParties.forEach(attendance => {
            let { party_id, attendance: status } = attendance;

            if (!grouped_attendance_parties[party_id]) {

                grouped_attendance_parties[party_id] = {
                    meetings: [],
                    attended: 0,
                    absent: 0,
                };
            }

            if (status === 'P' || status === 'DE' || status === 'L' || status === 'LDE') {
                grouped_attendance_parties[party_id].attended += 1;
            } else {
                grouped_attendance_parties[party_id].absent += 1;
            }

            if (!grouped_attendance_parties[party_id].meetings.includes(attendance.meeting_id)) {
                grouped_attendance_parties[party_id].meetings.push(attendance.meeting_id);
            }
        });

        Object.keys(grouped_attendance_parties).forEach(party => {
            let { attended, absent } = grouped_attendance_parties[party];
            let total = attended + absent;
            let percentage = parseFloat(attended / total * 100).toFixed(2);
            grouped_attendance_parties[party].percentage = parseInt(percentage);
        });

        // convert to array with party_id
        let parties = Object.keys(grouped_attendance_parties).map(party => {
            return {
                party,
                ...grouped_attendance_parties[party]
            }
        });

        let avg = parties.length > 0 ? parseFloat((parties.reduce((sum, p) => sum + p.percentage, 0) / parties.length).toFixed(2)) : 0;

        setBlock_partiesWithBestAttendance({
            parties: parties,
            avg: avg
        })


    }

    function block_members_with_best_attendance() {
        let grouped_attendance_members = {};

        filteredData.forEach(attendance => {
            let { member_id, attendance: status } = attendance;

            if (!grouped_attendance_members[member_id]) {
                grouped_attendance_members[member_id] = {
                    meetings: [],
                    attended: 0,
                    absent: 0,
                    percentage: 0
                };
            }

            if (['P', 'DE', 'L', 'LDE'].includes(status)) {
                grouped_attendance_members[member_id].attended += 1;
            } else {
                grouped_attendance_members[member_id].absent += 1;
            }

            if (!grouped_attendance_members[member_id].meetings.includes(attendance.meeting_id)) {
                grouped_attendance_members[member_id].meetings.push(attendance.meeting_id);
            }
        });

        Object.keys(grouped_attendance_members).forEach(member => {
            let { attended, absent } = grouped_attendance_members[member];
            let total = attended + absent;
            let percentage = total > 0 ? parseFloat((attended / total) * 100).toFixed(2) : 0;
            grouped_attendance_members[member].percentage = parseFloat(percentage);
        });

        // Convert to array with member_id
        let members = Object.keys(grouped_attendance_members).map(member => {
            return {
                member,
                ...grouped_attendance_members[member]
            };
        });

        // Compute the average attendance percentage across all members
        let avg = members.length > 0
            ? parseFloat((members.reduce((sum, m) => sum + m.percentage, 0) / members.length).toFixed(2))
            : 0;

        setBlock_membersWithBestAttendance({
            members: members,
            avg: avg
        });

    }

    function block_attendance_by_gender() {
        let attendance_by_gender = {
            male: [],
            female: []
        };

        let grouped_attendance_members = {};

        filteredData.forEach(attendance => {
            let { member_id, attendance: status, meeting_id } = attendance;

            if (!grouped_attendance_members[member_id]) {
                grouped_attendance_members[member_id] = {
                    member_id: member_id,
                    meetings: new Set(),
                    attended: 0,
                    absent: 0,
                    percentage: 0,
                    gender: membersData.find(m => m.id === member_id)?.gender || "unknown"
                };
            }

            if (['P', 'DE', 'L', 'LDE'].includes(status)) {
                grouped_attendance_members[member_id].attended += 1;
            } else {
                grouped_attendance_members[member_id].absent += 1;
            }

            grouped_attendance_members[member_id].meetings.add(meeting_id);
        });

        let maleTotal = 0, maleCount = 0, femaleTotal = 0, femaleCount = 0;

        Object.keys(grouped_attendance_members).forEach(member => {
            let { attended, absent, gender } = grouped_attendance_members[member];
            let total = attended + absent;
            let percentage = total > 0 ? parseFloat((attended / total) * 100).toFixed(2) : 0;
            grouped_attendance_members[member].percentage = parseFloat(percentage);

            if (gender === "male") {
                attendance_by_gender.male.push(grouped_attendance_members[member]);
                maleTotal += grouped_attendance_members[member].percentage;
                maleCount++;
            } else if (gender === "female") {
                attendance_by_gender.female.push(grouped_attendance_members[member]);
                femaleTotal += grouped_attendance_members[member].percentage;
                femaleCount++;
            }
        });

        let maleAvg = maleCount > 0 ? parseFloat((maleTotal / maleCount).toFixed(2)) : 0;
        let femaleAvg = femaleCount > 0 ? parseFloat((femaleTotal / femaleCount).toFixed(2)) : 0;

        setBlock_AttendanceByGender({
            male: maleAvg,
            female: femaleAvg
        });
    }

    // UseEffects //////////////////

    useEffect(() => {
        loadData(attendance_data_csv);
        loadData(members_data_csv);
        loadData(parties_data_csv);
        loadData(committees_data_csv);
    }, []);

    useEffect(() => {
        calc_dateRange();
    }, [attendanceData]);

    useEffect(() => {
        filterData();
        calc_historical_dateRange();

    }, [dateRange, party, selectedMonth, selectedYear]);

    useEffect(() => {
        block_total_scheduled_meetings();
        block_length_of_meeting();
        block_meetings_that_ended_late();
        block_meetings_per_committee();
        block_meetings_that_overlapped();
        block_meetings_per_member();
        block_overall_attendance();
        block_committees_with_best_attendance();
        block_parties_with_best_attendance();
        block_members_with_best_attendance();
        block_attendance_by_gender();
    }, [filteredData])

    useEffect(() => {
        filterHistoricalData();
    }, [historicalDateRange]);

    useEffect(() => {
        console.log(historicalData);
    }, [historicalData]);

    return (
        <Fragment>
            <PMHeader />
            <PMTabs active="overview" />

            <Container fluid className="pt-4">
                <div className="overview-container">
                    <Row>
                        <Col>
                            <h1>Parliamentary overview</h1>
                        </Col>
                    </Row>
                </div>
            </Container>

            <Container fluid className="dashboard-nav mt-3 py-2">
                <div className="overview-container">

                    <Row className="justify-content-between">
                        <Col>
                            <a href="#scheduling" className="nav-button">Scheduling</a>
                            <a href="#attendance" className="nav-button">Attendance</a>
                        </Col>
                        <Col>
                            <Row className="justify-content-end">
                                <Col xs="auto" className="d-flex align-items-center"><span className="form-label">Party:</span></Col>
                                <Col xs="auto">
                                    <Dropdown className="dropdown-select">
                                        <Dropdown.Toggle>
                                            <Row>
                                                <Col><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></Col>
                                                <Col>({getMemberCount()} members)</Col>
                                                <Col xs="auto">
                                                    <FontAwesomeIcon icon={faChevronDown} />
                                                </Col>
                                            </Row>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => setParty("All")}>All parties</Dropdown.Item>
                                            {partiesData.map(
                                                (party, index) => {
                                                    return (
                                                        <Dropdown.Item key={index} onClick={() => setParty(party.id)}>
                                                            {party.party}
                                                        </Dropdown.Item>
                                                    );
                                                }
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>
                                <Col xs="auto" className="d-flex align-items-center justify-content-end text-nowrap"><span className="form-label">Time Period:</span></Col>
                                <Col xs="auto">
                                    <Dropdown className="dropdown-select">
                                        <Dropdown.Toggle>
                                            <Row>
                                                <Col>{selectedYear}</Col>
                                                <Col xs="auto">
                                                    <FontAwesomeIcon icon={faChevronDown} />
                                                </Col>
                                            </Row>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {years.map(
                                                (year, index) => {
                                                    return (
                                                        <Dropdown.Item key={index} onClick={() => changeYear(year)}>
                                                            {year}
                                                        </Dropdown.Item>
                                                    );
                                                }
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>
                                <Col md="auto">
                                    <Dropdown className="dropdown-select">
                                        <Dropdown.Toggle>
                                            <Row>
                                                <Col>{months.find(m => m.month === selectedMonth).name}</Col>
                                                <Col xs="auto">
                                                    <FontAwesomeIcon icon={faChevronDown} />
                                                </Col>
                                            </Row>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {months.map(
                                                (month, index) => {
                                                    return (
                                                        <Dropdown.Item key={index} onClick={() => changeMonth(month.month)}>
                                                            {month.name}
                                                        </Dropdown.Item>
                                                    );
                                                }
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>
                                <Col md="auto">
                                    <div className="nav-button-direction" onClick={() => changeMonth(selectedMonth - 1)}>
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                    </div>
                                    <div className="nav-button-direction" onClick={() => changeMonth(selectedMonth + 1)}>
                                        <FontAwesomeIcon icon={faArrowRight} />
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </div>
            </Container>

            <Container fluid className="py-4">
                <div className="overview-container">
                    <section className="section-header mt-4" id="scheduling">
                        <Row>
                            <Col>
                                <div className="header-img-container">
                                    <div className="header-img" style={{ backgroundImage: "url('../assets/scheduling.jpeg')" }}></div>
                                    <h2>Scheduling of committee meetings</h2>
                                </div>
                            </Col>
                            <Col className="d-flex align-items-center">
                                <div className="section-intro">These metrics look at parliaments published schedule to get a sense for how much is being asked of parliamentarians. If parliament is not scheduling effectively, the job of an MP may become more difficult.</div>
                            </Col>
                        </Row>
                    </section>

                    <section className="scheduling mt-4">
                        <Row>
                            <Col>
                                <DashboardCard>
                                    <CardTitle>Total scheduled meetings</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>
                                        <Row className="justify-content-between">
                                            <Col>
                                                <span className="card-big-text">{block_totalScheduledMeetings[0]?.total}</span>
                                                <span className="card-subtext">{block_totalScheduledMeetings[0]?.per_day} per day</span>
                                            </Col>
                                            <Col xs="auto" className="d-flex align-items-center">
                                                <div className="card-badge">20% vs longterm avg</div>
                                            </Col>
                                        </Row>
                                    </CardSubtitle>
                                    <CardContent>
                                        <div className="seperator my-3"></div>
                                        <h4 className="mb-3">Distribution of meetings throughout the period</h4>
                                        <CardHelp metric="totalScheduledMeetings" />
                                        {
                                            party === "All" ?
                                                <LineChart data={block_totalScheduledMeetings[0].data} width={400} height={150} referenceY={block_totalScheduledMeetings[0].per_day} />
                                                :
                                                <LineChart data={block_totalScheduledMeetings[1].data} width={400} height={150} referenceY={block_totalScheduledMeetings[0].per_day} data2={block_totalScheduledMeetings[0].data} party={partiesData.find(p => p.id === party)?.party} />
                                        }
                                        <div className="chart-legend mt-4">
                                            { 
                                                party != "All" && (
                                                    <div className="legend-item">
                                                        <div className="legend-color" style={{ borderColor: '#fb9905' }}></div>
                                                        <div className="legend-label">{partiesData.find(p => p.id === party)?.party}</div>
                                                    </div>
                                                )
                                            }
                                            <div className="legend-item">
                                                <div className="legend-color" style={{ borderColor: '#000' }}></div>
                                                <div className="legend-label">All Parties</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>
                            <Col>
                                <DashboardCard>

                                    <CardTitle>Avg. meetings per member</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>
                                        <Row className="justify-content-between">
                                            <Col>
                                                <span className="card-big-text">{parseInt(block_meetingsPerMember[0].avg)}</span>
                                            </Col>
                                            <Col xs="auto" className="d-flex align-items-center">
                                                <div className="card-badge">20% vs longterm</div>
                                            </Col>
                                        </Row>

                                    </CardSubtitle>
                                    <CardContent>
                                        <div className="seperator my-3"></div>
                                        <h4 className="mb-3">Meeting count for members</h4>
                                        <CardHelp metric="meetingsPerMember" />
                                        {
                                            party === "All" ? (
                                                <BubbleChart
                                                    data={block_meetingsPerMember[0].data}
                                                    width={400}
                                                    height={150}
                                                    xType="count"
                                                />
                                            ) : (
                                                <BubbleChart
                                                    data={block_meetingsPerMember[1].data}
                                                    data2={block_meetingsPerMember[0].data}
                                                    width={400}
                                                    height={150}
                                                    party={partiesData.find(p => p.id === party)?.party}
                                                    xType="count"
                                                />
                                            )
                                        }
                                        <div className="chart-legend mt-4">
                                            { 
                                                party != "All" && (
                                                    <div className="legend-item">
                                                        <div className="legend-color legend-circle" style={{ borderColor: '#000', backgroundColor: '#fb9905' }}></div>
                                                        <div className="legend-label">{partiesData.find(p => p.id === party)?.party}</div>
                                                    </div>
                                                )
                                            }
                                            <div className="legend-item">
                                                <div className="legend-color legend-circle" style={{ borderColor: '#000', backgroundColor: '#fff' }}></div>
                                                <div className="legend-label">All Parties</div>
                                            </div>
                                        </div>


                                    </CardContent>
                                </DashboardCard>
                            </Col>
                            <Col>
                                <DashboardCard>

                                    <CardTitle>Avg. length of a single meeting</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>
                                        <Row className="justify-content-between">
                                            <Col>
                                                <span className="card-big-text">
                                                    {parseInt(block_lengthOfMeeting[0].avg_scheduled / 60)}h {block_lengthOfMeeting[0].avg_scheduled % 60}m</span>
                                            </Col>
                                            <Col xs="auto" className="d-flex align-items-center">
                                                <div className="card-badge">20% vs longterm</div>
                                            </Col>
                                        </Row>

                                    </CardSubtitle>
                                    <CardContent>
                                        <div className="seperator my-3"></div>
                                        <h4 className="mb-3">Meeting lengths</h4>
                                        <CardHelp metric="lengthOfMeeting"></CardHelp>

                                        {
                                            party === "All" ? (
                                                <BubbleChart
                                                    data={block_lengthOfMeeting[0].data_scheduled}
                                                    xType="time"
                                                />
                                            ) : (
                                                <BubbleChart
                                                    data={block_lengthOfMeeting[1].data_scheduled}
                                                    data2={block_lengthOfMeeting[0].data_scheduled}
                                                    xType="time"
                                                    party={partiesData.find(p => p.id === party)?.party}
                                                />
                                            )
                                        }
                                        <div className="chart-legend mt-4">
                                            { 
                                                party != "All" && (
                                                    <div className="legend-item">
                                                        <div className="legend-color legend-circle" style={{ borderColor: '#000', backgroundColor: '#fb9905' }}></div>
                                                        <div className="legend-label">{partiesData.find(p => p.id === party)?.party}</div>
                                                    </div>
                                                )
                                            }
                                            <div className="legend-item">
                                                <div className="legend-color legend-circle" style={{ borderColor: '#000', backgroundColor: '#fff' }}></div>
                                                <div className="legend-label">All Parties</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>

                            <Col>
                                <DashboardCard>

                                    <CardTitle>Number of meetings that ended late</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>
                                        <Row className="justify-content-between">
                                            <Col>
                                                <span className="card-big-text">{block_meetingsThatEndedLate[0]?.late_count}</span>
                                            </Col>
                                            <Col xs="auto" className="d-flex align-items-center">
                                                <div className="card-badge">20% vs longterm</div>
                                            </Col>
                                        </Row>
                                        
                                    </CardSubtitle>
                                    <CardContent>
                                        <div className="seperator my-3"></div>
                                        <h4 className="mb-3">All meetings durations</h4>
                                        <CardHelp metric="meetingsThatEndedLate" />
                                        {
                                            party === "All" ? (
                                                <BubbleChart
                                                    data={block_meetingsThatEndedLate[0]?.data || []}
                                                    xType="late"
                                                />
                                            ) : (
                                                <BubbleChart
                                                    data={block_meetingsThatEndedLate[1]?.data || []}
                                                    data2={block_meetingsThatEndedLate[0]?.data || []}
                                                    xType="late"
                                                    party={partiesData.find(p => p.id === party)?.party}
                                                />
                                            )
                                        }
                                        <div className="chart-legend mt-4">
                                            { 
                                                party != "All" && (
                                                    <div className="legend-item">
                                                        <div className="legend-color legend-circle" style={{ borderColor: '#000', backgroundColor: '#fb9905' }}></div>
                                                        <div className="legend-label">{partiesData.find(p => p.id === party)?.party}</div>
                                                    </div>
                                                )
                                            }
                                            <div className="legend-item">
                                                <div className="legend-color legend-circle" style={{ borderColor: '#000', backgroundColor: '#fff' }}></div>
                                                <div className="legend-label">All Parties</div>
                                            </div>
                                        </div>

                                    </CardContent>
                                </DashboardCard>

                            </Col>


                        </Row>
                        <Row className="mt-4">

                            <Col>
                                <DashboardCard>
                                    <CardTitle>Meetings per committee</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>
                                        <Row>
                                            <Col><span className="card-big-text">{parseInt(block_meetingsPerCommittee.avg)}</span></Col>
                                            <Col xs="auto">
                                                <CardSparkline data={block_meetingsPerCommittee.sparklineData} />
                                            </Col>
                                        </Row>
                                    </CardSubtitle>
                                    <CardContent>
                                        <CardHelp metric="meetingsPerCommittee"></CardHelp>
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Committee</th>
                                                            <th>Meetings</th>
                                                            <th>Total time</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            block_meetingsPerCommittee.committees.sort((a, b) => b.count - a.count).map((committee, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committeesData.find(c => c.id === committee.committee).name}</td>
                                                                    <td>{committee.count}</td>
                                                                    <td>{parseInt(committee.total_time / 60)}h {committee.total_time % 60}m</td>
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

                                    <CardTitle>Scheduled meetings that overlapped</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">{block_meetingsThatOverlapped.count}</span> of <span className="card-big-text">{block_totalScheduledMeetings.total}</span>
                                    </CardSubtitle>
                                    <CardContent>
                                        <CardHelp metric="meetingsThatOverlapped" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Committee</th>
                                                            <th>Meetings</th>
                                                            <th>Overlapped</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            block_meetingsThatOverlapped.counts.map((committee, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committeesData.find(c => c.id === committee.committee).name}</td>
                                                                    <td>{block_meetingsPerCommittee.committees.find(c => c.committee === committee.committee)?.count}</td>
                                                                    <td>{committee.count}</td>
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

                    <section className="section-header mt-4" id="attendance">
                        <Row>
                            <Col>
                                <div className="header-img-container">
                                    <div className="header-img" style={{ backgroundImage: "url('../assets/committee-meeting-attendance.jpeg')" }}></div>
                                    <h2>Attendance of committee meetings</h2>
                                </div>
                            </Col>
                            <Col className="d-flex align-items-center">
                                <div className="section-intro">In these metrics we look at actual attendance data recorded by PMG to give us a sense for the parties, committees and members with the best track record for attendance. It is important to note that attendance is just one factor when assessing performance.</div>
                            </Col>
                        </Row>
                    </section>

                    <section className="attendance mt-4">
                        <Row>
                            <Col>
                                <DashboardCard>
                                    <CardTitle>Overall meeting attendance</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">{parseInt(block_overallAttendance.avg)}%</span>
                                    </CardSubtitle>

                                    <CardContent>
                                        <CardHelp metric="overallAttendance" />
                                        <div className="mt-3">
                                            <StackedBarChart data={block_overallAttendance.data} party={partiesData.find(p => p.id === party)?.party || "All"} />
                                        </div>
                                    </CardContent>
                                </DashboardCard>

                            </Col>
                            <Col>
                                <DashboardCard>
                                    <CardTitle>Committees with the best attendance</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>

                                    </CardSubtitle>

                                    <CardContent>
                                        <CardHelp metric="commiteesWithBestAttendance" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Committee</th>
                                                            <th>Meetings</th>
                                                            <th>Present</th>
                                                            <th>% vs avg</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            block_committeesWithBestAttendance.committees.sort((a, b) => b.percentage - a.percentage).map((committee, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committeesData.find(c => c.id === committee.committee).name}</td>
                                                                    <td>{committee.meetings}</td>
                                                                    <td>{parseInt(committee.percentage)}%</td>
                                                                    <td><CardBar value={parseInt(committee.percentage)} avg={block_committeesWithBestAttendance.avg} /></td>
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

                                    <CardTitle>Parties with the best attendance</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>

                                    </CardSubtitle>

                                    <CardContent>
                                        <CardHelp metric="partiesWithBestAttendance" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Party</th>
                                                            <th>Meetings</th>
                                                            <th>Present</th>
                                                            <th>% vs avg</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            block_partiesWithBestAttendance.parties.sort((a, b) => b.percentage - a.percentage).map((p, index) =>
                                                                <tr key={index} className={party == p.party ? 'current-party' : ''}>
                                                                    <td>{index + 1}</td>
                                                                    <td><Badge party pic={partiesData.find(c => c.id === p.party).party} />{partiesData.find(c => c.id === p.party).party}</td>
                                                                    <td>{p.meetings.length}</td>
                                                                    <td>{parseInt(p.percentage)}%</td>
                                                                    <td><CardBar value={parseInt(p.percentage)} avg={block_partiesWithBestAttendance.avg} /></td>
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
                                    <CardTitle>Members with the best attendance</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>

                                    </CardSubtitle>

                                    <CardContent>
                                        <CardHelp metric="membersWithBestAttendance" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '40%' }}>Member</th>
                                                            <th>Party</th>
                                                            <th>Meetings</th>
                                                            <th>Present</th>
                                                            <th>%</th>
                                                            <th>% vs avg</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            block_membersWithBestAttendance.members.sort((a, b) => b.percentage - a.percentage).map((member, index) =>
                                                                <tr key={index}>
                                                                    <td>{index + 1}</td>
                                                                    <td><Badge pic={membersData.find(c => c.id === member.member)?.profile_pic} />{membersData.find(c => c.id === member.member)?.surname}, {membersData.find(c => c.id === member.member)?.initial}</td>
                                                                    <td>{partiesData.find(c => c.id === membersData.find(m => m.id === member.member)?.party_id)?.party}</td>
                                                                    <td>{member.meetings.length}</td>
                                                                    <td></td>
                                                                    <td>{parseInt(member.percentage)}%</td>
                                                                    <td><CardBar value={parseInt(member.percentage)} avg={block_membersWithBestAttendance.avg} /></td>
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
                                    <CardTitle>Attendance by gender</CardTitle>
                                    <CardParty><PartyPill party={party}>{partiesData.find(p => p.id === party)?.party || "All"}</PartyPill></CardParty>
                                    <CardSubtitle>

                                    </CardSubtitle>

                                    <CardContent>
                                        <CardHelp metric="attendanceByGender" />
                                        <div className="scroll-area mt-4">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '80%' }}>Gender</th>
                                                            <th style={{ width: '10%' }}>Present</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>Female</td>
                                                            <td>{parseInt(block_AttendanceByGender.female)}%</td>
                                                            <td></td>
                                                        </tr>
                                                        <tr>
                                                            <td>Male</td>
                                                            <td>{parseInt(block_AttendanceByGender.male)}%</td>
                                                            <td></td>
                                                        </tr>
                                                    </tbody>

                                                </Table>
                                            </Scrollbars>
                                        </div>


                                    </CardContent>
                                </DashboardCard>

                            </Col>
                            <Col></Col>
                        </Row>
                    </section>

                    <section className="section-header mt-4" id="activities">
                        <Row>
                            <Col>
                                <div className="header-img-container">
                                    <div className="header-img" style={{ backgroundImage: "url('../assets/member-activities.jpeg')" }}></div>
                                    <h2>Member and minister activities</h2>
                                </div>
                            </Col>
                            <Col className="d-flex align-items-center">
                                <div className="section-intro">In this section we look at activities undertaken by MPs and ministers that show that they are engaging with parliamentary processes and procedures. While no single metric can tell this entire story, they do help us know where to look for leading voices in parliament.</div>
                            </Col>
                        </Row>
                    </section>

                    <section className="activities mt-4">


                    </section>



                </div>
            </Container>


        </Fragment>
    );

}

export default Overview;

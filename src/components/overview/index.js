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

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowUp,
    faArrowDown,
    faChevronDown
} from "@fortawesome/free-solid-svg-icons";

import { Scrollbars } from "react-custom-scrollbars";

import BarChart from "../charts/BarChart";
import CalendarDays from "../charts/CalendarDays";
import MeetingTimes from "../charts/MeetingTimes";
import AttendanceChart from "../charts/AttendanceChart";



import { DashboardCard, CardTitle, CardParty, CardSubtitle, CardSparkline, CardContent, CardBar, CardHelp } from "../dashboardcard";


function PartyPill(props) {

    let color = lookup.parties.find(p => p.party === props.party).color;

    return <div className="party-pill" style={{ backgroundColor: color }}>{props.party}</div>;
}

function Badge(props) {
   
    return <div className="party_member_badge"></div>;
}


function Overview() {

    const [party, setParty] = useState("IFP");
    const data = Array.from({ length: 25 }, (_, i) => ({
        category: i + 1,
        gray: Math.random() * 60,
        orange: Math.random() * 60
    }));
    const [period, setPeriod] = useState(6);


    // dummy data here

    const meetings_per_committee = [
        { committee: "Agriculture", meetings: 222, total_time: "10h22", trend: [2, 1, 4, 20] },
        { committee: "Basic Education", meetings: 215, total_time: "8h45", trend: [1, 2, 3, 15] },
        { committee: "Communications and Digital Technologies", meetings: 198, total_time: "12h15", trend: [3, 4, 2, 10] },
        { committee: "Cooperative Governance and Traditional Affairs", meetings: 230, total_time: "11h30", trend: [2, 1, 5, 25] },
        { committee: "Correctional Services", meetings: 210, total_time: "9h10", trend: [1, 3, 2, 18] },
        { committee: "Defence and Military Veterans", meetings: 240, total_time: "14h00", trend: [5, 2, 4, 30] },
        { committee: "Electricity and Energy", meetings: 205, total_time: "9h45", trend: [1, 2, 3, 22] },
        { committee: "Employment and Labour", meetings: 195, total_time: "10h05", trend: [2, 1, 4, 12] },
        { committee: "Finance Standing Committee", meetings: 250, total_time: "13h20", trend: [4, 2, 3, 28] },
        { committee: "Forestry, Fisheries and the Environment", meetings: 190, total_time: "8h55", trend: [2, 1, 3, 17] },
        { committee: "Health", meetings: 260, total_time: "15h30", trend: [6, 4, 5, 40] },
        { committee: "Higher Education", meetings: 200, total_time: "11h10", trend: [3, 2, 4, 20] },
        { committee: "Home Affairs", meetings: 215, total_time: "9h50", trend: [2, 1, 4, 18] },
        { committee: "Human Settlements", meetings: 225, total_time: "10h25", trend: [3, 2, 5, 25] },
        { committee: "International Relations", meetings: 185, total_time: "8h35", trend: [1, 3, 2, 15] },
        { committee: "Justice and Constitutional Development", meetings: 275, total_time: "16h50", trend: [6, 5, 4, 50] },
        { committee: "Land Reform and Rural Development", meetings: 210, total_time: "10h40", trend: [2, 3, 4, 22] },
        { committee: "Mineral and Petroleum Resources", meetings: 195, total_time: "9h15", trend: [2, 1, 3, 18] },
        { committee: "Planning, Monitoring and Evaluation", meetings: 180, total_time: "8h20", trend: [1, 2, 3, 10] },
        { committee: "Police", meetings: 300, total_time: "17h45", trend: [7, 6, 5, 55] },
        { committee: "Powers and Privileges of Parliament", meetings: 170, total_time: "7h55", trend: [1, 1, 2, 10] },
        { committee: "Public Accounts (SCOPA)", meetings: 290, total_time: "16h00", trend: [6, 5, 4, 45] },
        { committee: "Public Service and Administration", meetings: 205, total_time: "9h30", trend: [2, 2, 3, 20] },
        { committee: "Public Works and Infrastructure", meetings: 210, total_time: "10h15", trend: [2, 3, 4, 23] },
        { committee: "Rules of the National Assembly", meetings: 200, total_time: "8h50", trend: [1, 3, 2, 19] },
        { committee: "Science, Technology and Innovation", meetings: 220, total_time: "10h40", trend: [3, 2, 4, 28] },
        { committee: "Small Business Development", meetings: 185, total_time: "8h35", trend: [2, 1, 3, 12] },
        { committee: "Social Development", meetings: 240, total_time: "12h45", trend: [4, 3, 5, 30] },
        { committee: "Sport, Arts and Culture", meetings: 195, total_time: "9h25", trend: [2, 1, 4, 15] },
        { committee: "Standing Committee on Appropriations", meetings: 260, total_time: "13h10", trend: [5, 3, 4, 35] },
        { committee: "Standing Committee on Auditor General", meetings: 175, total_time: "8h00", trend: [1, 2, 3, 10] },
        { committee: "Tourism", meetings: 190, total_time: "9h05", trend: [2, 3, 4, 18] },
        { committee: "Trade, Industry and Competition", meetings: 235, total_time: "12h20", trend: [4, 2, 5, 25] },
        { committee: "Transport", meetings: 215, total_time: "11h35", trend: [3, 2, 4, 22] },
        { committee: "Water and Sanitation", meetings: 205, total_time: "10h45", trend: [2, 3, 4, 20] },
        { committee: "Women, Youth and Persons with Disabilities", meetings: 185, total_time: "8h50", trend: [1, 2, 3, 15] }
    ];
    
    const committee_meetings_overlapped = [
        { committee: "Agriculture", overlapped: 12, trend: [2, 1, 3, 0] },
        { committee: "Basic Education", overlapped: 8, trend: [1, 0, 2, 1] },
        { committee: "Communications and Digital Technologies", overlapped: 15, trend: [3, 2, 0, 1] },
        { committee: "Cooperative Governance and Traditional Affairs", overlapped: 10, trend: [2, 1, 1, 2] },
        { committee: "Correctional Services", overlapped: 7, trend: [1, 0, 2, 0] },
        { committee: "Defence and Military Veterans", overlapped: 14, trend: [3, 2, 1, 0] },
        { committee: "Electricity and Energy", overlapped: 9, trend: [2, 0, 1, 2] },
        { committee: "Employment and Labour", overlapped: 11, trend: [2, 1, 3, 0] },
        { committee: "Finance Standing Committee", overlapped: 16, trend: [3, 2, 4, 1] },
        { committee: "Forestry, Fisheries and the Environment", overlapped: 8, trend: [1, 0, 2, 1] },
        { committee: "Health", overlapped: 18, trend: [4, 3, 2, 1] },
        { committee: "Higher Education", overlapped: 10, trend: [2, 1, 3, 0] },
        { committee: "Home Affairs", overlapped: 9, trend: [2, 0, 1, 1] },
        { committee: "Human Settlements", overlapped: 13, trend: [3, 1, 2, 2] },
        { committee: "International Relations", overlapped: 7, trend: [1, 0, 1, 1] },
        { committee: "Justice and Constitutional Development", overlapped: 20, trend: [5, 4, 3, 2] },
        { committee: "Land Reform and Rural Development", overlapped: 11, trend: [3, 1, 2, 0] },
        { committee: "Mineral and Petroleum Resources", overlapped: 9, trend: [2, 1, 1, 1] },
        { committee: "Planning, Monitoring and Evaluation", overlapped: 6, trend: [1, 0, 0, 2] },
        { committee: "Police", overlapped: 19, trend: [4, 3, 4, 1] },
        { committee: "Powers and Privileges of Parliament", overlapped: 5, trend: [1, 0, 0, 1] },
        { committee: "Public Accounts (SCOPA)", overlapped: 17, trend: [4, 3, 2, 1] },
        { committee: "Public Service and Administration", overlapped: 10, trend: [2, 1, 2, 0] },
        { committee: "Public Works and Infrastructure", overlapped: 12, trend: [3, 2, 1, 1] },
        { committee: "Rules of the National Assembly", overlapped: 8, trend: [1, 1, 2, 0] },
        { committee: "Science, Technology and Innovation", overlapped: 13, trend: [3, 2, 3, 0] },
        { committee: "Small Business Development", overlapped: 6, trend: [1, 0, 1, 0] },
        { committee: "Social Development", overlapped: 14, trend: [3, 2, 1, 2] },
        { committee: "Sport, Arts and Culture", overlapped: 9, trend: [2, 1, 1, 1] },
        { committee: "Standing Committee on Appropriations", overlapped: 15, trend: [3, 3, 2, 1] },
        { committee: "Standing Committee on Auditor General", overlapped: 6, trend: [1, 0, 0, 1] },
        { committee: "Tourism", overlapped: 10, trend: [2, 1, 1, 2] },
        { committee: "Trade, Industry and Competition", overlapped: 12, trend: [3, 2, 2, 1] },
        { committee: "Transport", overlapped: 11, trend: [3, 1, 1, 1] },
        { committee: "Water and Sanitation", overlapped: 8, trend: [2, 1, 0, 1] },
        { committee: "Women, Youth and Persons with Disabilities", overlapped: 9, trend: [2, 0, 1, 2] }
    ];
    
    
    const attendance_committees = [
        { committee: "Agriculture", meetings: 50, present: 30, vs_avg: 85, trend: [12, 3, 15, 5] },
        { committee: "Basic Education", meetings: 42, present: 28, vs_avg: 88, trend: [10, 2, 18, 6] },
        { committee: "Communications and Digital Technologies", meetings: 47, present: 35, vs_avg: 90, trend: [14, 4, 16, 5] },
        { committee: "Cooperative Governance and Traditional Affairs", meetings: 45, present: 25, vs_avg: 80, trend: [8, 1, 12, 4] },
        { committee: "Correctional Services", meetings: 40, present: 20, vs_avg: 78, trend: [7, 2, 10, 3] },
        { committee: "Defence and Military Veterans", meetings: 55, present: 38, vs_avg: 92, trend: [15, 5, 20, 7] },
        { committee: "Electricity and Energy", meetings: 48, present: 32, vs_avg: 87, trend: [11, 3, 18, 5] },
        { committee: "Employment and Labour", meetings: 43, present: 28, vs_avg: 85, trend: [10, 2, 15, 6] },
        { committee: "Finance Standing Committee", meetings: 60, present: 45, vs_avg: 95, trend: [16, 4, 22, 8] },
        { committee: "Forestry, Fisheries and the Environment", meetings: 41, present: 27, vs_avg: 82, trend: [9, 1, 14, 5] },
        { committee: "Health", meetings: 65, present: 50, vs_avg: 96, trend: [18, 6, 25, 9] },
        { committee: "Higher Education", meetings: 44, present: 29, vs_avg: 86, trend: [11, 2, 15, 5] },
        { committee: "Home Affairs", meetings: 46, present: 30, vs_avg: 84, trend: [10, 2, 16, 4] },
        { committee: "Human Settlements", meetings: 50, present: 33, vs_avg: 88, trend: [12, 3, 18, 5] },
        { committee: "International Relations", meetings: 39, present: 24, vs_avg: 81, trend: [8, 1, 12, 3] },
        { committee: "Justice and Constitutional Development", meetings: 70, present: 52, vs_avg: 98, trend: [20, 8, 28, 10] },
        { committee: "Land Reform and Rural Development", meetings: 49, present: 31, vs_avg: 86, trend: [11, 3, 17, 5] },
        { committee: "Mineral and Petroleum Resources", meetings: 42, present: 26, vs_avg: 82, trend: [9, 2, 14, 4] },
        { committee: "Planning, Monitoring and Evaluation", meetings: 37, present: 22, vs_avg: 78, trend: [7, 1, 10, 2] },
        { committee: "Police", meetings: 68, present: 55, vs_avg: 94, trend: [18, 7, 25, 9] },
        { committee: "Powers and Privileges of Parliament", meetings: 35, present: 20, vs_avg: 76, trend: [6, 0, 10, 3] },
        { committee: "Public Accounts (SCOPA)", meetings: 64, present: 48, vs_avg: 92, trend: [17, 6, 24, 8] },
        { committee: "Public Service and Administration", meetings: 47, present: 30, vs_avg: 85, trend: [12, 3, 15, 5] },
        { committee: "Public Works and Infrastructure", meetings: 51, present: 34, vs_avg: 88, trend: [13, 3, 19, 5] },
        { committee: "Rules of the National Assembly", meetings: 43, present: 28, vs_avg: 83, trend: [10, 2, 14, 4] },
        { committee: "Science, Technology and Innovation", meetings: 52, present: 36, vs_avg: 90, trend: [14, 4, 20, 6] },
        { committee: "Small Business Development", meetings: 38, present: 23, vs_avg: 79, trend: [7, 1, 12, 3] },
        { committee: "Social Development", meetings: 54, present: 38, vs_avg: 91, trend: [15, 5, 21, 6] },
        { committee: "Sport, Arts and Culture", meetings: 40, present: 25, vs_avg: 80, trend: [8, 2, 13, 3] },
        { committee: "Standing Committee on Appropriations", meetings: 59, present: 42, vs_avg: 93, trend: [16, 5, 23, 7] },
        { committee: "Standing Committee on Auditor General", meetings: 36, present: 22, vs_avg: 77, trend: [6, 1, 10, 2] },
        { committee: "Tourism", meetings: 44, present: 30, vs_avg: 84, trend: [11, 2, 15, 4] },
        { committee: "Trade, Industry and Competition", meetings: 50, present: 33, vs_avg: 87, trend: [13, 3, 18, 5] },
        { committee: "Transport", meetings: 48, present: 32, vs_avg: 86, trend: [12, 2, 17, 5] },
        { committee: "Water and Sanitation", meetings: 42, present: 28, vs_avg: 83, trend: [10, 2, 14, 3] },
        { committee: "Women, Youth and Persons with Disabilities", meetings: 43, present: 27, vs_avg: 84, trend: [11, 2, 16, 4] }
    ];
    



    const attendance_parties = [
        { party: "ANC", meetings: 290, present: 220, vs_avg: 85, trend: [12, 3, 5, 8], img: "https://via.placeholder.com/150" },
        { party: "DA", meetings: 275, present: 210, vs_avg: 78, trend: [10, 2, 6, 9], img: "https://via.placeholder.com/150" },
        { party: "EFF", meetings: 260, present: 195, vs_avg: 76, trend: [9, 1, 4, 7], img: "https://via.placeholder.com/150" },
        { party: "IFP", meetings: 280, present: 205, vs_avg: 82, trend: [11, 2, 5, 10], img: "https://via.placeholder.com/150" },
        { party: "FF+", meetings: 265, present: 200, vs_avg: 79, trend: [8, 0, 6, 8], img: "https://via.placeholder.com/150" },
        { party: "ACDP", meetings: 250, present: 190, vs_avg: 75, trend: [7, 1, 4, 6], img: "https://via.placeholder.com/150" },
        { party: "UDM", meetings: 270, present: 215, vs_avg: 80, trend: [10, 3, 6, 9], img: "https://via.placeholder.com/150" },
        { party: "COPE", meetings: 260, present: 185, vs_avg: 74, trend: [9, 2, 3, 8], img: "https://via.placeholder.com/150" }
    ];

    const attendance_members = [
        { name: "Rachel Cecilia Adams", meetings: 275, present: 200, vs_avg: 80, trend: [10, 0, 6, 8], img: "https://via.placeholder.com/150" },
        { name: "Nanda Annah Ndalane", meetings: 230, present: 190, vs_avg: 75, trend: [9, 1, 7, 8], img: "https://via.placeholder.com/150" },
        { name: "Mokgadi Johanna Aphiri", meetings: 250, present: 210, vs_avg: 84, trend: [10, 2, 5, 9], img: "https://via.placeholder.com/150" },
        { name: "Tintswalo Joyce Bila", meetings: 260, present: 195, vs_avg: 78, trend: [8, 2, 6, 8], img: "https://via.placeholder.com/150" },
        { name: "Nkhensani Kate Bilankulu", meetings: 240, present: 185, vs_avg: 76, trend: [7, 3, 5, 9], img: "https://via.placeholder.com/150" },
        { name: "Polly Boshielo", meetings: 300, present: 215, vs_avg: 82, trend: [10, 0, 6, 10], img: "https://via.placeholder.com/150" },
        { name: "Alvin Botes", meetings: 265, present: 200, vs_avg: 79, trend: [8, 1, 7, 9], img: "https://via.placeholder.com/150" },
        { name: "Zolile Burns-Ncamashe", meetings: 220, present: 175, vs_avg: 74, trend: [7, 3, 5, 8], img: "https://via.placeholder.com/150" },
        { name: "Rosemary Nokuzola Capa", meetings: 280, present: 210, vs_avg: 85, trend: [10, 2, 6, 9], img: "https://via.placeholder.com/150" },
        { name: "Mosa Steve Chabane", meetings: 245, present: 190, vs_avg: 77, trend: [9, 1, 5, 8], img: "https://via.placeholder.com/150" },
        { name: "Tshehofatso Meagan Chauke-Adonis", meetings: 255, present: 205, vs_avg: 81, trend: [8, 2, 6, 9], img: "https://via.placeholder.com/150" },
        { name: "Sindi Chikunga", meetings: 230, present: 180, vs_avg: 76, trend: [9, 0, 6, 8], img: "https://via.placeholder.com/150" },
        { name: "Chupu Stanley Mathabatha", meetings: 300, present: 220, vs_avg: 88, trend: [10, 3, 6, 10], img: "https://via.placeholder.com/150" },
        { name: "Erald Alzano Cloete", meetings: 275, present: 200, vs_avg: 80, trend: [8, 1, 7, 9], img: "https://via.placeholder.com/150" },
        { name: "Barbara Creecy", meetings: 250, present: 190, vs_avg: 79, trend: [9, 2, 6, 8], img: "https://via.placeholder.com/150" },
        { name: "Sharon Winona Davids", meetings: 240, present: 185, vs_avg: 77, trend: [8, 0, 6, 9], img: "https://via.placeholder.com/150" },
        { name: "Sibongiseni Maxwell Dhlomo", meetings: 260, present: 195, vs_avg: 80, trend: [7, 3, 5, 8], img: "https://via.placeholder.com/150" },
        { name: "Dickson Masemola", meetings: 270, present: 205, vs_avg: 82, trend: [10, 1, 7, 10], img: "https://via.placeholder.com/150" },
        { name: "Thoko Didiza", meetings: 230, present: 180, vs_avg: 75, trend: [9, 2, 6, 8], img: "https://via.placeholder.com/150" },
        { name: "Masefako Clarah Dikgale", meetings: 245, present: 190, vs_avg: 78, trend: [8, 0, 7, 9], img: "https://via.placeholder.com/150" }
    ];

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






    const getCommitteeMeetings = async () => {
        try {
            const response = await axios.get(
                "https://api.pmg.org.za/committee-meeting/"
            );
            console.log(response);
        } catch (err) {
            console.error(err.message);
        }
    };


    





    useEffect(() => {
       



        getCommitteeMeetings()


    })

    return (
        <Fragment>
            <PMHeader />
            <PMTabs active="overview" />
            <Container fluid className="py-4">
                <div className="overview-container">
                    <Row>
                        <Col>
                            <h1>Performance Overview</h1>
                        </Col>
                    </Row>

                    <Row className="mt-3">

                        <Col md={2}>
                            <Row>
                                <Col xs="auto" className="d-flex align-items-center"><span className="form-label">Party:</span></Col>
                                <Col>
                                    <Dropdown className="dropdown-select">
                                        <Dropdown.Toggle>
                                            <Row>
                                                <Col><PartyPill party={party} /></Col>
                                                <Col xs="auto">
                                                    <FontAwesomeIcon icon={faChevronDown} />
                                                </Col>
                                            </Row>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
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
                        <Col>
                            <Row>
                                <Col xs="auto" className="d-flex align-items-center"><span className="form-label">For the last:</span></Col>
                                <Col></Col>
                            </Row>
                        </Col>
                    </Row>

                    <section className="mt-5">
                        <h2>Committee meetings in the last month</h2>
                        <Row className="mt-4">
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Representation in meetings</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">275</span> of <span className="card-big-text">275</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 64% above average</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
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
                                        <span className="card-big-text">3.6</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowDown} /> 42% below average</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                        <div className="chart-container">
                                            <h3>Scheduled meetings per member</h3>
                                            <BarChart x_label="Total scheduled meetings" y_label="Members" colors={[lookup.parties.find(p => p.party === party).color]} data={data} />
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
                                        <span className="card-big-text">8h4m</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 7% above average</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                        <div className="chart-container">
                                            <h3>Scheduled meetings per member</h3>
                                            <BarChart x_label="Total scheduled meetings" y_label="Members" colors={[lookup.parties.find(p => p.party === party).color]} data={data} />
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>

                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Avg.length of a meeting</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">2h10m</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 14% above average</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                        <div className="chart-container">
                                            <h3>Scheduled meetings per member</h3>
                                            <BarChart x_label="Total scheduled meetings" y_label="Members" colors={[lookup.parties.find(p => p.party === party).color]} data={data} />
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            </Col>

                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Number of meetings that ended late</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">76</span> of <span className="card-big-text">275</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowDown} /> 42% below avg.</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
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
                                        <span className="card-big-text">6</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 6%</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                        <div className="scroll-area">
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
                                                            meetings_per_committee.sort(() => Math.random() - 0.5).map((committee, index) => 
                                                            <tr>
                                                                <td>{index + 1}</td>
                                                                <td>{committee.committee}</td>
                                                                <td>{committee.meetings}</td>
                                                                <td>{committee.total_time}</td>
                                                                <td><CardSparkline data={committee.trend} /></td>
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
                                        <span className="card-big-text">42</span> of <span className="card-big-text">275</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 6%</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                        <div className="scroll-area">
                                            <Scrollbars style={{ height: "250px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Committee</th>
                                                            <th>Overlapped</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            committee_meetings_overlapped.sort(() => Math.random() - 0.5).map((committee, index) =>
                                                                <tr>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committee.committee}</td>
                                                                    <td>{committee.overlapped}</td>
                                                                    <td><CardSparkline data={committee.trend} /></td>
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
                        <h2>Attendance of committee meetings in the last month</h2>

                        <Row className="mt-4">
                            <Col>
                                <DashboardCard>
                                    <CardHelp><p>Lorem ipsum dolor set amet.</p></CardHelp>
                                    <CardTitle>Overall Attendance</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">68% present</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 6% abover avg.</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
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
                                        <div className="scroll-area">
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
                                                            attendance_committees.sort(() => Math.random() - 0.5).map((committee, index) => 
                                                                <tr>
                                                                    <td>{index + 1}</td>
                                                                    <td>{committee.committee}</td>
                                                                    <td>{committee.meetings}</td>
                                                                    <td>{committee.present}</td>
                                                                    <td><CardBar value={80} mark={70} /></td>
                                                                    <td><CardSparkline data={committee.trend} /></td>
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
                                        <span className="card-big-text">76</span> of <span className="card-big-text">275</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowDown} /> 42% below avg.</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                        <div className="scroll-area">
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
                                                            attendance_parties.sort(() => Math.random() - 0.5).map((party, index) => 
                                                                <tr>
                                                                    <td>{index + 1}</td>
                                                                    <td><Badge party={party.party}/>{party.party}</td>
                                                                    <td>{party.meetings}</td>
                                                                    <td>{party.present}</td>
                                                                    <td><CardBar value={80} mark={70} /></td>
                                                                    <td><CardSparkline data={[10, 0, 6, 8]} /></td>
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
                                        <span className="card-big-text">42</span> of <span className="card-big-text">275</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 6%</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                        <div className="scroll-area">
                                            <Scrollbars style={{ height: "200px" }}>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            <th style={{ width: '50%' }}>Member</th>
                                                            <th>Meetings</th>
                                                            <th>Present</th>
                                                            <th>% vs avg</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            attendance_members.sort(() => Math.random() - 0.5).map((member, index) => 
                                                                <tr>
                                                                    <td>{index + 1}</td>
                                                                    <td><Badge />{member.name}</td>
                                                                    <td>{member.meetings}</td>
                                                                    <td>{member.present}</td>
                                                                    <td><CardBar value={80} mark={70} /></td>
                                                                    <td><CardSparkline data={[10, 0, 6, 8]} /></td>
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
                                    <CardTitle>Attendance by gender</CardTitle>
                                    <CardParty><PartyPill party={party} /></CardParty>
                                    <CardSubtitle>
                                        <span className="card-big-text">42</span> of <span className="card-big-text">275</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 6%</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                       
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
                                        <span className="card-big-text">42</span> of <span className="card-big-text">275</span> <div className="card-badge"><FontAwesomeIcon
                                            icon={faArrowUp} /> 6%</div>
                                    </CardSubtitle>
                                    <CardSparkline data={[10, 0, 6, 8]} />
                                    <CardContent>
                                       
                                            
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
        </Fragment>
    );

}

export default Overview;

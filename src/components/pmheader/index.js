import React, { useEffect, useRef, useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from 'react-bootstrap/Nav';

import "./style.scss";

import ParliMeterLogo from '../../assets/parlimeter.png';
import DashboardBanner from '../../assets/dashboard.png';


function PMHeader() {
	return (
		<>
		<div style={{backgroundColor: "#9a0000", color: "#fff", padding: "0.5em", fontWeight: "bold", textAlign: "center"}}>This dashboard is under development. Data is subject to change.</div>
		<header>
			<Container fluid>
				<Row>
					<Col>
						<a href="/">
							<img src={ParliMeterLogo} alt="ParliMeter Dashboard" />
						</a>
						<img src={DashboardBanner} alt="ParliMeter Dashboard" />
					</Col>
					<Col>
						<Nav className="justify-content-end">
							<Nav.Item>
								<Nav.Link href="https://parlimeter.co.za">ParliMeter Home</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link href="https://parlimeter.co.za/about">About</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link href="https://parlimeter.co.za/blog">Blog</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link href="https://parlimeter.co.za/recommendations">Recommendations</Nav.Link>
							</Nav.Item>
						</Nav>
					</Col>
				</Row>
			</Container>
		</header>
		</>
	);
}

export default PMHeader;
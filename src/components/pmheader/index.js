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
								<Nav.Link href="/">ParliMeter Home</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link href="/about">About</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link href="/blog">Blog</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link href="/data-stories">Data Stories</Nav.Link>
							</Nav.Item>
						</Nav>
					</Col>
				</Row>
			</Container>
		</header>
	);
}

export default PMHeader;
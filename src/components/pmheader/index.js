import React, { useEffect, useState } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from 'react-bootstrap/Nav';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMobile
} from "@fortawesome/free-solid-svg-icons";

import "./style.scss";

import ParliMeterLogo from '../../assets/parlimeter.png';
import DashboardBanner from '../../assets/dashboard.png';

import CookieConsent from "../cookie";


function PMHeader() {
	const [showModal, setShowModal] = useState(false);

	// Function to check screen size
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				setShowModal(true);
			} else {
				setShowModal(false);
			}
		};

		// Check on mount
		handleResize();
		
		// Listen for resize events
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleClose = () => setShowModal(false);

	return (
		<>
			<div style={{ backgroundColor: "#9a0000", color: "#fff", padding: "0.5em", fontWeight: "bold", textAlign: "center" }}>
				This dashboard is under development. Data is subject to change.
			</div>

			<header>
				<Container fluid>
					<Row>
						<Col>
							<a href="https://www.parlimeter.co.za">
								<img src={ParliMeterLogo} alt="ParliMeter Dashboard" />
							</a>
							<img src={DashboardBanner} alt="ParliMeter Dashboard" />
						</Col>
						<Col>
							<Nav className="justify-content-end">
								<Nav.Item>
									<Nav.Link href="https://www.parlimeter.co.za">ParliMeter Home</Nav.Link>
								</Nav.Item>
								<Nav.Item>
									<Nav.Link href="https://www.parlimeter.co.za/about">About</Nav.Link>
								</Nav.Item>
								<Nav.Item>
									<Nav.Link href="https://www.parlimeter.co.za/blog">Blog</Nav.Link>
								</Nav.Item>
								<Nav.Item>
									<Nav.Link href="https://www.parlimeter.co.za/recommendations">Recommendations</Nav.Link>
								</Nav.Item>
							</Nav>
						</Col>
					</Row>
				</Container>
			</header>

			<Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton/>
                <Modal.Body>
                    <h2 className="mt-2"><FontAwesomeIcon icon={faMobile} color="#fb9905" className="me-2"/> Mobile Not Supported</h2>
                    <p className="mt-4">This dashboard is not optimized for small screens and may not function as intended. A dedicated mobile experience is in development.</p>
                    <Row className="justify-content-between my-4">
                        <Col></Col>
                        <Col xs="auto"><Button onClick={() => setShowModal(false)}>I understand</Button></Col>
                    </Row>


                </Modal.Body>
            </Modal>

			<CookieConsent />
		</>
	);
}

export default PMHeader;

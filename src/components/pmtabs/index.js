import React, { useEffect, useRef, useState } from "react";

import Container from "react-bootstrap/Container";

import "./style.scss";

function PMTabs() {
    return (
        <div className="tabs">
            <Container fluid>
                <a className="tab" href="/attendance">Attendance Tracker</a>
                <a className="tab active" href="/bills">Bill Tracker</a>
            </Container>
        </div>
    );
}

export default PMTabs;
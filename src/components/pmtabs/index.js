import React from "react";

import Container from "react-bootstrap/Container";

import "./style.scss";

function PMTabs(props) {
  const { active } = props;
  return (
    <div className="tabs">
      <Container fluid>
        <a
          className={`tab ${active === "bill-tracker" ? "active" : ""}`}
          href="/"
        >
          Bill Tracker
        </a>
        <a
          className={`tab ${active === "attendance-tracker" ? "active" : ""}`}
          href="/attendance"
        >
          Attendance Tracker
        </a>
      </Container>
    </div>
  );
}

export default PMTabs;

import React, { Fragment } from "react";

import Container from "react-bootstrap/Container";

import "./style.scss";

function PMTabs(props) {
  const { active } = props;
  return (
    <Fragment>
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
          <a
            className={`tab ${active === "overview" ? "active" : ""}`}
            href="/overview"
          >
            Performance Overview
          </a>
        </Container>
      </div>
      <Container fluid className="pt-3">
        {/* <div className="testing-notice">
          <strong>Notice:</strong> The data on this dashboard is for testing purposes only and is not accurate.
        </div> */}
      </Container>
    </Fragment>
  );
}

export default PMTabs;

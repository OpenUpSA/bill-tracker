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
            className={`tab ${active === "overview" ? "active" : ""}`}
            href="/overview"
          >
            Overview
          </a>
          <a
            className={`tab ${active === "attendance-tracker" ? "active" : ""}`}
            href="/attendance"
          >
            Attendance Tracker
          </a>
          <a
            className={`tab ${active === "bill-tracker" ? "active" : ""}`}
            href="/bill-tracker"
          >
            Bill Tracker
          </a>
          
          <a className="feedback-btn" target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSfaMxpxAx4TxaDcGZv2NySfZBir-nRblwMnNWiYhrxsnwsudg/viewform">Provide feedback</a>
          
        </Container>
      </div>
      
    </Fragment>
  );
}

export default PMTabs;

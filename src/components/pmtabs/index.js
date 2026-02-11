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
            className={`tab ${active === "attendance-tracker-2" ? "active" : ""}`}
            href="/attendance2"
          >
            Attendance Tracker v2
          </a>
          <a
            className={`tab ${active === "bill-tracker" ? "active" : ""}`}
            href="/bill-tracker"
          >
            Bill Tracker
          </a>

          <a className="feedback-btn" target="_blank" href="https://us13.list-manage.com/survey?u=0f09f0a8e93f804d1f920c778&id=bc6029e198&attribution=false">Provide feedback</a>
          
        </Container>
      </div>
      
    </Fragment>
  );
}

export default PMTabs;

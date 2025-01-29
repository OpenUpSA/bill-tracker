import React, { useEffect, useRef, useState } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";


import { SparklinesLine } from "@lueton/react-sparklines";

import "./style.scss";
import { Card } from "react-bootstrap";


export function CardTitle(props) {
    return <h3>{props.children}</h3>;
}

export function CardParty(props) {
    return <h4>{props.children}</h4>;
}

export function CardSubtitle(props) {
    return props.children;
}

export function CardSparkline(props) {
    
    // array of 4 random numbers
    const data = Array.from({length: 4}, () => Math.floor(Math.random() * 100));
    
    return <SparklinesLine
        stroke="#999"
        fill="none"
        data={data}
        height={20}
        width={40}
        
    />
}

export function CardBar(props) {
    let randomMark = Math.floor(Math.random() * 100);
    let randomValue = Math.floor(Math.random() * 100);
    
    return (
        <div className="card-bar">
            <div className="card-bar-fill" style={{width: randomValue}}></div>
            <div className="card-bar-mark" style={{left: randomMark}}></div>
        </div>
    );
}

export function CardContent(props) {
    return props.children;
}

export function CardHelp(props) {
    return (
        <div className="card-help">
            <div className="question">?</div>
            <div className="card-help-content">{props.children}</div>
        </div>
    )
}




export function DashboardCard(props) {

    const children = React.Children.toArray(props.children);

    // Extract specific child components
    const help = children.find(child => child.type === CardHelp);
    const title = children.find(child => child.type === CardTitle);
    const party = children.find(child => child.type === CardParty);
    const subtitle = children.find(child => child.type === CardSubtitle);
    const sparkline = children.find(child => child.type === CardSparkline);
    const content = children.find(child => child.type === CardContent);
   
	return (
        <div className="dashboard-card">
            {help}
            <Row>
                <Col>{title}</Col>
                <Col xs="auto">{party}</Col>
            </Row>
            <Row>
                <Col>{subtitle}</Col>
                <Col xs="auto">{sparkline}</Col>
            </Row>
            <Row>
                <Col>
                    {content}
                </Col>
            </Row>
            
        </div>
		
	);
}


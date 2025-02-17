import React, { useEffect, useRef, useState } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import "./style.scss";


export function CardTitle(props) {
    return <h3>{props.children}</h3>;
}

export function CardParty(props) {
    return <h4>{props.children}</h4>;
}

export function CardSubtitle(props) {
    return props.children;
}

export function CardContent(props) {
    return props.children;
}



export function DashboardCard(props) {

    const children = React.Children.toArray(props.children);

    // Extract specific child components
    
    const title = children.find(child => child.type === CardTitle);
    const party = children.find(child => child.type === CardParty);
    const subtitle = children.find(child => child.type === CardSubtitle);
    const content = children.find(child => child.type === CardContent);
    
   
	return (
        <div className={`dashboard-card ${props.fade ? 'faded' : ''}`}>
            
            <Row>
                <Col>{title}</Col>
                <Col xs="auto">{party}</Col>
            </Row>
            <Row>
                <Col>{subtitle}</Col>
            </Row>
            <Row>
                <Col>
                    {content}
                </Col>
            </Row>
            
        </div>
		
	);
}


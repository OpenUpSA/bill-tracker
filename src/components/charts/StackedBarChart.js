import { useEffect, useRef, useState } from 'react';

import './style.scss';

export default function StackedBarChart(props) {


    const chart_data = [];

    props.data.forEach((item, index) => {
        const total = item.P + item.L + item.LDE + item.DE + item.AP + item.A;
        const P_percentage = (item.P / total) * 100;
        const L_percentage = (item.L / total) * 100;
        const LDE_percentage = (item.LDE / total) * 100;
        const DE_percentage = (item.DE / total) * 100;
        const AP_percentage = (item.AP / total) * 100;
        const A_percentage = (item.A / total) * 100;
        const present_percentage = ((item.P + item.L + item.LDE) / total) * 100;
        const absent_percentage = ((item.DE + item.AP + item.A) / total) * 100;

        chart_data.push({
            ...item,
            P_percentage,
            L_percentage,
            LDE_percentage,
            DE_percentage,
            AP_percentage,
            A_percentage,
            present_percentage,
            absent_percentage
            
        });
    });




    return (
        <>
        {
            chart_data.map((item, index) => 
                <div className={`attendance-breakdown ${index > 0 && 'all-parties'}`} key={index}>

                    <div className="attendance-block attendance-attended" style={{ width: `${item.P_percentage}%` }}>
                        {
                            item.P_percentage > 5 &&                            
                            <div className="attendance-block-inner">
                                <div className="attendance-count">{item.P}</div>
                                <div className="attendance-label">Attended</div>
                            </div>
                        }
                    </div>
                    <div className="attendance-block attendance-arrived-late" style={{ width: `${item.L_percentage}%` }}>
                        {
                            item.L_percentage > 5 &&
                            <div className="attendance-block-inner">
                                <div className="attendance-count">{item.L}</div>
                                <div className="attendance-label">Arrived Late</div>
                            </div>
                        }
                    </div>
                    <div className="attendance-block attendance-arrived-late-departed-early" style={{ width: `${item.LDE_percentage}%` }}>
                        {
                            item.LDE_percentage > 5 &&
                            <div className="attendance-block-inner">
                                <div className="attendance-count">{item.LDE}</div>
                                <div className="attendance-label">Arrived Late & Departed Early</div>
                            </div>
                        }   
                    </div>
                    <div className="attendance-block attendance-departed-early" style={{ width: `${item.DE_percentage}%` }}>
                        {
                            item.DE_percentage > 5 &&
                            <div className="attendance-block-inner">
                                <div className="attendance-count">{item.DE}</div>
                                <div className="attendance-label">Departed Early</div>
                            </div>
                        }
                       
                        <div className="attendance-separator">
                            <div className="attendance-separator-arrow">{index == 0 ? '▼' : '▲'}</div>
                            <div className="attendance-separator-present">Present ({parseInt(item.present_percentage)}%)</div>
                            <div className="attendance-separator-absent">Absent ({parseInt(item.absent_percentage)}%)</div>
                        </div>
                      
                    </div>

                    <div className="attendance-block attendance-absent-with-apologies" style={{ width: `${item.AP_percentage}%` }}>
                        {
                            item.AP_percentage > 5 &&
                            <div className="attendance-block-inner">
                                <div className="attendance-count">{item.AP}</div>
                                <div className="attendance-label">Absent with Apologies</div>
                            </div>
                        }
                    </div>
                    <div className="attendance-block attendance-absent" style={{ width: `${item.A_percentage}%` }}>
                        {
                            item.A_percentage > 5 &&
                            <div className="attendance-block-inner">
                                <div className="attendance-count">{item.A}</div>
                                <div className="attendance-label">Absent</div>
                            </div>
                        }
                    </div>

                </div>
            )
        }
        </>
    );
}

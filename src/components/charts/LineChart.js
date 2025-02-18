import { curveNatural } from '@visx/curve';
import { scaleLinear } from '@visx/scale';
import { LinePath, Line, Circle } from '@visx/shape';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { useState, useEffect, useRef } from 'react';
import { timeFormat, timeParse } from 'd3-time-format';

export default function LineChart({ data, referenceY, data2 = null, party = null }) {
    const containerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(100);
    const height = 150;
    const padding = 20;

    // Resize observer
    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0].contentRect.width) {
                setChartWidth(entries[0].contentRect.width);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // Define scales
    const xScale = scaleLinear({
        domain: [0, data.length - 1],
        range: [padding, chartWidth - padding],
    });

    const yScale = scaleLinear({
        domain: [0, Math.max(...data.map((d) => d.y)) + 10],
        range: [height - 10, 10],
    });

    const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } = useTooltip();
    const bisectX = bisector((d) => d.x).left;

    // const handleMouseMove = (event) => {
    //     const { x } = localPoint(event) || { x: 0 };
    //     const x0 = xScale.invert(x);
    //     const index = bisectX(data, x0, 1);
    //     const d0 = data[index - 1];
    //     const d1 = data[index];
    //     if (!d0 || !d1) return;

    //     const d = x0 - d0.x > d1.x - x0 ? d1 : d0;

    //     showTooltip({
    //         tooltipLeft: xScale(d.x),
    //         tooltipTop: yScale(d.y),
    //         tooltipData: d,
    //     });
    // };

    const handleMouseMove = (event) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = xScale.invert(x);

        // Find the closest data point in the first dataset
        const index1 = bisectX(data, x0, 1);
        const d0 = data[index1 - 1];
        const d1 = data[index1];
        if (!d0 || !d1) return;

        const dPrimary = x0 - d0.x > d1.x - x0 ? d1 : d0;

        let dSecondary = null;
        if (data2) {
            // Find the closest data point in the second dataset
            const index2 = bisectX(data2, x0, 1);
            const d2_0 = data2[index2 - 1];
            const d2_1 = data2[index2];

            if (d2_0 && d2_1) {
                dSecondary = x0 - d2_0.x > d2_1.x - x0 ? d2_1 : d2_0;
            }
        }

        showTooltip({
            tooltipLeft: xScale(dPrimary.x), // Align tooltip to primary x value
            tooltipTop: yScale(dPrimary.y),
            tooltipData: { primary: dPrimary, secondary: dSecondary },
        });
    };

    // Fix: Correct date format for your dataset (MM/DD/YYYY)
    const parseDate = timeParse('%m/%d/%Y');
    const formatDate = timeFormat('%b %d'); // e.g., "Jan 15"

    // Filter out Mondays
    const mondayData = data
        .map((d, i) => ({
            ...d,
            index: i,
            parsedDate: parseDate(d.date), // Convert string to Date object
        }))
        .filter((d) => {
            return d.parsedDate && d.parsedDate.getDay() === 1; // Monday = 1
        });

    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            <svg width={chartWidth} height={height + 30} onMouseMove={handleMouseMove} onMouseLeave={hideTooltip}>
                {/* Line Path */}
                <LinePath
                    data={data}
                    x={(d) => xScale(d.x)}
                    y={(d) => yScale(d.y)}
                    stroke='#000'
                    strokeWidth={1}
                    
                />

                {
                    data2 && (
                        <LinePath
                            data={data2}
                            x={(d) => xScale(d.x)}
                            y={(d) => yScale(d.y)}
                            stroke='#fb9905'
                            strokeWidth={1}
                            
                        />
                    )
                }

                {/* Permanent Horizontal Reference Line */}
                {/* <Line
                    from={{ x: padding, y: yScale(referenceY) }}
                    to={{ x: chartWidth - padding, y: yScale(referenceY) }}
                    stroke="#fb9905"
                    strokeWidth={1}
                    strokeDasharray="6,3"
                /> */}

                {/* Monday Grid Lines */}
                {mondayData.map((d, i) => {
                    const xPos = xScale(d.index);
                    return (
                        <g key={i}>
                            <Line
                                from={{ x: xPos, y: padding }}
                                to={{ x: xPos, y: height - padding }}
                                stroke="#dadada"
                                strokeWidth={1}
                            />
                            {/* Moved the label to the TOP */}
                            <text
                                x={xPos}
                                y={padding - 5} // Adjusted position to be above the chart
                                fontSize={10}
                                textAnchor="middle"
                                fill="#868686"
                            >
                                Mon
                            </text>
                        </g>
                    );
                })}

                {/* Circle at Hovered Point for First Line */}
                {tooltipData && (
                    <Circle cx={tooltipLeft} cy={tooltipTop} r={3} fill="black" />
                )}

                {/* Circle at Hovered Point for Second Line (if exists) */}
                {tooltipData?.secondary && (
                    <Circle
                        cx={xScale(tooltipData.secondary.x)}
                        cy={yScale(tooltipData.secondary.y)}
                        r={3}
                        fill="#fb9905"
                    />
                )}
            </svg>

            {/* Calculate tooltip position dynamically */}
{tooltipData && (
    <Tooltip
        left={tooltipLeft + 10 > chartWidth - 100 ? tooltipLeft - 180 : tooltipLeft + 10} 
        top={tooltipTop - 30 < 10 ? tooltipTop + 10 : tooltipTop - 30} 
        style={{
            ...defaultStyles,
            position: 'absolute',
            backgroundColor: '#000',
            borderRadius: "5px",
            color: "#fff",
            padding: '5px',
            fontSize: "11px",
            lineHeight: "14px",
            maxWidth: "180px", 
            whiteSpace: "nowrap"
        }}
    >
        <div>
            <strong>Date:</strong> {tooltipData.primary.date ? formatDate(parseDate(tooltipData.primary.date)) : "N/A"}
        </div>
        <div>
            <strong>Meetings (All):</strong> {tooltipData.primary.y}
        </div>
        {tooltipData.secondary && (
            <div>
                <strong>Meetings ({party}):</strong> {tooltipData.secondary.y}
            </div>
        )}
    </Tooltip>
)}

            {/* Legend */}
            <div className="chart-legend">
                {
                    data2 && (
                        <div className="legend-item">
                            <div className="legend-color" style={{ borderColor: '#fb9905' }}></div>
                            <div className="legend-label">{party}</div>
                        </div>
                    )
                }
                <div className="legend-item">
                    <div className="legend-color" style={{ borderColor: '#000' }}></div>
                    <div className="legend-label">All Parties</div>
                </div>
            </div>
        </div>
    );
}

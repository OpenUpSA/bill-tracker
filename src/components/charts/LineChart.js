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
    const height = 180;
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

    const handleMouseMove = (event) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = xScale.invert(x);
        const index = bisectX(data, x0, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        if (!d0 || !d1) return;

        const d = x0 - d0.x > d1.x - x0 ? d1 : d0;

        showTooltip({
            tooltipLeft: xScale(d.x),
            tooltipTop: yScale(d.y),
            tooltipData: d,
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
                    curve={curveNatural}
                />

                {
                    data2 && (
                        <LinePath
                            data={data2}
                            x={(d) => xScale(d.x)}
                            y={(d) => yScale(d.y)}
                            stroke='#fb9905'
                            strokeWidth={1}
                            curve={curveNatural}
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

                {/* Tooltip vertical line */}
                {tooltipData && (
                    <Line
                        from={{ x: tooltipLeft, y: padding }}
                        to={{ x: tooltipLeft, y: height - padding }}
                        stroke="gray"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                    />
                )}

                {/* Circle at Hovered Point */}
                {tooltipData && (
                    <Circle cx={tooltipLeft} cy={tooltipTop} r={3} fill="black" />
                )}
            </svg>

            {/* Tooltip */}
            {tooltipData && (
                <Tooltip
                    left={tooltipLeft + 10}
                    top={tooltipTop - 30}
                    style={{ ...defaultStyles, position: 'absolute', backgroundColor: '#000', borderRadius: "5px", color: "#fff", padding: '5px', fontSize: "11px", lineHeight: "13px" }}
                >
                    <div>
                        <strong>Date:</strong> {tooltipData.date ? formatDate(parseDate(tooltipData.date)) : "N/A"}
                    </div>
                    <div>
                        <strong>meetings:</strong> {tooltipData.y}
                    </div>
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

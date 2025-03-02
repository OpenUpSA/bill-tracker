import { scaleLinear } from '@visx/scale';
import { Circle, Line } from '@visx/shape';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { useState, useEffect, useRef } from 'react';

export default function BubbleChart({ data, data2 = null, party = null, xType = "count" }) {
    const containerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(100);
    const height = 150;
    const padding = [20, 40, 5, 40];

    // Handle resizing
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

    // Define xScale based on xType (count, time, or late)
    const xDomain = xType === "count"
        ? [1, Math.max(...(data?.map((d) => d.x) || [1]), ...(data2?.map((d) => d.x) || [1]))]
        : [
            Math.min(...(data?.map((d) => d.x) || [0]), ...(data2?.map((d) => d.x) || [0])),
            Math.max(...(data?.map((d) => d.x) || [0]), ...(data2?.map((d) => d.x) || [0]))
        ];

    const xScale = scaleLinear({
        domain: xDomain,
        range: [padding[3], chartWidth - padding[1]],
    });

    const yScale = scaleLinear({
        domain: [0, Math.max(...(data?.map((d) => d.y) || [0]), ...(data2?.map((d) => d.y) || [0])) + 5],
        range: [height - padding[2], padding[0]],
    });

    const sizeScale = scaleLinear({
        domain: [
            1, // Ensure minimum size of 1
            Math.max(...(data?.map((d) => d.size) || [1]), ...(data2?.map((d) => d.size) || [1]))
        ],
        range: [5, 20], // Keeps small values small
    });


    const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } = useTooltip();

    const bisectX = bisector((d) => d.x).left;

    // Generate x-axis intervals
    const xMin = xDomain[0];
    const xMax = xDomain[1];
    const tickValues = [];

    if (xType === "count") {
        for (let tick = Math.ceil(xMin); tick <= xMax; tick++) {
            tickValues.push(tick);
        }
    } else if (xType === "time" || xType === "late") {
        for (let tick = Math.ceil(xMin / 120) * 120; tick <= xMax; tick += 120) {
            tickValues.push(tick);
        }
    }





    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            <svg width={chartWidth} height={height} onMouseLeave={hideTooltip}>

                {tickValues.map((xVal, i) => {
                    const xPos = xScale(xVal);
                    return (
                        <g key={i} >
                            <Line
                                from={{ x: xPos, y: padding[0] }}
                                to={{ x: xPos, y: height - padding[2] }}
                                stroke="#dadada"
                                strokeWidth={1}
                            />
                            <text
                                x={xPos}
                                y={padding[0] - 5}
                                fontSize={10}
                                textAnchor="middle"
                                fill="#868686"
                            >
                                {xType === "time" || xType === "late" ? `${xVal}min` : xVal}
                            </text>
                        </g>
                    );
                })}


                {
                    xType == "late" &&
                    <>
                        <text
                            x={0}
                            y={height - padding[2]}
                            fontSize={12}
                            textAnchor="start"
                            fill="#868686"
                        >
                            ← Ended Early
                        </text>
                        <text
                            x={chartWidth}
                            y={height - padding[2]}
                            fontSize={12}
                            textAnchor="end"
                            fill="#868686"
                        >
                            Ended late →
                        </text>
                    </>
                }

                {data.map((d, i) => (
                    <Circle
                        key={`data1-${i}`}
                        cx={xScale(d.x)}
                        cy={yScale(d.y) - 20}
                        r={sizeScale(d.size)}
                        stroke="black"
                        strokeWidth={tooltipData?.primary?.x === d.x ? 2 : 1.5}
                        fill="#fff"
                        onMouseEnter={(event) => {
                            const { x, y } = localPoint(containerRef.current, event);
                            showTooltip({
                                tooltipLeft: x,
                                tooltipTop: y,
                                tooltipData: { primary: d }
                            });
                        }}
                        onMouseLeave={hideTooltip}
                    />
                ))}

                {data2 &&
                    data2.map((d, i) => (
                        <Circle
                            key={`data2-${i}`}
                            cx={xScale(d.x)}
                            cy={yScale(d.y) + 20}
                            r={sizeScale(d.size)}
                            stroke="black"
                            strokeWidth={tooltipData?.secondary?.x === d.x ? 2 : 1.5}
                            fill="#fb9905"
                            onMouseEnter={(event) => {
                                const { x, y } = localPoint(containerRef.current, event);
                                showTooltip({
                                    tooltipLeft: x,
                                    tooltipTop: y,
                                    tooltipData: { secondary: d }
                                });
                            }}
                            onMouseLeave={hideTooltip}
                        />
                    ))}
            </svg>

            {/* Tooltip */}
            {tooltipData && (
                <Tooltip
                    left={tooltipLeft > chartWidth - 120 ? tooltipLeft - 120 : tooltipLeft + 10}
                    top={tooltipTop + 15} // Always just below the pointer
                    className="chart-tooltip"
                >
                    <div>
                        <strong>{xType === "late" ? "Minutes Late" : xType === "time" ? "Length" : "Meetings"}:</strong> {tooltipData.primary?.x || tooltipData.secondary?.x}
                        <br />
                        <strong>{xType === "late" ? "Meetings" : xType === "time" ? "Meetings" : "Members"}:</strong> {tooltipData.primary?.size || tooltipData.secondary?.size}
                    </div>
                </Tooltip>
            )}

        </div>
    );
}

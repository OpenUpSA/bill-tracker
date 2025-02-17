import { scaleLinear } from '@visx/scale';
import { Circle, Line } from '@visx/shape';
import { AxisBottom } from '@visx/axis';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { useState, useEffect, useRef } from 'react';

export default function BubbleChart2({ data, referenceLines }) {
    const containerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(100);
    const height = 150;
    const padding = 20;

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

    // Define scales
    const xScale = scaleLinear({
        domain: [Math.min(...data.map((d) => d.x)), Math.max(...data.map((d) => d.x))],
        range: [padding, chartWidth - padding],
    });

    const yScale = scaleLinear({
        domain: [0, Math.max(...data.map((d) => d.y)) + 5],
        range: [height, padding],
    });

    const sizeScale = scaleLinear({
        domain: [Math.min(...data.map((d) => d.size)), Math.max(...data.map((d) => d.size))],
        range: [5, 20],
    });

    const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } = useTooltip();
    const bisectX = bisector((d) => d.x).left;

    // Generate 30-minute interval ticks
    const xMin = Math.min(...data.map((d) => d.x));
    const xMax = Math.max(...data.map((d) => d.x));

    // Find the closest multiple of 30 to start from
    const firstTick = Math.ceil(xMin / 60) * 60;
    const tickValues = [];
    for (let tick = firstTick; tick <= xMax; tick += 60) {
        tickValues.push(tick);
    }

    const handleMouseMove = (event) => {
        if (!containerRef.current) return;

        const { x, y } = localPoint(containerRef.current, event) || { x: 0, y: 0 };

        // Find the closest circle
        let closestCircle = null;
        let minDistance = Infinity;

        data.forEach((d) => {
            const cx = xScale(d.x);
            const cy = yScale(d.y);
            const r = sizeScale(d.size);

            // Calculate Euclidean distance from mouse to circle center
            const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

            if (distance < r && distance < minDistance) {
                closestCircle = d;
                minDistance = distance;
            }
        });

        if (closestCircle) {
            showTooltip({
                tooltipLeft: xScale(closestCircle.x),
                tooltipTop: yScale(closestCircle.y),
                tooltipData: closestCircle,
            });
        } else {
            hideTooltip();
        }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            <svg width={chartWidth} height={height} onMouseMove={handleMouseMove} onMouseLeave={hideTooltip}>

                {/* <AxisBottom scale={xScale} top={height - padding} /> */}

                {/* Bubble Circles */}
                {data.map((d, i) => (
                    <Circle
                        key={i}
                        cx={xScale(d.x)}
                        cy={yScale(d.y)}
                        r={sizeScale(d.size)}
                        stroke="black"
                        strokeWidth={1}
                        fill="transparent"
                        onMouseEnter={(event) => {
                            showTooltip({
                                tooltipLeft: xScale(d.x),
                                tooltipTop: yScale(d.y),
                                tooltipData: d,
                            });
                        }}
                        onMouseLeave={hideTooltip}
                    />
                ))}

                {/* Vertical Reference Lines */}
                {/* {referenceLines.map((xVal, i) => (
                    <Line
                        key={i}
                        from={{ x: xScale(xVal), y: 0 }}
                        to={{ x: xScale(xVal), y: height }}
                        stroke={i === 0 ? 'black' : 'orange'}
                        strokeWidth={1}
                        strokeDasharray="4,4"
                    />
                ))} */}

                {/* Highlight Circle on Hover */}
                {tooltipData && (
                    <Circle cx={tooltipLeft} cy={tooltipTop} r={sizeScale(tooltipData.size)} fill="rgba(251, 153, 5, 0.5)" />
                )}



                {/* Vertical Grid Lines at 30-minute intervals */}
                {tickValues.map((xVal, i) => {
                    const xPos = xScale(xVal);
                    return (
                        <g key={i}>
                            <Line
                                from={{ x: xPos, y: padding }}
                                to={{ x: xPos, y: height - padding }}
                                stroke="lightgray"
                                strokeWidth={1}
                                strokeDasharray="4,4"
                            />
                            <text
                                x={xPos}
                                y={height - padding + 15}
                                fontSize={10}
                                textAnchor="middle"
                                fill="black"
                            >
                                {xVal}
                            </text>
                        </g>
                    );
                })}



            </svg>

            {/* Tooltip rendered outside the SVG */}
            {tooltipData && (
                <Tooltip
                    left={tooltipLeft + 10}
                    top={tooltipTop - 30}
                    style={defaultStyles}
                >
                    <div>
                        <strong>x:</strong> {tooltipData.x}, <strong>y:</strong> {tooltipData.y}, <strong>size:</strong> {tooltipData.size}
                    </div>
                </Tooltip>
            )}
        </div>
    );
}

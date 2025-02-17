import { AxisBottom } from '@visx/axis';
import { curveNatural } from '@visx/curve';
import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { Line, Circle } from '@visx/shape';
import { useState, useEffect, useRef } from 'react';

export default function LineChart({ data, referenceY }) {
    const containerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(100);
    const height = 150;
    const padding = 20;

    // Resize observer to track changes in width
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
        domain: [0, Math.max(...data.map((d) => d.y)) + 0],
        range: [height - padding, padding],
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

    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            <svg width={chartWidth} height={height} onMouseMove={handleMouseMove} onMouseLeave={hideTooltip}>
                {/* Line Path */}
                <LinePath
                    data={data}
                    x={(d) => xScale(d.x)}
                    y={(d) => yScale(d.y)}
                    stroke='#000'
                    strokeWidth={1}
                    curve={curveNatural}
                />

                {/* X-Axis */}
                {/* <AxisBottom scale={xScale} top={height - padding} /> */}

                {/* Permanent Horizontal Reference Line */}
                <Line
                    from={{ x: padding, y: yScale(referenceY) }}
                    to={{ x: chartWidth - padding, y: yScale(referenceY) }}
                    stroke="#fb9905"
                    strokeWidth={1}
                    strokeDasharray="6,3"
                />

                {/* Vertical Reference Line (for tooltip) */}
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
                    <Circle cx={tooltipLeft} cy={tooltipTop} r={5} fill="black" />
                )}

                {/* Vertical Grid Lines */}
                {[...Array(5)].map((_, i) => {
                    const xPos = xScale((data.length - 1) * (i / 4)); // Adjusting for specific intervals
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
                                {Math.round((data.length - 1) * (i / 4))}
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
                    style={{ ...defaultStyles, position: 'absolute', backgroundColor: 'white', border: '1px solid black', padding: '5px' }}
                >
                    <div>
                        <strong>x:</strong> {tooltipData.x}, <strong>y:</strong> {tooltipData.y}
                    </div>
                </Tooltip>
            )}
        </div>
    );
}

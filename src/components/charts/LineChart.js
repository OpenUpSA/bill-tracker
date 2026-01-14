import { scaleLinear } from '@visx/scale';
import { LinePath, Line, Circle } from '@visx/shape';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { timeFormat, timeParse } from 'd3-time-format';

// Create a global flag to track if any LineChart has ever loaded
let hasAnyLineChartEverLoaded = false;

export default function LineChart({ data, referenceY, data2 = null, party = null }) {
    const containerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(100);
    const [showSkeleton, setShowSkeleton] = useState(!hasAnyLineChartEverLoaded);
    const [isSkeletonFading, setIsSkeletonFading] = useState(false);
    const height = 150;
    const padding = [20, 20, 5, -10];
    
    useEffect(() => {
        if (data && data.length > 0 && !hasAnyLineChartEverLoaded) {
            setTimeout(() => {
                setIsSkeletonFading(true);
                setTimeout(() => {
                    setShowSkeleton(false);
                    setIsSkeletonFading(false);
                    hasAnyLineChartEverLoaded = true;
                }, 300);
            }, 300);
        } else if (hasAnyLineChartEverLoaded) {
            setShowSkeleton(false);
        }
    }, [data]);
    

    // Handle initial sizing and resizing
    useLayoutEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setChartWidth(containerRef.current.clientWidth);
            }
        };

        // Set initial width immediately
        updateWidth();

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
        range: [padding[3], chartWidth - padding[1]],
    });

    const yScale = scaleLinear({
        domain: [0, Math.max(...data.map((d) => d.y))],
        range: [height - padding[2], padding[0]],
    });

    const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } = useTooltip();
    const bisectX = bisector((d) => d.x).left;


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
            tooltipLeft: xScale(dPrimary.x), 
            tooltipTop: yScale(dPrimary.y),
            tooltipData: { primary: dPrimary, secondary: dSecondary },
        });
    };

    
    const parseDate = timeParse('%m/%d/%Y');
    const formatDate = timeFormat('%b %d');
    const formatMonth = timeFormat('%b');

    // Calculate the period length in months
    const firstDate = parseDate(data[0]?.date);
    const lastDate = parseDate(data[data.length - 1]?.date);
    const periodInMonths = firstDate && lastDate ? 
        (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth()) : 0;

    // Use monthly markers if period is longer than 2 months, otherwise use Monday markers
    const useMonthlyMarkers = periodInMonths > 2;

    const mondayData = data
        .map((d, i) => ({
            ...d,
            index: i,
            parsedDate: parseDate(d.date), 
        }))
        .filter((d) => {
            if (!d.parsedDate) return false;
            
            if (useMonthlyMarkers) {
                // Filter for first day of each month
                return d.parsedDate.getDate() === 1;
            } else {
                // Filter for Mondays
                return d.parsedDate.getDay() === 1;
            }
        });

    // Show skeleton loader on initial load
    if (showSkeleton) {
        return (
            <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
                <div 
                    style={{
                        width: '100%',
                        height: `${height}px`,
                        backgroundColor: '#f6f7f8',
                        borderRadius: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: isSkeletonFading ? 0 : 1,
                        transition: 'opacity 300ms ease-out'
                    }}
                >
                    <div 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                            animation: 'wave 1.5s infinite'
                        }}
                    />
                </div>
                <style>{`
                    @keyframes wave {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(300%); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative'}}>
            <svg width={chartWidth} height={height} onMouseMove={handleMouseMove} onMouseLeave={hideTooltip}>
                
                {mondayData.map((d, i) => {
                    const xPos = xScale(d.index + 1);
                    return (
                        <g key={i}>
                            <Line
                                from={{ x: xPos, y: padding[0] }}
                                to={{ x: xPos, y: height - padding[2] }}
                                stroke="#dadada"
                                strokeWidth={1}
                            />
                            
                            <text
                                x={xPos}
                                y={padding[0]-5} 
                                fontSize={10}
                                textAnchor="middle"
                                fill="#868686"
                            >{useMonthlyMarkers ? formatMonth(d.parsedDate) : 'Mon'}</text>
                        </g>
                    );
                })}
                
                {/* Line Path */}
                <LinePath
                    data={data}
                    x={(d) => xScale(d.x)}
                    y={(d) => yScale(d.y)}
                    stroke='#000'
                    strokeWidth={1.5}

                />

                {
                    data2 && (
                        <LinePath
                            data={data2}
                            x={(d) => xScale(d.x)}
                            y={(d) => yScale(d.y)}
                            stroke='#fb9905'
                            strokeWidth={1.5}

                        />
                    )
                }
                
                {tooltipData && (
                    <Circle cx={tooltipLeft} cy={tooltipTop} r={3} fill="black" />
                )}

                
                {tooltipData?.secondary && (
                    <Circle
                        cx={xScale(tooltipData.secondary.x)}
                        cy={yScale(tooltipData.secondary.y)}
                        r={3}
                        fill="#fb9905"
                    />
                )}
            </svg>

            
            {tooltipData && (
                <Tooltip
                    left={tooltipLeft > chartWidth / 2 ? tooltipLeft - 180 : tooltipLeft + 10} 
                    top={tooltipTop < 30 ? tooltipTop + 20 : tooltipTop - 30} 
                    className="chart-tooltip"
                >
                    <div>
                        <strong>Date:</strong> {tooltipData.primary.date ? timeFormat('%a, %d %B')(parseDate(tooltipData.primary.date)) : "N/A"}
                    </div>
                    <div>
                        <strong>All parties:</strong> {tooltipData.primary.y}
                    </div>
                    {tooltipData.secondary && (
                        <div>
                            <strong>{party}:</strong> {tooltipData.secondary.y}
                        </div>
                    )}
                </Tooltip>
            )}

            
        </div>
    );
}
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

import "./style.scss";

const CalendarDays = () => {
    const chartRef = useRef();

    const generateRandomData = () => {
        const randomData = Array.from({ length: 30 }, (_, i) => {
            const isWeekend = (i % 7 === 0 || (i + 1) % 7 === 0); // Sunday or Saturday
            return { day: i, value: isWeekend ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 25) + 5 };
        });
        return randomData;
    };

    const [data, setData] = useState(generateRandomData());

    useEffect(() => {
        const daysPerWeek = 7;

        const width = "100%";
        const height = 200;
        const cellWidth = 55;
        const cellHeight = 30;
        const cornerRadius = 5; // Rounded corner radius

        d3.select(chartRef.current).selectAll("*").remove();

        const svg = d3
          .select(chartRef.current)
          .attr("width", "100%")
          .attr("height", height)
          .style("display", "block");

        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range(["#f5f5f5", "#ff6600"]);

        // Day labels
        const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
        svg.selectAll("text.day-label")
            .data(dayLabels)
            .enter()
            .append("text")
            .attr("class", "day-label")
            .attr("x", (_, i) => i * cellWidth + cellWidth / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text(d => d);

        // Calendar blocks
        svg.selectAll("g.day-block")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "day-block")
            .attr("transform", d => {
                const x = (d.day % daysPerWeek) * cellWidth;
                const y = Math.floor(d.day / daysPerWeek) * cellHeight + 30;
                return `translate(${x}, ${y})`;
            })
            .each(function (d) {
                const g = d3.select(this);
                g.append("rect")
                    .attr("width", cellWidth - 4) // Subtracted for spacing
                    .attr("height", cellHeight - 4) // Subtracted for spacing
                    .attr("rx", cornerRadius)
                    .attr("ry", cornerRadius)
                    .attr("fill", colorScale(d.value));
                g.append("text")
                    .attr("x", (cellWidth - 4) / 2)
                    .attr("y", (cellHeight - 4) / 2 + 5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", "#000")
                    .text(d.value);
            });
    }, [data]);

    const randomizeData = () => {
        setData(generateRandomData());
    };

    return (
        <div>
           
            <svg ref={chartRef}></svg>
        </div>
    );
};

export default CalendarDays;

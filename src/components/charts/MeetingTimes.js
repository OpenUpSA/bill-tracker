import React, { useRef, useEffect } from "react";
import * as d3 from "d3";


const MeetingTimes = (props) => {
	const chartRef = useRef();

	useEffect(() => {
		// Data for two datasets
		const set1 = [
			{ x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 },
			{ x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }
		];

		const set2 = [
			{ x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 },
			{ x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }, { x: Math.floor(Math.random() * 181) - 90 }
		];




		// Responsive dimensions
		const containerWidth = chartRef.current.parentElement.offsetWidth;
		const width = containerWidth;
		const height = 200;
		const margin = { top: 30, right: 50, bottom: 50, left: 0 };


		d3.select(chartRef.current).selectAll("*").remove();


		const svg = d3
			.select(chartRef.current)
			.attr("width", width)
			.attr("height", height);





		// Create scales
		const xScale = d3.scaleLinear()
			.domain([-90, 90]) // Range of x-values
			.range([margin.left, width - margin.right]);

		const yScale = d3.scalePoint()
			.domain(["All others", "ANC"]) // Groups for y-axis
			.range([margin.top, height - margin.bottom])
			.padding(0.5);



		// Draw axis
		const xAxis = d3.axisBottom(xScale)
			.tickValues([-90, -60, -30, -10, 10, 30, 60, 90])
			.tickFormat(d => d > 0 ? `+${d}` : d);

		svg.append("g")
			.attr("transform", `translate(0, ${height - margin.bottom})`)
			.call(xAxis);

		// Add group labels
		svg.append("g")
			.selectAll("text")
			.data(["All others", "ANC"])
			.enter()
			.append("text")
			.attr("x", margin.left - 10)
			.attr("y", d => yScale(d))
			.attr("text-anchor", "end")
			.attr("alignment-baseline", "middle")
			.text(d => d);

		// Draw vertical guideline for "on-time" range
		svg.append("rect")
			.attr("x", xScale(-10))
			.attr("y", margin.top)
			.attr("width", xScale(10) - xScale(-10))
			.attr("height", height - margin.top - margin.bottom)
			.attr("fill", "#e0e0e0")
			.attr("opacity", 0.5);

		// Plot circles for set1
		svg.selectAll(".set1")
			.data(set1)
			.enter()
			.append("circle")
			.attr("class", "set1")
			.attr("cx", d => xScale(d.x))
			.attr("cy", yScale("ANC"))
			.attr("r", 8)
			.attr("fill", "rgba(251, 153, 5, 0.5)");
			

		// Plot circles for set2
		svg.selectAll(".set2")
			.data(set2)
			.enter()
			.append("circle")
			.attr("class", "set2")
			.attr("cx", d => xScale(d.x))
			.attr("cy", yScale("All others"))
			.attr("r", 8)
			.attr("fill", "rgb(0, 0, 0, 0.2)");
	}, [props.data]);

	return <svg ref={chartRef}></svg>;
};

export default MeetingTimes;

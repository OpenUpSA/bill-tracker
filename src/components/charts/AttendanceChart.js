import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

import "./style.scss";

const AttendanceChart = (props) => {
	const chartRefTop = useRef();
	const chartRefBottom = useRef();

	useEffect(() => {
		// Data for ANC and All Others
		const dataANC = [
			{ category: "Attended", value: 2377, color: "#a3e4a3" },
			{ category: "Arrived late", value: 2377, color: "#a377e4" },
			{ category: "Departed", value: 2377, color: "#77a3e4" },
			{ category: "Absent with leave", value: 2377, color: "#f5a377" },
			{ category: "Absent", value: 1251, color: "#e47777" },
		];

		const dataAllOthers = [
			{ category: "Attended", value: 2377, color: "#a3e4a3" },
			{ category: "Arrived late", value: 1188, color: "#a377e4" },
			{ category: "Departed", value: 1188, color: "#77a3e4" },
			{ category: "Absent with leave", value: 594, color: "#f5a377" },
			{ category: "Absent", value: 594, color: "#e47777" },
		];

		// Responsive dimensions
		const renderChart = (ref, data) => {
			const containerWidth = ref.current.parentElement.offsetWidth;
			const width = containerWidth;
			const height = 100;
			const margin = { top: 20, right: 20, bottom: 20, left: 20 };

			const total = d3.sum(data, (d) => d.value);

			d3.select(ref.current).selectAll("*").remove();

			const svg = d3
				.select(ref.current)
				.attr("width", width)
				.attr("height", height);

			const xScale = d3
				.scaleLinear()
				.domain([0, total])
				.range([margin.left, width - margin.right]);

			// Draw stacked bars
			let cumulative = 0;
			svg
				.selectAll("rect")
				.data(data)
				.enter()
				.append("rect")
				.attr("x", (d) => {
					const x = xScale(cumulative);
					cumulative += d.value;
					return x;
				})
				.attr("y", margin.top)
				.attr("width", (d) => xScale(d.value) - xScale(0))
				.attr("height", height - margin.top - margin.bottom)
				.attr("fill", (d) => d.color);

			// Add category labels
			cumulative = 0;
			svg
				.selectAll("text")
				.data(data)
				.enter()
				.append("text")
				.attr("x", (d) => {
					const x = xScale(cumulative + d.value / 2);
					cumulative += d.value;
					return x;
				})
				.attr("y", margin.top - 5)
				.attr("text-anchor", "middle")
				.text((d) => d.category);

			// Add values
			cumulative = 0;
			svg
				.selectAll(".value")
				.data(data)
				.enter()
				.append("text")
				.attr("class", "value")
				.attr("x", (d) => {
					const x = xScale(cumulative + d.value / 2);
					cumulative += d.value;
					return x;
				})
				.attr("y", height / 2)
				.attr("text-anchor", "middle")
				.attr("fill", "white")
				.text((d) => d.value);
		};

		renderChart(chartRefTop, dataANC);
		// renderChart(chartRefBottom, dataAllOthers);
	}, [props.data]);

	return (
		<>
			<svg ref={chartRefTop}></svg>
			{/* <svg ref={chartRefBottom}></svg> */}
		</>
	);
};

export default AttendanceChart;

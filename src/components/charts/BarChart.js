import React, { useRef, useEffect } from "react";
import * as d3 from "d3";


const BarChart = (props) => {

	const chartRef = useRef();
	const [chartData, setChartData] = React.useState([]);
	const [chartData2, setChartData2] = React.useState([]);


	useEffect(() => {

		if (props.data != null) {
			setChartData2(props.data2);
		}

		setChartData(props.data);

		
		


	}, [props.data, props.data2]);

	function secondSet(d) {

		if (chartData2.length > 0) {
			return d.set2 || 0;
		}
		return 0;
	}

	function drawChart() {

		const containerWidth = chartRef.current.parentElement.offsetWidth;
		const width = containerWidth;
		const height = 200;
		const margin = { top: 30, right: 50, bottom: 50, left: 0 };


		d3.select(chartRef.current).selectAll("*").remove();


		const svg = d3
			.select(chartRef.current)
			.attr("width", width)
			.attr("height", height);

		// Scales
		const x = d3
			.scaleBand()
			.domain(chartData.map(d => d.category))
			.range([margin.left, width - margin.right])
			.padding(0.5);

		const y = d3
			.scaleLinear()
			.domain([0, d3.max(chartData, d => Math.max(d.all, secondSet(d)))])
			.nice()
			.range([height - margin.bottom, margin.top]);


		svg
			.append("g")
			.attr("class", "grid")
			.attr("transform", `translate(${margin.left},0)`)
			.call(
				d3
					.axisLeft(y)
					.tickValues(d3.range(0, d3.max(chartData, d => Math.max(d.all, secondSet(d))) + 1, 20))
					.tickSize(-width + margin.right + margin.left)
					.tickFormat("")
			)
			.selectAll(".domain")
			.remove();

		// Axes
		const xAxis = d3.axisBottom(x).tickValues(props.x_scale);
		svg
			.append("g")
			.attr("transform", `translate(0,${height - margin.bottom})`)
			.call(xAxis)
			.selectAll(".domain, .tick line")
			.remove();

		svg
			.append("g")
			.attr("transform", `translate(${width - margin.right},0)`)
			.call(d3.axisRight(y).tickValues(d3.range(0, d3.max(chartData, d => Math.max(d.all, secondSet(d))) + 1, 20)))
			.selectAll(".domain, .tick line")
			.remove();

		// Add Y-axis label
		svg
			.append("text")
			.attr("x", width - margin.right + 30)
			.attr("y", height / 2)
			.attr("fill", "black")
			.attr("text-anchor", "middle")
			.attr("transform", `rotate(-90,${width - margin.right + 40},${height / 2 - 10})`)
			.text(props.y_label);

		// Add X-axis label
		svg
			.append("text")
			.attr("x", width / 2)
			.attr("y", height - margin.bottom + 40)
			.attr("text-anchor", "middle")
			.attr("fill", "black")
			.text(props.x_label);

		// Set1
		svg
			.selectAll(".bar-set1")
			.data(chartData)
			.enter()
			.append("rect")
			.attr("class", "bar-set1")
			.attr("x", d => x(d.category))
			.attr("y", d => y(d.all))
			.attr("width", x.bandwidth())
			.attr("height", d => y(0) - y(d.all))
			.attr("rx", x.bandwidth() * 0.3)
			.attr("ry", x.bandwidth() * 0.3)
			.attr("fill", 'lightgray');

		if (chartData2.length > 0) {
			svg
				.selectAll(".bar-set2")
				.data(chartData2)
				.enter()
				.append("rect")
				.attr("class", "bar-set2")
				.attr("x", d => x(d.category))
				.attr("y", d => y(d.set2))
				.attr("width", x.bandwidth())
				.attr("height", d => y(0) - y(d.set2))
				.attr("rx", x.bandwidth() * 0.3)
				.attr("ry", x.bandwidth() * 0.3)
				.attr("fill", '#fb9905');
		}
	}


	useEffect(() => {

		

		if (chartData.length > 0) {
			drawChart();
		}
	}, [chartData, chartData2]);



	return <svg ref={chartRef}></svg>;
};

export default BarChart;
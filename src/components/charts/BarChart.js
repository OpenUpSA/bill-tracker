import React, { useRef, useEffect } from "react";
import * as d3 from "d3";


const BarChart = (props) => {

	const chartRef = useRef();
	const tooltipRef = useRef();
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
		const height = 190;
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

		svg.selectAll(".grid .tick line")
			.attr("stroke", "#dee2e6")
			.attr("stroke-width", 0.5);

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

		function roundedBarPath(bx, by, bw, bh, rTop, rBottom) {
			rTop = Math.min(rTop, bh / 2, bw / 2);
			rBottom = Math.min(rBottom, bh / 2, bw / 2);
			return `M ${bx + rTop},${by}
				H ${bx + bw - rTop}
				Q ${bx + bw},${by} ${bx + bw},${by + rTop}
				V ${by + bh - rBottom}
				Q ${bx + bw},${by + bh} ${bx + bw - rBottom},${by + bh}
				H ${bx + rBottom}
				Q ${bx},${by + bh} ${bx},${by + bh - rBottom}
				V ${by + rTop}
				Q ${bx},${by} ${bx + rTop},${by} Z`;
		}

		const rTop = x.bandwidth() * 0.15;
		const rBottom = x.bandwidth() * 0.03;

		const tooltip = d3.select(tooltipRef.current);

		function showTooltip(event, d) {
			const allVal = d.all !== undefined
				? d.all
				: (chartData.find(cd => cd.category === d.category) || {}).all || 0;
			const partyVal = (chartData2.find(cd => cd.category === d.category) || {}).set2 || 0;

			const [px, py] = d3.pointer(event, tooltipRef.current.parentElement);

			let html = `<div>All MPs: <strong>${allVal}</strong></div>`;
			if (chartData2.length > 0 && props.party) {
				html += `<div>${props.party}: <strong>${partyVal}</strong></div>`;
			}

			tooltip
				.style("display", "block")
				.style("left", `${px + 12}px`)
				.style("top", `${py - 50}px`)
				.html(html);
		}

		function hideTooltip() {
			tooltip.style("display", "none");
		}

		// Set1
		svg
			.selectAll(".bar-set1")
			.data(chartData)
			.enter()
			.append("path")
			.attr("class", "bar-set1")
			.attr("d", d => roundedBarPath(x(d.category), y(d.all), x.bandwidth(), y(0) - y(d.all), rTop, rBottom))
			.attr("fill", 'lightgray')
			.on("mouseover", showTooltip)
			.on("mousemove", showTooltip)
			.on("mouseout", hideTooltip);

		if (chartData2.length > 0) {
			svg
				.selectAll(".bar-set2")
				.data(chartData2)
				.enter()
				.append("path")
				.attr("class", "bar-set2")
				.attr("d", d => roundedBarPath(x(d.category), y(d.set2), x.bandwidth(), y(0) - y(d.set2), rTop, rBottom))
				.attr("fill", '#fb9905')
				.on("mouseover", showTooltip)
				.on("mousemove", showTooltip)
				.on("mouseout", hideTooltip);
		}
	}


	useEffect(() => {

		if (chartData.length > 0) {
			drawChart();
		}
	}, [chartData, chartData2]);



	return (
		<div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
			<svg ref={chartRef}></svg>
			<div
				ref={tooltipRef}
				style={{
					display: 'none',
					position: 'absolute',
					backgroundColor: '#fbf5ec',
					borderRadius: '5px',
					padding: '8px 10px',
					fontSize: '12px',
					pointerEvents: 'none',
					zIndex: 9999,
					whiteSpace: 'nowrap'
				}}
			/>
		</div>
	);
};

export default BarChart;

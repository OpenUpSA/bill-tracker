

import { Axis } from '@visx/axis';
import { curveNatural } from '@visx/curve';
import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';

export default function BasicLineChart(props) {
    // Define the graph dimensions and margins
    const width = props.width || 800;
    const height = props.height || 500;
    const padding = 50;

    const colors = {
      white: '#FBFBFB',
      black: '#1B1B1B',
      gray: '#EAEAEA',
      darkGray: '#2A2A2A',
      accent: '#D248FF',
      darkAccent: '#5E10FE',
      red: '#B80C09',
      green: '#659B5E',
  };

    // Define the scales of the graph
    // Linear scales are used for continuous data

    // The x scale maps the x values to the width of the graph
    const xScale = scaleLinear({
        // The domain is the range of values the data can take on
        domain: [0, props.data.length - 1], // The first and last x values, here: from 0 to the last index of the data

        // The range is the size of the graph in pixels
        range: [padding, width - padding], // The first and last x pixels
    });

    // The y scale maps the y values to the height of the graph
    const yScale = scaleLinear({
        // The domain is the range of values the data can take on
        domain: [0, Math.max(...props.data.map((d) => d.y)) + 5], // The first and last y values, here: from 0 to the max y value + 5

        // The range is the size of the graph in pixels
        range: [height - padding, padding], // The first and last y pixels
    });

    return (
        // The svg element is the root of the graph
        <svg width={width} height={height}>
            {/* The background of the graph */}
            {/* <rect
                x={0} // The x position of the rectangle
                y={0} // The y position of the rectangle
                width={width} // The width of the rectangle
                height={height} // The height of the rectangle
                 // The fill color of the rectangle
                // rx={14} // rounded corners
            /> */}

            {/* The x axis */}
            {/* <Axis
                orientation="bottom" // The orientation of the axis
                top={height - padding} // The y position of the axis
                scale={xScale} // The scale of the axis
                numTicks={width > 520 ? 10 : 5} // The number of ticks on the axis
                stroke={colors.white} // The color of the axis
                tickStroke={colors.white} // The color of the ticks
                tickLabelProps={() =>
                    // The style of the tick labels
                    ({
                        fill: colors.white, // The color of the tick labels
                        fontSize: 14, // The font size of the tick labels
                        textAnchor: 'middle', // The text anchor of the tick labels
                        verticalAnchor: 'middle', // The vertical anchor of the tick labels
                    })
                }
                hideZero // Hide the zero tick
            /> */}

            {/* The y axis */}
            {/* <Axis
                orientation="left" // The orientation of the axis
                left={padding} // The x position of the axis
                scale={yScale} // The scale of the axis
                numTicks={height > 520 ? 10 : 5} // The number of ticks on the axis
                stroke={colors.white} // The color of the axis
                tickStroke={colors.white} // The color of the ticks
                tickLabelProps={() =>
                    // The style of the tick labels
                    ({
                        fill: colors.white, // The color of the tick labels
                        fontSize: 14, // The font size of the tick labels
                        textAnchor: 'end', // The text anchor of the tick labels
                        verticalAnchor: 'middle', // The vertical anchor of the tick labels
                    })
                }
                hideZero // Hide the zero tick
            /> */}

            {/* The line path */}
            <LinePath
                data={props.data} // The data to map to the line path
                x={(d) => xScale(d.x)} // The x position of the line path
                y={(d) => yScale(d.y)} // The y position of the line path
                stroke='#000' // The color of the line path
                strokeWidth={2} // The width of the line path
                curve={curveNatural} // The curve of the line path
            />
            {/* reference line */}
            <LinePath
                data={[{ x: 0, y: 0 }, { x: props.data.length - 1, y: 0 }]} // The data to map to the line path
                x={(d) => xScale(d.x)} // The x position of the line path
                y={(d) => yScale(d.y)} // The y position of the line path
                stroke='#000' // The color of the line path
                strokeWidth={1} // The width of the line path
                strokeDasharray={'4,4'}
                curve={curveNatural} // The curve of the line path
                
            />
            
        </svg>
    );
}
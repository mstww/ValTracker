import React from 'react';
import { VictoryChart, VictoryArea, VictoryTheme, VictoryAxis } from 'victory';

export default function InfoChart({ label, data }) {
  
  return(
    <>
      <span className='top-1 left-1 absolute'>{ label }</span>
      <div className='ml-4 hub-chart'>
        <svg style={{ height: 0 }}>
          <defs>
            <linearGradient id="myGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor="#c80043" />
              <stop offset="100%" stopColor="#6f00ff" />
            </linearGradient>
          </defs>
        </svg>
        <VictoryChart
          theme={ VictoryTheme.grayscale }
          domainPadding={{ x: [0.5, 0], y: [ 1, 1 ] }}
        >
          <VictoryAxis
            dependentAxis
            style={{
              axis: {
                stroke: 'white'
              },
              tickLabels: {
                fontSize: 18,
                fill: 'white'
              }
            }}
          />
          <VictoryAxis
            tickFormat={(y) => y == 8 ? ('Latest') : (9 - (y))}
            //tickFormat={["8", "7", "6", "5", "4", "3", "2", "Latest"]}
            style={{
              axis: {
                stroke: 'white'
              },
              tickLabels: {
                fontSize: 18,
                fill: 'white'
              }, 
              grid: {
                stroke: 'transparent'
              }
            }}
          />
          <VictoryArea
            interpolation={'monotoneX'}
            style={{ 
              data: { 
                fill: 'url(#myGradient)', 
                fillOpacity: 0.7, 
                stroke: '#ffffff', 
                strokeWidth: 1
              }
            }}
            data={data}
            x="match"
            y="stat"
          />
        </VictoryChart>

      </div>
    </>
  )
}
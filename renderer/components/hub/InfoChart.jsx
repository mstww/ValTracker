import React from 'react';
import { VictoryChart, VictoryArea, VictoryTheme, VictoryAxis } from 'victory';
import { useFirstRender } from '../useFirstRender';

export default function InfoChart({ label, data, LocalLatest }) {
  const firstRender = useFirstRender();

  const [ theme, setTheme ] = React.useState('normal');
  const [ dataRelay, setDataRelay ] = React.useState([]);

  const colors = {
    "normal": {
      "color_1": "#c80043",
      "color_2": "#6f00ff",
      "stroke": "#ffffff",
      "text": "#ffffff"
    },
    "legacy": {
      "color_1": "#c80043",
      "color_2": "#6f00ff",
      "stroke": "#ffffff",
      "text": "#ffffff"
    },
    "light": {
      "color_1": "#2761FF",
      "color_2": "#BB1CFF",
      "stroke": "#000000",
      "text": "#000000"
    },
    "dark": {
      "color_1": "#d61044",
      "color_2": "#832CFF",
      "stroke": "#ffffff",
      "text": "#ffffff"
    }
  }

  React.useEffect(async () => {
    if(!firstRender) {
      try {
        setTheme(document.body.getAttribute("data-theme"));
      } catch(e) {
        console.log(e);
      }
    }
  }, []);
  
  React.useEffect(() => {
    setDataRelay(data);
  }, [ data ]);
  
  return(
    <>
      <span className='top-1 left-1 absolute'>{ label }</span>
      <div className='ml-4 hub-chart'>
        <svg style={{ height: 0 }}>
          <defs>
            <linearGradient id="myGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor={colors[theme].color_1} />
              <stop offset="100%" stopColor={colors[theme].color_2} />
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
                stroke: colors[theme].stroke
              },
              tickLabels: {
                fontSize: 18,
                fill: colors[theme].text
              }
            }}
          />
          <VictoryAxis
            tickFormat={(y) => y == 8 ? (LocalLatest) : (9 - (y))}
            //tickFormat={["8", "7", "6", "5", "4", "3", "2", "Latest"]}
            style={{
              axis: {
                stroke: colors[theme].stroke
              },
              tickLabels: {
                fontSize: 18,
                fill: colors[theme].text
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
                stroke: colors[theme].stroke, 
                strokeWidth: 1
              }
            }}
            data={dataRelay}
            x="match"
            y="stat"
          />
        </VictoryChart>

      </div>
    </>
  )
}
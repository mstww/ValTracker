import { Tooltip } from '@nextui-org/react';

export default function ThemeSelector({ currentTheme, setCurrentTheme }) {
  const themes = [
    {
      "displayName": "Default Theme",
      "name": "default",
      "color": "#12171d"
    },
    {
      "displayName": "Legacy Theme",
      "name": "legacy",
      "color": "#2d2d2d"
    },
    {
      "displayName": "Light Theme",
      "name": "light",
      "color": "#d1d1d1"
    }
  ];

  return (
    <div className="flex flex-row items-center ml-4 mt-2 mb-4">
      <div>
        <span className="text-lg transition-all duration-100 ease-linear inline-block mb-2">Change Color Theme</span> <br />
        <span className={"text-gray-500 mt-2"}>Select a color theme that would like the app to use!</span> 
      </div>
      <div className="ml-auto relative mr-28 w-52 flex flex-row items-center justify-center">
        {
          themes.map((theme, index) => {
            return (
              <Tooltip 
                content={theme.displayName} 
                color="error" 
                placement={'top'} 
                className={(index === 0 ? ' ml-auto ' : '') + (index+1 === themes.length ? '' : ' mr-4 ') + (currentTheme === theme.name ? 'cursor-default' : 'cursor-pointer')}
              >
                <div 
                  className={"w-9 h-9 border-2 rounded " + (currentTheme === theme.name ? 'border-button-color' : 'border-black border-opacity-70')} 
                  style={{ background: theme.color }}
                  onClick={() => { setCurrentTheme(theme.name) }}
                />
              </Tooltip>
            )
          })
        }
      </div>
    </div>
  )
}
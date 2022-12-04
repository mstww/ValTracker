import { Tooltip } from '@nextui-org/react';
import LocalText from '../translation/LocalText';

export default function ThemeSelector({ currentTheme, setCurrentTheme, L }) {
  const themes = LocalText(L, "pg_1.grp_6.setting_1.themes");

  return (
    <div className="flex flex-row items-center ml-4 mt-2 mb-4">
      <div>
        <span className="text-lg transition-all duration-100 ease-linear inline-block mb-2">{LocalText(L,  "pg_1.grp_6.setting_1.name")}</span> <br />
        <span className={"text-gray-500 mt-2"}>{LocalText(L,  "pg_1.grp_6.setting_1.desc")}</span> 
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
                key={index}
              >
                <div 
                  className={"w-9 h-9 border rounded " + (currentTheme === theme.name ? 'border-button-color' : 'border-black border-opacity-70')} 
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
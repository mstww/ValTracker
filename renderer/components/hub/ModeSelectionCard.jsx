export default function ModeSelectionCard({ mode_name, display_name, active, setActive, extraClasses }) {
  return(
    <div 
      className={
        'mode-card-small border-2 rounded-sm mb-1 transition-all duration-100 ease-linear p-1 ' 
        + (extraClasses ? extraClasses : '') 
        + (active == mode_name ? ' border-button-color' : ' border-maincolor-lightest hover:button-border-color-hover cursor-pointer hover:bg-maincolor')
      }
      onClick={() => { setActive(mode_name) }}
    >
      <span className='break-normal'>{display_name}</span>
    </div>
  )
}
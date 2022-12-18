export default function ModeSelectionCard({ mode_name, display_name, active, setActive, extraClasses, id }) {
  return(
    <div 
      className={
        'mode-card-small border rounded mb-1 transition-all duration-100 ease-linear p-1 ' 
        + (extraClasses ? extraClasses : '') 
        + (active == mode_name ? ' border-button-color' : ' border-tile-color hover:button-border-color-hover cursor-pointer hover:bg-opacity-60 bg-tile-color bg-opacity-30')
      }
      id={id}
      onClick={() => { setActive(mode_name) }}
    >
      <span className='break-normal font-light'>{display_name}</span>
    </div>
  )
}
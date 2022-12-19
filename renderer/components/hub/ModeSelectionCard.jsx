export default function ModeSelectionCard({ mode_name, display_name, active, setActive, extraClasses, id }) {
  return(
    <div 
      className={
        'mode-card-small border rounded mb-1 transition-all duration-100 ease-linear p-1 ' 
        + (extraClasses ? extraClasses : '') 
        + (active == mode_name ? 'bg-opacity-20 bg-tile-color border-button-color' : ' border-tile-color hover:button-border-color-hover cursor-pointer hover:bg-opacity-50 bg-tile-color bg-opacity-20 active:bg-opacity-0')
      }
      id={id}
      onClick={() => { setActive(mode_name) }}
    >
      <span className='break-normal font-light'>{display_name}</span>
    </div>
  )
}
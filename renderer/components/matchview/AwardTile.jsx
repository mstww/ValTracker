export default function AwardTile({ icon, rotate_icon, title, desc }) {
  return(
    <div className={'w-full border-2 rounded-sm border-maincolor-lightest mb-2 overflow-hidden p-1 award-tile'}>
      <span className='ml-1.5 relative top-0 flex flex-row'>
        <img src={icon} className={'w-6 relative bottom-px shadow-img ' + (rotate_icon ? 'transform rotate-45' : '')} /> 
        <span className="ml-2 text-lg">{title}</span>
      </span>
      <span className='relative bottom-0 left-1.5 text-gray-400 font-light award-tile-desc'>{desc}</span>
    </div>
  )
}
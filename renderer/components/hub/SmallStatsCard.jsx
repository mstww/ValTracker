export default function SmallStatsCard({ number, desc, extraClasses }) {
  return(
    <div className={'stat-card-small border-2 rounded-sm border-maincolor-lightest ' + (extraClasses ? extraClasses : '')}>
      <h2 className='ml-2 relative top-1'>{ number }</h2>
      <p className='relative bottom-1 ml-2 text-gray-400'>{ desc }</p>
    </div>
  )
}
export default function SmallStatsCard({ number, desc, extraClasses }) {
  return(
    <div className={'stat-card-small border rounded border-maincolor-lightest bg-tile-color bg-opacity-10 ' + (extraClasses ? extraClasses : '')}>
      <h2 className='ml-2 relative top-1 text-xl'>{ number }</h2>
      <p className='relative bottom-1 ml-2 text-gray-500'>{ desc }</p>
    </div>
  )
}
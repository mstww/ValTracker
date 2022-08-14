export default function SmallStatsCard({ img_src, header, win_percent, avg_kda, extraClasses }) {
  return(
    <div className={'w-full border-2 rounded-sm border-maincolor-lightest flex flex-row ' + (extraClasses ? extraClasses : '')}>
      <div className={"p-2 w-1/2"}>
        <img src={img_src} className={'rounded-sm shadow-img'} />
      </div>
      <div className={"stat-card-small"}>
        <h3 className="mt-2 ml-2">{header}</h3>
        <hr className="ml-2" />
        <div className="flex flex-row">
          <div className='w-1/2 ml-2'>
            <h2 className='mt-1'>{win_percent}</h2>
            <p className='relative bottom-2 text-sm text-gray-400'>Win%</p>
          </div>
          <div className='w-1/2 ml-2'>
            <h2 className='mt-1'>{avg_kda}</h2>
            <p className='relative bottom-2 text-sm text-gray-400'>Avg KDA</p>
          </div>
        </div>
      </div>
    </div>
  )
}
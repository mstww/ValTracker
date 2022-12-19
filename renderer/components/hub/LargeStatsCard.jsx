export default function LargeStatsCard({ img_src, header, win_percent, avg_kda, stat_1_locale, stat_2_locale, extraClasses }) {
  return(
    <div className={'w-full border rounded border-tile-color flex flex-row bg-tile-color bg-opacity-10 ' + (extraClasses ? extraClasses : '')}>
      <div className={"p-2 w-1/2"}>
        <img src={img_src} className={'rounded shadow-img'} />
      </div>
      <div className={"stat-card-small"}>
        <h3 className="mt-2 ml-2">{header}</h3>
        <hr className="ml-2" />
        <div className="flex flex-row">
          <div className='w-1/2 ml-2'>
            <h2 className='mt-1 text-xl'>{win_percent}%</h2>
            <p className='relative bottom-2 text-sm text-gray-500'>{stat_1_locale}</p>
          </div>
          <div className='w-1/2 ml-2'>
            <h2 className='mt-1 text-xl'>{avg_kda}</h2>
            <p className='relative bottom-2 text-sm text-gray-500'>{stat_2_locale}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function LargeStatsCard({ img_src, header, win_percent, avg_kda, stat_1_locale, stat_2_locale, extraClasses, loading }) {
  return (
    <div className={'w-full border rounded border-tile-color flex flex-row bg-tile-color bg-opacity-10 ' + (extraClasses ? extraClasses : '')}>
      <div className={"p-2 w-1/2"}>
        <img src={loading ? "/images/map_invisible.png" : img_src} className={`rounded ${loading === true ? "skeleton-img bg-tile-color" : "shadow-img"}`} />
      </div>
      <div className={"stat-card-small"}>
        <h3 className={`mt-2 ml-2 ${loading === true && "skeleton-text"}`}>{loading === true ? "Amogus" : header}</h3>
        <hr className="ml-2" />
        <div className="flex flex-row">
          <div className='w-1/2 ml-2'>
            <h2 className={`mt-1 !h-6 text-xl mb-1 ${loading === true && "skeleton-text"}`}>{loading === true ? "69%" : win_percent + "%"}</h2>
            <p className={`relative !h-[22px] bottom-1 text-sm text-gray-500 ${loading === true && "skeleton-text"}`}>{stat_1_locale}</p>
          </div>
          <div className='w-1/2 ml-2'>
            <h2 className={`mt-1 !h-6 text-xl mb-1 ${loading === true && "skeleton-text"}`}>{loading === true ? "42.0" : avg_kda}</h2>
            <p className={`relative !h-[22px] bottom-1 text-sm text-gray-500 ${loading === true && "skeleton-text"}`}>{stat_2_locale}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
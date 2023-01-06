export default function FLatLargeStatsCard({ extraClasses, img_src, header, top_num, top_desc, stat_1_num, stat_1_desc, stat_2_num, stat_2_desc, stat_3_num, stat_3_desc, loading }) {
  return(
    <div className={'border rounded border-tile-color p-2 flex flex-row bg-tile-color bg-opacity-10 ' + (extraClasses ? extraClasses : '')}>
      <div className="w-full">
        <div className="flex flex-row items-center mb-1 relative">
          <img src={loading === true ? '/agents/omen_black.png' : img_src} className={`h-12 shadow-img ${loading === true && "skeleton-image"}`} />
          <h3 className={`ml-2 font-medium ${loading === true && "skeleton-text"}`}>{loading === true ? "Amogus" : header}</h3>
          <div className="ml-auto">
            <h3 className={`mb-5 h-6 ${loading === true && "skeleton-text"}`}>{loading === true ? "6969" : top_num}</h3>
            <p className={`text-gray-500 absolute h-[22px] bottom-0.5 right-0 ${loading === true && "skeleton-text"}`}>{loading === true ? "Sussy Baka" : top_desc}</p>
          </div>
        </div>
        <hr />
        <div className="flex flex-row">
          <div className='w-1/3 relative top-1'>
            <h2 className={`mt-0.5 h-6 text-xl ${loading === true && "skeleton-text"}`}>{loading === true ? "4.20" : stat_1_num}</h2>
            <p className={`relative h-[22px] text-sm text-gray-500 ${loading === true && "skeleton-text"}`}>{loading === true ? "Sussy Baka" : stat_1_desc}</p>
          </div>
          <div className='w-1/3 relative top-1'>
            <h2 className={`mt-0.5 h-6 text-xl ${loading === true && "skeleton-text"}`}>{loading === true ? "4.20" : stat_2_num}</h2>
            <p className={`relative h-[22px] text-sm text-gray-500 ${loading === true && "skeleton-text"}`}>{loading === true ? "Sussy Baka" : stat_2_desc}</p>
          </div>
          <div className='w-1/3 relative top-1'>
            <h2 className={`mt-0.5 h-6 text-xl ${loading === true && "skeleton-text"}`}>{loading === true ? "69" : stat_3_num}</h2>
            <p className={`relative h-[22px] text-sm text-gray-500 ${loading === true && "skeleton-text"}`}>{loading === true ? "Sussy Baka" : stat_3_desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
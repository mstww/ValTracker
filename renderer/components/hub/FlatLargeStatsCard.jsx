export default function FLatLargeStatsCard({ extraClasses, img_src, header, top_num, top_desc, stat_1_num, stat_1_desc, stat_2_num, stat_2_desc, stat_3_num, stat_3_desc }) {
  return(
    <div className={'border-2 rounded border-maincolor-lightest p-2 flex flex-row mb-3 ' + (extraClasses ? extraClasses : '')}>
      <div className="w-full">
        <div className="flex flex-row items-center mb-1 relative">
          <img src={img_src} className="h-12 shadow-img" />
          <h3 className="ml-2">{header}</h3>
          <div className="ml-auto">
            <h3 className="mb-5">{top_num}</h3>
            <p className='text-gray-500 absolute bottom-1 right-0'>{top_desc}</p>
          </div>
        </div>
        <hr />
        <div className="flex flex-row">
          <div className='w-1/3 relative top-1'>
            <h2 className='mt-1'>{stat_1_num}</h2>
            <p className='relative bottom-2 text-sm text-gray-500'>{stat_1_desc}</p>
          </div>
          <div className='w-1/3 relative top-1'>
            <h2 className='mt-1'>{stat_2_num}</h2>
            <p className='relative bottom-2 text-sm text-gray-500'>{stat_2_desc}</p>
          </div>
          <div className='w-1/3 relative top-1'>
            <h2 className='mt-1'>{stat_3_num}</h2>
            <p className='relative bottom-2 text-sm text-gray-500'>{stat_3_desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function SmallStatsCard({ number, desc, extraClasses, loading }) {
  return(
    <div className={'stat-card-small border rounded border-tile-color bg-tile-color bg-opacity-10 ' + (extraClasses ? extraClasses : '')}>
      <h2 className={`ml-2 !h-[22px] relative top-1 text-xl mb-1 ${loading === true && "skeleton-text"}`}>{ loading === true ? "20.69" : number }</h2>
      <p className={`mb-1 !h-6 ml-2 text-gray-500 ${loading === true && "skeleton-text"}`}>{ loading === true ? "example desc" : desc }</p>
    </div>
  )
}
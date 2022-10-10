export default function SkinTile({ skinImage, skinName, extraClasses, onClick, isOwned, contentTier }) {
  return (
    <div 
      id='skin-tile'
      className= {
        'box-border shadow-lg hover:shadow-2xl border-2 border-separate relative flex flex-col h-24 text-center items-center justify-center bg-tile-color bg-opacity-60 py-4 rounded hover:bg-opacity-100 cursor-pointer transition-colors ease-in duration-100 mb-2 overflow-hidden '
        +
        (extraClasses != '' ? extraClasses : 'border-tile-color')
      }
      onClick={onClick}
    >
      <img src={contentTier} className="absolute top-1 left-1 w-6" />
      <img id='skin-img' className={'shadow-img w-3/4 ' + (!isOwned ? 'opacity-30' : '')} src={ skinImage } />
      <div className={'mt-2 absolute w-full text-center bottom-0 left-0'}>
        <span className={'text-white ' + (!isOwned ? 'text-gray-500' : '')}>{ skinName }</span>
      </div>
    </div>
  )
}
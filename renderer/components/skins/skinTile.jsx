export default function SkinTile({ skinImage, skinName, extraClasses, onClick, isOwned }) {
  return (
    <div 
      id='skin-tile'
      className= {
        'box-border shadow-lg hover:shadow-2xl border-2 border-separate relative flex flex-col h-24 text-center items-center justify-center bg-maincolor-lightest py-4 rounded-sm hover:bg-opacity-70 cursor-pointer transition-colors ease-in duration-100 mb-2 overflow-hidden '
        +
        (extraClasses != '' ? extraClasses : 'border-transparent')
      }
      onClick={onClick}
    >
      <img id='skin-img' className={'shadow-img w-4/5 ' + (!isOwned ? 'opacity-30' : '')} src={ skinImage } />
      <span className={'mt-2 absolute w-full text-center bottom-0 left-0 text-white ' + (!isOwned ? 'text-gray-400' : '')}>{ skinName }</span>
    </div>
  )
}
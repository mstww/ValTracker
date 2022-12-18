import React from "react";
import { Lock } from "../SVGs";

export default function LevelTile({ name, effect, onClick, levelUUID, activeLevel, playerItemsAll, count }) {
  const [ playerItems, setPlayerItems ] = React.useState([]);
  const [ isOwned, setIsOwned ] = React.useState(false);

  React.useEffect(() => {
    for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
      if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "e7c63390-eda7-46e0-bb7a-a6abdacd2433") {
        setPlayerItems(playerItemsAll.EntitlementsByTypes[i].Entitlements);
      }
    }
    // Run through all items, see if chroma is in them, if not, set isOwned to false
    for(var i = 0; i < playerItems.length; i++) {
      if(playerItems[i].ItemID == levelUUID) {
        setIsOwned(true);
        break;
      }
    }
    if(count == 0) {
      setIsOwned(true);
    }
  }, []);

  return (
    <div 
      className={
        "relative w-full h-14 border shadow-lg mb-2 flex flex-col p-px cursor-pointer rounded pl-1 transition-all duration-100 ease-linear bg-tile-color hover:bg-opacity-50 bg-opacity-20 " +
        (levelUUID == activeLevel ? 'border-button-color ' : 'border-tile-color ')
        +
        (isOwned ? ' ' : 'text-gray-500')
      }
      onClick={() => { onClick(levelUUID, isOwned) }}
    >
      <span className="text-lg">{name}</span>
      <span className="text-base font-light">{effect}</span>
      {
        isOwned ?
        ''
        :
        <div className="absolute top-0 bottom-0 right-0 flex justify-center items-center h-full mr-3">
          <Lock className='h-2/4 ml-auto' />
        </div>
      }
    </div>
  )
}
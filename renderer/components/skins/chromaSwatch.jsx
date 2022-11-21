import React from "react";
import { Lock } from "../SVGs";

export default function ChromaSwatch({ image, onClick, chromaUUID, activeChroma, playerItemsAll, baseLevel, count }) {
  const [ playerItems, setPlayerItems ] = React.useState([]);
  const [ playerLevels, setPlayerLevels ] = React.useState([]);
  const [ isOwned, setIsOwned ] = React.useState(false);
  const [ baseLevelOwned, setBaseLevelOwned ] = React.useState(false);

  if(count == 0) 
    var isBaseColor = true;
    
  React.useEffect(() => {
    // Run through all Entitlements to find chroma entitlements
    for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
      if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "3ad1b2b2-acdb-4524-852f-954a76ddae0a") {
        setPlayerItems(playerItemsAll.EntitlementsByTypes[i].Entitlements);
      }
    }
    // RUn through all Entitlements to find out if chroma is owned
    for(var i = 0; i < playerItems.length; i++) {
      if(playerItems[i].ItemID == chromaUUID) {
        setIsOwned(true);
        break;
      }
    }

    // Run through all Entitlements to find level entitlements
    for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
      if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "e7c63390-eda7-46e0-bb7a-a6abdacd2433") {
        setPlayerLevels(playerItemsAll.EntitlementsByTypes[i].Entitlements);
      }
    }
    // Run through all levels to see if base level is owned, if yes, set first chroma to owned.
    for(var i = 0; i < playerLevels.length; i++) {
      if(playerLevels[i].ItemID == baseLevel) {
        setBaseLevelOwned(true);
        break;
      }
    }
    if(baseLevelOwned == true && count == 0) {
      setIsOwned(true);
    }
  });

  return (
    <div 
      className={
        "chroma-swatch w-1/5 border border-button-color shadow-lg cursor-pointer relative rounded " +
        (chromaUUID == activeChroma ? 'border-opacity-100' : 'border-opacity-0')
      }
        onClick={() => { onClick(chromaUUID, isOwned, isBaseColor) }}
    >
      <img src={image} className="rounded" />
      {
        isOwned ?
        ''
        :
        <div className="chroma-swatch-not-owned-overlay absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 items-center justify-center flex rounded">
          <Lock className='w-2/4' />
        </div>
      }
    </div>
  )
}
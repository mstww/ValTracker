import React from "react";
import { Lock } from "../SVGs";

export default function LevelTile({ name, effect, onClick, levelUUID, activeLevel, isOwned }) {
  return (
    <div 
      className={
        "relative w-full h-14 border shadow-lg mb-2 flex flex-col p-px cursor-pointer rounded pl-1 transition-all duration-[0ms] ease-linear bg-tile-color hover:bg-opacity-50 bg-opacity-20 active:bg-opacity-0 " +
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
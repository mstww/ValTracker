import { motion } from "framer-motion"
import React from "react";
import { addSkinToWishlist, rmSkinFromWishlist } from "../js/dbFunctions";
import { StarFilled, Star } from "./SVGs";

const slide_bottom = {
  hidden: { opacity: 0, x: 0, y: 50 },
  enter: { opacity: 1, x: 0, y: 0 },
}

export default function StoreItem({ item, delay, index, clickHandler, shownOverlayUUID, wishlistedItems, setWishlistedItems, userData, wishlistTextLocale, nightMarket, nmDiscount }) {
  const [ isWishlisted, setIsWishlisted ] = React.useState(false);
  const [ wishlistItem, setWishlistItem ] = React.useState({});

  const [ isThisSkinsOverlayShown, setIsThisSkinsOverlayShown ] = React.useState(false);

  React.useEffect(() => {
    for(var i = 0; i < wishlistedItems.length; i++) {
      if(item.uuid === wishlistedItems[i].uuid) {
        setIsWishlisted(true);
        setWishlistItem(wishlistedItems[i]);
        break;
      }
    }
  }, [ item ]);

  React.useEffect(() => {
    if(shownOverlayUUID === item.uuid) {
      setIsThisSkinsOverlayShown(true);
    } else {
      setIsThisSkinsOverlayShown(false);
    }
  }, [ shownOverlayUUID ]);

  const backdrop_variants = {
    hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
    enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
    exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
  }
  
  const card_variants = {
    hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
    enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
    exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
  }

  return(
    <>
      <motion.div 
        className='absolute bottom-0 left-0 w-full h-full flex items-center justify-center z-30 pointer-events-none'
        variants={backdrop_variants}
        initial="hidden"
        animate={isThisSkinsOverlayShown ? 'enter' : 'exit'}
        transition={{ type: 'ease-in', duration: 0.2 }}
      >
        <motion.div 
          className='modal-decoy'
          variants={card_variants}
          initial="hidden"
          animate={isThisSkinsOverlayShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.2 }}
        >
          <div id='levels-chromas' className='absolute bottom-4 left-4 w-64 text-white z-20'>
            <button 
              className={'w-full mt-2 flex flex-row items-center justify-center pointer-events-auto button default ' + (isThisSkinsOverlayShown ? '' : 'hidden')}
              onClick={async () => {
                if(isWishlisted === true) {
                  var wishlist = await rmSkinFromWishlist(wishlistItem);
                  setWishlistedItems(wishlist);
                  setIsWishlisted(false);
                } else {
                  var newItem = {
                    "uuid": item.uuid,
                    "displayName": item.name,
                    "displayIcon": item.image,
                    "price": item.price,
                    "skinTier": item.skinTier,
                    "isMelee": item.isMelee,
                    "wishlistedAt": Date.now()
                  }
                  
                  var result = await addSkinToWishlist(newItem);
  
                  setWishlistedItems(result);
                  setIsWishlisted(true);
                }
              }}
            >
              {
                isWishlisted === true ?
                <StarFilled className='w-5 h-5 mr-1 relative bottom-px cursor-pointer transition-all duration-100 ease-linear' />
                :
                <Star className='w-5 h-5 mr-1 relative bottom-px cursor-pointer transition-all duration-100 ease-linear' />
              }
              {wishlistTextLocale}
            </button>
          </div>
        </motion.div>
      </motion.div>
      <motion.div 
        variants={slide_bottom}
        initial="hidden"
        animate="enter"
        transition={{ type: 'ease', duration: 0.05, delay: delay }}
        id={'item-box'}
        className={'group z-10 h-full relative border border-tile-color bg-tile-color bg-opacity-60 rounded shadow-lg hover:shadow-2xl hover:bg-opacity-100 hover:z-0 transition-all duration-100 ease-in ' + (item ? '' : 'pointer-events-none ') + (nightMarket ? 'w-5/6 mx-auto mb-4' : 'w-1/4 mr-2')}
        onClick={(e) => {
          if(e.target.tagName !== "G" && e.target.tagName !== "SVG" && e.target.tagName !== "LINE" && e.target.tagName !== "g" && e.target.tagName !== "svg" && e.target.tagName !== "line" && e.target.tagName !== "path") {
            clickHandler(item.uuid, item.name, item.price, item.image, item.skinTierImage, index);
          }
        }}
      >
        <div className='absolute bottom-4 left-4 flex flex-row items-center z-30'>
          {
            isWishlisted === true ?
            <StarFilled 
              color
              className='w-6 h-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-100 ease-linear' 
              click={async () => {
                var wishlist = await rmSkinFromWishlist(wishlistItem);
                setWishlistedItems(wishlist);
                setIsWishlisted(false);
              }} 
            />
            :
            <Star 
              color
              className='w-6 h-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-100 ease-linear'
              click={async () => {
                var newItem = {
                  "uuid": item.uuid,
                  "displayName": item.name,
                  "displayIcon": item.image,
                  "price": item.price,
                  "skinTier": item.skinTier,
                  "isMelee": item.isMelee,
                  "wishlistedAt": Date.now()
                }
                
                var result = await addSkinToWishlist(newItem);

                setWishlistedItems(result);
                setIsWishlisted(true);
              }} 
            />
          }
        </div>
        <div className='absolute top-2 z-20 left-2 flex flex-row pr-2'>
          <img src={item.skinTierImage ? item.skinTierImage : '/invisible_weapons/spray.png'} className="w-6 h-6 relative top-px mr-2" />
          <span className="text-lg font-bold">{ item.name }</span>
        </div>
        <div className='flex w-full h-4/5 items-center justify-center mt-6 z-10'>
          <img src={ item.image ? item.image : '/invisible_weapons/vandal.png' } className={'w-4/5 drop-shadow-2xl transition-opacity duration-100 ease-in delay-' + delay} />
        </div>
        <div 
          id='item-price'
          className='text-xl text-gray-300 flex flex-row items-center absolute bottom-4 right-4 bg-opacity-60 bg-black rounded px-2 py-1'
        >
          {nmDiscount ? <span className="text-val-red mr-1.5 relative top-px">{`(${nmDiscount})`}</span> : ''}
          <span id="wallet-vp" className='relative top-px'>{ item.price }</span>
          <img src="/images/vp_icon.png" className='w-7 ml-2' />
        </div>
      </motion.div>
    </>
  )
}
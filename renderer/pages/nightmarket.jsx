import React from 'react';
import moment from 'moment';
import { motion } from "framer-motion"
import { useRouter } from 'next/router';
import fetch from 'node-fetch';
import { Collapse } from '@nextui-org/react';
import L from '../locales/translations/shop.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';
import { BackArrow, Close } from '../components/SVGs';
import Layout from '../components/Layout';
import StoreItem from '../components/StoreItem';
import { useFirstRender } from '../components/useFirstRender';
import { executeQuery, getCurrentPUUID, getCurrentUserData, updateThing } from '../js/dbFunctions';

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

function bundleTimeToHMS(n, o) {
  n = Number(n);
  var d = Math.floor(n / 86400);
  var h = Math.floor((n - d * 86400) / 3600);
  var m = Math.floor(n % 3600 / 60);
  var s = Math.floor(n % 3600 % 60);

  var dDisplay = d > 0 ? d + (d == 1 ? " " + o.d_1 + ", " : " " + o.d_2 + ", ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " " + o.h_1 + ", " : " " + o.h_2 + ", ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " " + o.m_1 + ", " : " " + o.m_2 + ", ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " " + o.s_1 : " " + o.s_2) : "";
  var str = dDisplay + hDisplay + mDisplay + sDisplay;

  if(str.split(",").pop() === ' ') {
    str = str.substring(0, str.lastIndexOf(','));
  }

  return str;
}

function NightMarket({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();
  const firstRender = useFirstRender();

  const [ nightMarket, setNightMarket ] = React.useState([]);
  const [ nightMarketTimer, setNightMarketTimer ] = React.useState(null);
  const [ nightMarketTimerNum, setNightMarketTimerNum ] = React.useState(0);

  const [ showBackground, setShowBackground ] = React.useState(false);
  const [ showCard, setShowCard ] = React.useState(false);

  const [ cardSkinUUID, setCardSkinUUID ] = React.useState('');
  const [ cardSkinName, setCardSkinName ] = React.useState('');
  const [ cardSkinImage, setCardSkinImage ] = React.useState('');
  const [ cardSkinPrice, setCardSkinPrice ] = React.useState('');
  const [ cardSkinChromas, setCardSkinChromas ] = React.useState([]);
  const [ cardSkinLevels, setCardSkinLevels ] = React.useState([]);

  const [ activeCardSkinChroma, setActiveCardSkinChroma ] = React.useState(0);
  const [ activeCardSkinLevel, setActiveCardSkinLevel ] = React.useState(0);

  const [ shopSkins, setShopSkins ] = React.useState({'0': {}, '1': {}, '2': {}, '3': {}, '4': {}, '5': {}});
  const [ skinList, setSkinList ] = React.useState([]);

  const [ wishlistedItems, setWishlistedItems ] = React.useState([]);
  const [ userData, setUserData ] = React.useState({});

  React.useEffect(async () => {
    var user_data = await getCurrentUserData();
    var user_wishlist = await executeQuery(`SELECT * FROM wishlist:⟨${user_data.uuid}⟩`);

    setUserData(user_data);
    setWishlistedItems(user_wishlist[0].skins);
  }, []);

  var localTimerObj = LocalText(L, "timer");

  React.useEffect(async () => {
    const raw_skins = await fetch('https://valorant-api.com/v1/weapons/skins?language=' + APIi18n(router.query.lang));
    const skins = await raw_skins.json();
    setSkinList(skins.data);
  }, []);

  React.useEffect(() => {
    if(router.query.nm_end) {
      var nmTimer = Math.abs(moment().diff(parseInt(router.query.nm_end), 'seconds'));
      setNightMarketTimerNum(nmTimer-1);
      var initialNM = bundleTimeToHMS(nmTimer-1, localTimerObj) + " " + localTimerObj.rem;
      setNightMarketTimer(initialNM);
    }
  }, []);

  React.useEffect(() => {
    if(!firstRender) {
      var timer = setInterval(async () => {
        var new_nm_timer = nightMarketTimerNum - 1;
        setNightMarketTimerNum(new_nm_timer);
        setNightMarketTimer(bundleTimeToHMS(new_nm_timer, localTimerObj) + " " + localTimerObj.rem);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [nightMarketTimerNum]);

  async function fetchSkins() {
    if(router.query.store) {
      var puuid = await getCurrentPUUID();
      var skinTiers = await (await fetch(`https://valorant-api.com/v1/contenttiers`)).json();
      var allSkins = await (await fetch(`https://valorant-api.com/v1/weapons/skins?language=${APIi18n(router.query.lang)}`)).json();

      var data = JSON.parse(router.query.store);
      var skins = [];

      for(var i = 0; i < data.nightMarket.offers.length; i++) {
        var skinUUID = data.nightMarket.offers[i].Offer.Rewards[0].ItemID;

        var raw = await fetch(`https://valorant-api.com/v1/weapons/skinlevels/${data.nightMarket.offers[i].Offer.Rewards[0].ItemID}?language=${APIi18n(router.query.lang)}`, { keepalive: true });
        var skin = await raw.json();

        for(var j = 0; j < allSkins.data.length; j++) {
          if(skinUUID === allSkins.data[j].levels[0].uuid) {
            var tierUUID = allSkins.data[j].contentTierUuid;
            var isMelee = (allSkins.data[j].assetPath.split("/")[3] === 'Melee');
          }
        }
        
        for(var j = 0; j < skinTiers.data.length; j++) {
          if(tierUUID === skinTiers.data[j].uuid && skinTiers.data[j].displayIcon !== null) {
            var skinTierImage = skinTiers.data[j].displayIcon;
          }
        }

        var skin_data = {
          uuid: skin.data.uuid,
          name: skin.data.displayName,
          image: skin.data.displayIcon,
          price: data.nightMarket.offers[i].DiscountCosts[Object.keys(data.nightMarket.offers[i].DiscountCosts)[0]],
          discount: data.nightMarket.offers[i].DiscountPercent,
          seen: data.nightMarket.offers[i].IsSeen,
          isMelee: isMelee,
          skinTierImage: skinTierImage,
        }

        skins.push(skin_data);
      }

      var objectToWrite = {
        skins: skins,
        nightMarketExpiresIn: data.nightMarket.nightMarketExpiresIn,
      }

      var playerStore = await executeQuery(`SELECT * FROM playerStore:⟨${puuid}⟩`);

      await updateThing(`playerStore:⟨${puuid}⟩`, {
        ...playerStore[0],
        nightMarket: objectToWrite
      });

      setNightMarket(skins);
    }
  }

  React.useEffect(async () => {
    var puuid = await getCurrentPUUID();
    var playerStore = await executeQuery(`SELECT nightMarket FROM playerStore:⟨${puuid}⟩`);
    var nightMarket = playerStore[0].nightMarket;
    
    if(Date.now() < nightMarket.expiresIn) {
      setNightMarket(nightMarket.skins);
    } else {
      fetchSkins();
    }
  }, [ router.query ]);

  const showShopSkin = (uuid, name, price, image, index) => {
    setActiveCardSkinChroma(0);
    setActiveCardSkinLevel(0);
    
    setCardSkinName(name);
    setCardSkinUUID(uuid);
    setCardSkinImage(image);
    setCardSkinPrice(price);

    for(var i = 0; i < skinList.length; i++) {
      if(skinList[i].levels[0].uuid == uuid) {
        var skin = skinList[i];
        // Set skin at shopSkins at index position
        setShopSkins({...shopSkins, [index]: skin});
      }
    }

    if(skin) {
      setCardSkinChromas(skin.chromas);
      setCardSkinLevels(skin.levels.reverse());
  
      setShowBackground(true);
      setIsOverlayShown(true);
      setShowCard(true);
    } if(!skin) {
      if(shopSkins[index]) {
        setCardSkinChromas(shopSkins[index].chromas);
        setCardSkinLevels(shopSkins[index].levels);
  
        setShowBackground(true);
        setIsOverlayShown(true);
        setShowCard(true);
      }
    }
  }

  const switchCardChroma = (image, number) => {
    if(number == 0) setActiveCardSkinLevel(0);
    setActiveCardSkinChroma(number);
    setCardSkinImage(image);
  }

  const switchCardLevel = (image, number) => {
    setActiveCardSkinChroma(0);
    setActiveCardSkinLevel(number);
    setCardSkinImage(image);
  }

  return (
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <motion.div 
        className='modal-backdrop'
        variants={backdrop_variants}
        initial="hidden"
        animate={showBackground ? 'enter' : 'exit'}
        transition={{ type: 'ease-in', duration: 0.2 }}
      >
        <motion.div 
          className='modal responsive'
          variants={card_variants}
          initial="hidden"
          animate={showCard ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.2 }}
        > 
          <div 
            className='close-icon-wrapper'
            onClick={() => {
              setShowBackground(false);
              setIsOverlayShown(false);
              setShowCard(false);

              
              setCardSkinUUID('');
              setCardSkinName('');
              setCardSkinImage('');
              setCardSkinPrice('');

              setCardSkinChromas([]);
              setCardSkinLevels([]);

              setActiveCardSkinChroma(0);
              setActiveCardSkinLevel(0);
            }}
          >
            <Close className='w-8 p-1' />
          </div>
          <div 
            className='text-2xl text-gray-300 flex flex-row items-center absolute bottom-4 right-4 bg-opacity-60 bg-black rounded px-4 py-2'
          >
            <span className='relative top-px'>{cardSkinPrice}</span>
            <img src="/images/vp_icon.png" className='w-8 ml-2 transition-opacity duration-100 ease-in' />
          </div>
          <h1 className='z-20 text-2xl font-bold'>{ cardSkinName }</h1>
          <div id='skin-image' className='z-10 bottom-0 left-0 absolute w-full h-full flex justify-center items-center'>
            <img src={ cardSkinImage } className='shadow-img' />
          </div>
          <div id='levels-chromas' className='absolute bottom-16 left-4 w-64 text-white z-20'>
            <div id='chromas' className='flex flex-row justify-between mb-4'>
              {
                cardSkinChromas.length > 1 ? 
                cardSkinChromas.map((chroma, index) => {
                  return (
                    <img 
                      key={index}
                      className={
                        'w-1/5 chroma-swatch border rounded shadow-lg cursor-pointer relative ' 
                        + (activeCardSkinChroma == index ? 'border-button-color' : 'border-maincolor')
                      }
                      src={chroma.swatch}
                      onClick={() => { 
                        switchCardChroma(
                          chroma.displayIcon ? chroma.displayIcon : chroma.fullRender,
                          index
                        );
                      }}
                    />
                  )
                }) : '' 
              }
            </div>
            { cardSkinLevels.length > 1 ?
              <Collapse id='levels-collapse' title={'Levels'}>
                <div id='levels'>
                  { cardSkinLevels.map((level, index) => {
                    return(
                      <div 
                        id='level' 
                        className={
                          'h-14 bg-maincolor-lightest mb-1 relative chroma-swatch rounded w-full border shadow-lg flex flex-col p-px cursor-pointer hover:bg-opacity-70 '
                          + (activeCardSkinLevel == index ? 'border-button-color' : 'border-maincolor')
                        }
                        key={index}
                        onClick={() => { 
                          switchCardLevel(
                            level.displayIcon ? level.displayIcon : cardSkinLevels[cardSkinLevels.length-1].displayIcon, index
                          ) 
                        }}
                      >
                        <span className="text-lg">Level { cardSkinLevels.length - index }</span>
                        <span className="text-base font-light">
                          {
                            level.levelItem ?
                              level.levelItem.split('::').pop()
                            :
                              ''
                          }
                        </span>
                      </div>
                    )
                  }) }
                </div>
              </Collapse>
              : ''
            }
          </div>
        </motion.div>
      </motion.div>
      <div id='back-arrow' className='absolute top-4 right-4 hover:bg-maincolor-lightest rounded cursor-pointer transition-all duration-100 ease-linear' onClick={() => { router.back() }}>
        <BackArrow className='w-8 p-1' />
      </div>
      <div className='absolute top-4 left-4'>
        <h1 className='text-2xl'>{LocalText(L, "night_market_header")} - {nightMarketTimer}</h1>
      </div>
      <div className='night-market-items flex flex-row w-full mx-auto items-center justify-around flex-wrap overflow-hidden'>
        <div className='w-full h-2/3 flex flex-row items-center flex-wrap justify-around'>
          {nightMarket.map((item, index) => {
            return (
              <div className='h-64 mb-4 w-1/3'>
                <StoreItem
                  item={item}
                  delay={`0.${index}`}
                  index={index}
                  clickHandler={() => {showShopSkin(item.uuid, item.name, item.price, item.image, index)}}
                  shownOverlayUUID={cardSkinUUID}
                  wishlistedItems={wishlistedItems}
                  setWishlistedItems={setWishlistedItems}
                  userData={userData}
                  wishlistTextLocale={LocalText(L, "add_to_wishlist")}
                  nightMarket
                  nmDiscount={`${item.discount}%`}
                  key={index}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

export default NightMarket;
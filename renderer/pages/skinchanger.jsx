import React from 'react';
import { useRouter } from 'next/router';
import fetch from 'node-fetch'
import SkinTile from '../components/skins/SkinTile';
import ChromaSwatch from '../components/skins/ChromaSwatch';
import LevelTile from '../components/skins/LevelTile';
import OverlayWrapper from '../components/settings/OverlayWrapper';
import { motion } from 'framer-motion';
import L from '../locales/translations/invchanger.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';
import { BackArrow, Close, Search, Star, StarFilled } from '../components/SVGs';
import Layout from '../components/Layout';
import { executeQuery, getCurrentUserData, getUserAccessToken, getUserEntitlement, addSkinToWishlist } from '../js/dbFunctions';
import { getOffers, setSkins } from '../js/riotAPIFunctions.mjs';

const card_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const fetchSkins = async (weaponType, lang) => {
  try {
    const response = await fetch(`https://valorant-api.com/v1/weapons/${weaponType}?language=${APIi18n(lang)}`, { keepalive: true });
    const json = await response.json();

    return { errored: false, items: json.data.skins };
  } catch(err) {
    return { errored: true, items: err };
  }
}

function SkinTiles({ setActiveSkin, activeSkin, showUnowned, useRef, setLockWishlistButton }) {
  const router = useRouter();
  const weaponType = router.query.weaponType;

  const [ weapons, setWeapons ] = React.useState([]);
  const [ playerItems, setPlayerItems ] = React.useState([]);
  const [ skinTiers, setSkinTiers ] = React.useState([]); 

  if(router.query.playerItems) {
    var playerItemsAll = JSON.parse(router.query.playerItems);
  } else {
    var playerItemsAll = {
      "EntitlementsByTypes": [],
    };
  }

  React.useEffect(() => {
    for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
      if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "e7c63390-eda7-46e0-bb7a-a6abdacd2433") {
        setPlayerItems(playerItemsAll.EntitlementsByTypes[i].Entitlements);
      }
    }

    const fetchApi = async () => {
      const { errored, items } = await fetchSkins(weaponType, router.query.lang);

      if(!errored)
        setWeapons(items);
    }

    setWeapons([]);
    fetchApi();
  }, [ weaponType ]);

  React.useEffect(async () => {
    var skintiers = await(await fetch('https://valorant-api.com/v1/contenttiers?language=' + APIi18n(router.query.lang))).json();
    setSkinTiers(skintiers.data);
  }, [])

  for(var i = 0; i < weapons.length; i++) {
    if(weapons[i].uuid == router.query.usedSkin) {
      weapons.unshift(weapons[i]);
      weapons.splice(i+1, 1);
    }
  }

  return (
    <div ref={useRef}>
      {weapons.map(weapon => {
        var isOwned = false;

        if(weapon.themeUuid == "5a629df4-4765-0214-bd40-fbb96542941f") {
          isOwned = true;
        } else {
          for(var i = 0; i < playerItems.length; i++) {
            if(weapon.themeUuid == "5a629df4-4765-0214-bd40-fbb96542941f") {
              isOwned = true;
              break;
            }
            if(playerItems[i].ItemID == weapon.levels[0].uuid) {
              isOwned = true;
              break;
            }
          }
        }

        for(var i = 0; i < skinTiers.length; i++) {
          if(weapon.contentTierUuid === skinTiers[i].uuid) {
            var contentImage = skinTiers[i].displayIcon;
          }
        }

        return (
          <SkinTile
            key={weapon.displayName.replace(" ", "-")}
            skinImage={
              weapon.themeUuid == '5a629df4-4765-0214-bd40-fbb96542941f' && weaponType ?
              'https://media.valorant-api.com/weapons/' + weaponType + '/displayicon.png' : weapon.levels[0].displayIcon
            }
            skinName={weapon.displayName}
            extraClasses={(activeSkin == weapon.uuid && isOwned ? ' button-border ' : '') + (isOwned ? '' : ' border-none unowned-skin') + (showUnowned && !isOwned ? 'shown' : '')}
            onClick={() => {
              setActiveSkin(weapon.uuid);
              setLockWishlistButton(false);
            }}
            isOwned={isOwned}
            contentTier={contentImage}
          />
        )
      })}
    </div>
  );
}

function Skinchanger({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();

  const [ skinData, setSkinData ] = React.useState([]);

  const [ shownSkin, setShownSkin ] = React.useState('');
  const [ activeSkinImage, setActiveSkinImage ] = React.useState('');
  const [ activeSkinLevels, setActiveSkinLevels ] = React.useState([]);
  const [ activeSkinChromas, setActiveSkinChromas ] = React.useState([]);
  const [ activeSkinPrice, setActiveSkinPrice ] = React.useState(0);

  const [ activeChroma, setActiveChroma ] = React.useState('');
  const [ activeLevel, setActiveLevel ] = React.useState('');

  const [ ingameSkin, setIngameSkin ] = React.useState('');
  const [ ingameChroma, setIngameChroma ] = React.useState('');
  const [ ingameLevel, setIngameLevel ] = React.useState('');
  const [ ingameSkinImage, setIngameSkinImage ] = React.useState('');
  const [ ingameChromas, setIngameChromas ] = React.useState([]);
  const [ ingameLevels, setIngameLevels ] = React.useState([]);
  const [ ingameVideo, setIngameVideo ] = React.useState('');

  const [ showSetSkinButton, setShowSetSkinButton ] = React.useState(true);
  const [ showWishlistButton, setShowWishlistButton ] = React.useState(false);
  const [ lockWishlistButton, setLockWishlistButton ] = React.useState(true);

  const [ showUnownedSkins, setShowUnownedSkins ] = React.useState(false);

  const [ currentSkinSearch, setCurrentSkinSearch ] = React.useState('');
  const skinTilesRef = React.useRef(null);

  const [ setSkinSuccess, setSetSkinSuccess ] = React.useState(false);

  const [ ownedLevelCount, setOwnedLevelCount ] = React.useState(0);

  const overlayRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const [ showVideo, setShowVideo ] = React.useState(false);
  const [ isVideoAvailable, setIsVideoAvailable ] = React.useState(false);

  const [ isWishlisted, setIsWishlisted ] = React.useState(false);
  const [ wishlistPosition, setWishlistPosition ] = React.useState(null);
  const [ wishlistedItems, setWishlistedItems ] = React.useState([]);
  const [ userData, setUserData ] = React.useState({});

  const [ skinPrices, setSkinPrices ] = React.useState([]);

  if(router.query.playerItems) {
    var playerItemsAll = JSON.parse(router.query.playerItems);
  } else {
    var playerItemsAll = {
      "EntitlementsByTypes": [],
    };
  }

  React.useEffect(() => {
    if(showVideo == false && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [ showVideo ]);

  React.useEffect(async () => {
    var skin_data = await(await fetch(`https://valorant-api.com/v1/weapons/skins?language=${APIi18n(router.query.lang)}` , { keepalive: true })).json();

    var user_data = await getCurrentUserData();
    var bearer = await getUserAccessToken();

    var entitlement_token = await getUserEntitlement();
    var skinPriceData = await getOffers(user_data.region, entitlement_token, bearer);

    setSkinPrices(skinPriceData.Offers);

    if(videoRef.current) {
      videoRef.current.volume = 0.3;
    }

    setSkinData(skin_data.data);
    setShownSkin(router.query.usedSkin);

    setIngameSkin(router.query.usedSkin);
    setIngameChroma(router.query.usedChroma);
    setIngameLevel(router.query.usedLevel);

    var chromaUUID = router.query.usedChroma;
    for(var i = 0; i < skin_data.data.length; i++) {
      if(skin_data.data[i].uuid == router.query.usedSkin) {
        setIngameChromas(skin_data.data[i].chromas);
        for(var j = 0; j < skin_data.data[i].chromas.length; j++) {
          if(skin_data.data[i].chromas[j].uuid == chromaUUID) {
            setIngameSkinImage(skin_data.data[i].chromas[j].fullRender);
            setActiveChroma(chromaUUID);
            setActiveLevel(skin_data.data[i].levels[skin_data.data[i].levels.length -1].uuid);
            if(skin_data.data[i].chromas[j].streamedVideo != null) {
              setIsVideoAvailable(true);
              videoRef.current.src = skin_data.data[i].chromas[j].streamedVideo;
              setIngameVideo(skin_data.data[i].chromas[j].streamedVideo);
            }
            setTimeout(() => {
              setActiveSkinImage(skin_data.data[i].chromas[j].fullRender);
            }, 10);
          }
        }
      }
    }

    var levelUUID = router.query.usedLevel;
    for(var i = 0; i < skin_data.data.length; i++) {
      if(skin_data.data[i].uuid == router.query.usedSkin) {
        setIngameLevels(skin_data.data[i].levels);
        for(var j = 0; j < skin_data.data[i].levels.length; j++) {
          if(skin_data.data[i].levels[j].uuid == levelUUID) {
            setActiveSkinImage(skin_data.data[i].levels[0].displayIcon);
            if(skin_data.data[i].levels[j].streamedVideo != null) {
              setIsVideoAvailable(true);
              videoRef.current.src = skin_data.data[i].levels[j].streamedVideo;
              setIngameVideo(skin_data.data[i].levels[j].streamedVideo);
            }
            setTimeout(() => {
              setActiveLevel(levelUUID);
            }, 10);
          }
        }
      }
    }

    changeSkinLevel(router.query.usedLevel);
  }, [ router.query ]);

  React.useEffect(() => {
    if(shownSkin != '' && router.query.usedSkin) {
      setActiveSkinImage('');
      setActiveSkinChromas([]);
      setActiveSkinLevels([]);
      setActiveSkinPrice(0);
      setOwnedLevelCount(0);
      setIsVideoAvailable(false);
      setShowWishlistButton(false);
      videoRef.current.src = '';

      if(shownSkin == ingameSkin) {
        setActiveSkinImage(ingameSkinImage);
        setActiveChroma(ingameChroma);
        setShowSetSkinButton(false);
        setShowWishlistButton(false);

        for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
          if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "e7c63390-eda7-46e0-bb7a-a6abdacd2433") {
            var playerItems = playerItemsAll.EntitlementsByTypes[i].Entitlements;
          }
        }

        var j = 0;
        ingameLevels.forEach(level => {
          for(var i = 0; i < playerItems.length; i++) {
            if(playerItems[i].ItemID == level.uuid) {
              j = j+1;
              break;
            }
          }
        });
        setOwnedLevelCount(j-1);
        
        setActiveLevel(ingameLevel);
        setActiveSkinLevels(ingameLevels);
        setActiveSkinChromas(ingameChromas);
      
        for(var i = 0; i < skinPrices.length; i++) {
          if(skinPrices[i].Rewards[0].ItemID === ingameLevels[0].uuid) {
            var price = skinPrices[i].Cost['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'];
          }
        }

        setActiveSkinPrice(price);
        videoRef.current.src = ingameVideo;
        if(ingameVideo != '') {
          setIsVideoAvailable(true);
        }
      } else {
        for(var i = 0; i < skinData.length; i++) {
          if(skinData[i].uuid == shownSkin) {
            var skin_data = skinData[i];
          }
        }
  
        setActiveSkinImage(skin_data.chromas[0].fullRender); 
        setActiveChroma(skin_data.chromas[0].uuid);
        
        setActiveSkinLevels(skin_data.levels);
        setActiveSkinChromas(skin_data.chromas);
      
        for(var i = 0; i < skinPrices.length; i++) {
          if(skinPrices[i].Rewards[0].ItemID === skin_data.levels[0].uuid) {
            var price = skinPrices[i].Cost['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'];
          }
        }

        setActiveSkinPrice(price);
        // Just check if base level is owned
        var baseLevel = skin_data.levels[0].uuid;
        var levels = skin_data.levels;
        var playerItems;
        var isOwned = false;
        for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
          if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "e7c63390-eda7-46e0-bb7a-a6abdacd2433") {
            playerItems = playerItemsAll.EntitlementsByTypes[i].Entitlements;
          }
        }
        if(playerItems) {
          var j = 0;
          // Run through all items, see if chroma is in them, if not, set isOwned to false
          for(var i = 0; i < playerItems.length; i++) {
            if(playerItems[i].ItemID == baseLevel) {
              isOwned = true;
              break;
            }
          }
          if(isOwned == true) {
            levels.forEach(level => {
              for(var i = 0; i < playerItems.length; i++) {
                if(playerItems[i].ItemID == level.uuid) {
                  j = j+1;
                  break;
                }
              }
            });
            setOwnedLevelCount(j-1);
            setShowSetSkinButton(true);
            setShowWishlistButton(false);
            isOwned = false;
          } else {
            setShowSetSkinButton(false);
            setShowWishlistButton(true);
          }
          if(skin_data.themeUuid == "5a629df4-4765-0214-bd40-fbb96542941f") {
            setShowSetSkinButton(true);
            setShowWishlistButton(false);
          }
          if(j > 0) {
            setActiveLevel(skin_data.levels[j-1].uuid);
            if(skin_data.chromas[0].streamedVideo != null) {
              setIsVideoAvailable(true);
              videoRef.current.src = skin_data.chromas[0].streamedVideo;
            }
            if(skin_data.levels[j-1].streamedVideo != null) {
              setIsVideoAvailable(true);
              videoRef.current.src = skin_data.levels[j-1].streamedVideo;
            }
          } else {
            setActiveLevel(skin_data.levels[0].uuid);
            if(skin_data.chromas[0].streamedVideo != null) {
              setIsVideoAvailable(true);
              videoRef.current.src = skin_data.chromas[0].streamedVideo;
            }
            if(skin_data.levels[0].streamedVideo != null) {
              setIsVideoAvailable(true);
              videoRef.current.src = skin_data.levels[0].streamedVideo;
            }
          }
        }
      }
    }
  }, [ shownSkin ]);
  
  const changeSkinChroma = (chromaUUID, isOwned, isBaseColor) => {
    setShowSetSkinButton(isOwned);

    if(chromaUUID == ingameChroma) {
      setShowSetSkinButton(false);
      setShowWishlistButton(false);
    }
    if(skinData) {
      for(var i = 0; i < skinData.length; i++) {
        if(skinData[i].uuid == shownSkin || skinData[i].uuid == router.query.usedSkin) {
          for(var j = 0; j < skinData[i].chromas.length; j++) {
            if(skinData[i].chromas[j].uuid == chromaUUID) {
              setActiveSkinImage(skinData[i].chromas[j].fullRender);
              setActiveChroma(chromaUUID);
              if(skinData[i].chromas[j].streamedVideo != null) {
                setIsVideoAvailable(true);
                videoRef.current.src = skinData[i].chromas[j].streamedVideo;
              }
              if(isBaseColor) {
                setActiveLevel(skinData[i].levels[ownedLevelCount].uuid);
                if(skinData[i].levels[ownedLevelCount].streamedVideo) {
                  setIsVideoAvailable(true);
                  videoRef.current.src = skinData[i].levels[ownedLevelCount].streamedVideo;
                }
              } else {
                setActiveLevel(skinData[i].levels[skinData[i].levels.length -1].uuid);
              }
            }
          }
        }
      }
    }
  }

  const changeSkinLevel = (levelUUID, isOwned) => {
    setShowSetSkinButton(isOwned);

    if(levelUUID == ingameLevel && ingameChroma == activeChroma) {
      setShowSetSkinButton(false);
      setShowWishlistButton(false);
    }

    if(skinData) {
      for(var i = 0; i < skinData.length; i++) {
        if(skinData[i].uuid == shownSkin) {
          for(var j = 0; j < skinData[i].levels.length; j++) {
            if(skinData[i].levels[j].uuid == levelUUID) {
              setActiveSkinImage(skinData[i].levels[0].displayIcon);
              setActiveLevel(levelUUID);
              setActiveChroma(skinData[i].chromas[0].uuid);
              if(skinData[i].levels[j].streamedVideo != null) {
                setIsVideoAvailable(true);
                videoRef.current.src = skinData[i].levels[j].streamedVideo;
              }
            }
          }
        }
      }
    }
  }

  const toggleUnownedSkins = (event) => {
    if(event.target.checked == false) {
      setShowUnownedSkins(false);
    } else {
      if(currentSkinSearch == '') {
        setShowUnownedSkins(!showUnownedSkins);
      } else {
        var searchstring = currentSkinSearch.toLowerCase();
        var elements = skinTilesRef.current.children;
        for(var i = 0; i < elements.length; i++) {
          if(elements[i].innerText.toLowerCase().includes(searchstring)) {
            elements[i].classList.add('shown');
          }
        }
      }
    }
  }

  const handlePlayerSearch = (event) => {
    setCurrentSkinSearch(event.target.value);
    var skins = skinTilesRef.current.children;
    for(var i = 0; i < skins.length; i++) {
      if(skins[i].lastChild.innerText.toLowerCase().includes(event.target.value.toLowerCase())) {
        if(skins[i].classList.contains('unowned-skin')) {
          if(!showUnownedSkins) {
            skins[i].classList.remove('shown');
          } else {
            skins[i].classList.add('shown');
          }
        } else {
          skins[i].style.display = 'flex';
        }
      } else {
        if(skins[i].classList.contains('unowned-skin')) {
          skins[i].classList.remove('shown');
        } else {
          skins[i].style.display = 'none';
        }
      }
    }
  }

  const setSkin = async () => {
    var weapon = router.query.weaponType;
    var skin = shownSkin;
    var level = activeLevel;
    var chroma = activeChroma;

    var inventory_raw = await executeQuery(`SELECT * FROM inventory:current`);
    var inventory = inventory_raw[0];

    for(var i = 0; i < inventory.Guns.length; i++) {
      if(inventory.Guns[i].ID == weapon) {
        inventory.Guns[i].SkinID = skin;
        inventory.Guns[i].SkinLevelID = level;
        inventory.Guns[i].ChromaID = chroma;
      }
    }

    var user_creds = await getCurrentUserData();

    var region = user_creds.region;
    var bearer = await getUserAccessToken();
    var entitlement_token = await getUserEntitlement();

    await setSkins(region, inventory.Subject, entitlement_token, bearer, inventory);

    setIngameSkin(skin);
    setIngameChroma(level);
    setIngameLevel(chroma);

    setSetSkinSuccess(true);

    setTimeout(() => {
      setSetSkinSuccess(false);
      setShowSetSkinButton(false);
      setShowWishlistButton(false);
    }, 2000);
  }

  React.useEffect(async () => {
    var user_data = await getCurrentUserData();
    var user_wishlist = await executeQuery(`SELECT * FROM wishlist:⟨${user_data.uuid}⟩`);

    setUserData(user_data);
    setWishlistedItems(user_wishlist[0].skins);
  }, []);

  React.useEffect(() => {
    if(activeSkinPrice === null || activeSkinPrice === undefined || activeSkinPrice === 0) {
      setShowWishlistButton(false);
    }
  }, [ activeSkinPrice ]);

  return ( 
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <OverlayWrapper useRef={overlayRef} isShown={showVideo}>
        <motion.div 
          className='w-2/3 mb-8 flex flex-col z-30 pointer-events-auto justify-between card'
          variants={card_variants}
          initial="hidden"
          animate={ showVideo ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.2 }}
        > 
          <div 
            className='close-icon-wrapper'
            onClick={() => { setShowVideo(false) }}
          >
            <Close className='w-8 p-1' />
          </div>
          <video ref={videoRef} src={''} type="video/mp4" controls className='rounded ml-px' />
        </motion.div>
      </OverlayWrapper>
      <div 
        className='absolute top-4 right-4 hover:bg-tile-color rounded cursor-pointer transition-all duration-[0ms] ease-linear' 
        onClick={() => { router.back() }}
      >
        <BackArrow className='w-8 p-1' />
      </div>
      <div className='flex flex-row h-full'>
        <div id='skin-selector' className='h-full w-1/5 p-4 overflow-hidden'>
          <div className='relative'>
            <input 
              id='skin-search'
              type='text'
              className='bg-button-color focus:outline-none text-sm z-20 pl-8 ml-1 font-light group-hover:bg-button-color-hover hover:bg-button-color-hover flex items-center py-1 rounded cursor-pointer outline-none mx-auto transition-all ease-in duration-[0ms] w-full h-8 pr-2'
              placeholder={LocalText(L, "skins.search_placeholder")}
              onKeyUp={handlePlayerSearch}
              autoCorrect='off'
              spellCheck='false'
            >
            </input>
            <Search className='absolute top-2 left-2 ml-0.5 w-4' />
          </div>
          <div className='relative mt-4 flex flew-row items-center'>
            <label className="switch">
              <input type="checkbox" className='group' name="open-valtracker" onClick={toggleUnownedSkins} />
              <span className="slider round my-auto bg-maincolor-dark group-hover:bg-tile-color group-checked:bg-tile-color group-checked:group-hover:bg-button-color-hover" />
            </label>
            <span className='ml-2 text-sm'>{LocalText(L, "skins.switch_label")}</span>
          </div>
          <div id='skin-list' className='mt-4 overflow-y-auto pr-1'>
            <SkinTiles setActiveSkin={setShownSkin} activeSkin={shownSkin} useRef={skinTilesRef} showUnowned={showUnownedSkins} setLockWishlistButton={setLockWishlistButton} />
          </div>
        </div>
        <div id='skin-viewer' className='h-full w-4/5 flex flex-row items-center justify-center'>
          <div className={'h-full w-1/3 flex flex-col justify-center'}>
            <div id='levels-chroma-changer' className='w-full'>
              <div id='chromas' className='mb-2'>
                <div className='flex flex-row items-center justify-between'>
                  {activeSkinChromas.map((chroma, index) => {
                    if(activeSkinChromas.length > 1) {
                      return (
                        <ChromaSwatch
                          onClick={changeSkinChroma} 
                          image={chroma.swatch} 
                          chromaUUID={chroma.uuid} 
                          activeChroma={activeChroma} 
                          key={chroma.uuid}
                          playerItemsAll={playerItemsAll}
                          count={index}
                          baseLevel={activeSkinLevels[0].uuid}
                        />
                      )
                    }
                  })}
                </div>
              </div>
              <div id='levels'>
                {activeSkinLevels.slice(0).reverse().map((level, index) => {
                  for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
                    if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "e7c63390-eda7-46e0-bb7a-a6abdacd2433") {
                      var isOwned = playerItemsAll.EntitlementsByTypes[i].Entitlements.find(x => x.ItemID === level.uuid);
                    }
                  }
                  if(activeSkinLevels.length > 1) {
                    return (
                      <LevelTile
                        name={'Level ' + (activeSkinLevels.length - parseInt(index))} 
                        effect={level.levelItem ? level.levelItem.split('::').pop() : ''} 
                        levelUUID={level.uuid}
                        activeLevel={activeLevel}
                        onClick={changeSkinLevel}
                        key={level.uuid}
                        isOwned={isOwned !== undefined}
                      />
                    )
                  }
                })}
              </div>
              <div className='flex flex-row justify-around items-center'>
                <button 
                  onClick={() => { setSkin() }} 
                  className={'w-full h-12 mt-2 block button highlight ' 
                  + (showSetSkinButton ? '' : 'hidden') 
                  + (setSkinSuccess ? ' highlight-green' : '')}
                  id='equip-skin-button'
                >
                  {setSkinSuccess ? LocalText(L, "skins.equip_button.state_2") : LocalText(L, "skins.equip_button.state_1")}
                </button>
                <button 
                  onClick={() => { 
                    setShowVideo(true);
                  }} 
                  className={'button text w-full h-12 mt-2 mb-2 relative top-1 block ' + (isVideoAvailable ? '' : 'hidden')}
                >
                  {LocalText(L, "skins.video_button")}
                </button>
              </div>
              <div className='flex flex-row w-full mt-2'>
                <button 
                  className={'w-2/3 mr-2 flex flex-row items-center justify-center button default ' + (showWishlistButton === true && lockWishlistButton === false ? '' : 'hidden')}
                  onClick={async () => {
                    if(isWishlisted === true) {
                      var wishlist = await rmSkinFromWishlist(wishlistedItems[wishlistPosition]);
                      setWishlistedItems(wishlist);
                      setIsWishlisted(false);
                    } else {
                      var item = activeSkinLevels[0];
                      for(var i = 0; i < skinPrices.length; i++) {
                        if(skinPrices[i].Rewards[0].ItemID === item.uuid) {
                          var price = skinPrices[i].Cost['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741']
                        }
                      }

                      var newItem = {
                        "uuid": item.uuid,
                        "displayName": item.displayName,
                        "displayIcon": item.displayIcon,
                        "price": price,
                        "wishlistedAt": Date.now()
                      }
                      
                      var result = await addSkinToWishlist(newItem);
      
                      setWishlistedItems(result);
                      setIsWishlisted(true);
                      setWishlistPosition(result.length-1);
                    }
                  }}
                >
                  {
                    isWishlisted === true ?
                    <StarFilled className='w-5 h-5 mr-1 relative bottom-px shadow-img group-hover:block cursor-pointer transition-all duration-[0ms] ease-linear' />
                    :
                    <Star className='w-5 h-5 mr-1 relative bottom-px shadow-img group-hover:block cursor-pointer transition-all duration-[0ms] ease-linear' />
                  }
                  {LocalText(L, "skins.wishlist_button")}
                </button>
                {
                  activeSkinPrice ? 
                  <div className={'flex flex-row items-center text-center bg-tile-color bg-opacity-10 border border-tile-color rounded py-2 ' + (showWishlistButton === true && lockWishlistButton === false ? 'w-1/3' : 'w-full')}>
                    <span className='flex flex-row w-full text-center items-center justify-center'>{activeSkinPrice} <img src='/images/vp_icon.png' className='w-6 ml-1' /></span>
                  </div>
                  :
                  null
                }
              </div>
            </div>
          </div>
          <div className='flex flex-row items-center justify-center w-3/4 mx-auto' id='skin-img'>
            <img src={activeSkinImage ? activeSkinImage : '/images/vandal_invisible.png'} className={activeSkinImage ? 'shadow-img w-3/5' : 'w-1/6'} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Skinchanger;
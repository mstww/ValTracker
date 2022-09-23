import React from 'react';
import { useRouter } from 'next/router';
import fetch from 'node-fetch'
import SkinTile from '../components/skins/SkinTile';
import fs from 'fs';
import L from '../locales/translations/invchanger.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';
import { BackArrow, Search } from '../components/SVGs';

async function setSkins(region, puuid, entitlement_token, bearer, loadout) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/personalization/v2/players/${puuid}/playerloadout`, {
    method: 'PUT',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
      "Content-Type": "application/json",
    },
    "body": JSON.stringify(loadout),
    keepalive: true
  })).json());
}

const fetchCards = async (lang) => {
  try {
    const response = await fetch(`https://valorant-api.com/v1/playercards?language=${APIi18n(lang)}`, { keepalive: true });
    const json = await response.json();

    return { errored: false, items: json.data };
  } catch(err) {
    return { errored: true, items: err };
  }
}

function SkinTiles({ setActiveSkin, activeSkin, showUnowned, useRef }) {
  const router = useRouter();
  const weaponType = router.query.weaponType;

  const [ weapons, setWeapons ] = React.useState([]);
  const [ playerItems, setPlayerItems ] = React.useState([]);

  if(router.query.playerItems) {
    var playerItemsAll = JSON.parse(router.query.playerItems);
  } else {
    var playerItemsAll = {
      "EntitlementsByTypes": [],
    };
  }

  React.useEffect(() => {
    for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
      if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "3f296c07-64c3-494c-923b-fe692a4fa1bd") {
        setPlayerItems(playerItemsAll.EntitlementsByTypes[i].Entitlements);
      }
    }

    const fetchApi = async () => {
      const { errored, items } = await fetchCards(router.query.lang);

      if(!errored)
        setWeapons(items);
    }

    setWeapons([]);
    fetchApi();
  }, [ weaponType ]);

  for(var i = 0; i < weapons.length; i++) {
    if(weapons[i].uuid == router.query.usedCard) {
      weapons.unshift(weapons[i]);
      weapons.splice(i+1, 1);
    }
  }

  return (
    <div ref={useRef}>
      {weapons.map(weapon => {
        var isOwned = false;
        for(var i = 0; i < playerItems.length; i++) {
          if(playerItems[i].ItemID == weapon.uuid) {
            isOwned = true;
            break;
          }
        }
        return (
          <SkinTile
            key={weapon.displayName.replace(" ", "-")}
            skinImage={
              weapon.wideArt
            }
            skinName={weapon.displayName}
            extraClasses={(activeSkin == weapon.uuid && isOwned ? ' border-button-color border-2 ' : '') + (isOwned ? '' : ' border-none unowned-skin') + (showUnowned && !isOwned ? 'shown' : '')}
            onClick={
              () => {setActiveSkin(weapon.uuid)}
            }
            isOwned={isOwned}
          />
        )
      })}
    </div>
  );
}

function Cardchanger() {
  const router = useRouter();

  const [ skinData, setSkinData ] = React.useState([]);

  const [ shownSkin, setShownSkin ] = React.useState('');
  const [ activeSmallArt, setActiveSmallArt ] = React.useState('');
  const [ activeWideArt, setActiveWideArt ] = React.useState('');
  const [ activeLargeArt, setActiveLargeArt ] = React.useState('');

  const [ ingameSkin, setIngameSkin ] = React.useState('');

  const [ showSetSkinButton, setShowSetSkinButton ] = React.useState(true);

  const [ showUnownedSkins, setShowUnownedSkins ] = React.useState(false);

  const [ currentSkinSearch, setCurrentSkinSearch ] = React.useState('');
  const skinTilesRef = React.useRef(null);

  const [ setSkinSuccess, setSetSkinSuccess ] = React.useState(false);

  if(router.query.playerItems) {
    var playerItemsAll = JSON.parse(router.query.playerItems);
  } else {
    var playerItemsAll = {
      "EntitlementsByTypes": [],
    };
  }

  // Fetch data for ALL skins once, then load from cache

  React.useEffect(async () => {
    var skin_data = await(await fetch(`https://valorant-api.com/v1/playercards?language=${APIi18n(router.query.lang)}`, { keepalive: true })).json();

    setSkinData(skin_data.data);
    setShownSkin(router.query.usedCard);
    setIngameSkin(router.query.usedCard);
    setShowSetSkinButton(false);
  }, [ router.query ]);

  React.useEffect(() => {
    if(shownSkin != '' && router.query.usedCard) {
      if(shownSkin == ingameSkin) {
        setActiveSmallArt(`https://media.valorant-api.com/playercards/${router.query.usedCard}/smallart.png`);
        setActiveWideArt(`https://media.valorant-api.com/playercards/${router.query.usedCard}/wideart.png`);
        setActiveLargeArt(`https://media.valorant-api.com/playercards/${router.query.usedCard}/largeart.png`);
        setShowSetSkinButton(false);
      } else {
        for(var i = 0; i < skinData.length; i++) {
          if(skinData[i].uuid == shownSkin) {
            var skin_data = skinData[i];
          }
        }
        
        setActiveSmallArt(skin_data.smallArt);
        setActiveWideArt(skin_data.wideArt);
        setActiveLargeArt(skin_data.largeArt);
        var baseLevel = skin_data.uuid;
        var playerItems;
        var isOwned = false;
        for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
          if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "3f296c07-64c3-494c-923b-fe692a4fa1bd") {
            playerItems = playerItemsAll.EntitlementsByTypes[i].Entitlements;
          }
        }
        if(playerItems) {
          for(var i = 0; i < playerItems.length; i++) {
            if(playerItems[i].ItemID == baseLevel) {
              isOwned = true;
              break;
            }
          }
          if(isOwned == true) {
            setShowSetSkinButton(true);
            isOwned = false;
          } else {
            setShowSetSkinButton(false);
          }
          if(skin_data.themeUuid == "5a629df4-4765-0214-bd40-fbb96542941f") {
            setShowSetSkinButton(true);
          }
        }
      }
    }
  }, [ shownSkin ]);

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
    var skin = shownSkin;

    var inventory_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/current_inventory.json');
    var inventory = JSON.parse(inventory_raw);

    inventory.Identity.PlayerCardID = skin;

    var tokenData_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
    var tokenData = JSON.parse(tokenData_raw);

    var user_creds_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
    var user_creds = JSON.parse(user_creds_raw);

    var region = user_creds.playerRegion;
    var bearer = tokenData.accessToken;

    var entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;;
    await setSkins(region, inventory.Subject, entitlement_token, bearer, inventory);

    setIngameSkin(skin);
    setSetSkinSuccess(true);

    setTimeout(() => {
      setSetSkinSuccess(false);
      setShowSetSkinButton(false);
    }, 2000);
  }

  return ( 
    <>
      <div className='absolute top-4 z-10 right-4 hover:bg-maincolor-lightest rounded cursor-pointer transition-all duration-100 ease-linear' onClick={() => { router.back() }}>
        <BackArrow cls='w-8 p-1 shadow-img' />
      </div>
      <div className='flex flex-row h-full relative'>
        <div id='skin-selector' className='relative h-full w-1/5 p-4 overflow-hidden'>
          <div className='relative'>
            <input 
              id='skin-search'
              type='text'
              className='group bg-button-color text-sm font-light pl-8 hover:bg-button-color-hover h-8 w-full flex items-center px-2 py-1 rounded cursor-pointer my-2 transition-all ease-in duration-100 focus:bg-button-color-hover outline-none'
              placeholder={LocalText(L, "cards.search_placeholder")}
              onKeyUp={handlePlayerSearch}
              autoCorrect='off'
              spellCheck='false'
            >
            </input>
            <Search cls='absolute top-2 left-2 ml-0.5 w-4' />
          </div>
          <div className='relative mt-4 flex flew-row items-center'>
            <label className="switch">
              <input type="checkbox" className='group' name="open-valtracker" onClick={toggleUnownedSkins} />
              <span className="slider round my-auto bg-maincolor group-hover:bg-maincolor-lightest group-checked:bg-maincolor-lightest group-checked:group-hover:bg-button-color-hover" />
            </label>
            <span className='ml-2 text-sm'>{LocalText(L, "cards.switch_label")}</span>
          </div>
          <div id='skin-list' className='mt-4 overflow-y-auto pr-1'>
            <SkinTiles setActiveSkin={setShownSkin} activeSkin={shownSkin} useRef={skinTilesRef} showUnowned={showUnownedSkins} />
          </div>
        </div>
        <div id='skin-viewer' className='relative h-full w-full flex flex-row items-center justify-center'>
          <div className={'h-full w-1/6 flex flex-col justify-center mr-32'}>
            <button 
              onClick={() => { setSkin() }} 
              className={
              'w-full h-12 mt-2 block change-color-btn ' 
              + 
              (showSetSkinButton ? '' : 'hidden')
              + 
              (setSkinSuccess ? ' bg-green-500 hover:bg-green-500 pointer-events-none cursor-default' : ' bg-button-color hover:bg-button-color-hover')}
              id='equip-skin-button'
            >
              {setSkinSuccess ? LocalText(L, "cards.equip_button.state_2") : LocalText(L, "cards.equip_button.state_1")}
            </button>
          </div>
          <div className='flex flex-row items-center justify-center w-2/4 mx-auto' id='skin-img'>
            <img src={activeSmallArt ? activeSmallArt : '/invisible_weapons/vandal.png'} className={activeSmallArt ? 'shadow-img w-3/5 mr-4' : 'w-1/6'} />
            <img src={activeWideArt ? activeWideArt : '/invisible_weapons/vandal.png'} className={activeWideArt ? 'shadow-img w-3/5 mr-4' : 'w-1/6'} />
            <img src={activeLargeArt ? activeLargeArt : '/invisible_weapons/vandal.png'} className={activeLargeArt ? 'shadow-img w-3/5 mr-40' : 'w-1/6'} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Cardchanger;
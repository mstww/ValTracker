import React from 'react';
import { useRouter } from 'next/router';
import fetch from 'node-fetch'
import SkinTile from '../components/skins/SkinTile';
import L from '../locales/translations/invchanger.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';
import { BackArrow, Search } from '../components/SVGs';
import Layout from '../components/Layout';
import { getCurrentUserData, getUserAccessToken, getUserEntitlement } from '../js/dbFunctions';

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

const fetchCards = async () => {
  try {
    const response = await fetch(`https://valorant-api.com/v1/sprays?language=${APIi18n(router.query.lang)}`, { keepalive: true });
    const json = await response.json();

    return { errored: false, items: json.data };
  } catch(err) {
    return { errored: true, items: err };
  }
}

function SkinTiles({ setActiveSkin, activeSkin, showUnowned, useRef, sprays }) {
  const router = useRouter();
  const weaponType = router.query.weaponType;

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
      if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "d5f120f8-ff8c-4aac-92ea-f2b5acbe9475") {
        setPlayerItems(playerItemsAll.EntitlementsByTypes[i].Entitlements);
      }
    }
  }, [ weaponType ]);

  for(var i = 0; i < sprays.length; i++) {
    if(sprays[i].uuid == router.query.usedSpray) {
      sprays.unshift(sprays[i]);
      sprays.splice(i+1, 1);
    }
  }

  return (
    <div ref={useRef}>
      {sprays.map(sprays => {
        var isOwned = false;
        for(var i = 0; i < playerItems.length; i++) {
          if(playerItems[i].ItemID == sprays.uuid) {
            isOwned = true;
            break;
          }
        }
        return (
          <SkinTile
            key={sprays.displayName.replace(" ", "-")}
            skinImage={
              sprays.fullTransparentIcon
            }
            skinName={sprays.displayName}
            extraClasses={(activeSkin == sprays.uuid && isOwned ? ' button-border ' : '') + (isOwned ? '' : ' border-none unowned-skin') + (showUnowned && !isOwned ? 'shown' : '')}
            onClick={
              () => {setActiveSkin(sprays.uuid)}
            }
            isOwned={isOwned}
          />
        )
      })}
    </div>
  );
}

function Spraychanger({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();

  const [ skinData, setSkinData ] = React.useState([]);

  const [ shownSkin, setShownSkin ] = React.useState('');
  const [ activeSkinImage, setActiveSkinImage ] = React.useState('');

  const [ ingameSkin, setIngameSkin ] = React.useState('');
  const [ ingameSkinImage, setIngameSkinImage ] = React.useState('');

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
    var skin_data = await(await fetch(`https://valorant-api.com/v1/sprays?language=${APIi18n(router.query.lang)}`, { keepalive: true })).json();

    setSkinData(skin_data.data);
    setIngameSkin(router.query.usedSpray);
    setShownSkin(router.query.usedSpray);
    setActiveSkinImage(`https://media.valorant-api.com/sprays/${router.query.usedSpray}/fulltransparenticon.png`);
    setIngameSkinImage(`https://media.valorant-api.com/sprays/${router.query.usedSpray}/fulltransparenticon.png`);
    setShowSetSkinButton(false);
  }, [ router.query ]);

  React.useEffect(() => {
    if(shownSkin != '' && router.query.usedSpray) {
      if(shownSkin == ingameSkin) {
        setActiveSkinImage(ingameSkinImage);
        setShowSetSkinButton(false);
      } else {
        for(var i = 0; i < skinData.length; i++) {
          if(skinData[i].uuid == shownSkin) {
            var skin_data = skinData[i];
          }
        }
        
        setActiveSkinImage(skin_data.fullTransparentIcon);
        var baseLevel = skin_data.uuid;
        var playerItems;
        var isOwned = false;
        for(var i = 0; i < playerItemsAll.EntitlementsByTypes.length; i++) {
          if(playerItemsAll.EntitlementsByTypes[i].ItemTypeID == "d5f120f8-ff8c-4aac-92ea-f2b5acbe9475") {
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
    var spray = shownSkin;

    var inventory_raw = await executeQuery(`SELECT * FROM inventory:current`);
    var inventory = inventory_raw[0];

    for(var i = 0; i < inventory.Sprays.length; i++) {
      if(inventory.Sprays[i].EquipSlotID == router.query.equipslot) {
        inventory.Sprays[i].SprayID = spray;
      }
    }

    var user_creds = await getCurrentUserData();

    var region = user_creds.region;
    var bearer = await getUserAccessToken();
    var entitlement_token = await getUserEntitlement();

    await setSkins(region, inventory.Subject, entitlement_token, bearer, inventory);

    setIngameSkin(spray);
    setSetSkinSuccess(true);

    setTimeout(() => {
      setSetSkinSuccess(false);
      setShowSetSkinButton(false);
    }, 2000);
  }

  return ( 
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <div className='absolute z-10 top-4 right-4 hover:bg-maincolor-lightest rounded cursor-pointer transition-all duration-100 ease-linear' onClick={() => { router.back() }}>
        <BackArrow cls='w-8 p-1' />
      </div>
      <div className='flex flex-row h-full'>
        <div id='skin-selector' className='h-full w-1/5 p-4 overflow-hidden'>
          <div className='relative'>
            <input 
              id='skin-search'
              type='text'
              className='bg-button-color focus:outline-none text-sm z-20 pl-8 ml-1 font-light group-hover:bg-button-color-hover hover:bg-button-color-hover flex items-center py-1 rounded cursor-pointer outline-none mx-auto transition-all ease-in duration-100 w-full h-8 px-2'
              placeholder={LocalText(L, "sprays.search_placeholder")}
              onKeyUp={handlePlayerSearch}
              autoCorrect='off'
              spellCheck='false'
            />
            <Search cls='absolute top-2 left-2 ml-0.5 w-4' />
          </div>
          <div className='relative mt-4 flex flew-row items-center'>
            <label className="switch">
              <input type="checkbox" className='group' name="open-valtracker" onClick={toggleUnownedSkins} />
              <span className="slider round my-auto bg-maincolor group-hover:bg-maincolor-lightest group-checked:bg-maincolor-lightest group-checked:group-hover:bg-button-color-hover" />
            </label>
            <span className='ml-2 text-sm'>{LocalText(L, "sprays.switch_label")}</span>
          </div>
          <div id='skin-list' className='mt-4 overflow-y-auto pr-1'>
            <SkinTiles setActiveSkin={setShownSkin} activeSkin={shownSkin} useRef={skinTilesRef} showUnowned={showUnownedSkins} sprays={skinData} />
          </div>
        </div>
        <div id='skin-viewer' className='relative h-full w-full flex flex-row items-center justify-center'>
          <div className={'h-full w-1/5 mx-auto flex flex-col justify-center'}>
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
              {setSkinSuccess ? LocalText(L, "sprays.equip_button.state_2") : LocalText(L, "sprays.equip_button.state_1")}
            </button>
          </div>
          <div className='flex flex-row items-center justify-center w-auto mx-auto' id='skin-img'>
            <img src={activeSkinImage ? activeSkinImage : '/invisible_weapons/vandal.png'} className={activeSkinImage ? 'shadow-img w-3/5 mr-4' : 'w-1/6'} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Spraychanger;
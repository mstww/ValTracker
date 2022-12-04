import React from 'react';
import fetch from 'node-fetch';
import { useRouter } from 'next/router'
import { ipcRenderer } from 'electron';
import { motion } from 'framer-motion';
import L from '../locales/translations/inventory.json';
import LocalText from '../components/translation/LocalText';
import { useFirstRender } from '../components/useFirstRender';
import Layout from '../components/Layout';
import { createThing, executeQuery, getCurrentPUUID, getCurrentUserData, getUserAccessToken, getUserEntitlement, updateThing } from '../js/dbFunctions';
import { Select } from '../components/Select';

function sortObject(obj) {
  return Object.keys(obj).sort().reduce(function (acc, key) {
    if(obj[key] !== null && obj[key].length !== undefined && typeof obj[key] === "object" && obj[key].length > 0) {
      for(var i = 0; i < obj[key].length; i++) {
        obj[key][i] = sortObject(obj[key][i]);
      }
    }
    if(typeof obj[key] === "object" && obj[key] !== null && obj[key].length === undefined) {
      obj[key] = sortObject(obj[key]);
    }
    acc[key] = obj[key];
    return acc;
  }, {});
}

async function getPlayerLoadout(region, puuid, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/personalization/v2/players/${puuid}/playerloadout`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
    },
    keepalive: true
  })).json());
}

async function getPlayerItems(region, puuid, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/store/v1/entitlements/${puuid}`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
    },
    keepalive: true
  })).json());
}

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

const card_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}

function Inventory({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();
  const firstRender = useFirstRender();

  const [ player_items, setPlayerItems ] = React.useState({});
  const [ player_loadout, setPlayerLoadout ] = React.useState({});

  const [ presetList, setPresetList ] = React.useState([]);

  const [ backdropShown, setBackdropShown ] = React.useState(false);
  const [ saveInvCardShown, setSaveInvCardShown ] = React.useState(false);

  const [ deletePresetCardShown, setDeletePresetCardShown ] = React.useState(false);

  const [ showDeletePresetButton, setShowDeletePresetButton ] = React.useState(false);

  const [ currentPresetName, setCurrentPresetName ] = React.useState('0');

  const [ playerTitle, setPlayerTitle ] = React.useState('');

  const loadoutNameRef = React.useRef(null);
  const [ isClickable, setIsClickable ] = React.useState(false);

  const [ isSaveButtonShown, setIsSaveButtonShown ] = React.useState(true);

  const redirectToSkinChanger = (weaponType, usedSkin, usedChroma, usedLevel) => {
    var items_stringified = JSON.stringify(player_items);
    var path = `/skinchanger?weaponType=${weaponType}&usedSkin=${usedSkin}&usedLevel=${usedLevel}&usedChroma=${usedChroma}&playerItems=${items_stringified}`;
    router.push(path + '&lang=' + router.query.lang);
  }

  const redirectToCardChanger = (usedCard) => {
    var items_stringified = JSON.stringify(player_items);
    var path = `/cardchanger?usedCard=${usedCard}&playerItems=${items_stringified}`;
    router.push(path + '&lang=' + router.query.lang);
  }

  const redirectToSprayChanger = (usedSpray, equipslot) => {
    var items_stringified = JSON.stringify(player_items);
    var path = `/spraychanger?usedSpray=${usedSpray}&equipslot=${equipslot}&playerItems=${items_stringified}`;
    router.push(path + '&lang=' + router.query.lang);
  }

  React.useEffect(async () => {
    ipcRenderer.send('changeDiscordRP', 'skins_activity');
    var user_data = await getCurrentUserData();
    var bearer = await getUserAccessToken();
    try {
      var entitlement_token = await getUserEntitlement();
      var player_loadout_data = await getPlayerLoadout(user_data.region, user_data.uuid, entitlement_token, bearer);
      setPlayerLoadout(player_loadout_data);
      await updateThing(`inventory:current`, player_loadout_data);
  
      var player_items = await getPlayerItems(user_data.region, user_data.uuid, entitlement_token, bearer);
      setPlayerItems(player_items);
  
      player_loadout_data.Guns.forEach(gun => {
        var img = document.querySelector(`img[data-weapontype="${gun.ID}"]`);
  
        img.src = `https://media.valorant-api.com/weaponskinchromas/${gun.ChromaID}/fullrender.png`;
  
        img.setAttribute('data-skin', gun.SkinID);
        img.setAttribute('data-skinchroma', gun.ChromaID);
        img.setAttribute('data-skinlevel', gun.SkinLevelID);

        if(gun.CharmID) {
          var img = document.querySelector(`img[data-weaponforbuddy="${gun.ID}"]`);
          
          img.setAttribute('src', `https://media.valorant-api.com/buddies/${gun.CharmID}/displayicon.png`);
        }
      });

      player_loadout_data.Sprays.forEach(spray => {
        var img = document.querySelector(`img[data-equipslot="${spray.EquipSlotID}"]`);
  
        img.src = `https://media.valorant-api.com/sprays/${spray.SprayID}/fulltransparenticon.png`;
        
        img.setAttribute('data-spray', spray.SprayID);
      });

      var img = document.querySelector(`img[data-equipslot="playercard"]`);
      img.src = `https://media.valorant-api.com/playercards/${player_loadout_data.Identity.PlayerCardID}/largeart.png`;
      img.setAttribute('data-card', player_loadout_data.Identity.PlayerCardID);
  
      var preList = await executeQuery(`SELECT * FROM presetCollection:⟨${user_data.uuid}⟩ FETCH presets.preset`);
      setPresetList(preList[0].presets);

      var copy = structuredClone(preList[0].presets);
  
      copy.forEach(preset => {
        player_loadout_data.Version = 0;
        preset.Version = 0;

        var name = preset['name'];
        delete preset['name'];
        delete preset['displayName'];
        delete preset['id'];

        var presetSorted = sortObject(preset);
        var invSorted = sortObject(player_loadout_data);

        if(JSON.stringify(presetSorted) === JSON.stringify(invSorted)) {
          setCurrentPresetName(name);
          setIsSaveButtonShown(false);
          setShowDeletePresetButton(true);
        }
      });
      setIsClickable(true);
    } catch(err) {
      console.log(err);
    }
  }, []);

  React.useEffect(async () => {
    if(!firstRender) {
      var title = await(await fetch(`https://valorant-api.com/v1/playertitles/${player_loadout.Identity.PlayerTitleID}`)).json();
      setPlayerTitle(title.data.titleText);
    }
  }, [ player_loadout ]);

  var tile_classes = 'weapon-tile bg-tile-color bg-opacity-60 border border-tile-color hover:bg-opacity-100 transition-all duration-100 ease-in rounded relative shadow-lg hover:shadow-xl flex items-center justify-center ' + (isClickable ? 'cursor-pointer' : 'cursor-not-allowed');

  const toggleSaveInvDialogue = () => {
    setBackdropShown(!backdropShown);
    setIsOverlayShown(!isOverlayShown)
    setSaveInvCardShown(!saveInvCardShown);
  }

  const toggleDeleteCurrentPresetDialogue = () => {
    setBackdropShown(!backdropShown);
    setIsOverlayShown(!isOverlayShown);
    setDeletePresetCardShown(!deletePresetCardShown);
  }

  const saveInventory = async () => {
    var loadout_name = loadoutNameRef.current.value;
    var puuid = await getCurrentPUUID();
    loadoutNameRef.current.value = '';

    var loadoutToSave = player_loadout;
    loadoutToSave.displayName = loadout_name;

    loadout_name = loadout_name.replace(/[^a-zA-Z0-9 ]/g, "");
    loadout_name = loadout_name.replace(/\s+/g, " ");
    loadout_name = loadout_name.trim();

    loadoutToSave.name = loadout_name;
    
    var result = await createThing(`preset`, loadoutToSave);
    
    var currentPresetList = await executeQuery(`SELECT (SELECT id FROM $parent.presets.id) AS presets FROM presetCollection:⟨${puuid}⟩`);

    currentPresetList[0].presets.push(result[0] ? result[0].id : (result.id ? result.id : result[0].result[0].id));
    await updateThing(`presetCollection:⟨${puuid}⟩`, currentPresetList[0]);
  
    var presetList = await executeQuery(`SELECT * FROM presetCollection:⟨${puuid}⟩ FETCH presets.preset`);
    setPresetList(presetList[0].presets);

    toggleSaveInvDialogue();

    setIsSaveButtonShown(false);
    setCurrentPresetName(loadout_name);

    setShowDeletePresetButton(true);
  }

  const deleteCurrentPreset = async () => {
    var puuid = await getCurrentPUUID();
    var result = await executeQuery(`SELECT id FROM preset WHERE name = "${currentPresetName}"`)
    await executeQuery(`DELETE ${result[0].id}`);
    
    var currentPresetList = await executeQuery(`SELECT (SELECT id FROM $parent.presets.id) AS presets FROM presetCollection:⟨${puuid}⟩`);

    currentPresetList[0].presets = currentPresetList[0].presets.filter(function (el) { return el != null; });

    await updateThing(`presetCollection:⟨${puuid}⟩`, currentPresetList[0]);
    
    var currentPresetList = await executeQuery(`SELECT * FROM presetCollection:⟨${puuid}⟩ FETCH presets.preset`);

    setPresetList(currentPresetList[0].presets);
    
    setIsSaveButtonShown(true);
    setCurrentPresetName('0');
    toggleDeleteCurrentPresetDialogue();
  }

  const changeInventory = async (loadout_name) => {
    if(loadout_name === '0') return;
    var user_data = await getCurrentUserData();
    
    var loadout_raw = await executeQuery(`SELECT * FROM preset WHERE name = "${loadout_name}"`);
    var loadout = loadout_raw[0];

    delete loadout['displayName'];
    delete loadout['name'];
    delete loadout['id'];

    var bearer = await getUserAccessToken();

    var entitlement_token = await getUserEntitlement();
    var new_inv = await setSkins(user_data.region, user_data.uuid, entitlement_token, bearer, loadout);

    new_inv.Guns.forEach(async gun => {
      var img = document.querySelector(`img[data-weapontype="${gun.ID}"]`);

      img.src = `https://media.valorant-api.com/weaponskinchromas/${gun.ChromaID}/fullrender.png`;
    });

    new_inv.Sprays.forEach(spray => {
      var img = document.querySelector(`img[data-equipslot="${spray.EquipSlotID}"]`);

      img.src = `https://media.valorant-api.com/sprays/${spray.SprayID}/fulltransparenticon.png`;
      
      img.setAttribute('data-spray', spray.SprayID);
    });

    var img = document.querySelector(`img[data-equipslot="playercard"]`);
    img.src = `https://media.valorant-api.com/playercards/${new_inv.Identity.PlayerCardID}/largeart.png`;
    img.setAttribute('data-card', new_inv.Identity.PlayerCardID);
  }

  const weapons = [
    { "name": "Classic", "imgClasses": "pointer-events-none mx-auto w-4/6", "uuid": "29a0cfab-485b-f5d5-779a-b59f85e204a8" },
    { "name": "Shorty", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "42da8ccc-40d5-affc-beec-15aa47b42eda" },
    { "name": "Frenzy", "imgClasses": "pointer-events-none mx-auto w-3/5", "uuid": "44d4e95c-4157-0037-81b2-17841bf2e8e3" },
    { "name": "Ghost", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "1baa85b4-4c70-1284-64bb-6481dfc3bb4e" },
    { "name": "Sheriff", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "e336c6b8-418d-9340-d77f-7a9e4cfe0702" },
    { "name": "Stinger", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "f7e1b454-4ad4-1063-ec0a-159e56b58941" },
    { "name": "Spectre", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "462080d1-4035-2937-7c09-27aa2a5c27a7" },
    { "name": "Bucky", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "910be174-449b-c412-ab22-d0873436b21b" },
    { "name": "Judge", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "ec845bf4-4f79-ddda-a3da-0db3774b2794" },
    { "name": "Guardian", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "ae3de142-4d85-2547-dd26-4e90bed35cf7" },
    { "name": "Bulldog", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "4ade7faa-4cf1-8376-95ef-39884480959b" },
    { "name": "Phantom", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a" },
    { "name": "Vandal", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "9c82e19d-4575-0200-1a81-3eacf00cf872" },
    { "name": "Marshal", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "c4883e50-4494-202c-3ec3-6b8a9284f00b" },
    { "name": "Operator", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "a03b24d3-4319-996d-0f8c-94bbfba1dfc7" },
    { "name": "Ares", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "55d8a0f4-4274-ca67-fe2c-06ab45efdf58" },
    { "name": "Odin", "imgClasses": "pointer-events-none mx-auto w-5/6", "uuid": "63e6c2b6-4a8e-869c-3d4c-e38355226584" },
    { "name": "Melee", "imgClasses": "pointer-events-none mx-auto w-2/5", "uuid": "2f59173c-4bed-b6c3-2191-dea9b58be9c7" }
  ]

  return (
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <motion.div 
        className='modal-backdrop'
        key={"InventoryBackdrop"}
        variants={backdrop_variants}
        initial="hidden"
        animate={backdropShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <motion.div 
          className="flex flex-col justify-between p-4 pb-2 modal fixed"
          key={"SavePresetCard"}
          variants={card_variants}
          initial="hidden"
          animate={saveInvCardShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <h1 className='font-bold'>{LocalText(L, "modals.save_modal.header")}</h1>
          <p>{LocalText(L, "modals.save_modal.desc")}</p>
          <input
            type='text'
            className='bg-button-color text-md font-light hover:bg-button-color-hover h-8 w-full flex items-center px-2 py-1 shadow-lg hover:shadow-2xl rounded cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none'
            placeholder={LocalText(L, "modals.save_modal.input_placeholder")}
            id='skin-search'
            autoCorrect='off'
            spellCheck='false'
            ref={loadoutNameRef}
          />
          <div className='mt-4'>
            <button className='button default' onClick={() => { saveInventory() }}>{LocalText(L, "modals.save_modal.button_1_text")}</button>
            <button className='button text' onClick={() => { toggleSaveInvDialogue() }}>{LocalText(L, "modals.save_modal.button_2_text")}</button>
          </div>
        </motion.div>
        <motion.div 
          className="flex flex-col justify-between p-4 pb-2 modal fixed"
          key={"DeletePresetCard"}
          variants={card_variants}
          initial="hidden"
          animate={deletePresetCardShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <h1>{LocalText(L, "modals.remove_modal.header")}</h1>
          <p>
            {LocalText(L, "modals.remove_modal.desc")}
            <br />
            ({currentPresetName})
            <br />
            {LocalText(L, "modals.remove_modal.desc2")}
          </p>
          
          <div className='mt-4'>
            <button className='button default' onClick={() => { deleteCurrentPreset() }}>{LocalText(L, "modals.remove_modal.button_1_text")}</button>
            <button className='button text' onClick={() => { toggleDeleteCurrentPresetDialogue() }}>{LocalText(L, "modals.remove_modal.button_2_text")}</button>
          </div>
        </motion.div>
      </motion.div>
      <div className='w-full h-full flex flex-row items-center justify-center'>
        <div className='w-1/6 h-4/5 m-4 relative'>
          <div id='inventory-card-wrapper' className='bg-black group overflow-hidden border border-tile-color rounded mb-4 shadow-lg hover:shadow-2xl transition-all duration-100 ease-linear'>
            <img 
              id='inventory-card'
              data-equipslot='playercard'
              className='cursor-default w-full mx-auto group-hover:opacity-70 transition-all duration-100 ease-linear' 
              src='/invisible_weapons/large_card.png'
              onClick={(e) => { redirectToCardChanger(e.target.getAttribute('data-card')) }}
            />
            <div 
              className='absolute bottom-20 bg-tile-color bg-opacity-60 hover:bg-opacity-100 w-full mx-auto text-global-text h-8 border-t border-b border-tile-color flex items-center justify-center transition-all duration-100 ease-linear cursor-pointer'
            >
              <span className='text-global-text'>{playerTitle}</span>
            </div>
          </div>
          <div className='h-2/5 mt-2 flex flex-col justify-around items-center' id='inventory-sprays'>
            <div 
              className={'relative mx-auto w-full inv-spray h-1/3 mb-1.5 bottom-0.5 ' + (tile_classes)}
              onClick={(e) => { 
                redirectToSprayChanger(e.target.firstChild.getAttribute('data-spray'), e.target.firstChild.getAttribute('data-equipslot'))
              }}
            >
              <img data-equipslot='0814b2fe-4512-60a4-5288-1fbdcec6ca48' className='h-5/6 mx-auto pointer-events-none shadow-img' src='/invisible_weapons/spray.png' />
            </div> 
            <div 
              className={'relative mx-auto w-full inv-spray h-1/3 mb-1.5 ' + (tile_classes)}
              onClick={(e) => {
                redirectToSprayChanger(e.target.firstChild.getAttribute('data-spray'), e.target.firstChild.getAttribute('data-equipslot'))
              }}
            >
              <img data-equipslot='04af080a-4071-487b-61c0-5b9c0cfaac74' className='h-5/6 mx-auto pointer-events-none shadow-img' src='/invisible_weapons/spray.png' />
            </div>
            <div 
              className={'relative mx-auto w-full inv-spray h-1/3 top-px ' + (tile_classes)}
              onClick={(e) => {
                redirectToSprayChanger(e.target.firstChild.getAttribute('data-spray'), e.target.firstChild.getAttribute('data-equipslot'))
              }}
            >
              <img data-equipslot='5863985e-43ac-b05d-cb2d-139e72970014' className='h-5/6 mx-auto pointer-events-none shadow-img' src='/invisible_weapons/spray.png' />
            </div>
          </div>
        </div>
        <div id='inv-main' className='w-5/6 mx-auto'>
          {weapons.map((weapon, index) => {
            return (
              <div
                id={weapon.name.toLowerCase()}
                className={tile_classes}
                onClick={
                  isClickable ? 
                  (e) => redirectToSkinChanger(
                    e.target.firstChild.getAttribute('data-weapontype'), 
                    e.target.firstChild.getAttribute('data-skin'), 
                    e.target.firstChild.getAttribute('data-skinchroma'), 
                    e.target.firstChild.getAttribute('data-skinlevel')
                  )
                  :
                  null
                }
              >
                <img src={`/invisible_weapons/${weapon.name.toLowerCase()}.png`} data-weapontype={weapon.uuid} alt={weapon.name} className={weapon.imgClasses} />
                <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>{weapon.name}</span>
                {
                  weapon.name !== "Melee" &&
                  <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10 pointer-events-none'>
                    <img data-weaponforbuddy={weapon.uuid} src='/invisible_weapons/melee.png' />
                  </div>
                }
              </div>
            )
          })}

          <div id='save-inv' className='flex flex-col items-center justify-center'>
            <button className={'w-5/6 button default mb-2 ' + (isSaveButtonShown ? 'block' : "hidden")} onClick={() => { toggleSaveInvDialogue() }}>
              {LocalText(L, "save_loadout_button_text")}
            </button>
            <Select 
              className={"w-5/6"}
              value={currentPresetName}
              setValue={setCurrentPresetName}
              onChange={() => {
                changeInventory(currentPresetName);
                if(currentPresetName !== '0') {
                  setShowDeletePresetButton(true);
                } else {
                  setShowDeletePresetButton(false);
                }
              }}
              items={[
                { value: "0", text: "Select a preset", disabled: true, important: false },
                { "seperator": true },
                ...presetList.reverse().map((preset) => {
                  return { value: preset.name, text: preset.displayName, disabled: false, important: false }
                })
              ]}
            />
          </div>

          <div id='inv_selector' className='flex items-center justify-center'>
            <div className={'w-full flex items-center justify-center ' + (showDeletePresetButton ? '' : 'hidden')}>
              <button className={'w-5/6 button default'} onClick={() => { toggleDeleteCurrentPresetDialogue() }}>
                {LocalText(L, "delete_preset_button")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Inventory;
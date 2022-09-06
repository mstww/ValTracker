import React from 'react';
import Layout from '../components/Layout';
import fs from 'fs'
import fetch from 'node-fetch';
import { useRouter } from 'next/router'
import { ipcRenderer } from 'electron';
import { motion } from 'framer-motion';
import L from '../locales/translations/inventory.json';
import LocalText from '../components/translation/LocalText';
import { useFirstRender } from '../components/useFirstRender';

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

function Inventory() {
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

  var token_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
  var token_data = JSON.parse(token_data_raw);

  var user_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
  var user_data = JSON.parse(user_data_raw);

  React.useEffect(async () => {
    ipcRenderer.send('changeDiscordRP', 'skins_activity');
    var bearer = token_data.accessToken;
    try {
      var entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;
      var player_loadout_data = await getPlayerLoadout(user_data.playerRegion, user_data.playerUUID, entitlement_token, bearer);
      setPlayerLoadout(player_loadout_data);
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/current_inventory.json', JSON.stringify(player_loadout_data));
  
      var player_items = await getPlayerItems(user_data.playerRegion, user_data.playerUUID, entitlement_token, bearer);
      setPlayerItems(player_items);
  
      player_loadout_data.Guns.forEach(gun => {
        var img = document.querySelector(`img[data-weapontype="${gun.ID}"]`);
  
        img.src = `https://media.valorant-api.com/weaponskinchromas/${gun.ChromaID}/fullrender.png`;
  
        img.setAttribute('data-skin', gun.SkinID);
        img.setAttribute('data-skinchroma', gun.ChromaID);
        img.setAttribute('data-skinlevel', gun.SkinLevelID);

        if(gun.CharmID) {
          console.log(gun.CharmID);
          var img = document.querySelector(`img[data-weaponForBuddy="${gun.ID}"]`);
          
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
  
      if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID)) {
        fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID);
      }
      var folderPresetList = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID);
  
      var newPresetList = [];
      folderPresetList.forEach(preset => {
        var preset_obj = {};

        var JSON_preset = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID + '/' + preset));

        preset_obj.name = preset.replace('.json', '');

        if(JSON_preset.displayName) {
          preset_obj.displayName = JSON_preset.displayName;
        } else {
          preset_obj.displayName = preset.replace('.json', '');
        }
        
        newPresetList.push(preset_obj);
      });
  
      setPresetList(newPresetList);

      var all_presets = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID);
  
      all_presets.forEach(preset => {
        var presetData = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID + '/' + preset));
        player_loadout_data.Version = 0;
        presetData.Version = 0;
        delete presetData['displayName'];

        if(JSON.stringify(presetData) == JSON.stringify(player_loadout_data)) {
          setCurrentPresetName(preset.split('.')[0]);
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

  var tile_classes = 'weapon-tile bg-maincolor-lightest border-2 border-maincolor-lightest hover:bg-opacity-70 transition-all duration-100 ease-in rounded-sm relative shadow-lg hover:shadow-xl flex items-center justify-center ' + (isClickable ? 'cursor-pointer' : 'cursor-not-allowed');

  const toggleSaveInvDialogue = () => {
    setBackdropShown(!backdropShown);
    setSaveInvCardShown(!saveInvCardShown);
  }

  const toggleDeleteCurrentPresetDialogue = () => {
    setBackdropShown(!backdropShown);
    setDeletePresetCardShown(!deletePresetCardShown);
  }

  const saveInventory = async () => {
    var loadout_name = loadoutNameRef.current.value;
    var puuid = user_data.playerUUID;
    loadoutNameRef.current.value = '';

    var loadoutToSave = player_loadout;
    loadoutToSave.displayName = loadout_name;

    loadout_name = loadout_name.replace(/[^a-zA-Z0-9 ]/g, "");
    loadout_name = loadout_name.replace(/\s+/g, " ");
    loadout_name = loadout_name.trim();

    if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + puuid)) {
      fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + puuid);
    }

    fs.writeFileSync(process.env.APPDATA + `/VALTracker/user_data/player_inventory/presets/${puuid}/${loadout_name}.json`, JSON.stringify(loadoutToSave));

    var folderPresetList = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + puuid);

    var newPresetList = [];
    folderPresetList.forEach(preset => {
      var preset_obj = {};

      var JSON_preset = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID + '/' + preset));

      preset_obj.name = preset.replace('.json', '');

      if(JSON_preset.displayName) {
        preset_obj.displayName = JSON_preset.displayName;
      } else {
        preset_obj.displayName = preset.replace('.json', '');
      }
      
      newPresetList.push(preset_obj);
    });

    toggleSaveInvDialogue();

    setPresetList(newPresetList);

    setCurrentPresetName(loadout_name);

    setShowDeletePresetButton(true);
  }

  const deleteCurrentPreset = () => {
    fs.unlinkSync(process.env.APPDATA + `/VALTracker/user_data/player_inventory/presets/${user_data.playerUUID}/${currentPresetName}.json`);

    var folderPresetList = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID);

    var newPresetList = [];
    folderPresetList.forEach(preset => {
      var preset_obj = {};

      var JSON_preset = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/player_inventory/presets/' + user_data.playerUUID + '/' + preset));

      preset_obj.name = preset.replace('.json', '');

      if(JSON_preset.displayName) {
        preset_obj.displayName = JSON_preset.displayName;
      } else {
        preset_obj.displayName = preset.replace('.json', '');
      }
      
      newPresetList.push(preset_obj);
    });

    setPresetList(newPresetList);
    
    setCurrentPresetName('0');
    toggleDeleteCurrentPresetDialogue();
  }

  const changeInventory = async (loadout_name, input) => {
    if(loadout_name === '0') {
      return;
    }
    var loadout_raw = fs.readFileSync(process.env.APPDATA + `/VALTracker/user_data/player_inventory/presets/${user_data.playerUUID}/${loadout_name}.json`);
    var loadout = JSON.parse(loadout_raw);

    delete loadout['displayName'];

    var token_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
    var token_data = JSON.parse(token_data_raw);

    var bearer = token_data.accessToken;

    var entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;
    var new_inv = await setSkins(user_data.playerRegion, user_data.playerUUID, entitlement_token, bearer, loadout);

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

  return (
    <Layout>
      <motion.div 
        className='absolute bottom-0 left-0 w-full h-full flex items-center justify-center z-40 bg-black bg-opacity-80 pointer-events-none'
        key={"InventoryBackdrop"}
        variants={backdrop_variants}
        initial="hidden"
        animate={backdropShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <motion.div 
          className="w-96 rounded-sm bg-maincolor mb-8 flex flex-col justify-between p-4 pb-2 pointer-events-auto shadow-lg"
          key={"SavePresetCard"}
          variants={card_variants}
          initial="hidden"
          animate={saveInvCardShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <h1>{LocalText(L, "modals.save_modal.header")}</h1>
          <p>{LocalText(L, "modals.save_modal.desc")}</p>
          <input
            type='text'
            className='bg-button-color text-md font-light placeholder:text-white hover:bg-button-color-hover h-8 w-full flex items-center px-2 py-1 shadow-lg hover:shadow-2xl rounded-sm cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none'
            placeholder={LocalText(L, "modals.save_modal.input_placeholder")}
            autoCorrect='off'
            spellCheck='false'
            ref={loadoutNameRef}
          />
          <div className='mt-4'>
            <button onClick={() => { saveInventory() }}>{LocalText(L, "modals.save_modal.button_1_text")}</button>
            <button className='text-button' onClick={() => { toggleSaveInvDialogue() }}>{LocalText(L, "modals.save_modal.button_2_text")}</button>
          </div>
        </motion.div>
        <motion.div 
          className="w-96 rounded-sm bg-maincolor mb-8 flex flex-col justify-between p-4 pb-2 pointer-events-auto shadow-lg"
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
            <button onClick={() => { deleteCurrentPreset() }}>{LocalText(L, "modals.remove_modal.button_1_text")}</button>
            <button className='text-button' onClick={() => { toggleDeleteCurrentPresetDialogue() }}>{LocalText(L, "modals.remove_modal.button_2_text")}</button>
          </div>
        </motion.div>
      </motion.div>
      <div className='w-full h-full flex flex-row items-center justify-center'>
        <div className='w-1/6 h-4/5 m-4'>
          <div id='inventory-card-wrapper'>
            <img 
              id='inventory-card'
              data-equipslot='playercard'
              className='shadow-lg hover:shadow-2xl transition-all duration-100 cursor-default ease-linear h-full mx-auto border-2 border-maincolor-lightest rounded-sm mb-4' 
              src='/invisible_weapons/large_card.png'
              onClick={(e) => { redirectToCardChanger(e.target.getAttribute('data-card')) }}
            />
            <div 
              id="title-div" 
              className='relative bottom-40 mx-auto h-8 border-2 bg-black bg-opacity-70 border-maincolor-lightest flex items-center justify-center hover:bg-opacity-20 transition-all duration-100 ease-linear cursor-pointer'
            >
              <span>{playerTitle}</span>
            </div>
          </div>
          <div className='h-2/5 mt-2' id='inventory-sprays'>
            <div 
              className={'relative mx-auto w-5/6 2xl:w-4/5 h-1/3 ' + (tile_classes)}
              onClick={(e) => { 
                redirectToSprayChanger(e.target.firstChild.getAttribute('data-spray'), e.target.firstChild.getAttribute('data-equipslot'))
              }}
            >
              <img data-equipslot='0814b2fe-4512-60a4-5288-1fbdcec6ca48' className='h-5/6 mx-auto pointer-events-none' src='/invisible_weapons/spray.png' />
            </div> 
            <div 
              className={'relative mx-auto w-5/6 2xl:w-4/5 h-1/3 ' + (tile_classes)}
              onClick={(e) => {
                redirectToSprayChanger(e.target.firstChild.getAttribute('data-spray'), e.target.firstChild.getAttribute('data-equipslot'))
              }}
            >
              <img data-equipslot='04af080a-4071-487b-61c0-5b9c0cfaac74' className='h-5/6 mx-auto pointer-events-none' src='/invisible_weapons/spray.png' />
            </div>
            <div 
              className={'relative mx-auto w-5/6 2xl:w-4/5 h-1/3 ' + (tile_classes)}
              onClick={(e) => {
                redirectToSprayChanger(e.target.firstChild.getAttribute('data-spray'), e.target.firstChild.getAttribute('data-equipslot'))
              }}
            >
              <img data-equipslot='5863985e-43ac-b05d-cb2d-139e72970014' className='h-5/6 mx-auto pointer-events-none' src='/invisible_weapons/spray.png' />
            </div>
          </div>
        </div>
        <div id='inv-main' className='w-5/6 mx-auto'>
          <div 
            id="classic" 
            className={ tile_classes }
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
            <img src='/invisible_weapons/classic.png' data-weapontype='29a0cfab-485b-f5d5-779a-b59f85e204a8' alt='Classic' className='pointer-events-none mx-auto w-4/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Classic</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10 pointer-events-none block'>
              <img data-weaponForBuddy='29a0cfab-485b-f5d5-779a-b59f85e204a8' className='pointer-events-none block' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div
            id="shorty" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/shorty.png' data-weapontype='42da8ccc-40d5-affc-beec-15aa47b42eda' alt='Shorty' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Shorty</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='42da8ccc-40d5-affc-beec-15aa47b42eda' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div id="frenzy" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/frenzy.png' data-weapontype='44d4e95c-4157-0037-81b2-17841bf2e8e3' alt='Frenzy' className='pointer-events-none mx-auto w-3/5' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Frenzy</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='44d4e95c-4157-0037-81b2-17841bf2e8e3' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="ghost" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/ghost.png' data-weapontype='1baa85b4-4c70-1284-64bb-6481dfc3bb4e' alt='Ghost' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Ghost</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='1baa85b4-4c70-1284-64bb-6481dfc3bb4e' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="sheriff" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/sheriff.png' data-weapontype='e336c6b8-418d-9340-d77f-7a9e4cfe0702' alt='Sheriff' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Sheriff</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='e336c6b8-418d-9340-d77f-7a9e4cfe0702' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="stinger"
            className={ tile_classes } 
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
            <img src='/invisible_weapons/stinger.png' data-weapontype='f7e1b454-4ad4-1063-ec0a-159e56b58941' alt='Stinger' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Stinger</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='f7e1b454-4ad4-1063-ec0a-159e56b58941' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="spectre" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/spectre.png' data-weapontype='462080d1-4035-2937-7c09-27aa2a5c27a7' alt='Spectre' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Spectre</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='462080d1-4035-2937-7c09-27aa2a5c27a7' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="bucky" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/bucky.png' data-weapontype='910be174-449b-c412-ab22-d0873436b21b' alt='Bucky' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Bucky</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='910be174-449b-c412-ab22-d0873436b21b' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="judge" 
            className={ tile_classes }
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
            <img src='/invisible_weapons/judge.png' data-weapontype='ec845bf4-4f79-ddda-a3da-0db3774b2794' alt='Judge' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Judge</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='ec845bf4-4f79-ddda-a3da-0db3774b2794' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="bulldog" 
            className={ tile_classes } 
            onClick={
              (e) => redirectToSkinChanger(
                e.target.firstChild.getAttribute('data-weapontype'), 
                e.target.firstChild.getAttribute('data-skin'), 
                e.target.firstChild.getAttribute('data-skinchroma'), 
                e.target.firstChild.getAttribute('data-skinlevel')
                )
              }
            >
            <img src='/invisible_weapons/bulldog.png' data-weapontype='ae3de142-4d85-2547-dd26-4e90bed35cf7' alt='Bulldog' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Bulldog</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='ae3de142-4d85-2547-dd26-4e90bed35cf7' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="guardian" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/guardian.png' data-weapontype='4ade7faa-4cf1-8376-95ef-39884480959b' alt='Guardian' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Guardian</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='4ade7faa-4cf1-8376-95ef-39884480959b' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="phantom" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/phantom.png' data-weapontype='ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a' alt='Phantom' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Phantom</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="vandal" 
            className={ tile_classes }
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
            <img src='/invisible_weapons/vandal.png' data-weapontype='9c82e19d-4575-0200-1a81-3eacf00cf872' alt='Vandal' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Vandal</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='9c82e19d-4575-0200-1a81-3eacf00cf872' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="marshal" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/marshal.png' data-weapontype='c4883e50-4494-202c-3ec3-6b8a9284f00b' alt='Marshal' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Marshal</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='c4883e50-4494-202c-3ec3-6b8a9284f00b' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="operator" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/operator.png' data-weapontype='a03b24d3-4319-996d-0f8c-94bbfba1dfc7' alt='Operator' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Operator</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='a03b24d3-4319-996d-0f8c-94bbfba1dfc7' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="ares" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/ares.png' data-weapontype='55d8a0f4-4274-ca67-fe2c-06ab45efdf58' alt='Ares' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Ares</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='55d8a0f4-4274-ca67-fe2c-06ab45efdf58' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="odin" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/odin.png' data-weapontype='63e6c2b6-4a8e-869c-3d4c-e38355226584' alt='Odin' className='pointer-events-none mx-auto w-5/6' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Odin</span>
            <div id='buddy-div' className='absolute bottom-1 left-1 2xl:h-14 2xl:w-14 h-10 w-10'>
              <img data-weaponForBuddy='63e6c2b6-4a8e-869c-3d4c-e38355226584' src='/invisible_weapons/melee.png' />
            </div>
          </div>
          <div 
            id="melee" 
            className={ tile_classes } 
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
            <img src='/invisible_weapons/melee.png' data-weapontype='2f59173c-4bed-b6c3-2191-dea9b58be9c7' alt='Melee' className='pointer-events-none mx-auto w-2/5' />
            <span className='pointer-events-none absolute bottom-0 left-0 w-full text-center'>Melee</span>
          </div>

          <div id='save-inv' className='flex flex-col items-center justify-center'>
            <button className='w-5/6' onClick={() => { toggleSaveInvDialogue() }}>
              {LocalText(L, "save_loadout_button_text")}
            </button>
            <select
              id='inv_selector_select' 
              value={currentPresetName}
              onChange={(e) => {
                setCurrentPresetName(e.target.value);
                changeInventory(e.target.value, e.target);
                if(e.target.value !== '0') {
                  setShowDeletePresetButton(true);
                } else {
                  setShowDeletePresetButton(false);
                }
              }}
              className='bg-button-color text-md font-light placeholder:text-white hover:bg-button-color-hover h-8 w-5/6 flex items-center px-2 py-1 shadow-lg hover:shadow-2xl rounded-sm cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none mt-4'
            >
              <option value='0' disabled>{LocalText(L, "preset_select_placeholder")}</option>
              {
                // Reverse Map
                presetList.reverse().map((preset, i) => {
                  return (
                    <option key={i} value={preset.name}>{preset.displayName}</option>
                  )
                })
              }
            </select>
          </div>

          <div id='inv_selector' className='flex items-center justify-center'>
            <div className={'w-full flex items-center justify-center ' + (showDeletePresetButton ? '' : 'hidden')}>
              <button className={'w-5/6 '} onClick={() => { toggleDeleteCurrentPresetDialogue() }}>
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
import React from 'react';
import Layout from '../components/Layout';
import { ipcRenderer, shell } from 'electron';
import SettingsTile from '../components/settings/SettingsTile';
import SettingsWrapper from '../components/settings/SettingsWrapper';
import SettingsGroup from '../components/settings/SettingsGroup';
import Setting from '../components/settings/Setting';
import SettingsSeperator from '../components/settings/SettingsSeperator';
import fs from 'fs';
import { useRouter } from 'next/router';
import fetch from 'node-fetch';
import pjson from '../../package.json';
import moment from 'moment';
import parser from 'showdown';
import AboutCredit from '../components/settings/AboutCredit';
import AboutGroup from '../components/settings/AboutGroup';
import AboutWrapper from '../components/settings/AboutWrapper';
import OverlayWrapper from '../components/settings/OverlayWrapper';
import PopupCard from '../components/settings/PopupCard';

const md_conv = new parser.Converter();

async function openLoginWindow() {
  return await ipcRenderer.invoke('loginWindow', false);
}

async function getPlayerUUID(bearer) {
  return (await (await fetch('https://auth.riotgames.com/userinfo', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer,
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json())['sub'];
}

async function getXMPPRegion(requiredCookie, bearer, id_token) {
  return (await (await fetch("https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant", {
    "method": "PUT",
    "headers": {
      "cookie": requiredCookie,
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearer
    },
    "body": `{\"id_token\":\"${id_token}\"}`,
    keepalive: true
  })).json());
}

async function getPlayerMMR(region, puuid, entitlement_token, bearer) {
  var valorant_version = await(await fetch('https://valorant-api.com/v1/version')).json();
  return (await (await fetch(`https://pd.${region}.a.pvp.net/mmr/v1/players/` + puuid, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      'Authorization': 'Bearer ' + bearer,
      'X-Riot-ClientVersion': valorant_version.data.riotClientVersion,
      'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json());
}

async function getEntitlement(bearer) {
  return (await (await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + bearer,
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json())['entitlements_token'];
}

const fetchPatchnotes = async () => {
  try {
    const response = await fetch(`https://api.valtracker.gg/patchnotes/v${pjson.version}`, { keepalive: true });
    const json = await response.json();

    const patchnotes = md_conv.makeHtml(json.data.patchnotes);
    const releaseDate = moment(json.data.release_date).format('MMMM Do YYYY');

    return { errored: false, patchnotes: patchnotes, releaseDate: releaseDate, version: json.data.version };
  } catch(err) {
    return { errored: true, patchnotes: err, date: null, version: null };
  }
}

function Patchnotes() {
  const [ patchnotes, setPatchnotes ] = React.useState([]);
  const [ releaseDate, setReleaseDate ] = React.useState(null);
  const [ version, setVersion ] = React.useState(null);

  React.useEffect(() => {
    const fetchApi = async () => {
      const { errored, patchnotes, releaseDate, version } = await fetchPatchnotes();

      if(!errored)
        setPatchnotes(patchnotes);
        setReleaseDate(releaseDate);
        setVersion(version);
    }

    setPatchnotes([]);
    fetchApi();
  }, []);

  return (
    <div className='patchnotes prose'>
      <h1>Patchnotes for { version }</h1>
      <p className='text-gray-500'>Released {releaseDate}</p>
      <div 
        className='ml-4 mt-4 w-5/6' 
        onClick={(e) => {
          if(e.target.tagName === 'a' || e.target.tagName === 'A') {
            shell.openExternal(e.target.href);
          }
        }} 
        dangerouslySetInnerHTML={{ __html: patchnotes }} 
      />
    </div>
  );
}

function Settings() {
  const router = useRouter();

  // Check for querys first
  if(router.query.tab) {
    var initialActive = router.query.tab;
  } else {
    var initialActive = 'app';
  }

  const [ activeSettingsGroup, setActiveGroup ] = React.useState(initialActive);

  const [ autoOpen, setAutoOpen ] = React.useState(false);
  const [ startHidden, setStartHidden ] = React.useState(false);
  const [ skinWishlistNotifications, setSkinWishlistNotifications ] = React.useState(false);
  const [ minClose, setMinClose ] = React.useState(false);
  const [ hardwareAcceleration, setHardwareAcceleration ] = React.useState(false);
  const [ legacyThemeToggle, setLegacyThemeToggle ] = React.useState(false);

  const [ appRP, setAppRP ] = React.useState(false);
  const [ appRPwhenHidden, setAppRPwhenHidden ] = React.useState(false);
  const [ gameRP, setGameRP ] = React.useState(false);

  const [ gameRP_showMode, setGameRP_showMode ] = React.useState(true);
  const [ gameRP_showRank, setGameRP_showRank ] = React.useState(true);
  const [ gameRP_showTimer, setGameRP_showTimer ] = React.useState(true);
  const [ gameRP_showScore, setGameRP_showScore ] = React.useState(true);

  const riot_removeAccount = React.useRef(null);
  const [ riot_removeAccountPopupOpen, setRiot_RemoveAccountPopupOpen ] = React.useState(false);

  const [ riot_accountList, setRiot_AccountList ] = React.useState([]);
  const [ riot_activeAccountSelection, setRiot_ActiveAccountSelection ] = React.useState(null);

  const [ other_copyCodeToClipButtonText, setOther_CopyCodeToClipButtonText ] = React.useState('Copy to Clipboard');

  const overlayWrapper = React.useRef(null);
  const [ popupBackgroundShown, setPopupBackgroundShown ] = React.useState(false);

  const other_resetApp = React.useRef(null);
  const [ other_resetAppPopupOpen, setOther_ResetAppPopupOpen ] = React.useState(false);

  const [ importSettingsVal, setImportSettingsVal ] = React.useState('');

  const other_applySettingsCodePopup = React.useRef(null);
  const [ other_applySettingsCode, setOther_applySettingsCode ] = React.useState(false);

  async function fetchUserAccounts() {
    var data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json')
    var data = JSON.parse(data_raw);
    var accounts = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts');
  
    accounts.forEach(accountFile => {
      var account_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + accountFile);
      var account_data = JSON.parse(account_data_raw);

      var active_account = false;
      if(data.playerUUID == account_data.playerUUID) {
        active_account = true;
      }

      // Add account_data to riot_accountList using setRiot_AccountList, but only if active_account is false
      if(!active_account) {
        setRiot_AccountList(riot_accountList => [...riot_accountList, account_data]);
      }
    });
  }

  const fetchSettings = () => {
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(data.startOnBoot === true) {
      setAutoOpen(true);
    }
    if(data.startOnBoot === true && data.startHidden === true) {
      setStartHidden(true);
    }
    if(data.skinWishlistNotifications === true || data.skinWishlistNotifications === undefined) {
      setSkinWishlistNotifications(true);
    }
    if(data.minimizeOnClose === true) {
      setMinClose(true);
    }
    if(data.enableHardwareAcceleration === true || data.enableHardwareAcceleration === undefined) {
      setHardwareAcceleration(true);
    }
    if(data.hasDiscordRPenabled === true || data.hasDiscordRPenabled === undefined) {
      setAppRP(true);
    }
    if(data.hasValorantRPenabled === true || data.hasValorantRPenabled === undefined) {
      setGameRP(true);
    }
    if(data.showDiscordRPWhenHidden === true) {
      setAppRPwhenHidden(true);
    }
    
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json');
    var data = JSON.parse(raw);

    if(data.themeName == 'legacy') {
      setLegacyThemeToggle(true);
    }

    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json')) {
      var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json'));

      setGameRP_showMode(data.showMode);

      setGameRP_showRank(data.showRank);
  
      setGameRP_showTimer(data.showTimer);
  
      setGameRP_showScore(data.showScore);
    }
  }

  const changeAutoOpen = (e) => {
    console.log(e)
    if(typeof e === 'boolean') ipcRenderer.send('openAppOnLogin', e);
    else ipcRenderer.send('openAppOnLogin', !autoOpen);

    setAutoOpen(!autoOpen);
  }

  const changeOpenHiddenOnAuto = (e) => {
    console.log(e)
    if(typeof e === 'boolean') ipcRenderer.send('hideAppOnLogin', e);
    else ipcRenderer.send('hideAppOnLogin', !startHidden);

    setStartHidden(!startHidden)
  }

  const changeSkinWishlistNotifications = (e) => {
    console.log(e)
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(typeof e === 'boolean') data.skinWishlistNotifications = e;
    else data.skinWishlistNotifications = !data.skinWishlistNotifications;

    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));

    setSkinWishlistNotifications(!skinWishlistNotifications);
  }

  const changeMinClose = (e) => {
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(typeof e === 'boolean') data.minimizeOnClose = e;
    else data.minimizeOnClose = !data.minimizeOnClose;
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));

    setMinClose(!minClose);
  }

  const changeHardwareAcceleration = (e) => {
    
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(typeof e === 'boolean') data.enableHardwareAcceleration = e;
    else data.enableHardwareAcceleration = !data.enableHardwareAcceleration;
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));

    setHardwareAcceleration(!hardwareAcceleration);
  }

  const changeLegacyThemeToggle = (e) => {
    if(typeof e === 'boolean') {
      if(e === true) {
        var data = {
          themeName: 'legacy'
        }
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(data));
        document.body.classList.add('legacy');
      } else {
        var data = {
          themeName: 'default'
        }
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(data));
  
        var legacyClasses = document.getElementsByClassName('legacy ');
        for(var i = 0; i < legacyClasses.length; i++) {
          legacyClasses[i].classList.remove('legacy');
        }
      }
    } else {
      if(!legacyThemeToggle === true) {
        var data = {
          themeName: 'legacy'
        }
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(data));
        document.body.classList.add('legacy');
      } else {
        var data = {
          themeName: 'default'
        }
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(data));
  
        var legacyClasses = document.getElementsByClassName('legacy ');
        for(var i = 0; i < legacyClasses.length; i++) {
          legacyClasses[i].classList.remove('legacy');
        }
      }
    }

    setLegacyThemeToggle(!legacyThemeToggle);
  }

  const changeAppRP = (e) => {
    
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(typeof e === 'boolean') data.hasDiscordRPenabled = e;
    else data.hasDiscordRPenabled = !data.hasDiscordRPenabled;
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));

    ipcRenderer.send('changeDiscordRP', `clear`);

    setAppRP(!appRP);
  }

  const changeAppRPWhenHidden = (e) => {
    
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(typeof e === 'boolean') data.showDiscordRPWhenHidden = e;
    else if(data.showDiscordRPWhenHidden === true) data.showDiscordRPWhenHidden = false;
    else if(data.showDiscordRPWhenHidden === false) data.showDiscordRPWhenHidden = true;
    else data.showDiscordRPWhenHidden = true;

    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));

    ipcRenderer.send('changeDiscordRP', `clear`);

    setAppRPwhenHidden(!appRPwhenHidden);
  }

  const changeGameRP = (e) => {
    
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(typeof e === 'boolean') data.hasValorantRPenabled = e;
    else data.hasValorantRPenabled = !data.hasValorantRPenabled;

    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));

    setGameRP(!gameRP);
  }

  const changeShowMatchMode = (e) => {
    
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json'));

    if(typeof e === 'boolean') data.showMode = e;
    else data.showMode = !gameRP_showMode;
    
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json', JSON.stringify(data));

    setGameRP_showMode(!gameRP_showMode);
  }

  const changeShowRank = (e) => {
    
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json'));
    
    if(typeof e === 'boolean') data.showRank = e;
    else data.showRank = !gameRP_showRank;
    
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json', JSON.stringify(data));

    setGameRP_showRank(!gameRP_showRank);
  }

  const changeShowTimer = (e) => {
    
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json'));

    if(typeof e === 'boolean') data.showTimer = e;
    else data.showTimer = !gameRP_showTimer;
    
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json', JSON.stringify(data));
    
    setGameRP_showTimer(!gameRP_showTimer);
  }

  const changeShowScore = (e) => {
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json'));

    if(typeof e === 'boolean') data.showScore = e;
    else data.showScore = !gameRP_showScore;

    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json', JSON.stringify(data));
    
    setGameRP_showScore(!gameRP_showScore);
  }

  const addNewAccount = async () => {
    const data = await openLoginWindow();
    if(data) {
      var bearer = data.tokenData.accessToken;
      var id_token = data.tokenData.id_token;
  
      try {
        var arg = await ipcRenderer.invoke('getTdidCookie', 'addedNewAccount');
      
        var requiredCookie = "tdid=" + arg
        var puuid = await getPlayerUUID(bearer);

        var userAccounts = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts');
        for(var i = 0; i < userAccounts.length; i++) {
          if(userAccounts[i].split('.')[0] === puuid) {
            ipcRenderer.send('relayTextbox', 'This account has already been added.');
            return false;
          }
        }
    
        var reagiondata = await getXMPPRegion(requiredCookie, bearer, id_token);
        var region = reagiondata.affinities.live
        var options = {
          method: "PUT",
          body: "[\"" + puuid + "\"]",
          keepalive: true
        }
        var new_account_data = await fetch("https://pd." + region + ".a.pvp.net/name-service/v2/players", options );
        var new_account_data = await new_account_data.json();
    
        const entitlement_token = await getEntitlement(bearer);
    
        const account_rank_data = await getPlayerMMR(region, puuid, entitlement_token, bearer);
    
        var currenttier = 0;
        if(mmr_data.LatestCompetitiveUpdate.TierAfterUpdate != undefined) {
          var currenttier = account_rank_data.LatestCompetitiveUpdate.TierAfterUpdate
        }
    
        var accObj = {
          playerName: new_account_data[0].GameName,
          playerTag: new_account_data[0].TagLine,
          playerRegion: region,
          playerUUID: puuid,
          playerRank: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/largeicon.png`,
        }
    
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + puuid + '.json', JSON.stringify(accObj));
    
        if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid)) {
          fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid);
        }
    
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/token_data.json', JSON.stringify(data.tokenData));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/cookies.json', JSON.stringify(data.riotcookies));
  
        router.push('/settings?tab=riot&counter=' + router.query.counter);
      } catch(err) {
        console.log(err)
        router.push('/settings?tab=riot&counter=' + router.query.counter);
      }
    }
  }

  const removeAccount = async (puuid, popupToClose) => {
    fs.rmdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid, { recursive: true });
    fs.unlinkSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + puuid + '.json');
    // Find object in riot_accountList with same playerUUID propety as puuid and remove it
    var new_account_list = riot_accountList.filter(account => account.playerUUID !== puuid);
    setRiot_AccountList(new_account_list);
    closePopup(popupToClose);
  }

  const openPopup = (setPopupOpen) => {
    setPopupOpen(true);
    setPopupBackgroundShown(true);
  }
  
  const closePopup = (setPopupOpen) => {
    setPopupBackgroundShown(false);
    setPopupOpen(false);
  }

  const states = {
    true: 1,
    false: 0,
    '1': true,
    1: true,
    '0': false,
    0: false
  }

  // TODO: Validate code, apply settings, restart app, check if code is corrupted or not a real code, then send textbox that tells the user.
  const generateSettingsCode = () => {
    var str = '';
    str += (states[autoOpen]); // 0
    str += (states[startHidden]); // 1
    str += (states[skinWishlistNotifications]); // 2
    str += (states[minClose]); // 3
    str += (states[hardwareAcceleration]); // 4
    str += (states[legacyThemeToggle]); // 5
    str += (states[appRP]); // 6
    str += (states[appRPwhenHidden]); // 7
    str += (states[gameRP]); // 8
    str += (states[gameRP_showMode]); // 9
    str += (states[gameRP_showRank]); // 10
    str += (states[gameRP_showTimer]); // 11
    str += (states[gameRP_showScore]); // 12
    
    var buff = Buffer.from(str);
    str = buff.toString('base64');

    navigator.clipboard.writeText(str);
  }

  const validateSettingsCode = (settingsStates) => {
    var verificationState = true;

    if(settingsStates.length === 13) {
      for(var i = 0; i < settingsStates.length; i++) {
        if(settingsStates[i] !== '1' && settingsStates[i] !== '0') {
          verificationState = false;
          break;
        }
      }

    } else {
      verificationState = false;
    }

    return verificationState;
  }

  const applySettingsFromCode = (code) => {
    let buff = Buffer.from(code, 'base64');
    code = buff.toString('ascii');
    
    var settingsStates = code.split("");

    var isUseable = validateSettingsCode(settingsStates);
    
    if(isUseable) {
      changeAutoOpen(states[settingsStates[0]]);
      changeOpenHiddenOnAuto(states[settingsStates[1]]);
      changeSkinWishlistNotifications(states[settingsStates[2]]);
      changeMinClose(states[settingsStates[3]]);
      changeHardwareAcceleration(states[settingsStates[4]]);
      changeLegacyThemeToggle(states[settingsStates[5]]);
      changeAppRP(states[settingsStates[6]]);
      changeAppRPWhenHidden(states[settingsStates[7]]);
      changeGameRP(states[settingsStates[8]]);
      changeShowMatchMode(states[settingsStates[9]]);
      changeShowRank(states[settingsStates[10]]);
      changeShowTimer(states[settingsStates[11]]);
      changeShowScore(states[settingsStates[12]]);

      ipcRenderer.send('restartApp');
    } else {
      closePopup(setOther_applySettingsCode);
      ipcRenderer.send('relayTextbox', 'Invalid Profile Code.');
    }
  }

  const resetApp = () => {
    ipcRenderer.send('resetApp');
  }

  React.useEffect(() => {
    fetchUserAccounts();
    fetchSettings();
    ipcRenderer.send('changeDiscordRP', "settings_activity");
    generateSettingsCode();
  }, []);

  return (
    <Layout>
      <OverlayWrapper useRef={overlayWrapper} isShown={popupBackgroundShown}>

        <PopupCard
          useRef={other_resetApp}
          header={'Reset VALTracker?'}
          text={'This will reset all data saved by the app, including account data, shop data, favourite matches and settings. This action cannot be undone.'}
          button_1={'Confirm'}
          button_2={'Cancel'}
          button_1_onClick={() => { resetApp() } }
          button_2_onClick={() => { closePopup(setOther_ResetAppPopupOpen) }}
          isOpen={other_resetAppPopupOpen}
          isButtonClickable={true}
        />

        <PopupCard
          useRef={other_applySettingsCodePopup}
          header={'Apply Settings Profile?'}
          text={'This will restart the app and possibly change all of your settigns. If you want to back up your current settings, close this popup and copy your settings share code.'}
          button_1={'Confirm'}
          button_2={'Cancel'}
          button_1_onClick={() => { applySettingsFromCode(importSettingsVal) } }
          button_2_onClick={() => { closePopup(setOther_applySettingsCode) }}
          isOpen={other_applySettingsCode}
          isButtonClickable={true}
        />

        <PopupCard
          useRef={riot_removeAccount}
          header={'Select Account to Remove'}
          text={'Select the account you wish to remove from VALTracker.'}
          button_1={'Confirm'}
          button_2={'Cancel'}
          button_1_onClick={() => { removeAccount(riot_activeAccountSelection, setRiot_RemoveAccountPopupOpen) }}
          button_2_onClick={() => { 
            closePopup(setRiot_RemoveAccountPopupOpen);
            setRiot_ActiveAccountSelection(null);
          }}
          isOpen={riot_removeAccountPopupOpen}
          isButtonClickable={riot_activeAccountSelection}
        >
          <div className="account-list mt-2">
            {riot_accountList.map((account, index) => {
              return (
                <div 
                  className={
                    'flex flex-row items-center content-center h-1/6 mb-2 justify-start rounded-sm transition-all ease-in duration-100 border border-gray-500'
                    + (account.playerUUID == riot_activeAccountSelection ? ' border-gradient-left active-riot-acc' : ' hover:bg-maincolor-lightest border-maincolor-lightest cursor-pointer')
                  }
                  onClick={() => { setRiot_ActiveAccountSelection(account.playerUUID) }}
                  id={ account.playerUUID }
                  key={ index }
                >
                  <img 
                    src={account.playerRank}
                    className='w-9 p-1 mr-2 ml-1 rounded-full border border-gray-500 my-1 pointer-events-none'
                    id='navbar-account-switcher-rank'
                  /> 
                  <div className='flex flex-col justify-center pointer-events-none'>
                    <span className='m-0 leading-none mb-px pointer-events-none'>{ account.playerName }</span>
                    <span className='text-gray-500 font-light leading-none pointer-events-none'>#{ account.playerTag }</span>
                  </div>
                  <span className='ml-auto mr-4 pointer-events-none'>{ account.playerRegion.toUpperCase() }</span>
                </div>
              )
            })}
          </div>
        </PopupCard>

      </OverlayWrapper>

      <div className='w-full mt-4'>
        <div id='settings-topbar' className='flex flex-row h-1/5 justify-around'>
          <SettingsTile type='app' text={"App"} delay={0} active={activeSettingsGroup} onClick={() => {setActiveGroup('app')}} />
          <SettingsTile type='rpc' text={"Rich Presences"} delay={0.1} active={activeSettingsGroup} onClick={() => {setActiveGroup('rpc')}} />
          <SettingsTile type='riot' text={"Riot Account Management"} delay={0.15} active={activeSettingsGroup} onClick={() => {setActiveGroup('riot')}} />
          <SettingsTile type='patchnotes' text={"Patchnotes"} delay={0.2} active={activeSettingsGroup} onClick={() => {setActiveGroup('patchnotes')}} />
          <SettingsTile type='other' text={"Other"} delay={0.2} active={activeSettingsGroup} onClick={() => {setActiveGroup('other')}} />
        </div>
        <div id='wrapper-handler' className='ml-20 mt-10 h-4/5'>

          <SettingsWrapper type='app' activeWrapper={activeSettingsGroup}>

            <SettingsGroup header={'APP BEHAVIOUR'}>
              <Setting 
                title={'Open VALTracker'} 
                desc={'Open VALTracker automatically right when your PC starts.'} 
                inputType={'checkbox'} 
                isChecked={autoOpen} 
                onClick={changeAutoOpen}
              />

              <SettingsSeperator />

              <Setting 
                title={'Open VALTracker minimized'} 
                desc={'Open VALTracker minimized on autostart.'} 
                inputType={'checkbox'} 
                isChecked={startHidden && autoOpen}
                isDisabled={!autoOpen}
                onClick={changeOpenHiddenOnAuto}
              />
            </SettingsGroup>

            <SettingsGroup header={'SKIN WISHLIST'}>
              <Setting 
                title={'Skin Wishlist Notifications'} 
                desc={'Enable or disable Skin Wishlist notifications.'} 
                desc2={'Tip: Open VALTracker Minimized so that you don\'t get disturbed by the window popping up.'}
                inputType={'checkbox'} 
                isChecked={skinWishlistNotifications}
                onClick={changeSkinWishlistNotifications}
              />
            </SettingsGroup>

            <SettingsGroup header={'CLOSE BUTTON'}>
              <Setting
                title={'Minimize to Tray'} 
                desc={'Closing the app window will minimize it to your system Tray.'} 
                inputType={'checkbox'} 
                isChecked={minClose} 
                onClick={changeMinClose}
              />
            </SettingsGroup>

            <SettingsGroup header={'PERFORMANCE'}>
              <Setting 
                title={'Hardware Acceleration'} 
                desc={'Enable or disable Hardware Acceleration. Requires a restart for changes to apply.'} 
                inputType={'checkbox'} 
                isChecked={hardwareAcceleration}
                onClick={changeHardwareAcceleration}
              />
            </SettingsGroup>

            <SettingsGroup header={'COLOR THEME'}>
              <Setting 
                title={'Legacy Theme'} 
                desc={"Toggle the App's Legacy Color Theme."} 
                inputType={'checkbox'}
                isChecked={legacyThemeToggle}
                onClick={changeLegacyThemeToggle}
              />
            </SettingsGroup>

          </SettingsWrapper>

          <SettingsWrapper type='rpc' activeWrapper={activeSettingsGroup}>

            <SettingsGroup header={'APP RICH PRESENCE'}>
              <Setting 
                title={'VALTracker Rich Presence'} 
                desc={"Show your friends that your're using VALTracker with a custom Rich Presence!"}
                inputType={'checkbox'}
                isChecked={appRP}
                onClick={changeAppRP}
              />

              <SettingsSeperator />

              <Setting 
                title={'Stop Rich Presence when minimized'} 
                desc={'Open VALTracker minimized on autostart.'} 
                inputType={'checkbox'}
                isChecked={appRPwhenHidden}
                isDisabled={!appRP}
                onClick={changeAppRPWhenHidden}
              />
            </SettingsGroup>

            <SettingsGroup header={'VALORANT RICH PRESENCE'}>

              <Setting 
                title={'VALORANT Game Presence'} 
                desc={"Set your Discord Status to a Rich Presence about your current match!"} 
                inputType={'checkbox'} 
                isChecked={gameRP}
                onClick={changeGameRP}
              />

              <SettingsSeperator />

              <Setting 
                title={'Show Match Mode'} 
                desc={"Decide if you want to show the mode that you're currently playing!"} 
                desc2={"Turning off this setting will disable the ability to show your rank when playing a competitive match."}
                inputType={'checkbox'} 
                isChecked={gameRP_showMode}
                onClick={changeShowMatchMode}
              />

              <Setting 
                title={'Show Rank instead of Agent'} 
                desc={"Change the small picture to your rank instead of your agent if you play ranked!"} 
                inputType={'checkbox'} 
                isChecked={gameRP_showRank}
                isDisabled={!gameRP_showMode}
                onClick={changeShowRank}
              />

              <Setting 
                title={'Show Timer'} 
                desc={"Turn the timer for the Rich Presence on or off!"} 
                inputType={'checkbox'} 
                isChecked={gameRP_showTimer}
                onClick={changeShowTimer}
              />

              <Setting 
                title={'Show Score'} 
                desc={"Turn the score for the Rich Presence on or off!"} 
                inputType={'checkbox'} 
                isChecked={gameRP_showScore}
                onClick={changeShowScore}
              />
            </SettingsGroup>
            
          </SettingsWrapper>

          <SettingsWrapper type='riot' activeWrapper={activeSettingsGroup}>

            <SettingsGroup header={'ACCOUNT MANAGEMENT'}>
              <Setting 
                title={'Add an Account'} 
                desc={"Open a login window to add a new Riot Account."} 
                inputType={'button'} 
                buttonText={'Add new Account'} 
                onClick={addNewAccount}
              />

              <SettingsSeperator />

              <Setting
                title={'Remove an Account'}
                desc={'Remove a Riot Account from VALTracker.'}
                inputType={'button'}
                buttonText={'Remove Account'}
                onClick={() => { openPopup(setRiot_RemoveAccountPopupOpen) }}
              />
            </SettingsGroup>

          </SettingsWrapper>

          <SettingsWrapper type='patchnotes' activeWrapper={activeSettingsGroup}>

            <Patchnotes />

          </SettingsWrapper>

          <SettingsWrapper type='other' activeWrapper={activeSettingsGroup}>

          <SettingsGroup header={'SETTINGS PROFILE'}>
            <Setting
              title={'Import Settings'}
              desc={'Import a settings profile. You can copy your own code below.'}
              inputType={'text'}
              inputVal={importSettingsVal}
              setInputVal={setImportSettingsVal}
              extraButton={true}
              extraButtonText={'Apply'}
              extraButtonClick={() => { openPopup(setOther_applySettingsCode) }}
            />

            <SettingsSeperator />

            <Setting
              title={'Export Settings'}
              desc={'Copy your settings share code to the clipboard.'}
              inputType={'button'}
              buttonText={other_copyCodeToClipButtonText}
              onClick={() => { 
                generateSettingsCode();
                setOther_CopyCodeToClipButtonText('Done!');
                setTimeout(async () => {
                  setOther_CopyCodeToClipButtonText('Copy to clipboard');
                }, 2000);
              }}
            />
          </SettingsGroup>

            <SettingsGroup header={'DANGER ZONE'} important={true}>
              <Setting 
                title={'Reset VALTracker'} 
                desc={"Reset the App. This includes account data, settings, and all other data."}
                inputType={'button'} 
                buttonText={'Reset VALTracker'}
                onClick={() => { openPopup(setOther_ResetAppPopupOpen) }}
              />
            </SettingsGroup>

            <AboutWrapper header={'ABOUT'}>
              <AboutGroup header={'USED APIs'}>

                <AboutCredit url={'https://valtracker.gg/docs'} text={'VALTracker API'} />
                <AboutCredit url={'https://valorant-api.com'} text={'valorant-api.com'} />
                <AboutCredit url={'https://docs.henrikdev.xyz/valorant.html'} text={'docs.henrikdev.xyz'} />

              </AboutGroup>

              <AboutGroup header={'UI ELEMENTS'}>

                <AboutCredit url={'https://nextui.org'} text={'NextUI'} />
                <AboutCredit url={'https://fontawesome.com/'} text={'Fontawesome'} />
                <AboutCredit url={'https://streamlinehq.com/'} text={'Streamline'} />

              </AboutGroup>
            </AboutWrapper>
            
          </SettingsWrapper>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
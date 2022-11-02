import React from 'react';
import { ipcRenderer, shell } from 'electron';
import SettingsTile from '../components/settings/SettingsTile';
import SettingsWrapper from '../components/settings/SettingsWrapper';
import SettingsGroup from '../components/settings/SettingsGroup';
import Setting from '../components/settings/Setting';
import SettingsSeperator from '../components/settings/SettingsSeperator';
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
import LanguageCheckbox from '../components/settings/LanguageCheckbox';
import AllLangs from '../locales/languages.json';
import L from '../locales/translations/settings.json';
import LocalText from '../components/translation/LocalText';
import ThemeSelector from '../components/settings/ThemeSelector';
import VersionCheckbox from '../components/settings/VersionCheckbox';
import { Loading } from '@nextui-org/react';
import Layout from '../components/Layout';
import { changeSetting, executeQuery, getAllSettings, getCurrentPUUID, updateThing } from '../js/dbFunctions.mjs';
import { v5 as uuidv5 } from 'uuid';

const md_conv = new parser.Converter();

async function openLoginWindow() {
  return await ipcRenderer.invoke('loginWindow', false);
}

async function getPUUID(bearer) {
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

async function getPlayerMMR(region, puuid, entitlement_token, bearer) {
  var valorant_version = await(await fetch('https://valorant-api.com/v1/version')).json();
  if(region === 'latam' || region === 'br') region = 'na';
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

async function requestUserCreds(region, puuid) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/name-service/v2/players/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: "[\"" + puuid + "\"]",
    keepalive: true
  })).json());
}

const fetchPatchnotes = async (lang, version) => {
  try {
    const json = await(await fetch(`http://localhost:4000/v1/changelog/${version}`, { keepalive: true })).json();

    const patchnotes = md_conv.makeHtml(json.data.changelog);
    moment.locale(lang);
    const releaseDate = moment(json.data.date).format('D. MMMM, YYYY');

    return { errored: false, patchnotes: patchnotes, releaseDate: releaseDate, version: json.data.version };
  } catch(err) {
    return { errored: true, patchnotes: err, date: null, version: null };
  }
}

function Patchnotes({ showVersionModal, shownPatchnotes }) {
  const router = useRouter();

  const [ patchnotes, setPatchnotes ] = React.useState([]);
  const [ releaseDate, setReleaseDate ] = React.useState(null);
  const [ version, setVersion ] = React.useState(null);
  const [ patchnotesLoading, setPatchnotesLoading ] = React.useState(false);

  React.useEffect(() => {
    const fetchApi = async () => {
      setPatchnotesLoading(true);
      const { errored, patchnotes, releaseDate, version } = await fetchPatchnotes(router.query.lang, "v" + pjson.version);

      if(!errored) {
        setPatchnotes(patchnotes);
        setReleaseDate(releaseDate);
        setVersion(version);
        setPatchnotesLoading(false);
      }
    }

    setPatchnotes([]);
    fetchApi();
  }, []);

  React.useEffect(async () => {
    if(shownPatchnotes !== "") {
      setPatchnotesLoading(true);
      const { errored, patchnotes, releaseDate, version } = await fetchPatchnotes(router.query.lang, shownPatchnotes);

      if(!errored) {
        setPatchnotes(patchnotes);
        setReleaseDate(releaseDate);
        setVersion(version);
        setPatchnotesLoading(false);
      }
    }
  }, [shownPatchnotes]);

  return (
    <div className='patchnotes prose'>
      <h1>Changelog for { version }</h1>
      <p className='text-gray-500'>
        Released {releaseDate} | <span onClick={showVersionModal} className='text-button-color text-opacity-70 cursor-pointer hover:underline'>Change Version</span>
      </p>
      <div 
        className={'ml-4 mt-4 w-5/6 patchnotes ' + (patchnotesLoading === true ? 'hidden' : '')}
        onClick={(e) => {
          if(e.target.tagName === 'a' || e.target.tagName === 'A') {
            e.preventDefault();
            shell.openExternal(e.target.href);
          }
        }} 
        dangerouslySetInnerHTML={{ __html: patchnotes }} 
      />
      <div className={'w-5/6 h-96 flex flex-row items-center justify-center ' + (patchnotesLoading === true ? '' : 'hidden')}>
        <Loading color={'error'} size={'md'} />
      </div>
    </div>
  );
}

function Settings({ isNavbarMinimized, setTheme, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();

  if(router.query.tab) {
    var initialActive = router.query.tab;
  } else {
    var initialActive = 'app';
  }
  
  var errors = LocalText(L, 'errors');

  const [ activeSettingsGroup, setActiveGroup ] = React.useState(initialActive);

  const [ autoOpen, setAutoOpen ] = React.useState(false);
  const [ startHidden, setStartHidden ] = React.useState(false);
  const [ skinWishlistNotifications, setSkinWishlistNotifications ] = React.useState(false);
  const [ minClose, setMinClose ] = React.useState(false);
  const [ hardwareAcceleration, setHardwareAcceleration ] = React.useState(false);

  const [ appRP, setAppRP ] = React.useState(false);
  const [ appRPwhenHidden, setAppRPwhenHidden ] = React.useState(false);
  const [ gameRP, setGameRP ] = React.useState(false);

  const [ gameRP_showMode, setGameRP_showMode ] = React.useState(true);
  const [ gameRP_showRank, setGameRP_showRank ] = React.useState(true);
  const [ gameRP_showTimer, setGameRP_showTimer ] = React.useState(true);
  const [ gameRP_showScore, setGameRP_showScore ] = React.useState(true);

  const [ patchnotes_versionSwitcherSelectedPatchnotesVersion, setPatchnotes_versionSwitcherSelectedPatchnotesVersion ] = React.useState('');
  const [ patchnotes_versionSwitcherFallback, setPatchnotes_versionSwitcherFallback ] = React.useState('');
  const [ patchnotes_selectedPatchnotesVersion, setPatchnotes_selectedPatchnotesVersion ] = React.useState('');

  const general_changeLang = React.useRef(null);
  const [ general_changeLangPopupOpen, setGeneral_changeLangPopupOpen ] = React.useState(false);

  const [ currentSelectedLanguage, setCurrentSelectedLanguage ] = React.useState(false);
  const [ appLang, setAppLang ] = React.useState({});

  const riot_removeAccount = React.useRef(null);
  const [ riot_removeAccountPopupOpen, setRiot_RemoveAccountPopupOpen ] = React.useState(false);

  const [ riot_accountList, setRiot_AccountList ] = React.useState([]);
  const [ riot_activeAccountSelection, setRiot_ActiveAccountSelection ] = React.useState(null);

  const pathchnotes_versionSwitcher = React.useRef(null);
  const [ patchnotes_versionSwitcherOpen, setPatchnotes_versionSwitcherOpen ] = React.useState(false);

  const [ other_copyCodeToClipButtonText, setOther_CopyCodeToClipButtonText ] = React.useState(LocalText(L, 'pg_5.grp_1.setting_2.button_text'));

  const overlayWrapper = React.useRef(null);
  const [ popupBackgroundShown, setPopupBackgroundShown ] = React.useState(false);

  const other_resetApp = React.useRef(null);
  const [ other_resetAppPopupOpen, setOther_ResetAppPopupOpen ] = React.useState(false);

  const [ importSettingsVal, setImportSettingsVal ] = React.useState('');

  const other_applySettingsCodePopup = React.useRef(null);
  const [ other_applySettingsCode, setOther_applySettingsCode ] = React.useState(false);

  const [ currentTheme, setCurrentTheme ] = React.useState('normal');

  const [ patchnoteVersions, setPatchnotesVersions ] = React.useState([]);

  async function fetchUserAccounts() {
    var puuid = await getCurrentPUUID();
    var accounts = await executeQuery(`SELECT * FROM playerCollection:app FETCH players.player`);
  
    accounts[0].players.forEach(account => {
      var active_account = false;
      if(puuid == account.uuid) {
        active_account = true;
      }

      if(!active_account) {
        setRiot_AccountList(riot_accountList => [...riot_accountList, account]);
      }
    });
  }

  const fetchSettings = async () => {
    var data = await getAllSettings();

    if(data.launchOnBoot === true) {
      setAutoOpen(true);
    }
    if(data.launchOnBoot === true && data.lauchHiddenOnBoot === true) {
      setStartHidden(true);
    }
    if(data.wishlistNotifs === true || data.wishlistNotifs === undefined) {
      setSkinWishlistNotifications(true);
    }
    if(data.minOnClose === true) {
      setMinClose(true);
    }
    if(data.hardwareAccel === true || data.hardwareAccel === undefined) {
      setHardwareAcceleration(true);
    }
    if(data.useAppRP === true || data.useAppRP === undefined) {
      setAppRP(true);
    }
    if(data.useGameRP === true || data.useGameRP === undefined) {
      setGameRP(true);
    }
    if(data.hideAppPresenceWhenHidden === true) {
      setAppRPwhenHidden(true);
    }

    setCurrentTheme(data.appColorTheme);

    setGameRP_showMode(data.showGameRPMode);

    setGameRP_showRank(data.showGameRPRank);

    setGameRP_showTimer(data.showGameRPScore);

    setGameRP_showScore(data.showGameRPTimer);
  }

  const changeAutoOpen = (e) => {
    if(typeof e === 'boolean') ipcRenderer.send('openAppOnLogin', e);
    else ipcRenderer.send('openAppOnLogin', !autoOpen);

    setAutoOpen(!autoOpen);
  }

  const changeOpenHiddenOnAuto = (e) => {
    if(typeof e === 'boolean') ipcRenderer.send('hideAppOnLogin', e);
    else ipcRenderer.send('hideAppOnLogin', !startHidden);

    setStartHidden(!startHidden)
  }

  const changeSkinWishlistNotifications = async (e) => {
    await changeSetting(`wishlistNotifs`, e);

    setSkinWishlistNotifications(!skinWishlistNotifications);
  }

  const changeMinClose = async (e) => {
    await changeSetting(`minOnClose`, e);

    setMinClose(!minClose);
  }

  const changeHardwareAcceleration = async (e) => {
    await changeSetting(`hardwareAccel`, e);

    setHardwareAcceleration(!hardwareAcceleration);
  }

  const changeAppRP = async (e) => {
    await changeSetting(`useAppRP`, e);

    ipcRenderer.send('changeDiscordRP', `clear`);

    setAppRP(!appRP);
  }

  const changeAppRPWhenHidden = async (e) => {
    await changeSetting(`hideAppPresenceWhenHidden`, e);

    ipcRenderer.send('changeDiscordRP', `clear`);

    setAppRPwhenHidden(!appRPwhenHidden);
  }

  const changeGameRP = async (e) => {
    await changeSetting(`useGameRP`, e);

    setGameRP(!gameRP);
  }

  const changeShowMatchMode = async (e) => {
    await changeSetting(`showGameRPMode`, e);

    setGameRP_showMode(!gameRP_showMode);
  }

  const changeShowRank = async (e) => {
    await changeSetting(`showGameRPRank`, e);

    setGameRP_showRank(!gameRP_showRank);
  }

  const changeShowTimer = async (e) => {
    await changeSetting(`showGameRPScore`, e);
    
    setGameRP_showTimer(!gameRP_showTimer);
  }

  const changeShowScore = async (e) => {
    await changeSetting(`showGameRPTimer`, e);
    
    setGameRP_showScore(!gameRP_showScore);
  }

  const addNewAccount = async () => {
    const data = await openLoginWindow();
    if(data) {
      var bearer = data.tokenData.accessToken;
      var id_token = data.tokenData.id_token;
  
      try {
        var bearer = data.tokenData.accessToken;
        var id_token = data.tokenData.id_token;
    
        var tdid_val = await ipcRenderer.invoke('getTdidCookie');
        var requiredCookie = 'tdid=' + tdid_val;
    
        var puuid = await getPUUID(bearer);
        var entitlement_token = await getEntitlement(bearer);
        var regiondata = await getXMPPRegion(requiredCookie, bearer, id_token);
        var region = regiondata.affinities.live;
    
        var userInfo = await requestUserCreds(region, puuid);
        var name = userInfo[0].GameName;
        var tag = userInfo[0].TagLine;
        var uuid = userInfo[0].Subject;
        var region = region;
        
        const currenttier = await getPlayerMMR(region, uuid, entitlement_token, bearer);
    
        var userData = {
          name: name,
          tag: tag,
          uuid: uuid,
          region: region,
          rank: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/largeicon.png`
        }
    
        var favMatchConfigs = {};
      
        var matchIDResult = await createThing(`matchIDCollection:⟨favMatches::${puuid}⟩`, {
          "matchIDs": []
        });
      
        favMatchConfigs[puuid] = (await createThing(`favMatchConfig:⟨${puuid}⟩`, {
          matchIDCollection: matchIDResult.id ? matchIDResult.id : matchIDResult[0].result[0].id
        })).id;
      
        var hubConfigs = {};
      
        var matchIDResult = await createThing(`matchIDCollection:⟨hub::${puuid}⟩`, {
          "matchIDs": []
        });
      
        hubConfigs[puuid] = (await createThing(`hubConfig:⟨${puuid}⟩`, {
          matchIDResult: matchIDResult.id ? matchIDResult.id : matchIDResult[0].result[0].id
        })).id;
      
        var allPlayerConfigs = {};
      
        var result = await createThing(`playerConfig:⟨${puuid}⟩`, {
          "favMatchConfig": favMatchConfigs[puuid],
          "hubConfig": hubConfigs[puuid]
        });
        allPlayerConfigs[puuid] = result.id;
      
        var allPlayerDataIDs = [];
      
        var result = await createThing(`player:⟨${puuid}⟩`, {
          ...userData,
          "playerConfig": allPlayerConfigs[puuid]
        });
      
        allPlayerDataIDs.push(result.id);
      
        var result = await createThing(`playerCollection:⟨app⟩`, {
          "players": allPlayerDataIDs
        });
  
        var ssidObj = data.riotcookies.find(obj => obj.name === "ssid");
      
        await createThing(`rgConfig:⟨${puuid}⟩`, {
          "accesstoken": data.tokenData.accessToken,
          "idtoken": data.tokenData.id_token,
          "ssid": "ssid=" + ssidObj.value,
          "tdid": requiredCookie,
          "entitlement": entitlement_token
        });
      
        await executeQuery(`RELATE playerCollection:⟨app⟩->currentPlayer->player:⟨${puuid}⟩`); // Switch for new UUID
      
        await createThing(`hubContractProgress:⟨${puuid}⟩`, {
          "agentContract": {},
          "battlePass": {},
          "date": null
        });
      
        await createThing(`playerStore:⟨${puuid}⟩`, {});
      
        await createThing(`inventory:⟨current⟩`, {});
      
        await createThing(`presetCollection:⟨${puuid}⟩`, {
          "presets": []
        });
      
        await createThing(`wishlist:⟨${puuid}⟩`, {
          "skins": []
        });
      
        var bundle = await (await fetch(`http://localhost:4000/v1/bundles/featured`)).json();
        var result = await createThing(`featuredBundle:⟨${process.env.SERVICE_UUID}⟩`, bundle.data);
      
        await createThing(`services:⟨${process.env.SERVICE_UUID}⟩`, {
          "lastMessageUnix": Date.now(),
          "featuredBundle": result.id
        });
      } catch(err) {
        console.log(err)
        router.push('/settings?tab=riot&counter=' + router.query.counter + `&lang=${router.query.lang}`);
      }
    }
  }

  const removeAccount = async (puuid, popupToClose) => {
    var data = await executeQuery(`SELECT * FROM SELECT * FROM playerCollection:app`);
    var newArr = data[0].players.filter(e => e !== `player:⟨${puuid}⟩`);
    await updateThing(`playerCollection:app`, {
      players: newArr
    });
    await executeQuery(`DELETE player:⟨${puuid}⟩`);
    // Find object in riot_accountList with same uuid propety as puuid and remove it
    var new_account_list = riot_accountList.filter(account => account.uuid !== puuid);
    setRiot_AccountList(new_account_list);
    closePopup(popupToClose);
  }

  const openPopup = (setPopupOpen, info) => {
    if(info === "riot_rm_account" && riot_accountList.length === 0) {
      ipcRenderer.send("relayTextbox", "You cannot remove the account that the app is using.");
      return;
    }
    setPopupOpen(true);
    setPopupBackgroundShown(true);
    setIsOverlayShown(true);
  }
  
  const closePopup = (setPopupOpen) => {
    setPopupBackgroundShown(false);
    setPopupOpen(false);
    setIsOverlayShown(false);
  }

  const states = {
    true: 1,
    false: 0,
    '1': true,
    1: true,
    '0': false,
    0: false
  }

  const generateSettingsCode = () => {
    var str = '';

    str += states[autoOpen] + ':';
    str += states[startHidden] + ':';
    str += currentSelectedLanguage + ':';
    str += states[skinWishlistNotifications] + ':';
    str += states[minClose] + ':';
    str += states[hardwareAcceleration] + ':';
    str += currentTheme + ':';
    str += states[appRP] + ':';
    str += states[appRPwhenHidden] + ':';
    str += states[gameRP] + ':';
    str += states[gameRP_showMode] + ':';
    str += states[gameRP_showRank] + ':';
    str += states[gameRP_showTimer] + ':';
    str += states[gameRP_showScore];
    
    var buff = Buffer.from(str);
    str = buff.toString('base64');

    navigator.clipboard.writeText(str);
  }

  const validateSettingsCode = (settingsStates) => {
    var verificationState = true;

    var themes = ["normal","legacy","light"];

    if(settingsStates.length === 14) {
      for(var i = 0; i < settingsStates.length; i++) {
        if(i !== 2 && i !== 6 ) {
          if(settingsStates[i] !== '1' && settingsStates[i] !== '0') {
            verificationState = false;
            break;
          }
        } else {
          if(i === 2) {
            if(Object.keys(AllLangs).find(x => x === settingsStates[i]) === undefined) {
              verificationState = false;
              break;
            }
          } else {
            if(themes.find(x => x === settingsStates[i]) === undefined) {
              verificationState = false;
              break;
            }
          }
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
    
    var settingsStates = code.split(":");

    var isUseable = validateSettingsCode(settingsStates);
    
    if(isUseable) {
      changeAutoOpen(states[settingsStates[0]]);
      changeOpenHiddenOnAuto(states[settingsStates[1]]);
      changeSkinWishlistNotifications(states[settingsStates[2]]);
      changeMinClose(states[settingsStates[3]]);
      changeHardwareAcceleration(states[settingsStates[4]]);
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
      ipcRenderer.send('relayTextbox', errors.invalid_settings_code);
    }
  }

  const changeLanguageAndRestart = async () => {
    await changeSetting(`appLang`, currentSelectedLanguage);

    ipcRenderer.send('restartApp');
  }

  const resetApp = () => {
    ipcRenderer.send('resetApp');
  }

  const changeAppTheme = (theme) => {
    if(theme !== currentTheme) {
      document.body.classList.remove(currentTheme);
      document.body.classList.add(theme);
      setCurrentTheme(theme);
      setTheme(theme);

      changeSetting(`appColorTheme`, theme);
    }
  }

  React.useEffect(() => {
    fetchUserAccounts();
    fetchSettings();
    ipcRenderer.send('changeDiscordRP', "settings_activity");
    generateSettingsCode();
  }, []);

  React.useEffect(async () => {
    var uuid = uuidv5('appLang', process.env.SETTINGS_UUID);
    var data = await executeQuery(`SELECT * FROM setting:⟨${uuid}⟩`);
    setAppLang(data[0].value);
    setCurrentSelectedLanguage(data[0].value);
  }, [ general_changeLangPopupOpen ]);

  React.useEffect(async () => {
    var versionsData = await(await fetch('http://localhost:4000/v1/versions')).json();
    setPatchnotes_versionSwitcherSelectedPatchnotesVersion(versionsData.data[versionsData.data.length-1]);
    setPatchnotes_versionSwitcherFallback(versionsData.data[0]);
    setPatchnotesVersions(versionsData.data.reverse().splice(0, 15));
  }, []);

  var s2_bt2 = LocalText(L, 'pg_5.grp_1.setting_2.button_text_2');
  var s2_bt1 = LocalText(L, 'pg_5.grp_1.setting_2.button_text');

  return (
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <OverlayWrapper useRef={overlayWrapper} isShown={popupBackgroundShown}>

        <PopupCard
          useRef={general_changeLang}
          header={LocalText(L, "modals.change_lang.header")}
          text={LocalText(L, "modals.change_lang.desc")}
          button_1={LocalText(L, "modals.change_lang.button_1")}
          button_2={LocalText(L, "modals.change_lang.button_2")}
          button_1_onClick={() => { 
            changeLanguageAndRestart();
          }}
          button_2_onClick={() => {
            closePopup(setGeneral_changeLangPopupOpen);
            setCurrentSelectedLanguage(appLang === undefined ? 'en-US' : appLang);
          }}
          isWideCard={true}
          isButtonClickable={(appLang === undefined ? 'en-US' : appLang ) !== currentSelectedLanguage}
          isOpen={general_changeLangPopupOpen}
        >
          <div className="w-full mt-4 flex flex-row flex-wrap items-center">
            {
              Object.keys(AllLangs).map((lang, index) => {
                var appLang = appLang;
                if(appLang === undefined) appLang = 'en-US';

                if(appLang !== lang) {
                  return (
                    <LanguageCheckbox locale={lang} selectedLang={currentSelectedLanguage} displayName={AllLangs[lang].displayName} click={() => { setCurrentSelectedLanguage(lang) }} />
                  )
                }
              })
            }
          </div>
        </PopupCard>

        <PopupCard
          useRef={other_resetApp}
          header={LocalText(L, "modals.reset_app.header")}
          text={LocalText(L, "modals.reset_app.desc")}
          button_1={LocalText(L, "modals.reset_app.button_1")}
          button_2={LocalText(L, "modals.reset_app.button_2")}
          button_1_onClick={() => { resetApp() } }
          button_2_onClick={() => { closePopup(setOther_ResetAppPopupOpen) }}
          isOpen={other_resetAppPopupOpen}
          isButtonClickable={true}
        />

        <PopupCard
          useRef={other_applySettingsCodePopup}
          header={LocalText(L, "modals.apply_settings_profile.header")}
          text={LocalText(L, "modals.apply_settings_profile.desc")}
          button_1={LocalText(L, "modals.apply_settings_profile.button_1")}
          button_2={LocalText(L, "modals.apply_settings_profile.button_2")}
          button_1_onClick={() => { applySettingsFromCode(importSettingsVal) } }
          button_2_onClick={() => { closePopup(setOther_applySettingsCode) }}
          isOpen={other_applySettingsCode}
          isButtonClickable={true}
        />

        <PopupCard
          useRef={riot_removeAccount}
          header={LocalText(L, "modals.remove_riot_acc.header")}
          text={LocalText(L, "modals.remove_riot_acc.desc")}
          button_1={LocalText(L, "modals.remove_riot_acc.button_1")}
          button_2={LocalText(L, "modals.remove_riot_acc.button_2")}
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
                    'flex flex-row items-center content-center h-1/6 mb-2 justify-start rounded transition-all ease-in duration-100 border border-gray-500'
                    + (account.uuid == riot_activeAccountSelection ? ' border-gradient-left active-riot-acc' : ' hover:bg-tile-color border-tile-color cursor-pointer')
                  }
                  onClick={() => { setRiot_ActiveAccountSelection(account.uuid) }}
                  id={ account.uuid }
                  key={ index }
                >
                  <img 
                    src={account.rank}
                    className='w-9 p-1 mr-2 ml-1 rounded-full border border-gray-500 my-1 pointer-events-none'
                    id='navbar-account-switcher-rank'
                  /> 
                  <div className='flex flex-col justify-center pointer-events-none'>
                    <span className='m-0 leading-none mb-px pointer-events-none'>{ account.name }</span>
                    <span className='text-gray-500 font-light leading-none pointer-events-none'>#{ account.tag }</span>
                  </div>
                  <span className='ml-auto mr-4 pointer-events-none'>{ account.region.toUpperCase() }</span>
                </div>
              )
            })}
          </div>
        </PopupCard>

        <PopupCard
          useRef={pathchnotes_versionSwitcher}
          header={LocalText(L, "modals.change_patchnotes_ver.header")}
          text={LocalText(L, "modals.change_patchnotes_ver.desc")}
          button_1={LocalText(L, "modals.change_patchnotes_ver.button_1")}
          button_2={LocalText(L, "modals.change_patchnotes_ver.button_2")}
          button_1_onClick={() => { 
            closePopup(setPatchnotes_versionSwitcherOpen);
            setPatchnotes_selectedPatchnotesVersion(patchnotes_versionSwitcherSelectedPatchnotesVersion);
          }}
          button_2_onClick={() => { 
            closePopup(setPatchnotes_versionSwitcherOpen);
            setPatchnotes_versionSwitcherSelectedPatchnotesVersion(patchnotes_versionSwitcherFallback);
          }}
          isOpen={patchnotes_versionSwitcherOpen}
          isButtonClickable={patchnotes_versionSwitcherSelectedPatchnotesVersion !== ""}
          isWideCard
        >
          <div className="w-full mt-4 flex flex-row flex-wrap items-center">
            {patchnoteVersions.map((version, index) => {
              return (
                <VersionCheckbox key={index} version={version} selectedVersion={patchnotes_versionSwitcherSelectedPatchnotesVersion} click={() => { setPatchnotes_versionSwitcherSelectedPatchnotesVersion(version) }} />
              )
            })}
          </div>
        </PopupCard>

      </OverlayWrapper>

      <div className='w-full mt-4'>
        <div id='settings-topbar' className='flex flex-row h-1/5 justify-around'>
          <SettingsTile type='app' text={LocalText(L, 'nav.el_1')} delay={0} active={activeSettingsGroup} onClick={() => {setActiveGroup('app')}} />
          <SettingsTile type='rpc' text={LocalText(L, 'nav.el_2')} delay={0.1} active={activeSettingsGroup} onClick={() => {setActiveGroup('rpc')}} />
          <SettingsTile type='riot' text={LocalText(L, 'nav.el_3')} delay={0.15} active={activeSettingsGroup} onClick={() => {setActiveGroup('riot')}} />
          <SettingsTile type='patchnotes' text={LocalText(L, 'nav.el_4')} delay={0.2} active={activeSettingsGroup} onClick={() => {setActiveGroup('patchnotes')}} />
          <SettingsTile type='other' text={LocalText(L, 'nav.el_5')} delay={0.2} active={activeSettingsGroup} onClick={() => {setActiveGroup('other')}} />
        </div>
        <div id='wrapper-handler' className='ml-20 mt-10 h-4/5'>

          <SettingsWrapper type='app' activeWrapper={activeSettingsGroup}>

            <SettingsGroup header={LocalText(L, 'pg_1.grp_1.name')}>
              <Setting 
                title={LocalText(L, 'pg_1.grp_1.setting_1.name')} 
                desc={LocalText(L, 'pg_1.grp_1.setting_1.desc')} 
                inputType={'checkbox'} 
                isChecked={autoOpen} 
                onClick={changeAutoOpen}
              />

              <SettingsSeperator />

              <Setting 
                title={LocalText(L, 'pg_1.grp_1.setting_2.name')} 
                desc={LocalText(L, 'pg_1.grp_1.setting_2.desc')} 
                inputType={'checkbox'} 
                isChecked={startHidden && autoOpen}
                isDisabled={!autoOpen}
                onClick={changeOpenHiddenOnAuto}
              />
            </SettingsGroup>

            <SettingsGroup header={LocalText(L, 'pg_1.grp_2.name')}>
              <Setting 
                title={LocalText(L, 'pg_1.grp_2.setting_1.name')} 
                desc={LocalText(L, 'pg_1.grp_2.setting_1.desc')} 
                inputType={'button'}
                buttonText={LocalText(L, 'pg_1.grp_2.setting_1.button_text')}
                onClick={() => { openPopup(setGeneral_changeLangPopupOpen) }}
              />
            </SettingsGroup>

            <SettingsGroup header={LocalText(L, 'pg_1.grp_3.name')}>
              <Setting 
                title={LocalText(L, 'pg_1.grp_3.setting_1.name')} 
                desc={LocalText(L, 'pg_1.grp_3.setting_1.desc')} 
                desc2={LocalText(L, 'pg_1.grp_3.setting_1.desc2')}
                inputType={'checkbox'} 
                isChecked={skinWishlistNotifications}
                onClick={changeSkinWishlistNotifications}
              />
            </SettingsGroup>

            <SettingsGroup header={LocalText(L, 'pg_1.grp_4.name')}>
              <Setting
                title={LocalText(L, 'pg_1.grp_4.setting_1.name')} 
                desc={LocalText(L, 'pg_1.grp_4.setting_1.desc')} 
                inputType={'checkbox'} 
                isChecked={minClose} 
                onClick={changeMinClose}
              />
            </SettingsGroup>

            <SettingsGroup header={LocalText(L, 'pg_1.grp_5.name')}>
              <Setting 
                title={LocalText(L, 'pg_1.grp_5.setting_1.name')} 
                desc={LocalText(L, 'pg_1.grp_5.setting_1.desc')} 
                inputType={'checkbox'} 
                isChecked={hardwareAcceleration}
                onClick={changeHardwareAcceleration}
              />
            </SettingsGroup>

            <SettingsGroup header={LocalText(L, 'pg_1.grp_6.name')}>
              <ThemeSelector 
                L={L}
                currentTheme={currentTheme} 
                setCurrentTheme={changeAppTheme} 
              />
            </SettingsGroup>

          </SettingsWrapper>

          <SettingsWrapper type='rpc' activeWrapper={activeSettingsGroup}>

            <SettingsGroup header={LocalText(L, 'pg_2.grp_1.name')}>
              <Setting 
                title={LocalText(L, 'pg_2.grp_1.setting_1.name')} 
                desc={LocalText(L, 'pg_2.grp_1.setting_1.desc')}
                inputType={'checkbox'}
                isChecked={appRP}
                onClick={changeAppRP}
              />

              <SettingsSeperator />

              <Setting 
                title={LocalText(L, 'pg_2.grp_1.setting_2.name')} 
                desc={LocalText(L, 'pg_2.grp_1.setting_2.desc')} 
                inputType={'checkbox'}
                isChecked={appRPwhenHidden}
                isDisabled={!appRP}
                onClick={changeAppRPWhenHidden}
              />
            </SettingsGroup>

            <SettingsGroup header={LocalText(L, 'pg_2.grp_2.name')}>

              <Setting 
                title={LocalText(L, 'pg_2.grp_2.setting_1.name')} 
                desc={LocalText(L, 'pg_2.grp_2.setting_1.desc')} 
                inputType={'checkbox'} 
                isChecked={gameRP}
                onClick={changeGameRP}
              />

              <SettingsSeperator />

              <Setting 
                title={LocalText(L, 'pg_2.grp_2.setting_2.name')} 
                desc={LocalText(L, 'pg_2.grp_2.setting_2.desc')} 
                desc2={LocalText(L, 'pg_2.grp_2.setting_2.desc2')}
                inputType={'checkbox'} 
                isChecked={gameRP_showMode}
                onClick={changeShowMatchMode}
              />

              <Setting 
                title={LocalText(L, 'pg_2.grp_2.setting_3.name')} 
                desc={LocalText(L, 'pg_2.grp_2.setting_3.desc')} 
                inputType={'checkbox'} 
                isChecked={gameRP_showRank}
                isDisabled={!gameRP_showMode}
                onClick={changeShowRank}
              />

              <Setting 
                title={LocalText(L, 'pg_2.grp_2.setting_4.name')} 
                desc={LocalText(L, 'pg_2.grp_2.setting_4.desc')} 
                inputType={'checkbox'} 
                isChecked={gameRP_showTimer}
                onClick={changeShowTimer}
              />

              <Setting 
                title={LocalText(L, 'pg_2.grp_2.setting_5.name')} 
                desc={LocalText(L, 'pg_2.grp_2.setting_5.desc')} 
                inputType={'checkbox'} 
                isChecked={gameRP_showScore}
                onClick={changeShowScore}
              />
            </SettingsGroup>
            
          </SettingsWrapper>

          <SettingsWrapper type='riot' activeWrapper={activeSettingsGroup}>

            <SettingsGroup header={LocalText(L, 'pg_3.grp_1.name')}>
              <Setting 
                title={LocalText(L, 'pg_3.grp_1.setting_1.name')} 
                desc={LocalText(L, 'pg_3.grp_1.setting_1.desc')} 
                inputType={'button'} 
                buttonText={LocalText(L, 'pg_3.grp_1.setting_1.button_text')} 
                onClick={addNewAccount}
              />

              <SettingsSeperator />

              <Setting
                title={LocalText(L, 'pg_3.grp_1.setting_2.name')}
                desc={LocalText(L, 'pg_3.grp_1.setting_2.desc')}
                inputType={'button'}
                buttonText={LocalText(L, 'pg_3.grp_1.setting_2.button_text')}
                onClick={() => { openPopup(setRiot_RemoveAccountPopupOpen, "riot_rm_account") }}
              />
            </SettingsGroup>

          </SettingsWrapper>

          <SettingsWrapper type='patchnotes' activeWrapper={activeSettingsGroup}>

            <Patchnotes shownPatchnotes={patchnotes_selectedPatchnotesVersion} showVersionModal={() => { openPopup(setPatchnotes_versionSwitcherOpen) }} />

          </SettingsWrapper>

          <SettingsWrapper type='other' activeWrapper={activeSettingsGroup}>

            <SettingsGroup header={LocalText(L, 'pg_5.grp_1.name')}>
              <Setting
                title={LocalText(L, 'pg_5.grp_1.setting_1.name')}
                desc={LocalText(L, 'pg_5.grp_1.setting_1.desc')}
                inputType={'text'}
                inputVal={importSettingsVal}
                setInputVal={setImportSettingsVal}
                extraButton={true}
                extraButtonText={LocalText(L, 'pg_5.grp_1.setting_1.extra_button_text')}
                extraButtonClick={() => { openPopup(setOther_applySettingsCode) }}
              />

              <SettingsSeperator />

              <Setting
                title={LocalText(L, 'pg_5.grp_1.setting_2.name')}
                desc={LocalText(L, 'pg_5.grp_1.setting_2.desc')}
                inputType={'button'}
                buttonText={other_copyCodeToClipButtonText}
                onClick={() => { 
                  generateSettingsCode();
                  setOther_CopyCodeToClipButtonText(s2_bt2);
                  setTimeout(async () => {
                    setOther_CopyCodeToClipButtonText(s2_bt1);
                  }, 2000);
                }}
              />
            </SettingsGroup>

            <SettingsGroup header={LocalText(L, 'pg_5.grp_2.name')} important={true}>
              <Setting 
                title={LocalText(L, 'pg_5.grp_2.setting_1.name')} 
                desc={LocalText(L, 'pg_5.grp_2.setting_1.desc')}
                inputType={'button'} 
                buttonText={LocalText(L, 'pg_5.grp_2.setting_1.button_text')}
                onClick={() => { openPopup(setOther_ResetAppPopupOpen) }}
              />
            </SettingsGroup>

            <AboutWrapper header={LocalText(L, 'pg_5.about.name')}>
              <AboutGroup header={LocalText(L, 'pg_5.about.grp_1')}>

                <AboutCredit url={'https://valtracker.gg/docs'} text={'VALTracker API'} />
                <AboutCredit url={'https://valorant-api.com'} text={'valorant-api.com'} />
                <AboutCredit url={'https://docs.henrikdev.xyz/valorant.html'} text={'docs.henrikdev.xyz'} />

              </AboutGroup>

              <AboutGroup header={LocalText(L, 'pg_5.about.grp_2')}>

                <AboutCredit url={'https://nextui.org'} text={'NextUI'} />
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
import React from 'react';
import Layout from '../components/Layout';
import { ipcRenderer } from 'electron';
import fetch from 'node-fetch';
import fs from 'fs';
import { useRouter } from 'next/router';
import Langs from '../locales/languages.json';
import LanguageCheckbox from '../components/settings/LanguageCheckbox';
import L from '../locales/translations/setup.json';
import LocalText from '../components/translation/SetupLocalText';
import { motion } from 'framer-motion';
import { Progress } from '@nextui-org/react';
import { Translate, BackArrow } from '../components/SVGs';

const slides_first_load = {
  hidden: { opacity: 0, x: 0, y: 100, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
}

const slides_vars = {
  hidden: { opacity: 0, x: 200, y: 0, scale: 1, height: '100%', display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, height: '100%', display: 'block' },
  exit: { opacity: 0, x: -200, y: 0, scale: 1, height: '100%', transitionEnd: { display: 'none' } },
}

const page_2_vars = {
  hidden: { opacity: 0, x: 0, y: 200, scale: 1, height: '100%', display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, height: '100%', display: 'block' },
  exit: { opacity: 0, x: 0, y: 200, scale: 1, height: '100%', transitionEnd: { display: 'none' } },
}

const page_3_vars = {
  hidden: { opacity: 0, x: 0, y: -200, scale: 1, height: '100%', display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, height: '100%', display: 'block' },
  exit: { opacity: 0, x: 0, y: -200, scale: 1, height: '100%', transitionEnd: { display: 'none' } },
}

const page_4_vars = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 1, height: '100%', display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, height: '100%', display: 'block' },
  exit: { opacity: 0, x: 200, y: 0, scale: 1, height: '100%', transitionEnd: { display: 'none' } },
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

async function getXMPPRegion(requiredCookie, bearer, id_token) {
  return (await (await fetch("https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant", {
    "method": "PUT",
    "headers": {
      "Cookie": requiredCookie,
      "Content-Type": "application/json",
      "Authorization": "Bearer " + bearer
    },
    "body": `{\"id_token\":\"${id_token}\"}`,
    keepalive: true
  })).json());
}

async function getShopData(region, puuid, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/store/v2/storefront/${puuid}`, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      'Authorization': 'Bearer ' + bearer,
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

async function getMatchHistory(region, puuid, startIndex, endIndex, queue, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/match-history/v1/history/${puuid}?startIndex=${startIndex}&endIndex=${endIndex}&queue=${queue}`, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      'Authorization': 'Bearer ' + bearer,
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json());
}

async function getMatch(region, matchId, entitlement_token, bearer) {
  var valorant_version = await(await fetch('https://valorant-api.com/v1/version')).json();
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/match-details/v1/matches/${matchId}`, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      "X-Riot-ClientPlatform": "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
      'X-Riot-ClientVersion': valorant_version.data.riotClientVersion,
      'Authorization': 'Bearer ' + bearer,
      'Content-Type': 'application/json'
    },
    keepalive: true
  })).json());
}

async function getPlayerMMR(region, puuid, entitlement_token, bearer) {
  var matches = await getMatchHistory(region, puuid, 0, 1, 'competitive', entitlement_token, bearer);
  if(matches.History.length > 0) {
    var match_data = await getMatch(matches.History[0].MatchID);
    for(var i = 0; i < match_data.players.length; i++) {
      if(match_data.players[i].subject === puuid) {
        return match_data.players[i].competitiveTier;
      }
    }
  } else {
    return 0;
  }
}

function Setup() {
  const [ currentSelectedLanguage, setCurrentSelectedLanguage ] = React.useState('en-US');
  const [ currentLanguageDisplayName, setCurrentLanguageDisplayName ] = React.useState('English');

  const [ currentPage, setCurrentPage ] = React.useState('1');
  const [ lastPage, setLastPage ] = React.useState('0');

  const [ isPage2Shown, setIsPage2Shown ] = React.useState(false);
  const [ isLoginCompleted, setIsLoginCompleted ] = React.useState(false);

  const [ playerData, setPlayerData ] = React.useState({ playerRegion: '' });
  const [ loadingState, setLoadingState ] = React.useState('');

  const [ isProgressShown, setIsProgressShown ] = React.useState(false);
  const [ progress, setProgress ] = React.useState(0);

  const [ overallProgress, setOverallProgress ] = React.useState(6); //6, 33, 62, 100

  const login = async () => {
    var data = await ipcRenderer.invoke('loginWindow');
    
    if(data !== false) {
      try {
        setIsProgressShown(true);
        
        var bearer = data.tokenData.accessToken;
        var id_token = data.tokenData.id_token;
    
        var tdid_val = await ipcRenderer.invoke('getTdidCookie');
        var requiredCookie = 'tdid=' + tdid_val;
    
        setProgress(10);
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s0"));
        var puuid = await getPlayerUUID(bearer);
        var entitlement_token = await getEntitlement(bearer);
        setProgress(30);
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s1"));
        var regiondata = await getXMPPRegion(requiredCookie, bearer, id_token);
        var region = regiondata.affinities.live;
        var shopData = await getShopData(region, puuid, entitlement_token, bearer);
        setProgress(50);
    
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData));
    
        Date.prototype.addSeconds = function (s) {
          var copiedDate = new Date(this.getTime());
          return new Date(copiedDate.getTime() + s * 1000);
        }
    
        var dateData = {
          lastCheckedDate: new Date().getTime(),
          willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
        }
    
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s2"));
        var userInfo = await requestUserCreds(region, puuid);
        var playerName = userInfo[0].GameName;
        var playerTag = userInfo[0].TagLine;
        var playerUUID = userInfo[0].Subject;
        var playerRegion = region;
        setProgress(60);
    
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s3"));
        const currenttier = await getPlayerMMR(playerRegion, playerUUID, entitlement_token, bearer);
        setProgress(90);
    
        var userData = {
          playerName: playerName,
          playerTag: playerTag,
          playerUUID: playerUUID,
          playerRegion: playerRegion,
          playerRank: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/largeicon.png`
        }
  
        setPlayerData(userData);
    
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s4"));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData));
    
        if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid)) {
          fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid);
        }
    
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/token_data.json', JSON.stringify(data.tokenData));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/cookies.json', JSON.stringify(data.riotcookies));
        
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(data.tokenData));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify(data.riotcookies));
    
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', JSON.stringify(userData));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + playerUUID + '.json', JSON.stringify(userData));
  
        setLoadingState('');
        setProgress(100);
        setIsLoginCompleted(true);
      } catch(err) {
        console.log(err);
        setIsProgressShown(false);
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.err"));
      }
    } else {
      setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.win_closed"));
    }
  }

  const finishSetup = () => {
    var load_data_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
    var load_data = JSON.parse(load_data_raw);
  
    load_data.hasFinishedSetupSequence = true;
    load_data.appLang = currentSelectedLanguage;
    fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json", JSON.stringify(load_data));

    ipcRenderer.send('finishedSetup');
  }

  React.useEffect(() => {
    ipcRenderer.send('isInSetup');
  }, []);

  return (
    <Layout setup={true} classNames={'overflow-hidden'}>
      <div className='flex flex-col items-center p-4 h-full w-full'>
        <div id='setup-timeline' className='border-2 border-maincolor-lightest w-full p-2 h-14 rounded'>
          <div className='flex flex-row items-center mb-1 justify-between'>
            <span>{LocalText(L, currentSelectedLanguage, 'progress.lang')}</span>
            <span>{LocalText(L, currentSelectedLanguage, 'progress.riot')}</span>
            <span>{LocalText(L, currentSelectedLanguage, 'progress.confirm')}</span>
            <span>{LocalText(L, currentSelectedLanguage, 'progress.finish')}</span>
          </div>
          <Progress value={overallProgress} color="gradient" size={'xs'} className={'my-4 bg-maincolor-lightest rounded relative bottom-0 mt-0 w-full'} />
        </div>
        <div className='setup-content border-2 border-maincolor-lightest w-full mt-4 rounded p-2 relative overflow-hidden'>
          <motion.div 
            className='h-full relative'
            variants={lastPage === '0' ? slides_first_load : slides_vars}
            initial="hidden"
            animate={currentPage === '1' ? "enter" : "exit"}
            transition={{ type: 'linear', duration: 0.5, delay: (currentPage === '1' && lastPage !== '0' ? 0.5 : 0)}}
            id='pg-1'
          >
            <span className='text-lg'>{LocalText(L, currentSelectedLanguage, 'page_1.header')}</span>
            <hr className='bg-maincolor-lightest h-0.5 border-none mb-0' />
            <span className='text-sm text-gray-500'>{LocalText(L, currentSelectedLanguage, 'page_1.info')}</span>
            <div className='flex flex-row flex-wrap w-full mb-4 mt-2'>
              {Object.keys(Langs).map((lang, index) => {
                return (
                  <LanguageCheckbox key={index} locale={lang} selectedLang={currentSelectedLanguage} displayName={Langs[lang].displayName} click={() => { setCurrentSelectedLanguage(lang); setCurrentLanguageDisplayName(Langs[lang].displayName) }} />
                )
              })}
            </div>
            <button 
              onClick={() => {
                setIsPage2Shown(true);
                setCurrentPage('2');
                setLastPage('1');
                setOverallProgress(33);
              }}
              className={'setup-button bottom-2 left-2'}
            >
              {LocalText(L, currentSelectedLanguage, 'page_1.button_1_text')}
            </button>
          </motion.div>

          <motion.div
            variants={page_2_vars}
            initial="hidden"
            animate={isPage2Shown ? "enter" : 'exit'}
            transition={{ type: 'linear', duration: 0.5, delay: (isPage2Shown ? 0.5 : 0) }}
            id='pg-2'
            className='h-full relative'
          >
            <span className='text-lg'>{LocalText(L, currentSelectedLanguage, 'page_2.header')}</span>
            <hr className='bg-maincolor-lightest h-0.5 border-none mb-4' />
            <div className='flex flex-col items-center justify-center h-4/6 w-full mb-4'>
              <button className={'flex flex-row items-center mb-6 ' + (isLoginCompleted ? 'disabled' : '')} disabled={isLoginCompleted} onClick={() => ( login() )}><img src='/images/riot_fist.png' className='w-6 mr-2' /> {isLoginCompleted ? LocalText(L, currentSelectedLanguage, "page_2.login_button_text_2") : LocalText(L, currentSelectedLanguage, "page_2.login_button_text_1")}</button>
              <Progress value={progress} color="gradient" size={'xs'} className={'my-4 bg-maincolor-lightest rounded relative bottom-0 mt-0 w-2/6 ' + (isProgressShown ? '' : 'hidden')} />
              <div className={'relative bottom-3.5 font-thin text-gray-500 text-left w-2/6 ' + (isProgressShown ? 'text-left w-2/6' : 'text-center')}>{loadingState}</div>
            </div>
            <div className='absolute bottom-0.5 left-2'>
              {
                isLoginCompleted ? 
                (
                  <button 
                    onClick={() => {
                      setIsPage2Shown(false);
                      setLastPage("2");
                      setCurrentPage("3");
                      setOverallProgress(62);
                    }}
                    className={'bottom-0.5 relative'}
                  >
                    {LocalText(L, currentSelectedLanguage, "page_2.button_1_text")}
                  </button>
                )
                :
                null
              }
              <button 
                onClick={() => {
                  setIsPage2Shown(false);
                  setLastPage("2");
                  setCurrentPage("1");
                  setOverallProgress(6);
                }}
                className={'text-button relative inline-flex flex-row items-center ' + (isLoginCompleted ? 'right-5 top-0.5' : ' right-8 top-0.5')}
              >
                <BackArrow cls='w-4 mr-2' />{LocalText(L, currentSelectedLanguage, "page_2.button_2_text")}
              </button>
            </div>
          </motion.div>

          <motion.div
            variants={page_3_vars}
            initial="hidden"
            animate={currentPage === '3' ? "enter" : "exit"}
            transition={{ type: 'linear', duration: 0.5, delay: (currentPage === '3' ? 0.5 : 0) }}
            id='pg-3'
            className='h-full relative'
          >
            <span className='text-lg'>{LocalText(L, currentSelectedLanguage, 'page_3.header')}</span>
            <hr className='bg-maincolor-lightest h-0.5 border-none mb-2' />
            <div className='flex flex-col items-center'>
              <div className='flex flex-row items-center mb-4 mt-8'>
                <Translate cls='w-6 mr-2 ml-1' />
                <span>{currentLanguageDisplayName}</span>
              </div>
              <div 
                className={
                  'flex flex-row items-center content-center w-52 mb-2 justify-start border rounded transition-all ease-in duration-100 border-gradient-left active-riot-acc'
                }
              >
                <img 
                  src={playerData.playerRank}
                  className='w-9 p-1 mr-2 ml-1 rounded-full border border-gray-500 my-1 pointer-events-none'
                  id='navbar-account-switcher-rank shadow-img'
                /> 
                <div className='flex flex-col justify-center pointer-events-none'>
                  <span className='m-0 leading-none mb-px pointer-events-none'>{ playerData.playerName }</span>
                  <span className='text-gray-500 font-light leading-none pointer-events-none'>#{ playerData.playerTag }</span>
                </div>
                <span className='ml-auto mr-4 pointer-events-none'>{ playerData.playerRegion.toUpperCase() }</span>
              </div>

            </div>
            <div className='absolute bottom-0 left-2 flex flex-row items-center'>
              <button 
                onClick={() => {
                  setOverallProgress(100);
                  setLastPage("3");
                  setCurrentPage("4");
                }}
                className={''}
              >
                {LocalText(L, currentSelectedLanguage, 'page_3.button_1_text')}
              </button>
              <button 
                onClick={() => {
                  setOverallProgress(33);
                  setLastPage("3");
                  setCurrentPage("2");
                  setIsPage2Shown(true);
                }}
                className={'text-button relative inline-flex flex-row items-center right-5'}
              >
                <BackArrow cls='w-4 mr-2' />{LocalText(L, currentSelectedLanguage, 'page_3.button_2_text')}
              </button>
            </div>
          </motion.div>

          <motion.div
            variants={page_4_vars}
            initial="hidden"
            animate={currentPage === '4' ? "enter" : 'exit'}
            transition={{ type: 'linear', duration: 0.5, delay: (currentPage === '4' ? 0.5 : 0) }}
            id='pg-4'
            className='h-full relative'
          >
            <span className='text-lg'>{LocalText(L, currentSelectedLanguage, 'page_4.header')}</span>
            <hr />
            <div className='h-full w-full flex items-center justify-center'>
              <button 
                onClick={() => {
                  finishSetup();
                }}
                className={'relative bottom-8'}
              >
                {LocalText(L, currentSelectedLanguage, 'page_4.finish_button_text')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

export default Setup;
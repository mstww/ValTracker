import React from 'react';
import { ipcRenderer } from 'electron';
import fetch from 'node-fetch';
import Langs from '../locales/languages.json';
import LanguageCheckbox from '../components/settings/LanguageCheckbox';
import L from '../locales/translations/setup.json';
import LocalText from '../components/translation/SetupLocalText';
import { motion } from 'framer-motion';
import { Progress } from '@nextui-org/react';
import { Translate, BackArrow } from '../components/SVGs';
import Layout from '../components/Layout';
import { createThing, executeQuery, updateThing } from '../js/dbFunctions.mjs';
import { v5 as uuidv5 } from 'uuid';
import { getPUUID, getEntitlement, getXMPPRegion, requestUserCreds, getPlayerMMR } from '../js/riotAPIFunctions.mjs';

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

function Setup({ isOverlayShown, setIsOverlayShown }) {
  const [ currentSelectedLanguage, setCurrentSelectedLanguage ] = React.useState('en-US');
  const [ currentLanguageDisplayName, setCurrentLanguageDisplayName ] = React.useState('English');

  const [ currentPage, setCurrentPage ] = React.useState('1');
  const [ lastPage, setLastPage ] = React.useState('0');

  const [ isPage2Shown, setIsPage2Shown ] = React.useState(false);
  const [ isLoginCompleted, setIsLoginCompleted ] = React.useState(false);

  const [ playerData, setPlayerData ] = React.useState({ region: '' });
  const [ loadingState, setLoadingState ] = React.useState('');

  const [ isProgressShown, setIsProgressShown ] = React.useState(false);
  const [ progress, setProgress ] = React.useState(0);

  var overallProgressValues = LocalText(L, currentSelectedLanguage, "progress.values");

  const [ overallProgress, setOverallProgress ] = React.useState(overallProgressValues[0]);

  const login = async () => {
    var data = await ipcRenderer.invoke('loginWindow');
    
    if(data.tokenData) {
      try {
        setIsProgressShown(true);
        
        var bearer = data.tokenData.accessToken;
        var id_token = data.tokenData.id_token;
    
        var tdid_val = await ipcRenderer.invoke('getTdidCookie');
        var requiredCookie = 'tdid=' + tdid_val;
    
        setProgress(10);
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s0"));
        var puuid = await getPUUID(bearer);
        var entitlement_token = await getEntitlement(bearer);
        setProgress(30);
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s1"));
        var regiondata = await getXMPPRegion(requiredCookie, bearer, id_token);
        var region = regiondata.affinities.live;
        setProgress(50);
    
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s2"));
        var userInfo = await requestUserCreds(region, puuid);
        var name = userInfo[0].GameName;
        var tag = userInfo[0].TagLine;
        var uuid = userInfo[0].Subject;
        var region = region;
        setProgress(60);
    
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s3"));
        const currenttier = await getPlayerMMR(region, uuid, entitlement_token, bearer);
        setProgress(90);
    
        var userData = {
          name: name,
          tag: tag,
          uuid: uuid,
          region: region,
          rank: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/largeicon.png`
        }
  
        setPlayerData(userData);
    
        setLoadingState(LocalText(L, currentSelectedLanguage, "page_2.loading_states.s4"));
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
      
        var bundle = await (await fetch(`https://api.valtracker.gg/v1/bundles/featured`)).json();
        var result = await createThing(`featuredBundle:⟨${process.env.SERVICE_UUID}⟩`, bundle.data);
        
        var instancetoken = await ipcRenderer.invoke("requestInstanceToken", [name, tag]);
      
        await createThing(`services:⟨${process.env.SERVICE_UUID}⟩`, {
          "lastMessageUnix": Date.now(),
          "featuredBundle": result.id,
          "instancetoken": instancetoken.data
        });
  
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

  const finishSetup = async () => {
    var uuid = uuidv5("setupCompleted", process.env.SETTINGS_UUID);
    await updateThing(`setting:⟨${uuid}⟩`, {
      "name": "setupCompleted",
      "value": true,
      "type": "main"
    });

    var uuid = uuidv5("appLang", process.env.SETTINGS_UUID);
    await updateThing(`setting:⟨${uuid}⟩`, {
      "value": currentSelectedLanguage
    });

    ipcRenderer.send('finishedSetup');
  }

  return (
    <Layout setup={true} classNames={'overflow-hidden'} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <div className='flex flex-col items-center p-4 h-full w-full'>
        <div id='setup-timeline' className='border border-tile-color w-full p-2 h-14 rounded'>
          <div className='flex flex-row items-center mb-1 justify-between'>
            <span className='font-medium'>{LocalText(L, currentSelectedLanguage, 'progress.lang')}</span>
            <span className='font-medium'>{LocalText(L, currentSelectedLanguage, 'progress.riot')}</span>
            <span className='font-medium'>{LocalText(L, currentSelectedLanguage, 'progress.confirm')}</span>
            <span className='font-medium'>{LocalText(L, currentSelectedLanguage, 'progress.finish')}</span>
          </div>
          <Progress value={overallProgress} color="gradient" size={'xs'} className={'my-4 bg-tile-color rounded relative bottom-0 mt-0 w-full'} />
        </div>
        <div className='setup-content border border-tile-color w-full mt-4 rounded p-2 relative overflow-hidden'>
          <motion.div 
            className='h-full relative'
            variants={lastPage === '0' ? slides_first_load : slides_vars}
            initial="hidden"
            animate={currentPage === '1' ? "enter" : "exit"}
            transition={{ type: 'linear', duration: 0.5, delay: (currentPage === '1' && lastPage !== '0' ? 0.5 : 0)}}
            id='pg-1'
          >
            <span className='text-lg font-bold'>{LocalText(L, currentSelectedLanguage, 'page_1.header')}</span>
            <hr className='bg-tile-color h-0.5 border-none mb-0' />
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
                setOverallProgress(overallProgressValues[1]);
              }}
              className={'button default relative top-8 -bottom-0.5 left-0'}
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
            <span className='text-lg font-bold'>{LocalText(L, currentSelectedLanguage, 'page_2.header')}</span>
            <hr className='bg-tile-color h-0.5 border-none mb-4' />
            <div className='flex flex-col items-center justify-center h-4/6 w-full mb-4'>
              <button className={'flex flex-row items-center mb-6 button default ' + (isLoginCompleted ? 'disabled' : '')} disabled={isLoginCompleted} onClick={() => ( login() )}><img src='/images/riot_fist.png' className='w-6 mr-2' /> {isLoginCompleted ? LocalText(L, currentSelectedLanguage, "page_2.login_button_text_2") : LocalText(L, currentSelectedLanguage, "page_2.login_button_text_1")}</button>
              <Progress value={progress} color="gradient" size={'xs'} className={'my-4 bg-tile-color rounded relative bottom-0 mt-0 w-2/6 ' + (isProgressShown ? '' : 'hidden')} />
              <div className={'relative bottom-3.5 font-light text-gray-500 text-left w-2/6 ' + (isProgressShown ? 'text-left w-2/6' : 'text-center')}>{loadingState}</div>
            </div>
            <div className='absolute bottom-1 left-2'>
              {
                isLoginCompleted ? 
                (
                  <button 
                    onClick={() => {
                      setIsPage2Shown(false);
                      setLastPage("2");
                      setCurrentPage("3");
                      setOverallProgress(overallProgressValues[2]);
                    }}
                    className={'bottom-0.5 relative button default mr-2'}
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
                  setOverallProgress(overallProgressValues[0]);
                }}
                className={'button text relative inline-flex flex-row items-center button text ' + (isLoginCompleted ? 'top-0.5' : ' right-8 top-0.5')}
              >
                <BackArrow className='w-4 mr-2' />{LocalText(L, currentSelectedLanguage, "page_2.button_2_text")}
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
            <span className='text-lg font-bold'>{LocalText(L, currentSelectedLanguage, 'page_3.header')}</span>
            <hr className='bg-tile-color h-0.5 border-none mb-2' />
            <div className='flex flex-col items-center'>
              <div className='flex flex-row items-center mb-4 mt-8'>
                <Translate className='w-6 mr-2 ml-1' />
                <span>{currentLanguageDisplayName}</span>
              </div>
              <div 
                className={
                  'flex flex-row items-center content-center w-52 mb-2 justify-start border rounded transition-all ease-in duration-100 border-gradient-left active-riot-acc'
                }
              >
                <img 
                  src={playerData.rank}
                  className='w-9 p-1 mr-2 ml-1 rounded-full border border-gray-500 my-1 pointer-events-none'
                  id='navbar-account-switcher-rank shadow-img'
                /> 
                <div className='flex flex-col justify-center pointer-events-none'>
                  <span className='m-0 leading-none mb-px pointer-events-none'>{ playerData.name }</span>
                  <span className='text-gray-500 font-light leading-none pointer-events-none'>#{ playerData.tag }</span>
                </div>
                <span className='ml-auto mr-4 pointer-events-none'>{ playerData.region.toUpperCase() }</span>
              </div>

            </div>
            <div className='absolute bottom-0 left-2 flex flex-row items-center'>
              <button 
                onClick={() => {
                  setOverallProgress(overallProgressValues[3]);
                  setLastPage("3");
                  setCurrentPage("4");
                }}
                className={'button default'}
              >
                {LocalText(L, currentSelectedLanguage, 'page_3.button_1_text')}
              </button>
              <button 
                onClick={() => {
                  setOverallProgress(overallProgressValues[1]);
                  setLastPage("3");
                  setCurrentPage("2");
                  setIsPage2Shown(true);
                }}
                className={'button text relative inline-flex flex-row items-center right-5'}
              >
                <BackArrow className='w-4 mr-2' />{LocalText(L, currentSelectedLanguage, 'page_3.button_2_text')}
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
            <span className='text-lg font-bold'>{LocalText(L, currentSelectedLanguage, 'page_4.header')}</span>
            <hr />
            <div className='h-full w-full flex items-center justify-center'>
              <button 
                onClick={() => {
                  finishSetup();
                }}
                className={'relative bottom-8 button default'}
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
import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ipcRenderer } from 'electron';
import fetch from 'node-fetch';
import L from '../../locales/translations/reauth.json';
import LocalText from '../translation/LocalText';
import { createThing, executeQuery, getCurrentUserData } from '../../js/dbFunctions.mjs';

const card_base_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const card_step_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}

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

export default function ReauthLayer({ isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();
  
  const [ reauthQueue, setReauthQueue ] = React.useState([]);
  const [ reauthShown, setReauthShown ] = React.useState(false);
  const [ currentReauthStep, setCurrentReauthStep ] = React.useState(0);
  const [ userData, setUserData ] = React.useState({});

  const invokeLoginWindow = async () => {
    const data = await openLoginWindow();
    if(data) {
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
    
      var bundle = await (await fetch('https://api.valtracker.gg/featured-bundle')).json();
      var result = await createThing(`featuredBundle:⟨${process.env.SERVICE_UUID}⟩`, bundle.data);
    
      await createThing(`services:⟨${process.env.SERVICE_UUID}⟩`, {
        "lastMessageUnix": Date.now(),
        "featuredBundle": result.id
      });

      return;
    }
  }

  const restartAuthCycle = async () => {
    ipcRenderer.send('restartApp');
  }

  React.useEffect(() => {
    if(router.query.reauth_failed == 'true') {
      var reauthArray = JSON.parse(router.query.reauthArray);
      setReauthQueue(reauthArray);

      setReauthShown(true);
      setIsOverlayShown(true);
    }
  }, [ router ]);

  React.useEffect(async () => {
    var data = await getCurrentUserData();
    setUserData(data);
  }, []);

  return(
    <motion.div 
      className='absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-center items-center pointer-events-none z-50 bg-black bg-opacity-80'
      key={"LoginBackdrop"}
      variants={backdrop_variants}
      initial="hidden"
      animate={reauthShown ? "enter" : "exit"}
      transition={{ type: 'ease-in', duration: 0.3 }}
    >
      <motion.div 
        className='flex flex-col justify-center items-center w-96 bg-maincolor rounded p-4 pointer-events-auto'
        key={"InfoCard"}
        variants={card_base_variants}
        initial="hidden"
        animate={reauthShown && currentReauthStep === 0 ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <h2 className='mb-2'>{LocalText(L, "first_card.header")}</h2>
        <p className='font-normal text-base'>{LocalText(L, "first_card.desc", reauthQueue.length)}</p>
        <button className='w-full mt-8' onClick={() => { setCurrentReauthStep(currentReauthStep+1) }}>{LocalText(L, "first_card.button_text")}</button>
      </motion.div>
      {
        reauthQueue.map((accountData, index) => {
          var localReauthStep = index+1;

          return(
            <motion.div 
              className='flex flex-col justify-center items-center w-96 bg-maincolor rounded p-4 pointer-events-auto'
              key={"LoginCard_" + localReauthStep}
              variants={card_step_variants}
              initial="hidden"
              animate={currentReauthStep === localReauthStep ? "enter" : "exit"}
              transition={{ type: 'ease-in', duration: 0.3, delay: (currentReauthStep === localReauthStep ? 0.35 : 0) }}
            >
              <h2 className='mb-2'>{LocalText(L, "account_card.header", localReauthStep, (userData.name + '#' + userData.tag))}</h2>
              <p>{LocalText(L, "account_card.desc")}</p>
              <button 
                className='w-full mt-4' 
                onClick={async () => {
                  await invokeLoginWindow();
                  setCurrentReauthStep(currentReauthStep+1);
                }}
              >
                {LocalText(L, "account_card.button_text")}
              </button>
            </motion.div>
          )
        })
      }
      <motion.div 
        className='flex flex-col justify-center items-center w-96 bg-maincolor rounded p-4 pointer-events-auto'
        key={"FinalCard"}
        variants={card_step_variants}
        initial="hidden"
        animate={currentReauthStep > reauthQueue.length ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3, delay: 0.35 }}
      >
        <h2 className='mb-2'>{LocalText(L, "final_card.header")}</h2>
        <p>{LocalText(L, "final_card.desc")}</p>
        <button className='w-full mt-4' onClick={() => { restartAuthCycle() }}>{LocalText(L, "final_card.button_text")}</button>
      </motion.div>
    </motion.div>
  )
}
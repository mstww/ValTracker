import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import fs from 'fs';
import { ipcRenderer } from 'electron';
import fetch from 'node-fetch';

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

export default function ReauthLayer() {
  const router = useRouter();
  
  const [ reauthQueue, setReauthQueue ] = React.useState([]);
  const [ reauthShown, setReauthShown ] = React.useState(false);
  const [ currentReauthStep, setCurrentReauthStep ] = React.useState(0);

  const closeApp = () => {
    ipcRenderer.send('closeApp');
  }

  const invokeLoginWindow = async () => {
    const data = await openLoginWindow();
    if(data) {
      var bearer = data.tokenData.accessToken;
      var id_token = data.tokenData.id_token;
      var arg = await ipcRenderer.invoke('getTdidCookie', 'addedNewAccount');
      
      var requiredCookie = "tdid=" + arg
      var puuid = await getPlayerUUID(bearer);
  
      var reagiondata = await getXMPPRegion(requiredCookie, bearer, id_token);
      var region = reagiondata.affinities.live
      var options = {
        method: "PUT",
        body: "[\"" + puuid + "\"]",
        keepalive: true
      }
      var new_account_data = await fetch("https://pd." + region + ".a.pvp.net/name-service/v2/players", options);
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
    }
  }, [ router ]);

  React.useEffect(() => {
    if(currentReauthStep > reauthQueue.length) {

    }
  }, [ currentReauthStep ]);

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
        className='flex flex-col justify-center items-center w-96 bg-maincolor rounded-sm p-4 pointer-events-auto'
        key={"InfoCard"}
        variants={card_base_variants}
        initial="hidden"
        animate={reauthShown && currentReauthStep === 0 ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <h2 className='mb-2'>Error</h2>
        <p className='font-normal text-base'>We failed to log in with <span className='font-bold text-val-red'>{reauthQueue.length}</span> of your accounts. Please click the button below and follow the instructions to log in again.</p>
        <button className='w-full mt-8' onClick={() => { setCurrentReauthStep(currentReauthStep+1) }}>Proceed</button>
      </motion.div>
      {
        reauthQueue.map((accountData, index) => {
          var localReauthStep = index+1;
          var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/user_accounts/" + accountData.puuid + ".json"));

          return(
            <motion.div 
              className='flex flex-col justify-center items-center w-96 bg-maincolor rounded-sm p-4 pointer-events-auto'
              key={"LoginCard_" + localReauthStep}
              variants={card_step_variants}
              initial="hidden"
              animate={currentReauthStep === localReauthStep ? "enter" : "exit"}
              transition={{ type: 'ease-in', duration: 0.3, delay: (currentReauthStep === localReauthStep ? 0.35 : 0) }}
            >
              <h2 className='mb-2'>Account {localReauthStep} - {user_data.playerName + '#' + user_data.playerTag}</h2>
              <p>Click the button below to log in again with this account.</p>
              <button 
                className='w-full mt-4' 
                onClick={async () => {
                  await invokeLoginWindow();
                  setCurrentReauthStep(currentReauthStep+1);
                }}
              >
                Log in
              </button>
            </motion.div>
          )
        })
      }
      <motion.div 
        className='flex flex-col justify-center items-center w-96 bg-maincolor rounded-sm p-4 pointer-events-auto'
        key={"FinalCard"}
        variants={card_step_variants}
        initial="hidden"
        animate={currentReauthStep > reauthQueue.length ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3, delay: 0.35 }}
      >
        <h2 className='mb-2'>And that's it!</h2>
        <p>Thanks for using VALTracker. You can restart the app using the button below.</p>
        <button className='w-full mt-4' onClick={() => { restartAuthCycle() }}>Restart App</button>
      </motion.div>
    </motion.div>
  )
}
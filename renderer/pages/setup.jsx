import React from 'react';
import Layout from '../components/Layout';
import { ipcRenderer } from 'electron';
import fetch from 'node-fetch';
import fs from 'fs';
import { useRouter } from 'next/router';

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
  return (await (await fetch(`https://pd.${region}.a.pvp.net/name-service/v2/players/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: "[\"" + puuid + "\"]",
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

function Setup() {
  const router = useRouter();
  const login = async () => {
    try {
      var data = await ipcRenderer.invoke('loginWindow');
      
      var bearer = data.tokenData.accessToken;
      var id_token = data.tokenData.id_token;
  
      var tdid_val = await ipcRenderer.invoke('getTdidCookie');
      var requiredCookie = 'tdid=' + tdid_val;
  
      var puuid = await getPlayerUUID(bearer);
      var entitlement_token = await getEntitlement(bearer);
      var regiondata = await getXMPPRegion(requiredCookie, bearer, id_token);
      var region = regiondata.affinities.live;
      var shopData = await getShopData(region, puuid, entitlement_token, bearer);
  
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData));
  
      Date.prototype.addSeconds = function (s) {
        var copiedDate = new Date(this.getTime());
        return new Date(copiedDate.getTime() + s * 1000);
      }
  
      var dateData = {
        lastCheckedDate: new Date().getTime(),
        willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
      }
  
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData));
  
      if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid)) {
        fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid);
      }
  
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/token_data.json', JSON.stringify(data.tokenData));
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/cookies.json', JSON.stringify(data.riotcookies));
      
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(data.tokenData));
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify(data.riotcookies));
  
      // Reauth account here
  
      var userInfo = await requestUserCreds(region, puuid);
      var playerName = userInfo[0].GameName;
      var playerTag = userInfo[0].TagLine;
      var playerUUID = userInfo[0].Subject;
      var playerRegion = region;
  
      const playerMmr = await getPlayerMMR(playerRegion, playerUUID, entitlement_token, bearer);
      if(playerMmr.LatestCompetitiveUpdate.TierAfterUpdate) {
        var currenttier = playerMmr.LatestCompetitiveUpdate.TierAfterUpdate;
      } else {
        var currenttier = 0;
      }
  
      var userData = {
        playerName: playerName,
        playerTag: playerTag,
        playerUUID: playerUUID,
        playerRegion: playerRegion,
        playerRank: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/largeicon.png`
      }
  
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', JSON.stringify(userData));
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + playerUUID + '.json', JSON.stringify(userData));
  
      var load_data_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
      var load_data = JSON.parse(load_data_raw);
  
      load_data.hasFinishedSetupSequence = true;
      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json", JSON.stringify(load_data));
  
      ipcRenderer.send('finishedSetup');
      router.push('/home');
    } catch(err) {
      console.log(err);
      router.push('/setup');
    }
  }

  React.useEffect(() => {
    ipcRenderer.send('isInSetup');
  }, []);

  return (
    <Layout setup={true} classNames={'overflow-hidden'}>
      <div className='h-full flex flex-row justify-center items-center w-1/2 mx-auto'>
        <div id='left' className='w-1/2 mb-28 flex flex-row'>
          <div className='flex flex-col items-center mx-auto'>
            <img src='/icons/VALTracker_Logo_default.png' className='w-5/6' />
            <span className='text-3xl relative bottom-4'>WELCOME</span>
          </div>
        </div>
        <div id='right' className='w-1/2 mb-28 flex flex-col ml-8 relative h-1/4'>
          <p className='relative top-10 text-lg'>
            <span className='font-medium'>Hey Agent,</span><br />
            <span className='font-light'>Welcome to VALTracker. Please log in by clicking the button below.</span>
          </p>
          <button className='w-full mt-12' onClick={() => { login() }}>Log in</button>
        </div>
      </div>
    </Layout>
  );
}

export default Setup;
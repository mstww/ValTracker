import React from 'react';
import fs from 'fs';
import fetch from 'node-fetch';
import { useRouter } from 'next/router';

async function switcher_getPlayerUUID(bearer) {
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

async function switcher_getEntitlement(bearer) {
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

async function switcher_getXMPPRegion(requiredCookie, bearer, id_token) {
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

async function switcher_getShopData(region, puuid, entitlement_token, bearer) {
  return (await (await fetch('https://pd.' + region + '.a.pvp.net/store/v2/storefront/' + puuid, {
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

export default function AccountTile({ currenttier, puuid, username, usertag, userregion, active_account }) {
  const router = useRouter();

  const switchAccount = async (event) => {
    var currentUserCreds_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
    var currentUserCreds = JSON.parse(currentUserCreds_raw);
  
    var currentPuuid = currentUserCreds.playerUUID;
  
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + currentPuuid + '.json', currentUserCreds_raw) // works
  
    var currentUserTokens = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + currentPuuid + '/token_data.json', currentUserTokens) // works
  
    var currentUserCookies = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json');
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + currentPuuid + '/cookies.json', currentUserCookies) // works
  
    var puuidToBeSwitchedTo = event.target.id;
    var newUserCreds = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + puuidToBeSwitchedTo + '.json');
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', newUserCreds); // works
  
    var newTokenData_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuidToBeSwitchedTo + '/token_data.json');
    var newTokenData = JSON.parse(newTokenData_raw);

    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', newTokenData_raw); // works
  
    var newCookieData_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuidToBeSwitchedTo + '/cookies.json');
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', newCookieData_raw); // works
  
    var bearer = newTokenData.accessToken;
    
    sessionStorage.removeItem('navbar-rank');
    try {
      puuid = await switcher_getPlayerUUID(bearer);
  
      var entitlement_token = await switcher_getEntitlement(bearer);
  
      var region = newUserCreds.playerRegion
  
      var shopData = await switcher_getShopData(region, puuid, entitlement_token, bearer);
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))
  
      Date.prototype.addSeconds = function (seconds) {
        var copiedDate = new Date(this.getTime());
        return new Date(copiedDate.getTime() + seconds * 1000);
      }
  
      var dateData = {
        lastCkeckedDate: new Date().getTime(),
        willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
      }
  
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))

      router.push(router.route + '?account=' + puuidToBeSwitchedTo);
    } catch(err) {
      console.log(err);
      router.push(router.route + '?account=' + puuidToBeSwitchedTo);
    }
  }

  return (
    <li 
      className={
        'flex flex-row items-center content-center h-1/6 mb-2 justify-start border rounded-sm transition-all ease-in duration-100'
        + (active_account ? ' border-gradient-left active-riot-acc' : ' hover:bg-maincolor-lightest border-maincolor-lightest cursor-pointer')
      }
      id={ puuid }
      onClick={ async (e) => { active_account ? null : switchAccount(e) } }
    >
      <img 
        src={currenttier}
        className='w-9 p-1 mr-2 ml-1 rounded-full border border-gray-500 my-1 pointer-events-none'
        id='navbar-account-switcher-rank shadow-img'
      /> 
      <div className='flex flex-col justify-center pointer-events-none'>
        <span className='m-0 leading-none mb-px pointer-events-none'>{ username }</span>
        <span className='text-gray-500 font-light leading-none pointer-events-none'>#{ usertag }</span>
      </div>
      <span className='ml-auto mr-4 pointer-events-none'>{ userregion.toUpperCase() }</span>
    </li>
  )
}
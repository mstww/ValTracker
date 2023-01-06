import fetch from "node-fetch";

/**
 * Function that returns the match history of a user.
 * @param {String} region 
 * @param {String} puuid 
 * @param {Number} startIndex 
 * @param {Number} endIndex 
 * @param {String} queue 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 * @returns Returns the match history of the user. If this request fails, it returns the HTML response from the server.
 */

export async function getMatchHistory(region, puuid, startIndex, endIndex, queue, entitlement_token, bearer) {
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

/**
 * Funtion that returns a single match based on it's UUID.
 * @param {String} region 
 * @param {String} matchId 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 */

export async function getMatch(region, matchId, entitlement_token, bearer) {
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

/**
 * Function that returns a players contract data.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 */

export async function getPlayerContracts(region, puuid, entitlement_token, bearer) {
  var valorant_version = await(await fetch('https://valorant-api.com/v1/version')).json();
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/contracts/v1/contracts/${puuid}`, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      'Authorization': 'Bearer ' + bearer,
      'X-Riot-ClientVersion': valorant_version.data.riotClientVersion,
      'Content-Type': 'application/json'
    },
    keepalive: true
  })).json());
}

/**
 * Function that checks a specific match for a rankup.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} matchID 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 */

export async function checkForRankup(region, puuid, matchID, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  var data = await (await fetch(`https://pd.${region}.a.pvp.net/mmr/v1/players/${puuid}/competitiveupdates/${matchID}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer,
      'X-Riot-Entitlements-JWT': entitlement_token,
      'X-Riot-ClientPlatform': "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
      'Content-Type': 'application/json'
    },
    keepalive: true
  })).json();

  if(data.TierAfterUpdate > data.TierBeforeUpdate) return true;
  else return false;
}

/**
 * Function that sets a users inventory.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 * @param {Object} loadout 
 */

export async function setSkins(region, puuid, entitlement_token, bearer, loadout) {
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

/**
 * Function that retrieves a users inventory.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 */

export async function getPlayerLoadout(region, puuid, entitlement_token, bearer) {
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

/**
 * Function that retrieves a users entitlements.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 */

export async function getPlayerItems(region, puuid, entitlement_token, bearer) {
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

/**
 * Function that returns the match history of a user.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 * @param {Number} client_version 
 * @returns Returns the match history of the user. If this request fails, it returns the HTML response from the server.
 */

export async function getMMRInfo(region, puuid, entitlement_token, bearer, client_version) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/mmr/v1/players/${puuid}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer,
      'X-Riot-Entitlements-JWT': entitlement_token,
      'X-Riot-ClientPlatform': "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
      'X-Riot-ClientVersion': client_version,
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json());
}

/**
 * A function that returns a users rank based on their current match history.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 * @returns The current tier of the user as a number.
 */

export async function getPlayerMMR(region, puuid, entitlement_token, bearer) {
  var seasons = await(await fetch(`https://valorant-api.com/v1/seasons`)).json();
  
  var season = seasons.data.find(x => (new Date(x.startTime) < new Date()) && (new Date() < new Date(x.endTime)) && x.type === "EAresSeasonType::Act");
  var seasonUUID = season.uuid;

  var versionInfo = await (await fetch(`https://valorant-api.com/v1/version`)).json();

  var mmrInfo = await getMMRInfo(region, puuid, entitlement_token, bearer, versionInfo.data.riotClientVersion);
  
  var currentSeason = mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID[seasonUUID];

  if(currentSeason) {
    var currenttier = currentSeason.CompetitiveTier;
  } else {
    var currenttier = 0;
  }

  var peaktier = currenttier;

  for(var i = 0; i < mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID.length; i++) {
    if(mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID[i].CompetitiveTier > peaktier) peaktier = mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID[i].CompetitiveTier;
  }

  var totalOverallMatches = 0;

  var matchesByAct = {};

  for(var i = 0; i < Object.keys(mmrInfo.QueueSkills).length; i++) {
    var queue = mmrInfo.QueueSkills[Object.keys(mmrInfo.QueueSkills)[i]];
    for(var j = 0; j < Object.keys(queue.SeasonalInfoBySeasonID).length; j++) {
      if(!matchesByAct[Object.keys(queue.SeasonalInfoBySeasonID)[j]]) {
        matchesByAct[Object.keys(queue.SeasonalInfoBySeasonID)[j]] = 0;
      }
        
      totalOverallMatches += queue.SeasonalInfoBySeasonID[Object.keys(queue.SeasonalInfoBySeasonID)[j]].NumberOfGames;

      if(Object.keys(mmrInfo.QueueSkills)[i] === "competitive") queue.SeasonalInfoBySeasonID[Object.keys(queue.SeasonalInfoBySeasonID)[j]].NumberOfGames;

      matchesByAct[Object.keys(queue.SeasonalInfoBySeasonID)[j]] += queue.SeasonalInfoBySeasonID[Object.keys(queue.SeasonalInfoBySeasonID)[j]].NumberOfGames;
    }
  }

  var totalActMatches = matchesByAct[seasonUUID];

  const rankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/smallicon.png`;
  
  const date1 = new Date();
  const date2 = new Date(season.endTime);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  var obj = {
    "peaktier": peaktier,
    "ActWinsByTier": currentSeason.WinsByTier,
    "currenttier": currenttier,
    "ranked_rating": currentSeason.RankedRating,
    "currenttier_icon": rankIcon,
    "total_matches_played": currentSeason.NumberOfGames,
    "win_percentage": ((currentSeason.NumberOfWins / currentSeason.NumberOfGames) * 100).toFixed(2),
    "additional_info": mmrInfo.QueueSkills,
    "act_matches_total": totalActMatches,
    "overall_matches_total": totalOverallMatches,
    "days_remaining": diffDays
  }

  return obj;
}

/**
 * A function that returns a users puuid based on their access token.
 * @param {String} bearer
 */

export async function getPUUID(bearer) {
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

/**
 * A function that returns a users shard.
 * @param {String} requiredCookie
 * @param {String} bearer
 * @param {String} id_token
 */

export async function getXMPPRegion(requiredCookie, bearer, id_token) {
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

/**
 * A function that returns a users entitlement based on their access token.
 * @param {String} bearer
 */

export async function getEntitlement(bearer) {
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

/**
 * A function that returns a users name and tag based on their puuid.
 * @param {String} region
 * @param {String} puuid
 */

export async function requestUserCreds(region, puuid) {
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

/**
 * A function that returns a users wallet.
 * @param {String} region
 * @param {String} puuid
 * @param {String} entitlement_token
 * @param {String} bearer
 */

export async function getWallet(region, puuid, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch('https://pd.' + region + '.a.pvp.net/store/v1/wallet/' + puuid, {
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

/**
 * A function that returns all store offers.
 * @param {String} region
 * @param {String} entitlement_token
 * @param {String} bearer
 */

export async function getOffers(region, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch('https://pd.' + region + '.a.pvp.net/store/v1/offers/', {
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
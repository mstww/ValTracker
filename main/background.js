import { app, ipcMain, Menu, Tray, session } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import fs from 'fs';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';
import fetch from 'electron-fetch';
import { Worker } from 'worker_threads';
import RPC from 'discord-rpc';
import notifier from 'node-notifier';

const discord_rps = require("../modules/discord_rps.js");

// Change Discord RP if App requests it
var RPState = "app";

if(fs.existsSync(process.env.APPDATA + "/user_data/load_files/on_load.json")) {
  let onLoadData2 = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
  let loadData2 = JSON.parse(onLoadData2);
  
  if(loadData2.enableHardwareAcceleration == false) {
    app.disableHardwareAcceleration();
  }
}

const isProd = process.env.NODE_ENV === 'production';

const sendMessageToWindow = (channel, args) => {
  mainWindow.webContents.send(channel, args);
}

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')}`);
}

// Initialize new RPC client
const discordVALPresence = new RPC.Client({
  transport: "ipc",
});

// Initialize new RPC client
const discordClient = new RPC.Client({
  transport: "ipc",
});

// Get instance lock
const gotTheLock = app.requestSingleInstanceLock(); 

if(!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, CommandLine, workingDirectory) => {
    if(mainWindow) {
      if(mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

var app_data;

function createFavMatches() {
  // Create /favourite_matches dir
  fs.mkdirSync(app_data + "/user_data/favourite_matches");
}

function createUserData() {
  // Create /user_data dir and all files in it
  fs.mkdirSync(app_data + "/user_data");
  let userData = {
    playerName: "",
    playerTag: "",
    playerRegion: "",
    playerUUID: "",
  };
  fs.writeFileSync(app_data + "/user_data/user_creds.json", JSON.stringify(userData));
}

function createHomeSettings() {
  // Create /home_settings dir and all files in it
  fs.mkdirSync(app_data + "/user_data/home_settings");

  let homeSettings = {
    preferredMatchFilter: "unrated",
  };

  fs.writeFileSync(app_data + "/user_data/home_settings/settings.json", JSON.stringify(homeSettings));
}

function createLoadFiles() {
  // Create /load_files dir and all files in it
  fs.mkdirSync(app_data + "/user_data/load_files");

  let loadFileData = {
    hasFinishedSetupSequence: false,
    hasDiscordRPenabled: true
  };

  fs.writeFileSync(app_data + "/user_data/load_files/on_load.json", JSON.stringify(loadFileData));
}

function createPlayerProfileSettings() {
  // Create /player_profile_settings dir and all files in it
  fs.mkdirSync(app_data + "/user_data/player_profile_settings");

  let playerProfileSettings = {
    preferredMatchFilter: "unrated",
  };

  fs.writeFileSync(app_data + "/user_data/player_profile_settings/settings.json", JSON.stringify(playerProfileSettings));
}

function createThemes() {
  if(!fs.existsSync(app_data + "/user_data/themes")) {
    fs.mkdirSync(app_data + "/user_data/themes");
  }

  let themesPointerFile = {
    themeName: "normal",
  };

  fs.writeFileSync(app_data + "/user_data/themes/color_theme.json", JSON.stringify(themesPointerFile));

  // Create /themes/preset_themes dir and all files in it
  if(!fs.existsSync(app_data + "/user_data/themes/preset_themes")) {
    fs.mkdirSync(app_data + "/user_data/themes/preset_themes");
  }

  // Create /themes/custom_themes dir
  if(!fs.existsSync(app_data + "/user_data/themes/custom_themes")) {
    fs.mkdirSync(app_data + "/user_data/themes/custom_themes");
  }
}

function createMessageData() {
  fs.mkdirSync(app_data + "/user_data/message_data");

  var date = Date.now();
  var dateData = {
    date: date,
  };

  fs.writeFileSync(app_data + "/user_data/message_data/last_checked_date.json", JSON.stringify(dateData));
}

function createRiotGamesData() {
  fs.mkdirSync(app_data + "/user_data/riot_games_data");

  var cookiesData = [];
  var tokenData = {};

  fs.writeFileSync(app_data + "/user_data/riot_games_data/cookies.json", JSON.stringify(cookiesData));
  fs.writeFileSync(app_data + "/user_data/riot_games_data/token_data.json", JSON.stringify(tokenData));
}

function createInventoryData() {
  fs.mkdirSync(app_data + "/user_data/player_inventory");
  fs.mkdirSync(app_data + "/user_data/player_inventory/presets");

  var inventoryData = {};

  fs.writeFileSync(app_data + "/user_data/player_inventory/current_inventory.json", JSON.stringify(inventoryData));
}

async function getUserData(region) {
  return (await (await fetch("https://pd." + region + ".a.pvp.net/name-service/v2/players", {
    method: 'PUT',
    body: "[\"" + user_creds.playerUUID + "\"]",
    keepalive: true
  })).json());
}

async function getAccessTokens(ssid) {
  return (await fetch("https://auth.riotgames.com/api/v1/authorization", {
    method: 'POST',
    headers: {
      "User-Agent": "RiotClient/51.0.0.4429735.4381201 rso-auth (Windows;10;;Professional, x64)",
      'Content-Type': 'application/json',
      Cookie: ssid,
    },
    body: JSON.stringify({"client_id":"play-valorant-web-prod","nonce":"1","redirect_uri":"https://playvalorant.com/opt_in","response_type":"token id_token","scope":"account openid"}),
    keepalive: true
  }));
}

async function checkUserData() {
  var raw = fs.readFileSync(app_data + "/user_data/user_creds.json");
  var user_creds = JSON.parse(raw);
  
  if(!user_creds.playerName) {
    var response = await getUserData(user_creds.playerRegion);

    user_creds.playerName = response.data[0].GameName;
    user_creds.playerTag = response.data[0].TagLine;

    fs.writeFileSync(app_data + "/user_data/user_creds.json", JSON.stringify(user_creds));
    fs.writeFileSync(app_data + "/user_data/user_accounts/" + user_creds.playerUUID + ".json", JSON.stringify(user_creds));
  }

  if(!user_creds.playerUUID) {
    var account_data = await (await fetch(`https://api.henrikdev.xyz/valorant/v1/account/${user_creds.playerName}/${user_creds.playerTag}`)).json();

    user_creds.playerUUID = account_data.data.puuid;

    fs.writeFileSync(app_data + "/user_data/user_creds.json", JSON.stringify(user_creds));
    fs.writeFileSync(app_data + "/user_data/user_accounts/" + user_creds.playerUUID + ".json", JSON.stringify(user_creds));
  }

  if(!user_creds.playerRank) {
    var mmr_data = await (await fetch(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${user_creds.playerRegion}/${user_creds.playerUUID}`)).json();

    if(user_creds.playerRank != undefined) {
      user_creds.playerRank = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${mmr_data.data.currenttier}/largeicon.png`;
    } else {
      user_creds.playerRank = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png`;
    }

    fs.writeFileSync(app_data + "/user_data/user_creds.json", JSON.stringify(user_creds));
    fs.writeFileSync(app_data + "/user_data/user_accounts/" + user_creds.playerUUID + ".json", JSON.stringify(user_creds));
  }
}

const download_image = (url, new_path) => {
  fetch(url)
    .then(res => res.body.pipe(fs.createWriteStream(new_path)));
}

async function noFilesFound() {
  // Create /user_data dir and all files in it
  createUserData();

  // Create /favourite_matches dir and all files in it
  createFavMatches();

  // Create /home_settings dir and all files in it
  createHomeSettings();

  // Create /load_files dir and all files in it
  createLoadFiles();

  // Create /player_profile_settings dir and all files in it
  createPlayerProfileSettings();

  // Create /riot_games_data dir
  createRiotGamesData()

  // Create /shop_data dir
  fs.mkdirSync(app_data + "/user_data/shop_data");

  // Create /themes dir and all files in it
  createThemes();

  // Create /message_data dir and all files in it
  createMessageData();

  // Create /player_inventory dir and all files in it
  createInventoryData();

  fs.mkdirSync(app_data + "/user_data/user_accounts");

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/wishlists")) {
    fs.mkdirSync(process.env.APPDATA + "/VALTracker/user_data/wishlists");
  }

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons")) {
    fs.mkdirSync(process.env.APPDATA + "/VALTracker/user_data/icons");
  }
    
  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_beta.ico', process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico");
  };
    
  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Icon_default.png")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_beta.png', process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Icon_default.png");
  };

  // Load Window with Setup Sequence
  if (isProd) {
    await mainWindow.loadURL('app://./setup.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/setup`);
  }
}

async function reauthAccount(puuid) {
  try {
    if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid.split('.').pop() + "/cookies.json")) {
      const newCookiesFile = {};

      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid.split('.').pop() + "/cookies.json", JSON.stringify(newCookiesFile));
    }

    var rawCookies = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid.split('.').pop() + "/cookies.json");
    var bakedCookies = JSON.parse(rawCookies);

    var ssid;

    var jsontype = typeof bakedCookies[0] === "string";

    //check if json is object or array

    if(jsontype == true) {
      for (var i = 0; i < bakedCookies.length; i++) {
        var str1 = bakedCookies.split("ssid=").pop();
        var str2 = str1.split(';')[0];
        var ssid = 'ssid=' + str2 + ';'
      }
    } else {
      for (var i = 0; i < bakedCookies.length; i++) {
        if(bakedCookies[i].name == "ssid") {
          ssid = `ssid=${bakedCookies[i].value}; Domain=${bakedCookies[i].domain}; Path=${bakedCookies[i].path}; hostOnly=${bakedCookies[i].hostOnly}; secure=${bakedCookies[i].secure}; httpOnly=${bakedCookies[i].httpOnly}; session=${bakedCookies[i].session}; sameSite=${bakedCookies[i].sameSite};`;
        }
      }
    }

    const access_tokens = await getAccessTokens(ssid);

    const url_params = await access_tokens.json();

    var newTokenData = getTokenDataFromURL(url_params.response.parameters.uri);

    if(url_params.response.parameters.uri) {
      
      try {
        var user_data_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/user_accounts/" + puuid.split('.').pop() + ".json");
        var user_data = JSON.parse(user_data_raw);
  
        var mmr_data = await (await fetch(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${user_data.playerRegion}/${puuid}`)).json();
    
        var currenttier = mmr_data.data.currenttier;
        if(currenttier == null || currenttier == undefined) {
          currenttier = 0;
        }
  
        user_data.playerRank = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/largeicon.png`;
  
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/user_accounts/" + puuid.split('.').pop() + ".json", JSON.stringify(user_data));
  
        if(puuid.startsWith(".")) {
          fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/user_creds.json", JSON.stringify(user_data));
        }
      } catch(unused) {}
  
      if(puuid.startsWith(".")) {
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json", JSON.stringify(access_tokens.headers.get("set-cookie")));
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/token_data.json", JSON.stringify(newTokenData));
  
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid.split(".").pop() + "/cookies.json", JSON.stringify(access_tokens.headers.get("set-cookie")));
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid.split(".").pop() + "/token_data.json", JSON.stringify(newTokenData));
      } else {
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid + "/cookies.json", JSON.stringify(access_tokens.headers.get("set-cookie")));
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid + "/token_data.json", JSON.stringify(newTokenData));
      }
  
      console.log('Reauthenticated account with PUUID ' + puuid.split(".").pop());
  
      return { error: false, items: newTokenData, puuid: false };
    } else {
      return { error: true, items: url_params, puuid: puuid.split(".").pop() };
    }
  } catch (err) {
    return { error: true, items: err, puuid: puuid.split(".").pop() };
  }
}

async function reauthAllAccounts() {
  var puuid_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
  var puuid_parsed = JSON.parse(puuid_raw);

  if(puuid_parsed.playerUUID) {
    var puuid = puuid_parsed.playerUUID;
  
    var account_puuids = fs.readdirSync(process.env.APPDATA + "/VALTracker/user_data/user_accounts/");
    var accountsToReauth = [];

    account_puuids.forEach(uuid => {
      if(uuid.split(".")[0] == puuid) { 
        accountsToReauth.push("." + uuid.split(".")[0]);
      } else {
        accountsToReauth.push(uuid.split(".")[0]);
      }
    });
  
    var expectedLength = accountsToReauth.length;
  
    var i = 0;
  
    var data_array = [];
    var reauth_array = [];

    // Make a promise and check if it is rejected
    var promise = new Promise(async function(resolve, reject) {
      accountsToReauth.forEach(async (uuid) => {
        const { error, items, puuid } = await reauthAccount(uuid);

        if(error === true) {
          reauth_array.push({ error, items, puuid });
        } else {
          data_array.push(items);
        }
        i++;

        if(i == expectedLength) 
          resolve({ data_array, reauth_array });
      });
    });

    // Check if promise the promise was rejected
    var account_data = await promise.then(function({ data_array, reauth_array }) {
      if(reauth_array.length > 0) {
        console.log("Error while reauthing accounts.");
        return { error: true, items: false, reauthArray: reauth_array }; 
      } else {
        return { error: false, items: data_array[0], reauthArray: null }; 
      }
    });
    
    return account_data;
  } else {
    return { error: true, items: false, reauthArray: null };
  }
}

// -------------------- START RICH PRESENCE STATES --------------------

var playerAgent = false;
var pregameTimestamp = null;
var ingameTimestamp = null;
var menusTimestamp = null;
var lastState = null;
var lastGameMode = null;

// -------------------- END RICH PRESENCE STATES --------------------

async function getDataFromWebSocketEvent(eventData) {
  eventData = eventData.toString();

  if(eventData.split("")[0] !== "[") {
    return;
  }

  eventData = JSON.parse(eventData);

  if(eventData[1] !== "OnJsonApiEvent_chat_v4_presences") {
    return;
  }

  var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));

  if(eventData[2].data.presences[0].puuid !== user_data.playerUUID || eventData[2].data.presences[0].product !== "valorant") {
    return;
  }

  var B64_privateToken = eventData[2].data.presences[0].private;

  var buff = Buffer.from(B64_privateToken, 'base64');
  var privateObject = buff.toString();
  privateObject = JSON.parse(privateObject);

  var returnObj = {
    "isCustomGame": privateObject["provisioningFlow"] === "CustomGame",
    "isRange": privateObject["provisioningFlow"] === "ShootingRange",
    "playerState": privateObject["sessionLoopState"],
    "teamScore": privateObject["partyOwnerMatchScoreAllyTeam"],
    "enemyScore": privateObject["partyOwnerMatchScoreEnemyTeam"],
    "mapPath": privateObject["matchMap"],
    "gameMode": privateObject["queueId"]
  }

  return returnObj;
}

async function getShopData(region, puuid, entitlement_token, bearer) {
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

async function getPlayerItems(region, puuid, entitlement_token, bearer) {
  return (await (await fetch(`https://pd.${region}.a.pvp.net/store/v1/entitlements/${puuid}/e7c63390-eda7-46e0-bb7a-a6abdacd2433`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
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

async function getPlayer_PreGame(region, puuid, entitlement_token, bearer) {
  return (await (await fetch(`https://glz-${region}-1.${region}.a.pvp.net/pregame/v1/players/${puuid}`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
      "Content-Type": "application/json",
    },
    keepalive: true
  })).json());
}

async function getMatch_PreGame(region, MatchID, entitlement_token, bearer) {
  return (await (await fetch(`https://glz-${region}-1.${region}.a.pvp.net/pregame/v1/matches/${MatchID}`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
      "Content-Type": "application/json",
    },
    keepalive: true
  })).json());
}

async function getPlayer_CoreGame(region, puuid, entitlement_token, bearer) {
  return (await (await fetch(`https://glz-${region}-1.${region}.a.pvp.net/core-game/v1/players/${puuid}`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
      "Content-Type": "application/json",
    },
    keepalive: true
  })).json());
}

async function getMatch_CoreGame(region, MatchID, entitlement_token, bearer) {
  return (await (await fetch(`https://glz-${region}-1.${region}.a.pvp.net/core-game/v1/matches/${MatchID}`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
      "Content-Type": "application/json",
    },
    keepalive: true
  })).json());
}

async function getPlayer_Party(region, puuid, entitlement_token, bearer) {
  var valorant_version = await(await fetch('https://valorant-api.com/v1/version')).json();
  return (await (await fetch(`https://glz-${region}-1.${region}.a.pvp.net/parties/v1/players/${puuid}`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      "X-Riot-ClientVersion": 'release-' + valorant_version.data.version,
      'Authorization': "Bearer " + bearer,
      "Content-Type": "application/json",
    },
    keepalive: true
  })).json());
}

async function getParty(region, PartyID, entitlement_token, bearer) {
  return (await (await fetch(`https://glz-${region}-1.${region}.a.pvp.net/parties/v1/parties/${PartyID}`, {
    method: 'GET',
    headers: {
      "X-Riot-Entitlements-JWT": entitlement_token,
      'Authorization': "Bearer " + bearer,
      "Content-Type": "application/json",
    },
    keepalive: true
  })).json());
}

async function fetchPlayerAgent() {
  var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));
  var token_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json'));

  var bearer = token_data.accessToken;
  var region = user_data.playerRegion;
  var puuid = user_data.playerUUID;

  var entitlement_token = await getEntitlement(bearer);

  var player_data = await getPlayer_CoreGame(region, puuid, entitlement_token, bearer);

  var MatchID = player_data.MatchID;

  var match_data = await getMatch_CoreGame(region, MatchID, entitlement_token, bearer);

  for(var i = 0; i < match_data.Players.length; i++) {
    if(match_data.Players[i].Subject === puuid) {
      return {
        agentUUID: match_data.Players[i].CharacterID,
        matchData: match_data,
      };
    }
  }
}

function decideMatchModeFromURL(url, isRanked) {
  switch(url) {
    case("/Game/GameModes/Bomb/BombGameMode.BombGameMode_C"): { // Standard, decide bewtween ranked or not
      if(isRanked === true) return "competitive";
      return "unrated";
    }
    case("/Game/GameModes/QuickBomb/QuickBombGameMode.QuickBombGameMode_C"): {
      return "spikerush";
    }
    case("/Game/GameModes/OneForAll/OneForAll_GameMode.OneForAll_GameMode_C"): {
      return "onefa";
    }
    case("/Game/GameModes/Deathmatch/DeathmatchGameMode.DeathmatchGameMode_C"): {
      return "deathmatch";
    }
    case("/Game/GameModes/GunGame/GunGameTeamsGameMode.GunGameTeamsGameMode_C"): {
      return "ggteam";
    }
    case("/Game/GameModes/ShootingRange/ShootingRangeGameMode.ShootingRangeGameMode_C"): {
      return "ggteam";
    }
    default: {
      return "unrated";
    }
  }
}

async function checkForMatch() {
  var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));
  var token_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json'));

  var bearer = token_data.accessToken;
  var region = user_data.playerRegion;
  var puuid = user_data.playerUUID;

  var entitlement_token = await getEntitlement(bearer);

  var player_pregame_data = await getPlayer_PreGame(region, puuid, entitlement_token, bearer);
  if(player_pregame_data.MatchID !== undefined) {
    var game_data = await getMatch_PreGame(region, player_pregame_data.MatchID, entitlement_token, bearer);

    var gameMode = decideMatchModeFromURL(game_data.Mode, game_data.IsRanked);
    
    var data = {
      "isCustomGame": game_data.ProvisioningFlowID === "CustomGame",
      "isRange": game_data.ProvisioningFlowID === "ShootingRange",
      "playerState": 'PREGAME',
      "teamScore": null,
      "enemyScore": null,
      "mapPath": game_data.MapID,
      "gameMode": gameMode,
      "gamePod": game_data.GamePodID,
      "matchID": game_data.ID
    }
    
    decideRichPresenceData(data);
    return;
  }
  
  var player_coregame_data = await getPlayer_CoreGame(region, puuid, entitlement_token, bearer);
  if(player_coregame_data.MatchID !== undefined) {
    var game_data = await getMatch_CoreGame(region, player_coregame_data.MatchID, entitlement_token, bearer);

    var player_party_data = await getPlayer_Party(region, puuid, entitlement_token, bearer);

    var player_party = await getParty(region, player_party_data.CurrentPartyID, entitlement_token, bearer);

    var isRanked = player_party.MatchmakingData.QueueID === 'competitive';

    var gameMode = decideMatchModeFromURL(game_data.ModeID, isRanked);
    
    var data = {
      "isCustomGame": game_data.ProvisioningFlow === "CustomGame",
      "isRange": game_data.ProvisioningFlow === "ShootingRange",
      "playerState": 'INGAME',
      "teamScore": null,
      "enemyScore": null,
      "mapPath": game_data.MapID,
      "gameMode": gameMode,
      "gamePod": game_data.GamePodID,
      "matchID": game_data.MatchID
    }
    
    decideRichPresenceData(data);
    return;
  }
    
  var data = {
    "isCustomGame": false,
    "isRange": false,
    "playerState": 'MENUS',
    "teamScore": null,
    "enemyScore": null,
    "mapPath": null,
    "gameMode": null
  }
    
  decideRichPresenceData(data);
  return;
}

const gamemodes = {
  "newmap": "Unrated",
  "competitive": "Competitive",
  "unrated": "Unrated",
  "spikerush": "Spike Rush",
  "deathmatch": "Deathmatch",
  "ggteam": "Escalation",
  "onefa": "Replication",
  "snowball": "Snowball Fight",
  "custom": "Custom",
  "": "Custom"
}

async function decideRichPresenceData(data) {
  switch(data.playerState) {
    case("INGAME"): {
      sendMessageToWindow("")
      pregameTimestamp = null;
      menusTimestamp = null;

      if(ingameTimestamp === null) ingameTimestamp = Date.now();

      if(data.isCustomGame === true) {
        if(data.playerAgent) {
          playerAgent = data.playerAgent;
        }

        if(playerAgent == false) {
          var { agentUUID, matchData } = await fetchPlayerAgent();
          playerAgent = agentUUID;

          data.gamePod = matchData.GamePodID;
          data.matchID = matchData.MatchID;
        }

        var details = "Custom Game - In Match";

        if(data.teamScore === null && data.enemyScore === null) {
          var scores = "Waiting for next round to end...";
        } else {
          var scores = data.teamScore + " - " + data.enemyScore;
        }

        var map = data.mapPath.split("/").pop().toLowerCase();
        var agent = playerAgent;

        setRichPresence(details, scores, map, agent, ingameTimestamp);
      } else if(data.isRange === true) {
        var details = "The Range";
        var map = "range";
        var mode = 'unrated';

        setRichPresence(details, null, map, mode, ingameTimestamp);
      } else {
        if(playerAgent == false) {
          var { agentUUID, matchData } = await fetchPlayerAgent();
          playerAgent = agentUUID;

          data.gamePod = matchData.GamePodID;
          data.matchID = matchData.MatchID;
        }

        var details = gamemodes[data.gameMode] + " - In Match";

        if(data.teamScore === null && data.enemyScore === null) {
          var scores = "Waiting for next round to end...";
        } else {
          var scores = data.teamScore + " - " + data.enemyScore;
        }

        var map = data.mapPath.split("/").pop().toLowerCase();
        var agent = playerAgent;

        setRichPresence(details, scores, map, agent, ingameTimestamp);
      }
      lastState = "INGAME";
      lastGameMode = data.gameMode;
      break;
    }
    case("PREGAME"): {
      menusTimestamp = null;
      ingameTimestamp = null;

      if(pregameTimestamp === null) pregameTimestamp = Date.now();

      var details = gamemodes[data.gameMode] + " - Agent Select";
      var map = data.mapPath.split("/").pop().toLowerCase();
      var mode = data.gameMode;

      setRichPresence(details, null, map, mode, pregameTimestamp);
      lastState = "PREGAME";
      lastGameMode = mode;
      break;
    }
    case("MENUS"): {
      if(lastState === "INGAME") {
        sendMessageToWindow("hub_smartLoadNewMatches", lastGameMode);
      }
      pregameTimestamp = null;
      ingameTimestamp = null;

      if(menusTimestamp === null) menusTimestamp = Date.now();

      playerAgent = false;

      var details = "Browsing Menus";
      var image = 'valorant';

      setRichPresence(details, null, image, null, menusTimestamp);
      lastState = "MENUS";
      lastGameMode = null;
      break;
    }
  }
}

function setRichPresence(mode_and_info, scores, map, agent_or_mode, timestamp) {
  var obj = {
    assets: {
      large_text: "Playing VALORANT",
    },
    timestamps: {},
  };

  if(mode_and_info) obj.details = mode_and_info;
  if(scores) obj.state = scores;
  if(map) obj.assets.large_image = map;
  if(agent_or_mode) obj.assets.small_image = agent_or_mode;
  if(timestamp) obj.timestamps.start = timestamp;

  discordVALPresence.request("SET_ACTIVITY", {
    pid: 69,
    activity: obj,
  });
}

async function checkStoreForWishlistItems() {
  var user_accounts = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts');
  user_accounts.forEach(async (account) => {
    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + account)) {
      var user_creds = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + account));
      var user_wishlists = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + account));
    
      account = account.split(".")[0];

      const tokenData = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + account + '/token_data.json'));
    
      var bearer = tokenData.accessToken;
    
      var puuid = user_creds.playerUUID;
      var region = user_creds.playerRegion;
    
      var entitlement_token = await getEntitlement(bearer);
    
      var shopData = await getShopData(region, puuid, entitlement_token, bearer);
      console.log(shopData);

      var playerItems = await getPlayerItems(region, puuid, entitlement_token, bearer);
    
      var shopSkinUUIDs = [];
      
      for(var i = 0; i < shopData.SkinsPanelLayout.SingleItemOffers.length; i++) {
        var skinUUID = shopData.SkinsPanelLayout.SingleItemOffers[i];
        shopSkinUUIDs.push(skinUUID);
      }
    
      var singleSkinsTime = shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds + 10;
      var now = new Date();
      var singleSkinsExpirationDate = now.setSeconds(now.getSeconds() + singleSkinsTime);

      var hoursLeft = (Math.abs(singleSkinsExpirationDate - Date.now()) / 36e5);
      var hoursStr = 'hours';

      if(hoursLeft < 1) {
        hoursLeft = (Math.abs(singleSkinsExpirationDate - Date.now()) / 60000).toFixed(0);
        hoursStr = 'minutes';
      } else if(hoursLeft > 1 && hoursLeft < 2) {
        hoursLeft = '1';
        hoursStr = 'hour';
      } else {
        hoursLeft = hoursLeft.toFixed(0);
      }

      var wishlistedSkinsInShop = [];
    
      // TODO: Get wishlist here, check for all skins if they exist, if yes, send notifications
      for(var i = 0; i < user_wishlists.skins.length; i++) {
        for(var j = 0; j < shopSkinUUIDs.length; j++) {
          if(shopSkinUUIDs[j] === user_wishlists.skins[i].uuid) {
            wishlistedSkinsInShop.push(user_wishlists.skins[i].displayName);
          }
        }
      }

      if(wishlistedSkinsInShop.length === 1) {
        notifier.notify({
          title: "1 Wishlisted item in your shop!",
          message: `The ${wishlistedSkinsInShop[0]} is in your daily shop! It will be gone in ${hoursLeft} ${hoursStr}.`,
          icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
          wait: 3,
          appID: 'VALTracker'
        });
      } else if(wishlistedSkinsInShop.length > 1) {
        notifier.notify({
          title: "Multiple Wishlisted items in your shop!",
          message: `Multiple wishlisted items are in your daily shop! They will be gone in ${hoursLeft} ${hoursStr}.`,
          icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
          wait: 3,
          appID: 'VALTracker'
        });
      }
      
      for(var i = 0; i < playerItems.Entitlements.length; i++) {
        for(var j = 0; j < user_wishlists.skins.length; j++) {
          if(playerItems.Entitlements[i].ItemID === user_wishlists.skins[j].uuid) {
            delete user_wishlists.skins[j];
            var newArray = user_wishlists.skins.filter(value => Object.keys(value).length !== 0);
            
            var data = {
              "skins": newArray
            }

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + userData.playerUUID + '.json', JSON.stringify(data));
          }
        }
      }
      
      setTimeout(() => {
        checkStoreForWishlistItems();
      }, (singleSkinsExpirationDate+5) - Date.now());
    }
  });
}

// Set global mainWindow variable
let mainWindow;
var reauth_interval;
 
(async () => {
  var pjson = require('../package.json');
  
  var appStatus = await(await fetch('https://api.valtracker.gg/status/app', {
    headers: {
      "auth": 'v' + pjson.version,
    }
  })).json();

  if(appStatus.data.operational === true) {
    await app.whenReady();

    var featureStatus = await(await fetch('https://api.valtracker.gg/status/features/main_process', {
      headers: {
        "auth": 'v' + pjson.version,
      }
    })).json();

    console.log(featureStatus);
    
    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data')) {
      if(featureStatus.data.app_discord_rp.enabled === true) {
        //Login with Discord client 
        discordClient.login({
          clientId: "1005894948534616115",
        });
        
        // Set activity after client is finished loading
        discordClient.on("ready", () => {
          if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json")) {
            discordClient.request("SET_ACTIVITY", {
              pid: process.pid,
              activity: discord_rps.starting_activity,
            });
          }
        });
      } else {
        RPState = 'disabled'
      }
  
      if(featureStatus.data.valorant_discord_rp.enabled === true) {
        //Login with Discord client
        discordVALPresence.login({
          clientId: "957041886093267005",
        });
      
        var VAL_WEBSOCKET = new Worker(new URL("../modules/val_websocket_comms.mjs", import.meta.url));
        
        VAL_WEBSOCKET.on("message", async (msg) => {
          switch(msg.channel) {
            case("message"): {
              if(msg.data === "fetchPlayerData") {
                var data = await checkForMatch();
              } else {
                console.log(msg.data);
              }
            }
            case("WS_Event"): {
              var data = await getDataFromWebSocketEvent(msg.data);
              if(data !== undefined) {
                decideRichPresenceData(data);
              }
            }
            case("toggleDRP"): {
              if(msg.data === true) {
                RPState = 'val';
                discordClient.clearActivity(process.pid);
              } else if(msg.data === false) {
                RPState = 'app';
                discordVALPresence.clearActivity(69);
                sendMessageToWindow('setDRPtoCurrentPage');
              }
            }
          }
        });
        
        VAL_WEBSOCKET.on("error", err => {
          console.log(err);
        });
        
        VAL_WEBSOCKET.on("exit", exitCode => {
          console.log(exitCode);
        });
      }
    }
  
    var startedHidden = process.argv.find(arg => arg === '--start-hidden');
  
    // Set custom Protocol to start App
    if(process.defaultApp) {
      if(process.argv.length >= 2) {
        app.setAsDefaultProtocolClient("x-valtracker-client", process.execPath, [
          path.resolve(process.argv[1]),
        ]);
      }
    } else {
      app.setAsDefaultProtocolClient("x-valtracker-client");
    }

    var isLegacyTheme = false;
  
    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/themes/')) {
      var theme_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json");
      var theme = JSON.parse(theme_raw);
      if(theme.themeName == "legacy") {
        var bg = '#222222';
        isLegacyTheme = true;
      } else {
        var bg = '#1b222b';
      }
    }

    console.log(isLegacyTheme);
  
    mainWindow = createWindow('main', {
      width: 1400,
      height: 840,
      minWidth: 1400,
      minHeight: 840,
      frame: false,
      backgroundColor: bg,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: false,
        contextIsolation: false,
        devTools: true
      },
      show: startedHidden === undefined,
    });
  
    if(startedHidden !== undefined && fs.existsSync(process.env.APPDATA + '/VALTracker/user_data')) {
      var appIcon = new Tray(process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico");
      var contextMenu = Menu.buildFromTemplate([
        {
          label: "Show",
          click: function () {
            appIcon.destroy();
            mainWindow.show();
          },
        },
        {
          label: "Quit",
          click: function () {
            app.isQuiting = true;
            appIcon.destroy();
            app.quit();
          },
        },
      ]);
  
      appIcon.setContextMenu(contextMenu);
    }
  
    if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data")) {
      var isInSetup = false;
      
      ipcMain.on("isInSetup", function () {
        isInSetup = true;
      }); 
  
      ipcMain.on("finishedSetup", function () {
        isInSetup = false;
      });
  
      app.on("before-quit", () => {
        if(isInSetup == true) {
          fs.rmSync(process.env.APPDATA + "/VALTracker/user_data", { recursive: true, force: true });
        }
      });
    }
  
    mainWindow.onbeforeunload = () => {
      win.removeAllListeners();
    };
  
    mainWindow.on("move", () => {
      sendMessageToWindow("togglerestore", mainWindow.isMaximized());
    });
  
    ipcMain.handle("checkWindowState", () => {
      return mainWindow.isMaximized();
    });
    
    ipcMain.handle("min-window", async function (event, args) {
      mainWindow.minimize();
    });
  
    ipcMain.handle("max-window", async function (event, args) {
      mainWindow.maximize();
      return mainWindow.isMaximized();
    });
  
    ipcMain.handle("restore-window", async function (event, args) {
      mainWindow.unmaximize();
      return mainWindow.isMaximized();
    });
  
    ipcMain.on("close-window", async function (event, args) {
      var app_data = app.getPath("userData");
      var raw = fs.readFileSync(app_data + "/user_data/load_files/on_load.json");
      var json = JSON.parse(raw);
  
      if(json.minimizeOnClose == false || json.minimizeOnClose == undefined) {
        mainWindow.close();
      } else {
        mainWindow.hide();
  
        var appIcon = new Tray(process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico");
        var contextMenu = Menu.buildFromTemplate([
          {
            label: "Show",
            click: function () {
              appIcon.destroy();
              mainWindow.show();
            },
          },
          {
            label: "Quit",
            click: function () {
              app.isQuiting = true;
              appIcon.destroy();
              app.quit();
            },
          },
        ]);
  
        appIcon.setContextMenu(contextMenu);
      }
    }); 
  
    app_data = app.getPath("userData");
  
    if(fs.existsSync(app_data + "/settings")) {
      fs.renameSync(app_data + "/settings", app_data + "/user_data");
    }
  
    if(!fs.existsSync(app_data + "/user_data")) {
      noFilesFound();
    } else {
      if(!fs.existsSync(app_data + "/user_data/favourite_matches")) {
        createFavMatches();
      }
  
      if(!fs.existsSync(app_data + "/user_data/home_settings")) {
        createHomeSettings();
      }
  
      if(!fs.existsSync(app_data + "/user_data/load_files")) {
        createLoadFiles();
      }
  
      if(!fs.existsSync(app_data + "/user_data/player_profile_settings")) {
        createPlayerProfileSettings();
      }
  
      if(!fs.existsSync(app_data + "/user_data/riot_games_data")) {
        createRiotGamesData();
      }
  
      if(!fs.existsSync(app_data + "/user_data/riot_games_data/cookies.json")) {
        var cookiesData = [];
  
        fs.writeFileSync(app_data + "/user_data/riot_games_data/cookies.json", JSON.stringify(cookiesData));
      }
  
      if(!fs.existsSync(app_data + "/user_data/riot_games_data/token_data.json")) {
        var tokenData = {};
  
        fs.writeFileSync(app_data + "/user_data/riot_games_data/token_data.json", JSON.stringify(tokenData));
      }
  
      if(!fs.existsSync(app_data + "/user_data/shop_data")) {
        fs.mkdirSync(app_data + "/user_data/shop_data");
      }
  
      if(!fs.existsSync(app_data + "/user_data/themes")) {
        createThemes();
      }
  
      if(!fs.existsSync(app_data + "/user_data/message_data")) {
        createMessageData();
      }
  
      if(!fs.existsSync(app_data + "/user_data/user_accounts/")) {
        fs.mkdirSync(app_data + "/user_data/user_accounts/");
      } 
  
      if(!fs.existsSync(app_data + "/user_data/player_inventory")) {
        createInventoryData();
      }
  
      if(fs.existsSync(app_data + "/user_data/user_creds.json")) {
        await checkUserData(); 
  
        var raw = fs.readFileSync(app_data + "/user_data/user_creds.json");
        var user_creds = JSON.parse(raw);
  
        if(!fs.existsSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID)) {
          fs.mkdirSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID);
  
          if(fs.existsSync(app_data + "/user_data/riot_games_data/token_data.json")) {
            var raw = fs.readFileSync(app_data + "/user_data/riot_games_data/token_data.json");
            fs.writeFileSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID + "/token_data.json", raw);
          }
    
          if(fs.existsSync(app_data + "/user_data/riot_games_data/cookies.json")) {
            var raw = fs.readFileSync(app_data + "/user_data/riot_games_data/cookies.json");
            fs.writeFileSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID + "/cookies.json", raw);
          }
        }
      }
      
      if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/wishlists")) {
        fs.mkdirSync(process.env.APPDATA + "/VALTracker/user_data/wishlists");
      }
  
      if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons")) {
        fs.mkdirSync(process.env.APPDATA + "/VALTracker/user_data/icons");
      }
      
      if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico")) {
        download_image('https://valtracker.gg/img/VALTracker_Logo_beta.ico', process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico");
      };
      
      if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json")) {
        var { error, items, reauthArray } = await reauthAllAccounts();
        if(!error) {
          if(items.expiresIn) {
            var expiresIn = items.expiresIn;
          } else {
            // 55 Minutes 
            var expiresIn = 55 * 60;
          }
  
          if(items !== false) {
            reauth_interval = setInterval(reauthAllAccounts, expiresIn * 1000); 
            console.log("All accounts will be reauthenticated in 55 Minutes.");
          }
  
          if (isProd) {
            await mainWindow.loadURL('app://./home.html?isLegacyTheme=' + isLegacyTheme);
          } else {
            const port = process.argv[2];
            await mainWindow.loadURL(`http://localhost:${port}/home?isLegacyTheme=` + isLegacyTheme);
          } 
        } else {
          if (isProd) {
            await mainWindow.loadURL(`app://./home.html?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}&isLegacyTheme=` + isLegacyTheme);
          } else {
            const port = process.argv[2];
            await mainWindow.loadURL(`http://localhost:${port}/home?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}&isLegacyTheme=` + isLegacyTheme);
          } 
        }
    
        var on_load = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));
        if(on_load.skinWishlistNotifications === undefined || on_load.skinWishlistNotifications === true) {
          checkStoreForWishlistItems();
        }
      }
    }
  
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } else {
    autoUpdater.checkForUpdates();

    autoUpdater.on("update-available", () => {});
    
    autoUpdater.on("update-not-available", () => {
      notifier.notify({
        title: "VALTracker is currently disabled.",
        message: appStatus.data.desc,
        icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
        wait: 3,
        appID: 'VALTracker'
      });

      app.quit();
    });
    
    autoUpdater.on("error", (err) => {
      notifier.notify({
        title: "VALTracker is currently disabled.",
        message: appStatus.data.desc,
        icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
        wait: 3,
        appID: 'VALTracker'
      });
      
      app.quit();
    });
    
    autoUpdater.on("update-downloaded", () => {
      notifier.notify({
        title: "New Update downloaded!",
        message: "VALTracker has just downloaded a new update. It will now restart.",
        icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
        wait: 3,
        appID: 'VALTracker'
      });
      app.relaunch();
      app.quit();
    });
  }
})();

app.on("window-all-closed", function() {
  app.quit();
});

autoUpdater.on("update-available", () => {
  sendMessageToWindow("update-found");
});

autoUpdater.on("update-not-available", () => {
  sendMessageToWindow("no-update-found");
});

autoUpdater.on("error", (err) => {
  sendMessageToWindow("update-error", err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;

  log_message = log_message + " - Downloaded " + progressObj.percent + "%";

  log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";

  sendMessageToWindow("update-download-percent", progressObj.percent);
  sendMessageToWindow("update-download-status", log_message);
});

autoUpdater.on("update-downloaded", () => {
  sendMessageToWindow("update-download-finished");
});

ipcMain.on('fetch-update', function() {
  if(!isDev) {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.on('quit-app-and-install', function() {
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.handle("getTdidCookie", function (event, arg) { 
  session.defaultSession.cookies.get({})
  .then((cookies) => {
    var data = cookies.forEach((cookie) => {
      if(cookie.name == "tdid") {
        return cookie.value;
      }
    });
    return data;
  })
  .catch((error) => {
    log.info(error);
  });
}); 

ipcMain.on("getSSIDCookie", async function (event, arg) {
  var rawData = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json");
  var data = JSON.parse(rawData);

  for (var i = 0; i < data.length; i++) {
    if(data[i].name == "ssid") {
      value = data[i].value;
      expDate = data[i].expirationDate;
      event.sender.send("ssid", data[i].value + " // " + data[i].expirationDate);
    }
  }
});
ipcMain.on("changeDiscordRP", function (event, arg) {
  let onLoadData = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
  let loadData = JSON.parse(onLoadData);
  if(RPState === "app" && loadData.hasDiscordRPenabled === true || loadData.hasDiscordRPenabled === undefined) {
    switch (arg) {
      case "hub_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.hub_activity,
        });
        break;
      }
      case "skins_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.skins_activity,
        });
        break;
      }
      case "bundle_acitivity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.bundles_activity,
        });
        break;
      }
      case "pprofile_acitivity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.pprofile_acitivity,
        });
        break;
      }
      case "favmatches_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.favmatches_activity,
        });
        break;
      }
      case "favmatches_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.favmatches_activity,
        });
        break;
      }
      case "settings_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.settings_acitivity,
        });
        break;
      }
      case "patchnotes_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.patchnotes_acitivity,
        });
        break;
      }
      case "matchview_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.matchview_activity,
        });
        break;
      }
      case "shop_activity": {
        discordClient.request("SET_ACTIVITY", {
          pid: process.pid,
          activity: discord_rps.shop_activity,
        });
        break;
      }
      case "clear": {
        discordClient.clearActivity(process.pid);
        break;
      }
      default: {
        discordClient.clearActivity(process.pid);
        break;
      }
    }
  } else {
    discordClient.clearActivity(process.pid);
  }
});

async function fetchUserMMR() {
  var user_data_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/user_creds.json");
  var user_data = JSON.parse(user_data_raw);
  var user_UUID = user_data.playerUUID;
  var mmr_data = await (await fetch(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/eu/${user_UUID}`)).json();
  return mmr_data.data;
}

ipcMain.handle('fetchUserMMR', async (event, arg) => {
  let mmr = await fetchUserMMR();
  return mmr;
});

var signInUrl = 'https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid';

function getTokenDataFromURL(url) {
  try {
    const searchParams = new URLSearchParams((new URL(url)).hash.slice(1));
    return {
      accessToken: searchParams.get('access_token'),
      expiresIn: searchParams.get('expires_in'),
      id_token: searchParams.get('id_token'),
    };
  } catch (err) {
    throw new Error(`Bad url: "${url}"`);
  }
}

async function showSignIn(writeToFile) {
  return new Promise((resolve, reject) => {
    const loginWindow = createWindow('riot-login', { 
      show: false,
      width: 470,
      height: 880,
      autoHideMenuBar: true,
    });
    let foundToken = false;
    loginWindow.webContents.on('will-redirect', (event, url) => {
      // Login window redirecting...
      if(!foundToken && url.startsWith('https://playvalorant.com/opt_in')) {
        // Redirecting to url with tokens
        const tokenData = getTokenDataFromURL(url);
        foundToken = true;

        loginWindow.webContents.session.cookies.get({
          domain: 'auth.riotgames.com'
        }).then(async riotcookies => {
          await Promise.all(riotcookies.map(cookie => loginWindow.webContents.session.cookies.remove(`https://${cookie.domain}${cookie.path}`, cookie.name)));
          loginWindow.destroy();
          resolve({
            tokenData,
            riotcookies,
          });
          for(var i = 0; i < riotcookies.length; i++) {
            if(riotcookies[i].name == "ssid") {
              var cookieString = riotcookies[i].value
            }
          }
          if(writeToFile == true) {
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify(cookieString))
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(tokenData))
          }
        });
      }
    });
    loginWindow.once('ready-to-show', () => {
      loginWindow.show();
    }); 
    loginWindow.on('close', () => {
      // Login window was closed
      resolve(false);
    });
    loginWindow.loadURL(signInUrl);
  });
}

ipcMain.handle('loginWindow', async (event, args) => {
  return await showSignIn(args);
});

ipcMain.on("reauthCurrentAccount", async function (event, arg) {
  async function reauthCycle() {
    try {
      if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json")) {
        const newCookiesFile = {};
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json", JSON.stringify(newCookiesFile));
      }
      
      var user_creds_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/user_creds.json");
      var user_creds = JSON.parse(user_creds_raw);

      var puuid = user_creds.playerUUID;
      var rawCookies = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid + "/cookies.json");
      var bakedCookies = JSON.parse(rawCookies);

      var ssid;
  
      var jsontype = typeof bakedCookies[0] === "string";
  
      //check if json is object or array
  
      if(jsontype == true) {
        for (var i = 0; i < bakedCookies.length; i++) {
          var str1 = bakedCookies.split("ssid=").pop();
          var str2 = str1.split(';')[0];
          var ssid = 'ssid=' + str2 + ';'
        }
      } else {
        for (var i = 0; i < bakedCookies.length; i++) {
          if(bakedCookies[i].name == "ssid") {
            ssid = `ssid=${bakedCookies[i].value}; Domain=${bakedCookies[i].domain}; Path=${bakedCookies[i].path}; hostOnly=${bakedCookies[i].hostOnly}; secure=${bakedCookies[i].secure}; httpOnly=${bakedCookies[i].httpOnly}; session=${bakedCookies[i].session}; sameSite=${bakedCookies[i].sameSite};`;
          }
        }
      }
      
      const access_tokens = await getAccessTokens(ssid);

      if(access_tokens.data.response == undefined) {
        event.sender.send("reauthFail");
      } else {
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json", JSON.stringify(access_tokens.headers["set-cookie"]));

        const access_tokens = await getAccessTokens(ssid);

        const url_params = await access_tokens.json();

        var newTokenData = getTokenDataFromURL(url_params.response.parameters.uri); 

        event.sender.send("reauthSuccess", url_params.response.parameters.uri);

        return newTokenData;
      }
    } catch (err) {
      console.log(err);
      event.sender.send("reauthFail");
    }
  }
  reauthCycle();
});

ipcMain.on('openAppOnLogin', function(event, arg) {
  if(!isDev) {
    app.setLoginItemSettings({
      openAtLogin: arg,
      openAsHidden: false,
      args: []
    });
    var raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
    var data = JSON.parse(raw);
    data.startOnBoot = arg;
    data.startHidden = false;
    fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json", JSON.stringify(data));
  }
});

ipcMain.on('hideAppOnLogin', function(event, arg) {
  if(!isDev) {
    if(arg === true) {
      var args = [`--start-hidden`];
    } else {
      var args = [];
    }
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: arg,
      args: args
    });
    var raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
    var data = JSON.parse(raw);
    data.startOnBoot = true;
    data.startHidden = arg;
    fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json", JSON.stringify(data));
  }
});

ipcMain.on('relaunchApp', function() {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('restartReauthCycle', async function() {
  var { error, items, reauthArray } = await reauthAllAccounts();
  if(!error) {
    if(items.expiresIn) {
      var expiresIn = items.expiresIn;
    } else {
      // 55 Minutes 
      var expiresIn = 55 * 60;
    }

    if(items !== false) {
      clearInterval(reauth_interval);
      reauth_interval = setInterval(reauthAllAccounts, expiresIn * 1000);
      console.log("All accounts will be reauthenticated in 55 Minutes.");
    }

    if (isProd) {
      await mainWindow.loadURL('app://./home.html');
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/home`);
    } 
  } else {
    if (isProd) {
      await mainWindow.loadURL(`app://./home.html?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}`);
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/home?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}`);
    } 
  }
});

ipcMain.on('resetApp', function() {
  fs.rmdirSync(process.env.APPDATA + "/VALTracker/user_data", { recursive: true, force: true });
  app.exit(0); 
}); 

ipcMain.on('closeApp', function() {
  app.quit();
});

ipcMain.on('relayTextbox', function(event, args) {
  sendMessageToWindow('createTextbox', args);
});

ipcMain.on('relayUseLegacyTheme', function(event, args) {
  sendMessageToWindow('useLegacyTheme', args);
});
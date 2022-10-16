import { app, ipcMain, Menu, Tray, session } from 'electron';
import serve from 'electron-serve';
import fs from 'fs';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';
import fetch from 'electron-fetch';
import { Worker } from 'worker_threads';
import RPC from 'discord-rpc';
import notifier from 'node-notifier';
import { spawn } from 'child_process';

import { createWindow } from './helpers';
import { migrateDataToDB } from '../modules/dbMigration.mjs';

import L from '../translation/main_process.json';
import LocalText from './helpers/localization.mjs';

import * as dotenv from 'dotenv';
dotenv.config();

const discord_rps = require("../modules/discordRPs.js");
const pjson = require('../package.json');

const sendMessageToWindow = (channel, args) => {
  mainWindow.webContents.send(channel, args);
}

async function asyncTimeout(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

const isProd = process.env.NODE_ENV === 'production';
var app_data = app.getPath("userData");

var RPState = "app";
var child;

var discordVALPresence;
var discordClient;

var mainWindow;
var appIcon;
var isInSetup = false;

var inMigrationProgress = false;

const gotTheLock = app.requestSingleInstanceLock(); 

if(!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, CommandLine, workingDirectory) => {
    if(mainWindow) {
      if(mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
      if(appIcon) {
        appIcon.destroy();
      }
    }
  });
}

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')}`);
}

if(fs.existsSync(process.env.APPDATA + "/user_data/load_files/on_load.json")) {
  let loadData = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json"));
  
  if(loadData.enableHardwareAcceleration == false) {
    app.disableHardwareAcceleration();
  }
}

if(process.defaultApp) {
  if(process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("x-valtracker-client", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("x-valtracker-client");
}

const execFilePath = path.join(
  __dirname,
  "..",
  "lib",
  "VALTrackerDB.exe"
).replace("app.asar", "app.asar.unpacked");

if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data")) {
  child = spawn(execFilePath, [...process.env.DB_START.split(","), `file://${process.env.APPDATA}/VALTracker/user_data`]);

  child.stdout.on('data', function (data) {
    process.stdout.write(data);
  });
  child.stderr.on('data', function (data) {
    process.stderr.write(data);
  });
}

async function connectGamePresence() {
  try {
    // Initialize new RPC client
    discordVALPresence = new RPC.Client({
      transport: "ipc",
    });
    console.log("Game Presence connected.");
  } catch(e) {
    console.log("Error while starting Game Presence. Retrying...");
    await asyncTimeout(5000);
    connectGamePresence();
  }
}

connectGamePresence();

async function connectAppPresence() {
  try {
    // Initialize new RPC client
    discordClient = new RPC.Client({
      transport: "ipc",
    });
    console.log("App Presence connected.");
  } catch(e) {
    console.log("Error while starting App Presence. Retrying...");
    await asyncTimeout(5000);
    connectAppPresence();
  }
}

connectAppPresence();

await app.whenReady();

// TODO: if(userdata.user_creds dir exists) THEN do this, create extra window while this is happpening. Window can be closed when this is done, new mainWindow will be created anyway.
if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json')) {
  var on_load = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));

  if(on_load.appLang === undefined) var appLang = 'en-US'
  else var appLang = on_load.appLang;

  var theme_raw = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
  var theme = theme_raw.themeName;

  inMigrationProgress = true;

  var win = createWindow('migrate-test', {
    width: 620,
    height: 400,
    minWidth: 620,
    minHeight: 400,
    maxWidth: 620,
    maxHeight: 400,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: false,
      contextIsolation: false,
      devTools: true
    }
  });

  ipcMain.handleOnce("checkWindowState", () => {
    return win.isMaximized();
  });

  if (isProd) {
    await win.loadURL(`app://./migration.html?usedTheme=${theme}&lang=${appLang}`);
  } else {
    const port = process.argv[2];
    await win.loadURL(`http://localhost:${port}/migration?usedTheme=${theme}&lang=${appLang}`);
  } 

  await migrateDataToDB(win);

  win.close();
}

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

async function getAccessTokens(ssid) {
  return (await fetch("https://auth.riotgames.com/api/v1/authorization", {
    method: 'POST',
    headers: {
      "User-Agent": "RiotClient/46.0.0.4265023.4253280 rso-auth (Windows;10;;Professional, x64)",
      'Content-Type': 'application/json',
      Cookie: ssid,
    },
    body: JSON.stringify({"client_id":"riot-client","nonce":"1","redirect_uri":"http://localhost/redirect","response_type":"token id_token","scope":"openid link ban"}),
    keepalive: true
  }));
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

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/search_history")) {
    fs.mkdirSync(process.env.APPDATA + "/VALTracker/user_data/search_history");
    fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/search_history/history.json", JSON.stringify({ "arr":[] }));
  }

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/settings.json")) {
    var data = { showMode: true, showRank: true, showTimer: true, showScore: true };
    fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/settings.json", JSON.stringify(data));
  }
    
  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons/tray.ico")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_beta.ico', process.env.APPDATA + "/VALTracker/user_data/icons/tray.ico");
  };

  // Load Window with Setup Sequence
  if (isProd) {
    await mainWindow.loadURL(`app://./setup.html?lang=en-US`);
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/setup?lang=en-US`);
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

        var token_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json'));
        var bearer = token_data.accessToken;
        var ent = await getEntitlement(bearer);
        
        var currenttier = await getPlayerMMR(user_data.playerRegion, user_data.playerUUID, ent, bearer);
  
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

async function refreshEntitlementToken(uuid) {
  // Get entitlement for every account and write to file
  var bearer = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + uuid.split(".").pop() + "/token_data.json")).accessToken;
  var entitlement_token = await getEntitlement(bearer);

  fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + uuid.split(".").pop() + "/entitlement.json", JSON.stringify({ entitlement_token }));

  if(uuid.startsWith(".")) {
    fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/entitlement.json", JSON.stringify({ entitlement_token }));
  }
}

async function refreshAllEntitlementTokens() {
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
        await refreshEntitlementToken(uuid);

        i++;

        if(i == expectedLength) 
          resolve({ data_array, reauth_array });
      });
    });

    // Check if promise the promise was rejected
    var account_data = await promise.then(function({ data_array, reauth_array }) {
      if(reauth_array.length > 0) {
        console.log("Error while getting Entitlements.");
        return { ent_error: true, ent_items: false, ent_reauthArray: reauth_array }; 
      } else {
        return { ent_error: false, ent_items: data_array[0], ent_reauthArray: null }; 
      }
    });
    
    return account_data;
  } else {
    return { ent_error: true, ent_items: false, ent_reauthArray: null };
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

  try {
    eventData = JSON.parse(eventData);
  } catch(e) {}

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
  if(region === 'latam' || region === 'br') region = 'na';
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
  if(region === 'latam' || region === 'br') region = 'na';
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

  var entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;

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

const gamemodes = LocalText(L, 'gamemodes');

async function decideRichPresenceData(data) {
  var config = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/settings.json'));

  switch(data.playerState) {
    case("INGAME"): {
      pregameTimestamp = null;
      menusTimestamp = null;

      if(ingameTimestamp === null && config.showTimer === true) ingameTimestamp = Date.now();

      if(data.isCustomGame === true) {

        if(playerAgent === false && data.gameMode !== 'competitive') {
          if(data.playerAgent) {
            playerAgent = data.playerAgent;
          } else {
            var { agentUUID, matchData } = await fetchPlayerAgent();
            playerAgent = agentUUID;
  
            data.gamePod = matchData.GamePodID;
            data.matchID = matchData.MatchID;
          }
        } else if(data.gameMode === 'competitive') {
          playerAgent = null;
          var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));

          var smallImage = user_data.playerRank.split("/")[5];
        }

        if(config.showMode === true) {
          var details = `${gamemodes['custom']} - ${LocalText(L, 'val_rp_details.in_match')}`;
        } else {
          var details = LocalText(L, 'val_rp_details.in_match');
        }

        if(config.showScore === true) {
          if(data.teamScore === null && data.enemyScore === null) {
            var scores = LocalText(L, 'val_rp_details.waiting_for_round');
          } else {
            var scores = data.teamScore + " - " + data.enemyScore;
          }
        } else {
          var scores = null;
        }

        var map = data.mapPath.split("/").pop().toLowerCase();
        var agent = playerAgent;

        setRichPresence(details, scores, map, agent, ingameTimestamp);
      } else if(data.isRange === true) {
        var details = LocalText(L, 'val_rp_details.the_range');
        var map = "range";
        var mode = 'unrated';

        setRichPresence(details, null, map, mode, ingameTimestamp);
      } else {
        if(playerAgent === false && data.gameMode !== 'competitive') {
          var { agentUUID, matchData } = await fetchPlayerAgent();
          playerAgent = agentUUID;

          data.gamePod = matchData.GamePodID;
          data.matchID = matchData.MatchID;

          var smallImage = playerAgent;
        } else if(data.gameMode === 'competitive' && config.showRank === true) {
          playerAgent = null;
          var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));

          var smallImage = user_data.playerRank.split("/")[5];
        } else {
          var smallImage = undefined;
        }

        if(config.showMode === true) {
          var details = gamemodes[data.gameMode] + ` - ${LocalText(L, 'val_rp_details.in_match')}`;
        } else {
          var details = LocalText(L, 'val_rp_details.in_match');
        }

        if(config.showScore === true) {
          if(data.teamScore === null && data.enemyScore === null) {
            var scores = LocalText(L, 'val_rp_details.waiting_for_round');
          } else {
            var scores = data.teamScore + " - " + data.enemyScore;
          }
        } else {
          var scores = null;
        }

        var map = data.mapPath.split("/").pop().toLowerCase();

        setRichPresence(details, scores, map, smallImage, ingameTimestamp);
      }

      lastState = "INGAME";
      lastGameMode = data.gameMode;
      break;
    }
    case("PREGAME"): {
      menusTimestamp = null;
      ingameTimestamp = null;

      if(pregameTimestamp === null && config.showTimer === true) pregameTimestamp = Date.now();

      var map = data.mapPath.split("/").pop().toLowerCase();

      if(config.showMode === true) {
        var details = gamemodes[data.gameMode] + ` - ${LocalText(L, 'val_rp_details.agent_select')}`;
        var mode = data.gameMode;
      } else {
        var details = LocalText(L, 'val_rp_details.agent_select');
        var mode = null;
      }

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

      var details = LocalText(L, 'val_rp_details.menus');
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
      large_text: LocalText(L, 'val_rp_details.playing_val'),
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
    
      var entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;
    
      var shopData = await getShopData(region, puuid, entitlement_token, bearer);

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
      var hoursStr = LocalText(L, 'skin_wishlist_notifications.timer.h_1');

      if(hoursLeft < 1) {
        hoursLeft = (Math.abs(singleSkinsExpirationDate - Date.now()) / 60000).toFixed(0);
        hoursStr = LocalText(L, 'skin_wishlist_notifications.timer.m');
      } else if(hoursLeft > 1 && hoursLeft < 2) {
        hoursLeft = '1';
        hoursStr = LocalText(L, 'skin_wishlist_notifications.timer.h_2');
      } else {
        hoursLeft = hoursLeft.toFixed(0);
      }

      var wishlistedSkinsInShop = [];
    
      for(var i = 0; i < user_wishlists.skins.length; i++) {
        for(var j = 0; j < shopSkinUUIDs.length; j++) {
          if(shopSkinUUIDs[j] === user_wishlists.skins[i].uuid) {
            wishlistedSkinsInShop.push({ displayName: user_wishlists.skins[i].displayName, isMelee: user_wishlists.skins[i].isMelee });
          }
        }
      }

      if(wishlistedSkinsInShop.length === 1) {
        notifier.notify({
          title: LocalText(L, 'skin_wishlist_notifications.notif_1.header'),
          message: (
            wishlistedSkinsInShop[0].isMelee ? 
            LocalText(L, 'skin_wishlist_notifications.notif_1.desc', wishlistedSkinsInShop[0].displayName, hoursLeft, hoursStr) 
            : 
            LocalText(L, 'skin_wishlist_notifications.notif_1.melee_desc', wishlistedSkinsInShop[0].displayName, hoursLeft, hoursStr)
          ),
          icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
          wait: 3,
          appID: 'VALTracker'
        }, function (err, response, metadata) {
          if(response === undefined && err === null && JSON.stringify(metadata) === JSON.stringify({})) {
            mainWindow.show();
          }
        });
      } else if(wishlistedSkinsInShop.length > 1) {
        notifier.notify({
          title: LocalText(L, 'skin_wishlist_notifications.notif_2.header'),
          message: LocalText(L, 'skin_wishlist_notifications.notif_2.desc', hoursLeft, hoursStr),
          icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
          wait: 3,
          appID: 'VALTracker'
        }, function (err, response, metadata) {
          if(response === undefined && err === null && JSON.stringify(metadata) === JSON.stringify({})) {
            mainWindow.show();
          }
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

(async () => {
  var appStatus = await(await fetch('https://api.valtracker.gg/status/app', {
    headers: {
      "auth": 'v' + pjson.version,
    }
  })).json();

  if(appStatus.data.operational === false) {
    autoUpdater.checkForUpdates();
    
    autoUpdater.on("update-not-available", () => {
      notifier.notify({
        title: LocalText(L, 'disabled_notifs.no_update.header'),
        message: appStatus.data.desc,
        icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
        wait: 3,
        appID: 'VALTracker'
      });

      app.quit();
    });
    
    autoUpdater.on("error", (err) => {
      notifier.notify({
        title: LocalText(L, 'disabled_notifs.update_err.header'),
        message: appStatus.data.desc,
        icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
        wait: 3,
        appID: 'VALTracker'
      });
      
      app.quit();
    });
    
    autoUpdater.on("update-downloaded", () => {
      notifier.notify({
        title: LocalText(L, 'disabled_notifs.update_downloaded.header'),
        message: LocalText(L, 'disabled_notifs.update_downloaded.desc'),
        icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
        wait: 3,
        appID: 'VALTracker'
      });
      app.relaunch();
      app.quit();
    });

    return;
  }

  var featureStatus = await(await fetch('https://api.valtracker.gg/status/features/main_process', {
    headers: {
      "auth": 'v' + pjson.version,
    }
  })).json();
  
  if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data') && featureStatus.data.app_discord_rp.enabled) {
    //Login with Discord client 
    discordClient.login({
      clientId: "1018145263761764382",
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

  if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data') && featureStatus.data.valorant_discord_rp.enabled === true) {
    //Login with Discord client
    discordVALPresence.login({
      clientId: "957041886093267005",
    });
  
    var VAL_WEBSOCKET = new Worker(new URL("../modules/valWebSocketComms.mjs", import.meta.url));
    
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

  var startedHidden = process.argv.find(arg => arg === '--start-hidden');

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data")) {
    mainWindow = createWindow('setup-win', {
      width: 620,
      height: 400,
      minWidth: 620,
      minHeight: 400,
      maxWidth: 620,
      maxHeight: 400,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: false,
        contextIsolation: false,
        devTools: true
      },
      show: startedHidden === undefined,
    });

    isInSetup = true;

    ipcMain.on("finishedSetup", function () {
      isInSetup = false;
      app.quit();
    });

    app.on("before-quit", () => {
      if(child) {
        child.kill();
      }
      if(isInSetup == true) {
        fs.rmSync(process.env.APPDATA + "/VALTracker/user_data", { recursive: true, force: true });
      }
    });

    noFilesFound();
  } else {
    mainWindow = createWindow('main', {
      width: 1400,
      height: 840,
      minWidth: 1400,
      minHeight: 840,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: false,
        contextIsolation: false,
        devTools: true
      },
      show: startedHidden === undefined,
    });
  }

  if(startedHidden !== undefined && fs.existsSync(process.env.APPDATA + '/VALTracker/user_data')) {
    appIcon = new Tray(process.env.APPDATA + "/VALTracker/user_data/icons/tray.ico");

    appIcon.setToolTip("VALTracker");

    appIcon.on("click", function() {
      RPState = 'app';
      sendMessageToWindow('setDRPtoCurrentPage');
      appIcon.destroy();
      mainWindow.show();
    });

    var contextMenu = Menu.buildFromTemplate([
      {
        label: LocalText(L, 'tray_menu.show'),
        click: function () {
          RPState = 'app';
          sendMessageToWindow('setDRPtoCurrentPage');
          appIcon.destroy();
          mainWindow.show();
        },
      },
      {
        label: LocalText(L, 'tray_menu.quit'),
        click: function () {
          app.isQuiting = true;
          appIcon.destroy();
          app.quit();
        },
      },
    ]);

    appIcon.setContextMenu(contextMenu);
  }

  mainWindow.onbeforeunload = () => {
    mainWindow.removeAllListeners();
  };

  mainWindow.on("move", () => {
    sendMessageToWindow("togglerestore", mainWindow.isMaximized());
  });

  ipcMain.handle("checkWindowState", () => {
    return mainWindow.isMaximized();
  });
  
  ipcMain.handle("min-window", async function() {
    mainWindow.minimize();
  });

  ipcMain.handle("max-window", async function() {
    mainWindow.maximize();
    return mainWindow.isMaximized();
  });

  ipcMain.handle("restore-window", async function() {
    mainWindow.unmaximize();
    return mainWindow.isMaximized();
  });

  ipcMain.on("close-window", async function () {
    var config = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));

    if(config.minimizeOnClose === false || config.minimizeOnClose === undefined) {
      mainWindow.close();
      return;
    }

    if(config.hideDiscordRPWhenHidden === true) {
      RPState = 'ClientHidden';
      discordClient.clearActivity(process.pid);
    }

    mainWindow.hide();

    appIcon = new Tray(process.env.APPDATA + "/VALTracker/user_data/icons/tray.ico");

    appIcon.setToolTip("VALTracker");
  
    appIcon.on("click", function() {
      RPState = 'app';
      sendMessageToWindow('setDRPtoCurrentPage');
      appIcon.destroy();
      mainWindow.show();
    });

    var contextMenu = Menu.buildFromTemplate([
      {
        label: LocalText(L, 'tray_menu.show'),
        click: function () {
          RPState = 'app';
          sendMessageToWindow('setDRPtoCurrentPage');
          appIcon.destroy();
          mainWindow.show();
        },
      },
      {
        label: LocalText(L, 'tray_menu.quit'),
        click: function () {
          app.isQuiting = true;
          appIcon.destroy();
          app.quit();
        },
      },
    ]);

    appIcon.setContextMenu(contextMenu);
  });
  
  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/tray.ico")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_beta.ico', process.env.APPDATA + "/VALTracker/user_data/tray.ico");
  };

  if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/themes/')) {
    var theme_raw = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
    var theme = theme_raw.themeName;
  }
  
  if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json") && isInSetup === false) {
    var { error, items, reauthArray } = await reauthAllAccounts();

    if(items.expiresIn) {
      var expiresIn = items.expiresIn;
    } else {
      // 55 Minutes 
      var expiresIn = 55 * 60;
    }

    var on_load = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));

    if(on_load.appLang === undefined) var appLang = 'en-US'
    else var appLang = on_load.appLang;

    if(!error) {
      await refreshAllEntitlementTokens();
      var ent_expiresIn = 25 * 60;

      if(items !== false) {
        setInterval(reauthAllAccounts, expiresIn * 1000); 
        setInterval(refreshAllEntitlementTokens, ent_expiresIn * 1000); 
        console.log("All accounts will be reauthenticated in 55 Minutes.");
      }
      if (isProd) {
        await mainWindow.loadURL(`app://./home.html?usedTheme=${theme}&lang=${appLang}`);
      } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/home?usedTheme=${theme}&lang=${appLang}`);
      } 
    } else {
      if (isProd) {
        await mainWindow.loadURL(`app://./home.html?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}&usedTheme=${theme}&lang=${appLang}`);
      } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/home?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}&usedTheme=${theme}&lang=${appLang}`);
      } 
    }

    inMigrationProgress = false;

    if(on_load.skinWishlistNotifications === undefined || on_load.skinWishlistNotifications === true) {
      checkStoreForWishlistItems();
    }
  }
  
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
})();

app.on("window-all-closed", function() {
  if(inMigrationProgress === false) {
    app.quit();
  }
});

autoUpdater.on("update-available", () => {
  sendMessageToWindow("update-found");
});

autoUpdater.on("download-progress", (progressObj) => {
  sendMessageToWindow("update-download-percent", progressObj.percent);
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

ipcMain.on("changeDiscordRP", function (event, arg) {
  let loadData = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json"));
  if(RPState === "app" && loadData.hasDiscordRPenabled === true || loadData.hasDiscordRPenabled === undefined) {
    discordClient.request("SET_ACTIVITY", {
      pid: process.pid,
      activity: discord_rps[arg],
    });
  } else {
    discordClient.clearActivity(process.pid);
  }
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

var signInUrl = 'https://auth.riotgames.com/authorize?redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&client_id=riot-client&response_type=token%20id_token&nonce=1&scope=openid%20link%20ban';

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
      if(!foundToken && url.startsWith('http://localhost:42069/redirect')) {
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

    loginWindow.webContents.on('did-fail-load', () => {
      var url = loginWindow.webContents.getURL();
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

ipcMain.on('restartApp', function() {
  app.relaunch();
  app.quit();
});

ipcMain.on('resetApp', function() {
  if(child) {
    child.kill();
  }

  fs.rmdirSync(process.env.APPDATA + "/VALTracker/user_data", { recursive: true, force: true });
  app.exit(0); 
}); 

ipcMain.on('relayTextbox', function(event, args) {
  sendMessageToWindow('createTextbox', args);
});

ipcMain.on('relayOpenPlayerSearchModal', function(event, args) {
  sendMessageToWindow('openPlayerSearchModal', args);
});
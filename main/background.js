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
import Surreal from 'surrealdb.js';
import { v5 as uuidv5 } from 'uuid';

import { createWindow } from './helpers';
import { migrateDataToDB } from '../modules/dbMigration.mjs';
import { requestInstanceToken } from '../modules/requestInstanceToken.mjs';

import L from '../translation/main_process.json';

import * as dotenv from 'dotenv';
import { addSkinToWishlist, changeSetting, createThing, executeQuery, fetchMatch, getAllSettings, getCurrentPUUID, getCurrentUserData, getInstanceToken, getServiceData, getUserAccessToken, getUserEntitlement, removeMatch, rmSkinFromWishlist, switchPlayer, updateMessageDate, updateThing } from './helpers/dbFunctions';
dotenv.config();

const discord_rps = require("../modules/discordRPs.js");
const pjson = require('../package.json');

/**
 * An asynchronous timeout function. Works by returning a promise that gets resolved after the delay
 * that is passed into the function with a parameter.

 * @param {Number} delay Amount of time to wait for. (Milliseconds)

 * @returns A promise that can be awaited.
 */

async function asyncTimeout(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

const isProd = process.env.NODE_ENV === 'production';

var allCurrentlyProcessingMatchIDs = [];

var RPState = "app";
var child = null;

var discordVALPresence = null;
var discordClient = null;

var migrateWin = null;
var mainWindow = null;
var appIcon = null;
var isInSetup = false;

var inMigrationProgress = false;
var db = false;

/**
 * A function that returns the correct localization of a given JSON Key/Path. Works by connecting to
 * the database, grabbing the current language, turning the given string that resembles a JSON
 * path into an actual path and replacing possible variables, then returning the result. If no 
 * preferred language is found or the requested text does not have a translation, the english
 * result will get returned. 

 * @param {Object} json The translation object read from the file.
 * @param {String} path The JSON path to the wanted translation.
 * @param {String} num1replace The text to replace the first variable.
 * @param {String} num2replace The text to replace the second variable.
 * @param {String} num3replace The text to replace the third variable.

 * @returns The requested, localized string.
 */

export default async function LocalText(json, path, num1replace, num2replace, num3replace) {
  var uuid = uuidv5("appLang", process.env.SETTINGS_UUID);
  var langObj = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
  var appLang = langObj[0] ? langObj[0].value : 'en-US';

  var str = (appLang + '.' + path);

  var res = str.split('.').reduce(function(o, k) {
    return o && o[k];
  }, json);

  if(res === undefined) {
    var str = 'en-US.' + path;
    var res = str.split('.').reduce(function(o, k) {
      return o && o[k];
    }, json);
  }

  if(typeof res === "string") {
    res = res.replace("{{ val1 }}", num1replace);
    res = res.replace("{{ val2 }}", num2replace);
    res = res.replace("{{ val3 }}", num3replace);
  }

  return res;
}

/**
 * A function that sends the given argument to the renderer process in the given channel.
 * @param {String} channel The channel the message will be sent in.
 * @param {*} args The message to pass. Can by anything.
 */

const sendMessageToWindow = (channel, args) => {
  mainWindow.webContents.send(channel, args);
}

// Request an InstanceLock to prevent the app from being opened twice at the same time.
const gotTheLock = app.requestSingleInstanceLock(); 

if(!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, CommandLine, workingDirectory) => {
    if(mainWindow !== null) {
      try {
        if(mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        mainWindow.show();
        if(appIcon) {
          appIcon.destroy();
        }
      } catch(e) {
        console.log(e);
      }
    }
  });
}

// Select which directory to serve
if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')}`);
}

// Assemble the file path to the database
const execFilePath = path.join(
  __dirname,
  "..",
  "lib",
  "VALTrackerDB.exe"
).replace("app.asar", "app.asar.unpacked");

/**
 * A function to start the database. While starting, the app also checks for any left-over log files.
 */

async function startDB() {
  try {
    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data')) {
      var files = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data');
      files.forEach(file => {
        let regex = /^[a-zA-Z]+\.[a-zA-Z]+[0-9]*\.[0-9]+$/i;
        if(regex.test(file)) {
          fs.rmSync(process.env.APPDATA + '/VALTracker/user_data/' + file);
        }
      });
    }

    child = spawn(execFilePath, [...process.env.DB_START.split(","), `file://${process.env.APPDATA}/VALTracker/user_data`]);
    
    child.stdout.on('data', function (data) {
      process.stdout.write(data);
    });
    child.stderr.on('data', function (data) {
      process.stderr.write(data);
    });
  } catch(e) {
    console.log(e);
  }
}

startDB();

/**
 * A function to connect to the database.
 */

async function connectToDB() {
  try {
    var sdb = new Surreal(process.env.DB_URL);
  
    await sdb.wait();
  
    await sdb.signin({
      user: process.env.DB_USER,
      pass: process.env.DB_PASS
    });
  
    await sdb.use('app', 'main');
    
    db = sdb;
  } catch(e) {
    console.log(e);
  }
  return;
}

/**
 * A function to disable hardware acceleration. First checks if the setting is enabled, if yes,
 * turns off hardware acceleration.
 */

async function disableHardwareAcceleration() {
  if(db === false) await connectToDB();
  var uuid = uuidv5("hardwareAccel", process.env.SETTINGS_UUID);
  let loadData = await db.query(`SELECT value FROM setting:⟨${uuid}⟩`);
  
  if(loadData[0].result[0]) {
    if(loadData[0].result[0].value === false) app.disableHardwareAcceleration();
  }
}

await disableHardwareAcceleration();

// Set a protocol for the app. This is not currently used.
if(process.defaultApp) {
  if(process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("x-valtracker-client", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("x-valtracker-client");
}

/**
 * A function to connect to the Discord RPC (VALORANT Game Presence)
 */

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

/**
 * A function to connect to the Discord RPC (App Presence)
 */

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

// Handler that returns the state of the current window.
ipcMain.handle("checkWindowState", () => {
  return migrateWin !== false && migrateWin !== null ? migrateWin.isMaximized() : mainWindow.isMaximized();
});

// Handler to minimize the main window
ipcMain.handle("min-window", async function() {
  mainWindow.minimize();
});

// Handler to maximize the main window
ipcMain.handle("max-window", async function() {
  mainWindow.maximize();
  return mainWindow.isMaximized();
});

// Handler to restore the window to it's former state.
ipcMain.handle("restore-window", async function() {
  mainWindow.unmaximize();
  return mainWindow.isMaximized();
});

/* 
  Check if there are any files from before the transition from the local fs to a 
  database. If any files are found, the app will load a seperate window and migrate all of the 
  files into the database, after which it restarts.
*/

if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json')) {
  var on_load = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));

  if(on_load.appLang === undefined) var appLang = 'en-US'
  else var appLang = on_load.appLang;

  var theme_raw = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
  var theme = theme_raw.themeName;

  inMigrationProgress = true;

  migrateWin = createWindow('migrate-main-window', {
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

  if (isProd) {
    await migrateWin.loadURL(`app://./migration.html?usedTheme=${theme}&lang=${appLang}`);
  } else {
    const port = process.argv[2];
    await migrateWin.loadURL(`http://localhost:${port}/migration?usedTheme=${theme}&lang=${appLang}`);
  } 

  await migrateDataToDB(migrateWin);

  migrateWin.close();
  migrateWin = false;
}

/**
 * Function that fetches a user's access tokens based on an SSID token from their last authentication.
 * @param {String} ssid The SSID Token returned from the last authentication.
 * @returns The response from the server. 
 */

async function getAccessTokens(ssid) {
  return (await fetch("https://auth.riotgames.com/api/v1/authorization", {
    method: 'POST',
    headers: {
      "User-Agent": "RiotClient/61.0.6.4847198.4789131 rso-auth (Windows;11;;Professional, x64)",
      'Content-Type': 'application/json',
      Cookie: ssid,
    },
    body: JSON.stringify({"client_id":"play-valorant-web-prod","nonce":"1","redirect_uri":"https://playvalorant.com/opt_in","response_type":"token id_token","scope":"openid link ban"}),
    keepalive: true
  }));
}

/*
  
*/
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

/**
 * Funtion that returns a single match based on it's UUID.
 * @param {String} region 
 * @param {String} matchId 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 * @returns 
 */

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

/**
 * A function that returns a users rank based on their current match history.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 * @returns The current tier of the user as a number.
 */

async function getPlayerMMR(region, puuid, entitlement_token, bearer) {
  var matches = await getMatchHistory(region, puuid, 0, 1, 'competitive', entitlement_token, bearer);
  if(matches.History.length > 0) {
    var match_data = await getMatch(region, matches.History[0].MatchID, entitlement_token, bearer);
    for(var i = 0; i < match_data.players.length; i++) {
      if(match_data.players[i].subject === puuid) {
        return match_data.players[i].competitiveTier;
      }
    }
  } else {
    return 0;
  }
}

/**
 * A function that downloads an image from a URL to a specific path.
 * @param {String} url The URL of the image.
 * @param {String} new_path The path the image will be saved at.
 */

const download_image = (url, new_path) => {
  fetch(url)
    .then(res => res.body.pipe(fs.createWriteStream(new_path)));
}

/**
 * A function that quits the app after processing all matches in queue.
 * @param {Boolean} isUpdate If the reason to quit is an update or a regular quit.
 */

async function quitApp(isUpdate) {
  if(mainWindow) mainWindow.close();

  console.log("Matches left to process: ", allCurrentlyProcessingMatchIDs.length);
  
  if(allCurrentlyProcessingMatchIDs.length === 0) {
    console.log("Quitting...");

    if(isUpdate === true) {
      autoUpdater.quitAndInstall(true, true);
      return;
    }

    app.quit();
    return;
  }

  var processingInterval = setInterval(() => {
    console.log("Matches left to process: ", allCurrentlyProcessingMatchIDs.length);
    if(allCurrentlyProcessingMatchIDs.length === 0) {
      console.log("Quitting...");

      clearInterval(processingInterval);

      if(isUpdate === true) {
        autoUpdater.quitAndInstall(true, true);
      } else {
        app.quit();
      }
    }
  }, 5000);
}

/**
 * A function that gets run if no files are found, meaning the app just got started for the first 
 * time. Creates all of the necessary data for the app to function.
 */

async function noFilesFound() {
  if(db === false) await connectToDB();
  
  await db.use("app", "main");

  var appSettings = [
    { "name": "hubMatchFilter", "value": "unrated", "settingsType": "hub" },
    { "name": "setupCompleted", "value": false, "settingsType": "main" },
    { "name": "useAppRP", "value": true, "settingsType": "main" },
    { "name": "minOnClose", "value": false, "settingsType": "main" },
    { "name": "wishlistNotifs", "value": true, "settingsType": "main" },
    { "name": "hardwareAccel", "value": true, "settingsType": "main" },
    { "name": "launchOnBoot", "value": false, "settingsType": "main" },
    { "name": "lauchHiddenOnBoot", "value": false, "settingsType": "main" },
    { "name": "hideAppPresenceWhenHidden", "value": false, "settingsType": "main" },
    { "name": "useGameRP", "value": true, "settingsType": "main" },
    { "name": "appLang", "value": "en-US", "settingsType": ["main", "app"] },
    { "name": "showGameRPMode", "value": true, "settingsType": "main" },
    { "name": "showGameRPRank", "value": true, "settingsType": "main" },
    { "name": "showGameRPTimer", "value": true, "settingsType": "main" },
    { "name": "showGameRPScore", "value": true, "settingsType": "main" },
    { "name": "appColorTheme", "value": "normal", "settingsType": ["main", "app"] }
  ];

  var allSettingItemIDs = [];
  
  for(var i = 0; i < appSettings.length; i++) {
    var uuid = uuidv5(appSettings[i].name, process.env.SETTINGS_UUID);

    var result = await db.create(`setting:⟨${uuid}⟩`, {
      "name": appSettings[i].name,
      "value": appSettings[i].value,
      "type": appSettings[i].settingsType
    });

    allSettingItemIDs.push(result.id);
  }

  await db.create(`appConfig:⟨${process.env.APPCONFIG_UUID}⟩`, {
    "settingsCollection": allSettingItemIDs,
  });

  await db.create(`searchHistory:⟨app⟩`, {
    "items": []
  });

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/tray.ico")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_default.ico', process.env.APPDATA + "/VALTracker/user_data/tray.ico");
  };

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_default.png', process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png");
  };
}

/**
 * 
 * @param {String} puuid 
 * @returns An object containing if the reauthentication failed, if yes the reason and if no the 
 * new tokens for the authenticated user.
 */

async function reauthAccount(puuid) {
  try {
    if(db === false) await connectToDB();
    
    var data = await db.query(`SELECT * FROM rgConfig:⟨${puuid}⟩`);
    var rgConfig = data[0].result[0];

    var { ssid } = rgConfig;

    const access_tokens = await getAccessTokens(ssid);

    var newSSID = access_tokens.headers.get('set-cookie').split("ssid=").pop().split(";")[0];
    newSSID = `ssid=${newSSID}`;

    const url_params = await access_tokens.json();

    var newTokenData = getTokenDataFromURL(url_params.response.parameters.uri);

    rgConfig.ssid = newSSID;
    rgConfig.accesstoken = newTokenData.accessToken;
    rgConfig.idtoken = newTokenData.id_token;

    if(url_params.response.parameters.uri) {
      try {
        var data = await db.query(`SELECT * FROM player:⟨${puuid}⟩`);
        var user_data = data[0].result[0];

        var bearer = rgConfig.accesstoken;
        var ent = rgConfig.entitlement;
        
        var currenttier = await getPlayerMMR(user_data.region, puuid, ent, bearer);
  
        user_data.rank = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/largeicon.png`;
  
        await db.update(`player:⟨${puuid}⟩`, user_data);
      } catch(err) {
        console.log(err);
      }
  
      await db.update(`rgConfig:⟨${puuid}⟩`, rgConfig);
  
      console.log('Reauthenticated account with PUUID ' + puuid.split(".").pop());
  
      return { error: false, items: newTokenData, puuid: false };
    } else {
      return { error: true, items: url_params, puuid: puuid.split(".").pop() };
    }
  } catch (err) {
    return { error: true, items: err, puuid: puuid.split(".").pop() };
  }
}

/**
 * A function that reauthenticates all accounts in the app. If any accounts fail their 
 * reauthentication process, the app will show a modal prompting the user to sign back in.
 * @returns An object containing if the reauthentication failed, if yes the reason and if no the 
 * new tokens for all users.
 */

async function reauthAllAccounts() {
  if(db === false) await connectToDB();
  var puuid = await getCurrentPUUID();

  if(puuid) {
    var data = await db.query(`SELECT players.uuid AS uuids FROM playerCollection:app`);
    var account_puuids = data[0].result[0].uuids;
  
    var expectedLength = account_puuids.length;
  
    var i = 0;
  
    var data_array = [];
    var reauth_array = [];

    // Make a promise and check if it is rejected
    var promise = new Promise(async function(resolve, reject) {
      account_puuids.forEach(async (uuid) => {
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

/**
 * A function that refreshes the entitlement token of a user based on their PUUID.
 * @param {String} uuid 
 */

async function refreshEntitlementToken(uuid) {
  var data = await db.query(`SELECT * FROM rgConfig:⟨${uuid}⟩`);
  var rgConfig = data[0].result[0];

  var bearer = rgConfig.accesstoken;
  rgConfig.entitlement = await getEntitlement(bearer);

  await db.update(`rgConfig:⟨${uuid}⟩`, rgConfig);
}

/**
 * A function that refreshes the entitlement tokens of all users.
 * @returns An object containing if the reauthentication failed and if yes the reason.
 */

async function refreshAllEntitlementTokens() {
  if(db === false) await connectToDB();
  var puuid = await getCurrentPUUID();

  var data = await db.query(`SELECT players.uuid AS uuids FROM playerCollection:app`);
  var account_puuids = data[0].result[0].uuids;

  var expectedLength = account_puuids.length;

  var i = 0;

  var data_array = [];
  var reauth_array = [];

  // Make a promise and check if it is rejected
  var promise = new Promise(async function(resolve, reject) {
    account_puuids.forEach(async (uuid) => {
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
}

// -------------------- START RICH PRESENCE STATES --------------------

var playerAgent = false;
var pregameTimestamp = null;
var ingameTimestamp = null;
var menusTimestamp = null;
var lastState = null;
var lastGameMode = null;

// -------------------- END RICH PRESENCE STATES --------------------

/**
 * A function that reads a WebSocket event sent by the VALORANT local websocket and returns the
 * current state of the player.
 * @param {Object|Array} eventData The data recieved from the WebSocket event. 
 * @returns 
 */

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

  var user_data = await getCurrentUserData();

  if(eventData[2].data.presences[0].puuid !== user_data.uuid || eventData[2].data.presences[0].product !== "valorant") {
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

/**
 * A function that returns a user's daily store based on their PUUID.
 * @param {String} region The region of the user.
 * @param {String} puuid The PUUID of the user.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data for the user's store.
 */

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

/**
 * A function that returns all of a user's items that they own based on their PUUID.
 * @param {String} region The region of the user.
 * @param {String} puuid The PUUID of the user.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data for the user's items.
 */

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

/**
 * A function that fetches a user's entitlement based on their access token.
 * @param {String} bearer The access token of the user.
 * @returns The new entitlements token.
 */

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

/**
 * A function that fetches a user's pregame status based on their PUUID.
 * @param {String} region The region of the user.
 * @param {String} puuid The PUUID of the user.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data about the current pregame.
 */

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

/**
 * A function that fetches a matches pregame based on it's ID.
 * @param {String} region The region of the user/match.
 * @param {String} MatchID The ID of the match.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data about the current pregame.
 */

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

/**
 * A function that fetches a matches ongoing game based on it's ID.
 * @param {String} region The region of the user.
 * @param {String} puuid The PUUID of the user.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data about the current match.
 */

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

/**
 * A function that fetches a matches ongoing game based on it's ID.
 * @param {String} region The region of the user/match.
 * @param {String} MatchID The ID of the match.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data about the current match.
 */

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

/**
 * A function that fetches a player's party based on their PUUID.
 * @param {String} region The region of the user.
 * @param {String} puuid The PUUID of the user.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data about the current user's party.
 */

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

/**
 * A function that fetches a party's data based on it's ID.
 * @param {String} region The region of the user/party.
 * @param {String} puuid The ID of the party.
 * @param {String} entitlement_token The entitlement token of the user.
 * @param {String} bearer The access token of the user.
 * @returns An object containing the data about the party.
 */

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

/**
 * A function that fetches the user's agent if they are in an ongoing match.
 * @returns An object containing the agent's UUID and data about the current match.
 */

async function fetchPlayerAgent() {
  var user_data = await getCurrentUserData();
  var puuid = user_data.uuid;
  var region = user_data.region;

  var bearer = await getUserAccessToken();

  var entitlement_token = await getUserEntitlement();

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

/**
 * A function that returns the name of the mode the user is currently playing.
 * @param {String} url 
 * @param {Boolean} isRanked 
 * @returns The mode that the user is playing.
 */

function decideMatchModeFromURL(url, isRanked) {
  switch(url) {
    case("/Game/GameModes/Bomb/BombGameMode.BombGameMode_C"): { // Standard, decide bewtween ranked or not
      if(isRanked === true) return "competitive";
      else return "unrated";
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
      return "range";
    }
    case("/Game/GameModes/_Development/Swiftplay_EndOfRoundCredits/Swiftplay_EoRCredits_GameMode.Swiftplay_EoRCredits_GameMode_C"): {
      return "swiftplay";
    }
    default: {
      return "unrated";
    }
  }
}

/**
 * A function that checks if the current user is in a match. If yes, it sets the user's rich 
 * presence to the current mode.
 */

async function checkForMatch() {
  var user_data = await getCurrentUserData();
  var puuid = user_data.uuid;
  var region = user_data.region;

  var bearer = getUserAccessToken();

  var entitlement_token = await getUserEntitlement();

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

// Get the localizations for all gamemodes
const gamemodes = await LocalText(L, 'gamemodes');

/**
 * A function that completes the rich presence data.
 * @param {Object} data The data about the user's current state. 
 */

async function decideRichPresenceData(data) {
  if(db === false) await connectToDB();

  var settingsValues = {
    "showGameRPScore": null,
    "showGameRPMode": null,
    "showGameRPTimer": null,
    "showGameRPRank": null
  };

  for(var i = 0; i < Object.keys(settingsValues).length; i++) {
    var uuid = uuidv5(Object.keys(settingsValues)[i], process.env.SETTINGS_UUID);
    var result = await db.query(`SELECT value FROM setting:⟨${uuid}⟩`);
    settingsValues[Object.keys(settingsValues)[i]] = result[0].result[0].value;
  }

  switch(data.playerState) {
    case("INGAME"): {
      pregameTimestamp = null;
      menusTimestamp = null;

      if(ingameTimestamp === null && settingsValues.showGameRPTimer === true) ingameTimestamp = Date.now();

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
          var user_data = await getCurrentUserData();

          var smallImage = user_data.rank.split("/")[5];
        }

        var detailsText = await LocalText(L, 'val_rp_details.in_match');
        if(settingsValues.showGameRPMode === true) {
          var details = `${gamemodes['custom']} - ${detailsText}`;
        } else {
          var details = detailsText;
        }

        if(settingsValues.showGameRPScore === true) {
          if(data.teamScore === null && data.enemyScore === null) {
            var scores = await LocalText(L, 'val_rp_details.waiting_for_round');
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
        var details = await LocalText(L, 'val_rp_details.the_range');
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
        } else if(data.gameMode === 'competitive' && settingsValues.showGameRPRank === true) {
          playerAgent = null;
          var user_data = await getCurrentUserData();

          var smallImage = user_data.rank.split("/")[5];
        } else {
          var smallImage = undefined;
        }

        var detailsText = await LocalText(L, 'val_rp_details.in_match');
        if(settingsValues.showGameRPMode === true) {
          var details = gamemodes[data.gameMode] + ` - ${detailsText}`;
        } else {
          var details = detailsText;
        }

        if(settingsValues.showGameRPScore === true) {
          if(data.teamScore === null && data.enemyScore === null) {
            var scores = await LocalText(L, 'val_rp_details.waiting_for_round');
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

      if(pregameTimestamp === null && settingsValues.showGameRPTimer === true) pregameTimestamp = Date.now();

      var map = data.mapPath.split("/").pop().toLowerCase();
      
      var detailsText = await LocalText(L, 'val_rp_details.agent_select');
      if(settingsValues.showGameRPMode === true) {
        var details = gamemodes[data.gameMode] + ` - ${detailsText}`;
        var mode = data.gameMode;
      } else {
        var details = detailsText;
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

      var details = await LocalText(L, 'val_rp_details.menus');
      var image = 'valorant';

      setRichPresence(details, null, image, null, menusTimestamp);
      lastState = "MENUS";
      lastGameMode = null;
      break;
    }
  }
}

/**
 * A function that takes the formatted info about the user's current match and sends it to Discord
 * for the rich presence to function.
 * @param {String} mode_and_info 
 * @param {String} scores 
 * @param {String} map 
 * @param {String} agent_or_mode 
 * @param {Number} timestamp 
 */

async function setRichPresence(mode_and_info, scores, map, agent_or_mode, timestamp) {
  var lg_txt = await LocalText(L, 'val_rp_details.playing_val');
  var obj = {
    assets: {
      large_text: lg_txt,
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

/**
 * A function that checks all user accounts for wishlisted items. If any items are found, the app
 * will send a desktop notification.
 */

async function checkStoreForWishlistItems() {
  if(db === false) await connectToDB();
  
  var timeoutSet = false;

  var data = await db.query(`SELECT players.uuid AS uuids FROM playerCollection:app`);
  var account_puuids = data[0].result[0].uuids;

  account_puuids.forEach(async (account) => {
    var data = await db.query(`SELECT * FROM player:⟨${account}⟩`);
    var user_creds = data[0].result[0];
    
    var data = await db.query(`SELECT * FROM wishlist:⟨${account}⟩`);
    var user_wishlist = data[0].result[0];
  
    var bearer = await getUserAccessToken();
  
    var puuid = user_creds.uuid;
    var region = user_creds.region;
  
    var entitlement_token = await getUserEntitlement();
  
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
    var hoursStr = await LocalText(L, 'skin_wishlist_notifications.timer.h_2');

    if(hoursLeft < 1) {
      hoursLeft = (Math.abs(singleSkinsExpirationDate - Date.now()) / 60000).toFixed(0);
      hoursStr = await LocalText(L, 'skin_wishlist_notifications.timer.m');
    } else if(hoursLeft > 1 && hoursLeft < 2) {
      hoursLeft = '1';
      hoursStr = await LocalText(L, 'skin_wishlist_notifications.timer.h_1');
    } else {
      hoursLeft = hoursLeft.toFixed(0);
    }

    var wishlistedSkinsInShop = [];
  
    for(var i = 0; i < user_wishlist.skins.length; i++) {
      for(var j = 0; j < shopSkinUUIDs.length; j++) {
        if(shopSkinUUIDs[j] === user_wishlist.skins[i].uuid) {
          wishlistedSkinsInShop.push({ displayName: user_wishlist.skins[i].displayName, isMelee: user_wishlist.skins[i].isMelee });
        }
      }
    }

    if(wishlistedSkinsInShop.length === 0) return;

    var title1 = await LocalText(L, 'skin_wishlist_notifications.notif_1.header');
    var message1_1 = await LocalText(L, 'skin_wishlist_notifications.notif_1.desc', wishlistedSkinsInShop[0].displayName, hoursLeft, hoursStr)
    var message1_2 = await LocalText(L, 'skin_wishlist_notifications.notif_1.melee_desc', wishlistedSkinsInShop[0].displayName, hoursLeft, hoursStr);
    var message1 = wishlistedSkinsInShop[0].isMelee ? message1_1 : message1_2

    var title2 = await LocalText(L, 'skin_wishlist_notifications.notif_2.header');
    var message2 = await LocalText(L, 'skin_wishlist_notifications.notif_2.desc', hoursLeft, hoursStr);

    if(wishlistedSkinsInShop.length === 1) {
      notifier.notify({
        title: title1,
        message: message1,
        icon: process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png",
        wait: 3,
        appID: 'VALTracker'
      }, function (err, response, metadata) {
        if(response === undefined && err === null && JSON.stringify(metadata) === JSON.stringify({})) {
          mainWindow.show();
        }
      });
    } else if(wishlistedSkinsInShop.length > 1) {
      notifier.notify({
        title: title2,
        message: message2,
        icon: process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png",
        wait: 3,
        appID: 'VALTracker'
      }, function (err, response, metadata) {
        if(response === undefined && err === null && JSON.stringify(metadata) === JSON.stringify({})) {
          mainWindow.show();
        }
      });
    }
    
    for(var i = 0; i < playerItems.Entitlements.length; i++) {
      for(var j = 0; j < user_wishlist.skins.length; j++) {
        if(playerItems.Entitlements[i].ItemID === user_wishlist.skins[j].uuid) {
          delete user_wishlist.skins[j];
          var newArray = user_wishlist.skins.filter(value => Object.keys(value).length !== 0);
          
          await db.update(`wishlist:⟨${account}⟩`, {
            id: user_wishlist.id,
            skins: newArray
          });
        }
      }
    }
    
    if(timeoutSet === false) {
      setTimeout(() => {
        checkStoreForWishlistItems();
      }, (singleSkinsExpirationDate+5) - Date.now());

      timeoutSet = true;
    }
  });
}

// Main function that starts the app
(async () => {
  if(db === false) await connectToDB();

  var uuid = uuidv5("setupCompleted", process.env.SETTINGS_UUID);
  var res = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
  
  if(res.length === 0) {
    await noFilesFound();
  }

  var appStatus = await(await fetch('https://beta-api.valtracker.gg/v1/status/main', {
    headers: {
      "x-valtracker-version": 'v' + pjson.version,
    }
  })).json();

  if(appStatus.data.startup.operational === false) {
    autoUpdater.checkForUpdates();
    
    var title1 = await LocalText(L, 'disabled_notifs.no_update.header');
    autoUpdater.on("update-not-available", () => {
      notifier.notify({
        title: title1,
        message: appStatus.data.desc,
        icon: process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png",
        wait: 3,
        appID: 'VALTracker'
      });

      app.quit();
    });
    
    var title2 = await LocalText(L, 'disabled_notifs.no_update.header');
    autoUpdater.on("error", (err) => {
      notifier.notify({
        title: title2,
        message: appStatus.data.startup.desc,
        icon: process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png",
        wait: 3,
        appID: 'VALTracker'
      });
      
      app.quit();
    });
    
    var title3 = await LocalText(L, 'disabled_notifs.no_update.header');
    var message = await LocalText(L, 'disabled_notifs.no_update.header');
    autoUpdater.on("update-downloaded", () => {
      notifier.notify({
        title: title3,
        message: message,
        icon: process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png",
        wait: 3,
        appID: 'VALTracker'
      });
      app.relaunch();
      app.quit();
    });

    return;
  }
  
  if(appStatus.data.appRP.enabled === true) {
    //Login with Discord client 
    discordClient.login({
      clientId: "1018145263761764382",
    });
    
    // Set activity after client is finished loading
    discordClient.on("ready", () => {
      discordClient.request("SET_ACTIVITY", {
        pid: process.pid,
        activity: discord_rps.starting_activity,
      });
    });
  } else {
    RPState = 'disabled'
  }

  if(appStatus.data.gameRP.enabled === true) {
    var uuid = uuidv5("useGameRP", process.env.SETTINGS_UUID);
    let useGameRP = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
    useGameRP = useGameRP.length > 0 ? useGameRP[0] : {value: false};
  
    var uuid = uuidv5("setupCompleted", process.env.SETTINGS_UUID);
    let setupCompleted = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
    setupCompleted = setupCompleted.length > 0 ? setupCompleted[0] : {value: false};
    
    if((useGameRP.value === undefined || useGameRP.value === true) && setupCompleted.value === true) {
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
  }

  var startedHidden = process.argv.find(arg => arg === '--start-hidden');

  var uuid = uuidv5("setupCompleted", process.env.SETTINGS_UUID);
  let setupCompleted = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
  setupCompleted = setupCompleted.length > 0 ? setupCompleted[0] : {value: false};

  if(setupCompleted.value === false) {
    mainWindow = createWindow('setup-win', {
      width: 620,
      height: 400,
      minWidth: 620,
      minHeight: 400,
      maxWidth: 620,
      maxHeight: 400,
      //frame: false,
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#2f3241',
        symbolColor: '#74b1be',
        height: 60
      },
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: false,
        contextIsolation: false,
        devTools: true
      }
    });

    isInSetup = true;

    ipcMain.on("finishedSetup", function () {
      isInSetup = false;
      app.relaunch();
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
  } else {
    mainWindow = createWindow('main', {
      width: 1400,
      height: 840,
      minWidth: 1400,
      minHeight: 840,
      //frame: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: false,
        contextIsolation: false,
        devTools: true
      },
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#2f3241',
        symbolColor: '#74b1be',
        height: 60
      },
      show: startedHidden === undefined,
    });
  }

  if(startedHidden !== undefined) {
    appIcon = new Tray(process.env.APPDATA + "/VALTracker/user_data/tray.ico");

    appIcon.setToolTip("VALTracker");

    appIcon.on("click", function() {
      RPState = 'app';
      sendMessageToWindow('setDRPtoCurrentPage');
      appIcon.destroy();
      mainWindow.show();
    });

    var showText = await LocalText(L, 'tray_menu.show');
    var closeText = await LocalText(L, 'tray_menu.quit');

    var contextMenu = Menu.buildFromTemplate([
      {
        label: showText,
        click: function () {
          RPState = 'app';
          sendMessageToWindow('setDRPtoCurrentPage');
          appIcon.destroy();
          mainWindow.show();
        }
      },
      {
        label: closeText,
        click: function () {
          app.isQuiting = true;
          appIcon.destroy();
          quitApp();
        }
      }
    ]);

    appIcon.setContextMenu(contextMenu);
  }

  mainWindow.onbeforeunload = () => {
    mainWindow.removeAllListeners();
  };

  mainWindow.on("move", () => {
    sendMessageToWindow("togglerestore", mainWindow.isMaximized());
  });

  mainWindow.on("restore", () => {
    sendMessageToWindow("togglerestore", mainWindow.isMaximized());
  });

  ipcMain.on("close-window", async function () {
    var settings = {
      "minOnClose": null,
      "hideAppPresenceWhenHidden": null
    }

    for(var i = 0; i < Object.keys(settings).length; i++) {
      var uuid = uuidv5(Object.keys(settings)[i], process.env.SETTINGS_UUID);
      var result = await db.query(`SELECT value FROM setting:⟨${uuid}⟩`);
      settings[Object.keys(settings)[i]] = result[0].result[0].value;
    }

    if(settings.minOnClose === false || settings.minOnClose === undefined) {
      mainWindow.close();
      return;
    }

    if(settings.hideAppPresenceWhenHidden === true) {
      RPState = 'ClientHidden';
      discordClient.clearActivity(process.pid);
    }

    appIcon = new Tray(process.env.APPDATA + "/VALTracker/user_data/tray.ico");

    appIcon.setToolTip("VALTracker");
  
    appIcon.on("click", function() {
      if(RPState === 'ClientHidden') {
        RPState = 'app';
        sendMessageToWindow('setDRPtoCurrentPage');
      }
      appIcon.destroy();
      mainWindow.show();
    });

    var showText = await LocalText(L, 'tray_menu.show');
    var closeText = await LocalText(L, 'tray_menu.quit');

    var contextMenu = Menu.buildFromTemplate([
      {
        label: showText,
        click: function () {
          if(RPState === 'ClientHidden') {
            RPState = 'app';
            sendMessageToWindow('setDRPtoCurrentPage');
          }
          appIcon.destroy();
          mainWindow.show();
        }
      },
      {
        label: closeText,
        click: function () {
          app.isQuiting = true;
          appIcon.destroy();
          quitApp();
        }
      }
    ]);

    appIcon.setContextMenu(contextMenu);

    mainWindow.hide();
  });
  
  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/tray.ico")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_default.ico', process.env.APPDATA + "/VALTracker/user_data/tray.ico");
  };

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png")) {
    download_image('https://valtracker.gg/img/VALTracker_Logo_default.png', process.env.APPDATA + "/VALTracker/user_data/VALTrackerLogo.png");
  };

  var uuid = uuidv5("appColorTheme", process.env.SETTINGS_UUID);
  var themeObj = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
  var theme = themeObj[0] ? themeObj[0].value : 'normal';
  
  if(isInSetup === false) {
    var { error, items, reauthArray } = await reauthAllAccounts();

    if(items.expiresIn) {
      var expiresIn = items.expiresIn;
    } else {
      // 55 Minutes 
      var expiresIn = 55 * 60;
    }

    var uuid = uuidv5("appLang", process.env.SETTINGS_UUID);
    var langObj = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
    var appLang = langObj[0] ? langObj[0].value : 'en-US';

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
      
      var instanceToken = await getInstanceToken();
      
      var instanceComms = new Worker(new URL("../modules/instanceSocketComms.mjs", import.meta.url), { workerData: instanceToken });

      ipcMain.on('fetch-update', function() {
        instanceComms.postMessage({channel:"fetchingUpdate"});
      });

      ipcMain.on("rendererProcessError", (event, args) => {
        instanceComms.postMessage({channel:"rendererProcessError", data: args});
      });
      
      instanceComms.on("message", async (msg) => {
        if(msg.type === "message") {
          sendMessageToWindow("newMessage", msg.content);
        }
        if(msg.type === "update") {
          sendMessageToWindow("newUpdate", msg.content);
        }
      });
      
      instanceComms.on("error", err => {
        console.log(err);
      });
    } else {
      if (isProd) {
        await mainWindow.loadURL(`app://./home.html?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}&usedTheme=${theme}&lang=${appLang}`);
      } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/home?reauth_failed=true&reauthArray=${JSON.stringify(reauthArray)}&usedTheme=${theme}&lang=${appLang}`);
      } 
    }

    inMigrationProgress = false;

    var uuid = uuidv5("wishlistNotifs", process.env.SETTINGS_UUID);
    var wishObj = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
    var wishlistNotifs = wishObj[0] ? wishObj[0].value : undefined;

    if(wishlistNotifs === null || wishlistNotifs === true || wishlistNotifs === undefined) {
      checkStoreForWishlistItems();
    }
  } else {
    // Load Window with Setup Sequence
    if (isProd) {
      await mainWindow.loadURL(`app://./setup.html?lang=en-US`);
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/setup?lang=en-US`);
    }
  }
  
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
})();

// Handler that quits the app if all windows are closed
app.on("window-all-closed", function() {
  if(inMigrationProgress === false) {
    quitApp();
  }
});

// Handler that informs the user of an available update
autoUpdater.on("update-available", () => {
  sendMessageToWindow("update-found");
});

// Handler that informs the user of the current download progress of an update.
autoUpdater.on("download-progress", (progressObj) => {
  sendMessageToWindow("update-download-percent", progressObj.percent);
});

// Handler that informs the user that the download of an update has completed.
autoUpdater.on("update-downloaded", () => {
  sendMessageToWindow("update-download-finished");
});

// Handler to look for updates
ipcMain.on('fetch-update', function() {
  if(!isDev) {
    autoUpdater.checkForUpdates();
  }
});

// Handler to quit the app and install 
ipcMain.on('quit-app-and-install', function() {
  quitApp(true);
});

// Handler to change the app's discord presence to the requested activity.
ipcMain.on("changeDiscordRP", async function (event, arg) {
  var uuid = uuidv5("useAppRP", process.env.SETTINGS_UUID);
  var rpObj = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
  var useAppRP = rpObj[0] ? rpObj[0].value : undefined;

  if(RPState === "app" && useAppRP === true) {
    discordClient.request("SET_ACTIVITY", {
      pid: process.pid,
      activity: discord_rps[arg],
    });
  } else {
    discordClient.clearActivity(process.pid);
  }
});

// Handler to return the tdid cookie saved by the app.
ipcMain.handle("getTdidCookie", function () {
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
    console.log(error);
  });
});

// URL used in sign-in windows
var signInUrl = 'https://auth.riotgames.com/authorize?redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&client_id=riot-client&response_type=token%20id_token&nonce=1&scope=openid%20link%20ban';

/**
 * A function that extracts the token data from the redirect URL that is recieved by Riot's Servers.
 * @param {String} url 
 * @returns The token data included in the URL.
 */

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

/**
 * A function to open a login window, in which the user can enter their credentials.
 * @returns An object containing all cookies and access tokens that have been recieved.
 */
async function showSignIn() {
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

// Handler to open a login window
ipcMain.handle('loginWindow', async (event, args) => {
  return await showSignIn(args);
});

// Handler to change the autostart setting
ipcMain.on('openAppOnLogin', async function(event, arg) {
  if(!isDev) {
    app.setLoginItemSettings({
      openAtLogin: arg,
      openAsHidden: false,
      args: []
    });

    await changeSetting(`launchOnBoot`, arg);
    await changeSetting(`lauchHiddenOnBoot`, false);
  }
});

// Handler to change the setting that lets the app start hidden when starting on system boot
ipcMain.on('hideAppOnLogin', async function(event, arg) {
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

    await changeSetting(`launchOnBoot`, true);
    await changeSetting(`lauchHiddenOnBoot`, arg);
  }
});

// Handler to restart the app
ipcMain.on('restartApp', function() {
  app.relaunch();
  quitApp();
});

// Handler to completely reset the app
ipcMain.on('resetApp', function() {
  if(child) {
    child.kill();
  }

  fs.rmdirSync(process.env.APPDATA + "/VALTracker/user_data", { recursive: true, force: true });
  app.exit(0); 
}); 

// Handler to relay a textbox
ipcMain.on('relayTextbox', function(event, args) {
  sendMessageToWindow('createTextbox', args);
});

// Handler to relay the command to open the player search modal
ipcMain.on('relayOpenPlayerSearchModal', function(event, args) {
  sendMessageToWindow('openPlayerSearchModal', args);
});

// Handler to execute a query on the database
ipcMain.handle('executeQuery', async (event, args) => {
  return await executeQuery(args);
});

// Handler to create a thing in the database
ipcMain.handle('createThing', async (event, args) => {
  return await createThing(args[0], args[1]);
});

// Handler to update a thing in the database
ipcMain.handle('updateThing', async (event, args) => {
  return await updateThing(args[0], args[1]);
});

// Handler to switch the user to a different account
ipcMain.handle('switchPlayer', async (event, args) => {
  return await switchPlayer(args);
});

// Handler that returns the entitlement of the current user
ipcMain.handle('getUserEntitlement', async (event, args) => {
  return await getUserEntitlement(args);
});

// Handler that returns the access token of the current user
ipcMain.handle('getUserAccessToken', async (event, args) => {
  return await getUserAccessToken(args);
});

// Handler that returns all data about the current user
ipcMain.handle('getCurrentUserData', async () => {
  return await getCurrentUserData();
});

// Handler that returns the PUUID of the current user
ipcMain.handle('getCurrentPUUID', async () => {
  return await getCurrentPUUID();
});

// Handler that returns the instance token
ipcMain.handle('getInstanceToken', async () => {
  return await getInstanceToken();
});

// Handler that returns all service data
ipcMain.handle('getServiceData', async () => {
  return await getServiceData();
});

// Handler that updates the message date
ipcMain.handle('updateMessageDate', async (event, args) => {
  return await updateMessageDate(args);
});

// Handler that fetches a match and returns it
ipcMain.handle('fetchMatch', async (event, args) => {
  return await fetchMatch(args);
});

// Handler that creates a match in the database, if it does not yet exist
ipcMain.on('createMatch', async (event, args) => {
  if(allCurrentlyProcessingMatchIDs.includes(args.matchInfo.matchId)) return;

  allCurrentlyProcessingMatchIDs.push(args.matchInfo.matchId);

  var db = new Surreal(process.env.DB_URL);

  await db.wait();

  await db.signin({
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  });

  await db.use('app', 'main');

  var result = await db.query(`SELECT 1 FROM match:⟨${args.matchInfo.matchId}⟩`);
  if(result[0].result[0]) {
    allCurrentlyProcessingMatchIDs = allCurrentlyProcessingMatchIDs.filter(x => x !== args.matchInfo.matchId);
    return;
  }

  var allRoundResults = [];
  for(var k = 0; k < args.roundResults.length; k++) {
    var round = {
      "bombPlanter": args.roundResults[k].bombPlanter,
      "playerStats": args.roundResults[k].playerStats,
      "roundResult": args.roundResults[k].roundResult,
      "winningTeam": args.roundResults[k].winningTeam
    }
    allRoundResults.push(round);
  }

  var match = {
    matchInfo: args.matchInfo,
    players: args.players,
    roundResults: allRoundResults,
    stats_data: args.stats_data,
    teams: args.teams
  }

  var result = await db.create(`match:⟨${args.matchInfo.matchId}⟩`, match);

  allCurrentlyProcessingMatchIDs = allCurrentlyProcessingMatchIDs.filter(x => x !== args.matchInfo.matchId);
  db.close();
});

// Handler that removes a match from the database
ipcMain.handle('removeMatch', async (event, args) => {
  return await removeMatch(args[0], args[1]);
});

// Handler that adds a skin to the wishlist
ipcMain.handle('addSkinToWishlist', async (event, args) => {
  return await addSkinToWishlist(args);
});

// Handler that removes a skin from the wishlist
ipcMain.handle('rmSkinFromWishlist', async (event, args) => {
  return await rmSkinFromWishlist(args);
});

// Handler that returns all settings
ipcMain.handle('getAllSettings', async (event, args) => {
  return await getAllSettings();
});

// Handler that changes a setting
ipcMain.handle('changeSetting', async (event, args) => {
  return await changeSetting(args[0], args[1]);
});

// Handler that requests a new instance token
ipcMain.handle('requestInstanceToken', async (event, args) => {
  return await await requestInstanceToken(args[0], args[1]);
});
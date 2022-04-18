// Import required modules
const { app, BrowserWindow, ipcMain, Menu, Tray, session } = require("electron");
const fs = require("fs");
const https = require('https');
const axios = require("axios").default;
const path = require("path");

// Initialize new RPC client
const RPC = require("discord-rpc");
const discordClient = new RPC.Client({
  transport: "ipc",
});

if(fs.existsSync(process.env.APPDATA + "/user_data/load_files/on_load.json")) {
  let onLoadData2 = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
  let loadData2 = JSON.parse(onLoadData2);
  
  if(loadData2.enableHardwareAcceleration == false) {
    app.disableHardwareAcceleration();
  }
  
  //Login with Discord client
  if(loadData2.hasDiscordRPenabled == true) {
    discordClient.login({
      clientId: "933753504558903406",
    });
  }
}

// Set activity after client is finished loading
const discord_rps = require("./modules/discord_rps.js");
discordClient.on("ready", () => {
  if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json")) {
    discordClient.request("SET_ACTIVITY", {
      pid: process.pid,
      activity: discord_rps.starting_activity,
    });
  }
});

// Initialize new RPC client
const discordVALPresence = new RPC.Client({
  transport: "ipc",
});

if(fs.existsSync(process.env.APPDATA + "/user_data/load_files/on_load.json")) {
  //Login with Discord client
  if(loadData2.hasValRPenabled == true) {
    discordVALPresence.login({
      clientId: "957041886093267005",
    });
  }
}

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
  // Create /favourite_matches dir and all files in it
  fs.mkdirSync(app_data + "/user_data/favourite_matches");
  let favMatchesPointer = {
    favourites: [{}],
  };
  fs.writeFileSync(app_data + "/user_data/favourite_matches/matches.json", JSON.stringify(favMatchesPointer));

  // Create /favourite_matches dir subfolders
  fs.mkdirSync(app_data + "/user_data/favourite_matches/matches");
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
    displayedUserName: "",
    preferredMatchFilter: "",
  };

  fs.writeFileSync(app_data + "/user_data/home_settings/settings.json", JSON.stringify(homeSettings));
}

function createLoadFiles() {
  // Create /load_files dir and all files in it
  fs.mkdirSync(app_data + "/user_data/load_files");

  let loadFileData = {
    hasFinishedSetupSequence: false,
    hasDiscordRPenabled: true,
    hasReadLatestPatchnotes: false,
  };

  fs.writeFileSync(app_data + "/user_data/load_files/on_load.json", JSON.stringify(loadFileData));
}

function createPlayerProfileSettings() {
  // Create /player_profile_settings dir and all files in it
  fs.mkdirSync(app_data + "/user_data/player_profile_settings");

  let playerProfileSettings = {
    displayedUserName: "",
    preferredMatchFilter: "",
  };

  fs.writeFileSync(app_data + "/user_data/player_profile_settings/settings.json", JSON.stringify(playerProfileSettings));
}

function createThemes() {
  if(!fs.existsSync(app_data + "/user_data/themes")) {
    fs.mkdirSync(app_data + "/user_data/themes");
  }

  let themesPointerFile = {
    isCustomTheme: false,
    themeName: "normal",
  };

  fs.writeFileSync(app_data + "/user_data/themes/color_theme.json", JSON.stringify(themesPointerFile));

  // Create /themes/preset_themes dir and all files in it
  if(!fs.existsSync(app_data + "/user_data/themes/preset_themes")) {
    fs.mkdirSync(app_data + "/user_data/themes/preset_themes");
  }

  const themes = require("./modules/preset_themes");

  for (var i = 0; i < Object.keys(themes).length; i++) {
    fs.writeFileSync(app_data + `/user_data/themes/preset_themes/${Object.keys(themes)[i]}.json`, JSON.stringify(themes[Object.keys(themes)[i]]));
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

async function checkUserData() {
  var raw = fs.readFileSync(app_data + "/user_data/user_creds.json");
  var user_creds = JSON.parse(raw);
  
  if(!user_creds.playerName) {
    axios({
      "url": "https://pd." + user_creds.playerRegion + ".a.pvp.net/name-service/v2/players",
      "method": "PUT",
      "data": "[\"" + user_creds.playerUUID + "\"]",
    })
    .then(function(response) {
      var response = JSON.parse(response)

      user_creds.playerName = response.data[0].GameName;
      user_creds.playerTag = response.data[0].TagLine;

      fs.writeFileSync(app_data + "/user_data/user_creds.json", JSON.stringify(user_creds));
      fs.writeFileSync(app_data + "/user_data/user_accounts/" + user_creds.playerUUID + ".json", JSON.stringify(user_creds));
    });
  }

  if(!user_creds.playerUUID) {
    var account_data = await axios.get(`https://api.henrikdev.xyz/valorant/v1/account/${user_creds.playerName}/${user_creds.playerTag}`);

    user_creds.playerUUID = account_data.data.data.puuid;

    fs.writeFileSync(app_data + "/user_data/user_creds.json", JSON.stringify(user_creds));
    fs.writeFileSync(app_data + "/user_data/user_accounts/" + user_creds.playerUUID + ".json", JSON.stringify(user_creds));
  }

  if(!user_creds.playerRank) {
    var mmr_data = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${user_creds.playerRegion}/${user_creds.playerUUID}`);

    if(user_creds.playerRank != undefined) {
      user_creds.playerRank = `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${mmr_data.data.data.currenttier}/largeicon.png`;
    } else {
      user_creds.playerRank = `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/largeicon.png`;
    }

    fs.writeFileSync(app_data + "/user_data/user_creds.json", JSON.stringify(user_creds));
    fs.writeFileSync(app_data + "/user_data/user_accounts/" + user_creds.playerUUID + ".json", JSON.stringify(user_creds));
  }
}

function noFilesFound() {
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
  fs.mkdirSync(app_data + "/user_data/riot_games_data");

  // Create /shop_data dir and all files in it
  createRiotGamesData()

  // Create /themes dir and all files in it
  createThemes();

  createMessageData();

  fs.mkdirSync(app_data + "/user_data/user_accounts");

  // Load Window with Setup Sequence
  mainWindow.loadFile("./setupSequence/index.html");
}

const download_image = (url, image_path) =>
  axios({
    url,
    responseType: 'stream',
  })
  .then(response =>
    new Promise((resolve, reject) => {
      response.data
        .pipe(fs.createWriteStream(image_path))
        .on('finish', () => resolve())
        .on('error', e => reject(e));
    }),
  );

// Set global mainWindow variable
let mainWindow;

// Create Main Window and check for folders/files
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 840,
    minWidth: 1400,
    minHeight: 840,
    frame: false,
    backgroundColor: "#12171d",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });

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

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons")) {
    fs.mkdirSync(process.env.APPDATA + "/VALTracker/user_data/icons");
  }

  if(!fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico")) {
    await download_image('https://valtracker.gg/img/VALTracker_Logo_default.ico', process.env.APPDATA + "/VALTracker/user_data/icons/tray_icon.ico");
  };

  mainWindow.onbeforeunload = (event) => {
    win.removeAllListeners();
  };

  mainWindow.on("move", () => {
    mainWindow.webContents.send("togglerestore", mainWindow.isMaximized());
  });

  ipcMain.handle("checkWindowState", () => {
    return mainWindow.isMaximized();
  });
  
  ipcMain.on("min-window", async function (event, args) {
    mainWindow.minimize();
  });

  ipcMain.on("max-window", async function (event, args) {
    mainWindow.maximize();
    event.sender.send("togglerestore", true);
  });

  ipcMain.on("restore-window", async function (event, args) {
    mainWindow.unmaximize();
    event.sender.send("togglerestore", false);
  });

  ipcMain.on("close-window", async function (event, args) {
    var raw = fs.readFileSync(app_data + "/user_data/load_files/on_load.json");
    var json = JSON.parse(raw);

    if(json.minimizeOnClose == false || json.minimizeOnClose == undefined) {
      mainWindow.close();
    } else {
      mainWindow.hide();

      if(!fs.existsSync(app_data + "/user_data/icons")) {
        fs.mkdirSync(app_data + "/user_data/icons");
      };

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

      appIcon.setContextMenu(contextMenu)
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

    if(fs.existsSync(app_data + "/user_data/user_creds.json")) {
      await checkUserData(); 

      var raw = fs.readFileSync(app_data + "/user_data/user_creds.json");
      var user_creds = JSON.parse(raw);

      if(!fs.existsSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID)) {
        fs.mkdirSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID);
      }

      if(fs.existsSync(app_data + "/user_data/riot_games_data/token_data.json")) {
        var raw = fs.readFileSync(app_data + "/user_data/riot_games_data/token_data.json");
        fs.writeFileSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID + "/token_data.json", raw);
      }

      if(fs.existsSync(app_data + "/user_data/riot_games_data/cookies.json")) {
        var raw = fs.readFileSync(app_data + "/user_data/riot_games_data/cookies.json");
        fs.writeFileSync(app_data + "/user_data/riot_games_data/" + user_creds.playerUUID + "/cookies.json", raw);
      }
    }

    mainWindow.loadFile("./pages/decoyIndex.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
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
        if(bakedCookies[i].includes("ssid=")) {
          ssid = bakedCookies[i];
        }
      }
    } else {
      for (var i = 0; i < bakedCookies.length; i++) {
        if(bakedCookies[i].name == "ssid") {
          ssid = `ssid=${bakedCookies[i].value}; Domain=${bakedCookies[i].domain}; Path=${bakedCookies[i].path}; hostOnly=${bakedCookies[i].hostOnly}; secure=${bakedCookies[i].secure}; httpOnly=${bakedCookies[i].httpOnly}; session=${bakedCookies[i].session}; sameSite=${bakedCookies[i].sameSite};`;
        }
      }
    }

    const ciphers = [
      "TLS_CHACHA20_POLY1305_SHA256",
      "TLS_AES_128_GCM_SHA256",
      "TLS_AES_256_GCM_SHA384",
      "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
    ];

    const agent = new https.Agent({
      ciphers: ciphers.join(":"),
      honorCipherOrder: true,
      minVersion: "TLSv1.2",
    });

    const access_tokens = await axios.post("https://auth.riotgames.com/api/v1/authorization", {
        client_id: "play-valorant-web-prod",
        nonce: 1,
        redirect_uri: "https://playvalorant.com/opt_in",
        response_type: "token id_token",
        scope: "account openid",
      },
      {
        headers: {
          Cookie: ssid,
          "User-Agent":
            "RiotClient/43.0.1.4195386.4190634 rso-auth (Windows; 10;;Professional, x64)",
        },
        httpsAgent: agent,
      }
    );

    newTokenData = getTokenDataFromURL(access_tokens.data.response.parameters.uri);

    if(puuid.startsWith(".")) {
      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json", JSON.stringify(access_tokens.headers["set-cookie"]));

      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/token_data.json", JSON.stringify(newTokenData));

      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid.split(".").pop() + "/cookies.json", JSON.stringify(access_tokens.headers["set-cookie"]));
  
      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid.split(".").pop() + "/token_data.json", JSON.stringify(newTokenData));
    } else {
      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid + "/cookies.json", JSON.stringify(access_tokens.headers["set-cookie"]));
  
      fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/" + puuid + "/token_data.json", JSON.stringify(newTokenData));
    }
    return newTokenData;
  } catch (err) {
    return;
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
    
    await new Promise((resolve, reject) => { 
      accountsToReauth.forEach(async (uuid) => {
        data = await reauthAccount(uuid);
        data_array.push(data);

        i++;

        if(i == expectedLength) {
          resolve();
        }
      });
    });
    
    return data_array;
  } else {
    return false;
  }
}

app.on("ready", async function () {
  createWindow();

  let onLoadData = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
  let loadData = JSON.parse(onLoadData);

  if(loadData.hasDiscordRPenabled == undefined) {
    loadData.hasDiscordRPenabled = true;
    var dataToWriteDown = JSON.stringify(loadData);
    fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json", dataToWriteDown);
  }
  
  var newTokenData = await reauthAllAccounts();

  var cycleRunning = false;

  if(newTokenData != false) {
    if(cycleRunning == false) {
      setInterval(reauthAllAccounts, (newTokenData[0].expiresIn - 300) * 1000);
      console.log("CYCLE STARTED");
      cycleRunning = true;
    }
  }
});

app.on("window-all-closed", function() {
  app.quit();
});

app.on("activate", function() {
  if(mainWindow === null) {
    createWindow();
  }
});

const { autoUpdater } = require("electron-updater");

autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update-found");
});

autoUpdater.on("update-not-available", () => {
  mainWindow.webContents.send("no-update-found");
});

autoUpdater.on("error", (err) => {
  mainWindow.webContents.send("update-error", err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;

  log_message = log_message + " - Downloaded " + progressObj.percent + "%";

  log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";

  mainWindow.webContents.send("update-download-percent", progressObj.percent);
  mainWindow.webContents.send("update-download-status", log_message);
});

autoUpdater.on("update-downloaded", () => {
  mainWindow.webContents.send("update-download-finished");
});

ipcMain.on('update-download', function() {
  console.log("DOWNLOADING UPDATE");
  var isDev = require('electron-is-dev');
  if(!isDev) {
    autoUpdater.checkForUpdates();
  }
});

app.on("activate", function () {
  if(mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('quit-app-and-install', function() {
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.on("setCookies", function (event, arg) {
  session.defaultSession.cookies
    .get({})
    .then((cookies) => {
      cookies.forEach((cookie) => {
        if(cookie.name == "tdid") {
          if(arg == "addedNewAccount") {
            event.sender.send("newAccountTdid", cookie.value);
          } else if(arg == "reauth") {
            event.sender.send("reauthTdid", cookie.value);
          } else {
            event.sender.send("tdid", cookie.value);
          }
        }
      });
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

// Change Discord RP if App requests it
var RPState = null;
ipcMain.on("changeDiscordRP", function (event, arg) {
  if(RPState == null || RPState == "APP") {
    let onLoadData = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
    let loadData = JSON.parse(onLoadData);
    if(loadData.hasDiscordRPenabled == true) {
      switch (arg) {
        case "hub_activity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.hub_activity,
          });
          break;
        case "skins_activity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.skins_activity,
          });
          break;
        case "bundle_acitivity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.bundles_activity,
          });
          break;
        case "pprofile_acitivity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.pprofile_acitivity,
          });
          break;
        case "favmatches_activity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.favmatches_acitivity,
          });
          break;
        case "playersearch_acitivity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.playersearch_acitivity,
          });
          break;
        case "settings_activity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.settings_acitivity,
          });
          break;
        case "patchnotes_activity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.patchnotes_acitivity,
          });
          break;
        case "matchview_activity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.matchview_activity,
          });
          break;
        case "shop_activity":
          discordClient.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: discord_rps.shop_activity,
          });
          break;
        case "clear":
          break;
      }
    } else {
      discordClient.clearActivity(process.pid);
    }
  }
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
    const loginWindow = new BrowserWindow({
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
          riotcookies.forEach(riotcookie => {
            if(riotcookie.name == "ssid") {
              cookieString = riotcookie.value
            }
          })
          if(writeToFile == true) {
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify(riotcookies))
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
      reject('window closed');
    });
    loginWindow.loadURL(signInUrl);
  });
}

ipcMain.handle('loginWindow', async (event, args) => {
  return await showSignIn(args);
});

var newTokenData;

function getTokenDataFromURL(url) {
  try {
    const searchParams = new URLSearchParams(new URL(url).hash.slice(1));
    return {
      accessToken: searchParams.get("access_token"),
      expiresIn: searchParams.get("expires_in"),
      id_token: searchParams.get("id_token"),
    };
  } catch (err) {
    throw new Error(err);
  }
}

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
          if(bakedCookies[i].includes("ssid=")) {
            ssid = bakedCookies[i];
          }
        }
      } else {
        for (var i = 0; i < bakedCookies.length; i++) {
          if(bakedCookies[i].name == "ssid") {
            ssid = `ssid=${bakedCookies[i].value}; Domain=${bakedCookies[i].domain}; Path=${bakedCookies[i].path}; hostOnly=${bakedCookies[i].hostOnly}; secure=${bakedCookies[i].secure}; httpOnly=${bakedCookies[i].httpOnly}; session=${bakedCookies[i].session}; sameSite=${bakedCookies[i].sameSite};`;
          }
        }
      }

      const ciphers = [
        "TLS_CHACHA20_POLY1305_SHA256",
        "TLS_AES_128_GCM_SHA256",
        "TLS_AES_256_GCM_SHA384",
        "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
      ];

      const agent = new https.Agent({
        ciphers: ciphers.join(":"),
        honorCipherOrder: true,
        minVersion: "TLSv1.2",
      });
      
      const access_tokens = await axios.post(
        "https://auth.riotgames.com/api/v1/authorization",
        {
          client_id: "play-valorant-web-prod",
          nonce: 1,
          redirect_uri: "https://playvalorant.com/opt_in",
          response_type: "token id_token",
          scope: "account openid",
        },
        {
          headers: {
            Cookie: ssid,
            "User-Agent":
              "RiotClient/43.0.1.4195386.4190634 rso-auth (Windows; 10;;Professional, x64)",
          },
          httpsAgent: agent,
        }
      );

      if(access_tokens.data.response == undefined) {
        event.sender.send("reauthFail");
      } else {
        fs.writeFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json", JSON.stringify(access_tokens.headers["set-cookie"]));

        event.sender.send("reauthSuccess", access_tokens.data.response.parameters.uri);
        
        newTokenData = getTokenDataFromURL(access_tokens.data.response.parameters.uri);
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
  app.setLoginItemSettings({
    openAtLogin: arg,
  })
})

ipcMain.on('relaunchApp', function() {
  app.relaunch();
  app.exit(0);
})

//Login with Discord client
discordVALPresence.login({
  clientId: "957041886093267005",
});

setTimeout(() => {
  const runValorantPresence = require("./modules/valorant_presence");
  runValorantPresence(discordClient, discordVALPresence, mainWindow);
}, 3000);
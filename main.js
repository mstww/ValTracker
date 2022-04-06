// Import required modules
const { app, BrowserWindow, ipcMain } = require("electron");
const ipc = require("electron").ipcMain;
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const fs = require("fs");
const fs_extra = require("fs-extra");
const RPC = require("discord-rpc");
const { session } = require("electron");
const { Agent } = require("https");
const axios = require("axios").default;
const isDev = require("electron-is-dev");
const find = require("find-process");

app.disableHardwareAcceleration();

// Import Discord RP settings
const discord_rps = require("./assets/js/modules/discord_rps.js");

// Initialize new RPC client
const discordClient = new RPC.Client({
  transport: "ipc",
});

//Login with Discord client
discordClient.login({
  clientId: "933753504558903406",
});

// Set activity after client is finished loading
discordClient.on("ready", () => {
  if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json")) {
    let onLoadData2 = fs.readFileSync(
      process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json"
    );
    let loadData2 = JSON.parse(onLoadData2);
    if (loadData2.hasDiscordRPenabled == true) {
      discordClient.request("SET_ACTIVITY", {
        pid: process.pid,
        activity: discord_rps.starting_activity,
      });
    } else if (loadData2.hasDiscordRPenabled == "anonymous") {
      discordClient.request("SET_ACTIVITY", {
        pid: process.pid,
        activity: discord_rps.anonymous_activity,
      });
    }
  }
});

// Initialize new RPC client
const discordVALPresence = new RPC.Client({
  transport: "ipc",
});

//Login with Discord client
discordVALPresence.login({
  clientId: "957041886093267005",
});

// Set activity after client is finished loading
discordVALPresence.on("ready", () => {
  console.log("VALPresence is Ready!")
});

// Change Discord RP if App requests it
var RPState = null;
ipc.on("changeDiscordRP", function (event, arg) {
  if(RPState == null || RPState == "APP") {
    let onLoadData3 = fs.readFileSync(
      process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json"
    );
    let loadData3 = JSON.parse(onLoadData3);
    if (loadData3.hasDiscordRPenabled == true) {
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
          discordClient.clearActivity(process.pid)
          break;
      }
    } else if (loadData3.hasDiscordRPenabled == "anonymous") {
      discordClient.request("SET_ACTIVITY", {
        pid: process.pid,
        activity: discord_rps.anonymous_activity,
      });
    }
  }
});

// Set custom Protocol to start App
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("valtracker-ptcl", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("valtracker-ptcl");
}

// Get instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, CommandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
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
  fs.writeFileSync(
    app_data + "/user_data/favourite_matches/matches.json",
    JSON.stringify(favMatchesPointer)
  );

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
  fs.writeFileSync(
    app_data + "/user_data/user_creds.json",
    JSON.stringify(userData)
  );
}

function createHomeSettings() {
  // Create /home_settings dir and all files in it
  fs.mkdirSync(app_data + "/user_data/home_settings");
  let homeSettings = {
    displayedUserName: "",
    preferredMatchFilter: "",
  };
  fs.writeFileSync(
    app_data + "/user_data/home_settings/settings.json",
    JSON.stringify(homeSettings)
  );
}

function createLoadFiles() {
  // Create /load_files dir and all files in it
  fs.mkdirSync(app_data + "/user_data/load_files");
  let loadFileData = {
    hasFinishedSetupSequence: false,
    hasDiscordRPenabled: true,
    hasReadLatestPatchnotes: false,
  };
  fs.writeFileSync(
    app_data + "/user_data/load_files/on_load.json",
    JSON.stringify(loadFileData)
  );
}

function createPlayerProfileSettings() {
  // Create /player_profile_settings dir and all files in it
  fs.mkdirSync(app_data + "/user_data/player_profile_settings");
  let playerProfileSettings = {
    displayedUserName: "",
    preferredMatchFilter: "",
  };
  fs.writeFileSync(
    app_data + "/user_data/player_profile_settings/settings.json",
    JSON.stringify(playerProfileSettings)
  );
}

function createThemes() {
  if (!fs.existsSync(app_data + "/user_data/themes")) {
    fs.mkdirSync(app_data + "/user_data/themes");
  }
  let themesPointerFile = {
    isCustomTheme: false,
    themeName: "normal",
  };
  fs.writeFileSync(
    app_data + "/user_data/themes/color_theme.json",
    JSON.stringify(themesPointerFile)
  );

  // Create /themes/preset_themes dir and all files in it
  if (!fs.existsSync(app_data + "/user_data/themes/preset_themes")) {
    fs.mkdirSync(app_data + "/user_data/themes/preset_themes");
  }
  const themes = require("./assets/js/modules/preset_themes");
  for (var i = 0; i < Object.keys(themes).length; i++) {
    fs.writeFileSync(
      app_data +
        `/user_data/themes/preset_themes/${Object.keys(themes)[i]}.json`,
      JSON.stringify(themes[Object.keys(themes)[i]])
    );
  }

  // Create /themes/custom_themes dir
  if (!fs.existsSync(app_data + "/user_data/themes/custom_themes")) {
    fs.mkdirSync(app_data + "/user_data/themes/custom_themes");
  }
}

function createMessageData() {
  fs.mkdirSync(app_data + '/user_data/message_data');
  var date = Date.now();
  var dateData = {
    "date": date
  }
  fs.writeFileSync(app_data + '/user_data/message_data/last_checked_date.json', JSON.stringify(dateData))
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

  // Create /shop_data dir
  fs.mkdirSync(app_data + "/user_data/shop_data");

  // Create /themes dir and all files in it
  createThemes();

  createMessageData();

  // Load Window with Setup Sequence
  mainWindow.loadFile("./setupSequence/index.html");
}

function moveOldFiles() {
  if (fs.existsSync(app_data + "/user_data/customThemes")) {
    if (!fs.existsSync(app_data + "/user_data/themes")) {
      fs.mkdirSync(app_data + "/user_data/themes");
    }
    fs.renameSync(
      app_data + "/user_data/customThemes",
      app_data + "/user_data/custom_themes"
    );
    if (fs.existsSync(app_data + "/user_data/customThemes")) {
      fs.unlinkSync(app_data + `/user_data/customThemes`, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
    if (fs.existsSync(app_data + "/user_data/themes/custom_themes")) {
      fs.unlinkSync(app_data + `/user_data/themes/custom_themes`, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
    fs_extra.moveSync(
      app_data + "/user_data/custom_themes",
      app_data + "/user_data/themes/custom_themes",
      (err) => {
        if (err) return console.error(err);
      }
    );
    fs.mkdirSync(app_data + "/user_data/themes/preset_themes");
    const themes = require("./assets/js/modules/preset_themes");
    for (var i = 0; i < Object.keys(themes).length; i++) {
      fs.writeFileSync(
        app_data +
          `/user_data/themes/preset_themes/${Object.keys(themes)[i]}.json`,
        themes[Object.keys(themes)[i]]
      );
    }
  }

  if (fs.existsSync(app_data + "/user_data/favouriteMatches")) {
    if (!fs.existsSync(app_data + "/user_data/favourite_matches")) {
      fs.mkdirSync(app_data + "/user_data/favourite_matches");
    }
    if (
      fs.existsSync(app_data + "/user_data/favourite_matches/favouriteMatches")
    ) {
      fs.unlinkSync(
        app_data + "/user_data/favourite_matches/favouriteMatches",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    fs_extra.moveSync(
      app_data + "/user_data/favouriteMatches",
      app_data + "/user_data/favourite_matches/favouriteMatches",
      (err) => {
        if (err) return console.error(err);
      }
    );
    fs.renameSync(
      app_data + "/user_data/favourite_matches/favouriteMatches",
      app_data + "/user_data/favourite_matches/matches"
    );
  }

  if (fs.existsSync(app_data + "/user_data/home")) {
    fs.renameSync(
      app_data + "/user_data/home",
      app_data + "/user_data/home_settings"
    );
    fs.readdir(app_data + "/user_data/home_settings", (err, files) => {
      if (err) {
        console.log(err);
      } else {
        let newData = {};
        files.forEach((file) => {
          let rawfile = fs.readFileSync(
            app_data + `/user_data/home_settings/${file}`
          );
          let filedata = JSON.parse(rawfile);
          newData[Object.keys(filedata)[0]] =
            filedata[Object.keys(filedata)[0]];
          fs.unlinkSync(
            app_data + `/user_data/home_settings/${file}`,
            (err) => {
              if (err) {
                console.log(err);
              }
            }
          );
        });
        if (newData.displayedUserName == undefined) {
          newData.displayedUserName = "";
        }
        fs.writeFileSync(
          app_data + "/user_data/home_settings/settings.json",
          JSON.stringify(newData)
        );
      }
    });
  }

  if (fs.existsSync(app_data + "/user_data/colorTheme.json")) {
    let jsondata = fs.readFileSync(app_data + "/user_data/colorTheme.json");
    let olddata = JSON.parse(jsondata);

    if (olddata.loadCustomTheme == true) {
      createThemes();
      let themesPointerFile = {
        isCustomTheme: true,
        themeName: olddata.customThemeName,
      };
      fs.writeFileSync(
        app_data + "/user_data/themes/color_theme.json",
        JSON.stringify(themesPointerFile)
      );
    } else {
      createThemes();
      let newName = olddata.logo_style.toLowerCase();
      if (newName == "default") {
        newName = "normal";
      }
      let themesPointerFile = {
        isCustomTheme: false,
        themeName: newName,
      };
      fs.writeFileSync(
        app_data + "/user_data/themes/color_theme.json",
        JSON.stringify(themesPointerFile)
      );
    }

    if (fs.existsSync(app_data + "/user_data/customThemes")) {
      fs.readdirSync(app_data + "/user_data/customThemes", (err, files) => {
        if (err) {
          console.log(err);
        } else {
          files.forEach((file) => {
            if (
              fs.existsSync(
                app_data + `/user_data/themes/custom_themes/${file}`
              )
            ) {
              fs.unlinkSync(
                app_data + `/user_data/themes/custom_themes/${file}`,
                (err) => {
                  if (err) {
                    console.log(err);
                  }
                }
              );
            }
            fs_extra.moveSync(
              app_data + `/user_data/customThemes/${file}`,
              app_data + `/user_data/themes/custom_themes`,
              (err) => {
                if (err) return console.error(err);
              }
            );
          });
        }
      });

      fs.unlinkSync(app_data + `/user_data/customThemes`, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    fs.unlinkSync(app_data + `/user_data/colorTheme.json`, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  if (fs.existsSync(app_data + "/user_data/cookies.json")) {
    if (!fs.existsSync(app_data + "/user_data/riot_games_data")) {
      fs.mkdirSync(app_data + "/user_data/riot_games_data");
    }
    if (fs.existsSync(app_data + "/user_data/riot_games_data/cookies.json")) {
      fs.unlinkSync(
        app_data + "/user_data/riot_games_data/cookies.json",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    fs_extra.moveSync(
      app_data + "/user_data/cookies.json",
      app_data + "/user_data/riot_games_data/cookies.json",
      (err) => {
        if (err) return console.error(err);
      }
    );
  }

  if (fs.existsSync(app_data + "/user_data/tokenData.json")) {
    if (!fs.existsSync(app_data + "/user_data/riot_games_data")) {
      fs.mkdirSync(app_data + "/user_data/riot_games_data");
    }
    fs.renameSync(
      app_data + "/user_data/tokenData.json",
      app_data + "/user_data/token_data.json"
    );
    if (
      fs.existsSync(app_data + "/user_data/riot_games_data/token_data.json")
    ) {
      fs.unlinkSync(
        app_data + "/user_data/riot_games_data/token_data.json",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    fs_extra.moveSync(
      app_data + "/user_data/token_data.json",
      app_data + "/user_data/riot_games_data/token_data.json",
      (err) => {
        if (err) return console.error(err);
      }
    );
  }

  if (fs.existsSync(app_data + "/user_data/current_shop.json")) {
    if (!fs.existsSync(app_data + "/user_data/shop_data")) {
      fs.mkdirSync(app_data + "/user_data/shop_data");
    }
    if (fs.existsSync(app_data + "/user_data/shop_data/current_shop.json")) {
      fs.unlinkSync(
        app_data + "/user_data/shop_data/current_shop.json",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    fs_extra.moveSync(
      app_data + "/user_data/current_shop.json",
      app_data + "/user_data/shop_data/current_shop.json",
      (err) => {
        if (err) return console.error(err);
      }
    );
  }

  if (fs.existsSync(app_data + "/user_data/last_checked_date.json")) {
    if (!fs.existsSync(app_data + "/user_data/shop_data")) {
      fs.mkdirSync(app_data + "/user_data/shop_data");
    }
    if (
      fs.existsSync(app_data + "/user_data/shop_data/last_checked_date.json")
    ) {
      fs.unlinkSync(
        app_data + "/user_data/shop_data/last_checked_date.json",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    fs_extra.moveSync(
      app_data + "/user_data/last_checked_date.json",
      app_data + "/user_data/shop_data/last_checked_date.json",
      (err) => {
        if (err) return console.error(err);
      }
    );
  }

  if (fs.existsSync(app_data + "/user_data/favourites.json")) {
    if (!fs.existsSync(app_data + "/user_data/favourite_matches")) {
      fs.mkdirSync(app_data + "/user_data/favourite_matches");
    }
    fs.renameSync(
      app_data + "/user_data/favourites.json",
      app_data + "/user_data/matches.json"
    );
    if (fs.existsSync(app_data + "/user_data/favourite_matches/matches.json")) {
      fs.unlinkSync(
        app_data + "/user_data/favourite_matches/matches.json",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    fs_extra.moveSync(
      app_data + "/user_data/matches.json",
      app_data + "/user_data/favourite_matches/matches.json",
      (err) => {
        if (err) return console.error(err);
      }
    );
  }

  if (fs.existsSync(app_data + "/user_data/onLoad.json")) {
    if (!fs.existsSync(app_data + "/user_data/load_files")) {
      fs.mkdirSync(app_data + "/user_data/load_files");
    }
    fs.renameSync(
      app_data + "/user_data/onLoad.json",
      app_data + "/user_data/on_load.json"
    );
    if (fs.existsSync(app_data + "/user_data/load_files/on_load.json")) {
      fs.unlinkSync(app_data + "/user_data/load_files/on_load.json", (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
    fs_extra.moveSync(
      app_data + "/user_data/on_load.json",
      app_data + "/user_data/load_files/on_load.json",
      (err) => {
        if (err) return console.error(err);
      }
    );
  }

  if (fs.existsSync(app_data + "/user_data/userData.json")) {
    fs.renameSync(
      app_data + "/user_data/userData.json",
      app_data + "/user_data/user_creds.json"
    );
  }
}

// Set global mainWindow variable
let mainWindow;

// Create Main Window and check for folders/files
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
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

  require('@electron/remote/main').initialize()
  require("@electron/remote/main").enable(mainWindow.webContents)

  if(!fs.existsSync(app_data + "/user_data")) {
    var isInSetup = false;
    ipcMain.on('isInSetup', function() { isInSetup = true; console.log("IS IN SETUP!") })

    ipcMain.on('finishedSetup', function() { isInSetup = false; console.log("LEFT SETUP!") })

    app.on('before-quit', () => {
      if(isInSetup == true) {
        console.log("Deleting Folder...")
        fs.rmSync(app_data + "/user_data", { recursive: true, force: true });
      }
    })
  }

  mainWindow.onbeforeunload = (event) => {
    win.removeAllListeners();
  };

  mainWindow.on('move', () => {
    mainWindow.webContents.send("togglerestore", mainWindow.isMaximized());
  })

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
    mainWindow.close();
  });

  app_data = app.getPath("userData");

  if (fs.existsSync(app_data + "/settings")) {
    fs.renameSync(app_data + "/settings", app_data + "/user_data");
  }

  moveOldFiles();

  if (!fs.existsSync(app_data + "/user_data")) {
    noFilesFound();
  } else {
    if (!fs.existsSync(app_data + "/user_data/favourite_matches")) {
      createFavMatches();
    }

    if (!fs.existsSync(app_data + "/user_data/home_settings")) {
      createHomeSettings();
    }

    if (!fs.existsSync(app_data + "/user_data/load_files")) {
      createLoadFiles();
    }

    if (!fs.existsSync(app_data + "/user_data/player_profile_settings")) {
      createPlayerProfileSettings();
    }

    if (!fs.existsSync(app_data + "/user_data/riot_games_data")) {
      fs.mkdirSync(app_data + "/user_data/riot_games_data");
      var cookiesData = [];
      var tokenData = {};
      fs.writeFileSync(
        app_data + "/user_data/riot_games_data/cookies.json",
        JSON.stringify(cookiesData)
      );
      fs.writeFileSync(
        app_data + "/user_data/riot_games_data/token_data.json",
        JSON.stringify(tokenData)
      );
    }

    if (!fs.existsSync(app_data + "/user_data/riot_games_data/cookies.json")) {
      var cookiesData = [];
      fs.writeFileSync(
        app_data + "/user_data/riot_games_data/cookies.json",
        JSON.stringify(cookiesData)
      );
    }

    if (
      !fs.existsSync(app_data + "/user_data/riot_games_data/token_data.json")
    ) {
      var tokenData = {};
      fs.writeFileSync(
        app_data + "/user_data/riot_games_data/token_data.json",
        JSON.stringify(tokenData)
      );
    }

    if (!fs.existsSync(app_data + "/user_data/shop_data")) {
      fs.mkdirSync(app_data + "/user_data/shop_data");
    }

    if (!fs.existsSync(app_data + "/user_data/themes")) {
      createThemes();
    }

    if(!fs.existsSync(app_data + '/user_data/message_data')) {
      createMessageData();
    }

    if(!fs.existsSync(app_data + '/user_data/user_accounts/')) {
      fs.mkdirSync(app_data + '/user_data/user_accounts/');
    }

    if(fs.existsSync(app_data + '/user_data/user_creds.json')) {
      var raw = fs.readFileSync(app_data + '/user_data/user_creds.json');
      var user_creds = JSON.parse(raw)
      if(!user_creds.playerUUID) {
        var account_data = await axios.get(`https://api.henrikdev.xyz/valorant/v1/account/${user_creds.playerName}/${user_creds.playerTag}`)
        user_creds.playerUUID = account_data.data.data.puuid
      }
      if(!user_creds.playerRank) {
        var mmr_data = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${user_creds.playerRegion}/${user_creds.playerUUID}`)
        if(user_creds.playerRank != undefined) {
          user_creds.playerRank = `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${mmr_data.data.data.currenttier}/largeicon.png`;
        } else {
          user_creds.playerRank = `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/largeicon.png`;
        }
      }
      fs.writeFileSync(app_data + '/user_data/user_creds.json', JSON.stringify(user_creds))
      fs.writeFileSync(app_data + '/user_data/user_accounts/' + user_creds.playerUUID + '.json', JSON.stringify(user_creds))

      if(!fs.existsSync(app_data + '/user_data/riot_games_data/' + user_creds.playerUUID)) {
        fs.mkdirSync(app_data + '/user_data/riot_games_data/' + user_creds.playerUUID)
      }

      if(fs.existsSync(app_data + '/user_data/riot_games_data/token_data.json')) {
        var raw = fs.readFileSync(app_data + '/user_data/riot_games_data/token_data.json');
        fs.writeFileSync(app_data + '/user_data/riot_games_data/' + user_creds.playerUUID + '/token_data.json', JSON.stringify(user_creds))
      }

      if(fs.existsSync(app_data + '/user_data/riot_games_data/cookies.json')) {
        var raw = fs.readFileSync(app_data + '/user_data/riot_games_data/cookies.json');
        fs.writeFileSync(app_data + '/user_data/riot_games_data/' + user_creds.playerUUID + '/cookies.json', JSON.stringify(user_creds))
      }
    }

    mainWindow.loadFile("./pages/decoyIndex.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

var updateCheck;

app.on("ready", async function () {
  createWindow();
  if(!isDev) {
    autoUpdater.checkForUpdates();
    updateCheck = setInterval(function () {
      autoUpdater.checkForUpdates();
    }, 300000);
  }
  let onLoadData = fs.readFileSync(
    process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json"
  );
  let loadData = JSON.parse(onLoadData);
  if (loadData.hasDiscordRPenabled == undefined) {
    loadData.hasDiscordRPenabled = true;
    var dataToWriteDown = JSON.stringify(loadData);
    fs.writeFileSync(
      process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json",
      dataToWriteDown
    );
  }
});

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send("message", text);
}

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  sendStatusToWindow("Update available.");
  mainWindow.webContents.send("update-available");
  clearInterval(updateCheck);
});

autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.");
});

autoUpdater.on("error", (err) => {
  sendStatusToWindow("Error in auto-updater. " + err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  sendStatusToWindow(log_message);
  mainWindow.webContents.send("download-percent", progressObj.percent);
});

autoUpdater.on("update-downloaded", (info) => {
  sendStatusToWindow("Update downloaded");
  mainWindow.webContents.send("showUpdateWindow");
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipc.on("setCookies", function (event, arg) {
  log.info(arg);
  session.defaultSession.cookies
    .get({})
    .then((cookies) => {
      cookies.forEach((cookie) => {
        if (cookie.name == "tdid") {
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

ipc.on("getSSIDCookie", async function (event, arg) {
  var rawData = fs.readFileSync(
    process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json"
  );
  var data = JSON.parse(rawData);
  for (var i = 0; i < data.length; i++) {
    if (data[i].name == "ssid") {
      value = data[i].value;
      expDate = data[i].expirationDate;
      event.sender.send(
        "ssid",
        data[i].value + " // " + data[i].expirationDate
      );
    }
  }
});

var newTokenData;
var cycleRunning = false;

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

ipc.on("startReauthCycle", async function (event, arg) {
  async function reauthCycle() {
    try {
      if (
        !fs.existsSync(
          process.env.APPDATA +
            "/VALTracker/user_data/riot_games_data/cookies.json"
        )
      ) {
        const newCookiesFile = {};
        fs.writeFileSync(
          process.env.APPDATA +
            "/VALTracker/user_data/riot_games_data/cookies.json",
          JSON.stringify(newCookiesFile)
        );
      }
      var rawCookies = fs.readFileSync(
        process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json"
      );
      var bakedCookies = JSON.parse(rawCookies);

      var ssid;

      var jsontype = typeof bakedCookies[0] === "string";

      //check if json is object or array

      if (jsontype == true) {
        for (var i = 0; i < bakedCookies.length; i++) {
          if (bakedCookies[i].includes("ssid=")) {
            ssid = bakedCookies[i];
          }
        }
      } else {
        for (var i = 0; i < bakedCookies.length; i++) {
          if (bakedCookies[i].name == "ssid") {
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

      const agent = new Agent({
        ciphers: ciphers.join(":"),
        honorCipherOrder: true,
        minVersion: "TLSv1.2",
      });

      console.log(ssid)

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

      if (access_tokens.data.response == undefined) {
        event.sender.send("reauthFail");
      } else {
        fs.writeFileSync(
          process.env.APPDATA +
            "/VALTracker/user_data/riot_games_data/cookies.json",
          JSON.stringify(access_tokens.headers["set-cookie"])
        );
        event.sender.send(
          "reauthSuccess",
          access_tokens.data.response.parameters.uri
        );
        newTokenData = getTokenDataFromURL(access_tokens.data.response.parameters.uri);
        return newTokenData;
      }
    } catch (err) {
      console.log(err)
      event.sender.send("reauthFail");
    }
  }
  await reauthCycle();
  if (cycleRunning == false) {
    setInterval(reauthCycle, (newTokenData.expiresIn - 300) * 1000);
    console.log("CYCLE STARTED");
    cycleRunning = true;
  }
});

const https = require("https");
const WebSocket = require("ws");

const localAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function asyncTimeout(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

async function getLockfileData() {
  const lockfilePath = path.join(
    process.env["LOCALAPPDATA"],
    "Riot Games\\Riot Client\\Config\\lockfile"
  );
  const contents = await fs.promises.readFile(lockfilePath, "utf8");
  let d = {};
  [d.name, d.pid, d.port, d.password, d.protocol] = contents.split(":");
  return d;
}

async function getSession(port, password) {
  return (
    await axios.get(`https://127.0.0.1:${port}/chat/v1/session`, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(`riot:${password}`).toString("base64"),
      },
      httpsAgent: localAgent,
    })
  ).data;
}

async function getHelp(port, password) {
  return (
    await axios.get(`https://127.0.0.1:${port}/help`, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(`riot:${password}`).toString("base64"),
      },
      httpsAgent: localAgent,
    })
  ).data;
}

async function waitForLockfile() {
  return new Promise(async (resolve, reject) => {
    const watcher = fs.watch(
      path.join(
        process.env["LOCALAPPDATA"],
        "Riot Games\\Riot Client\\Config\\"
      ),
      (eventType, fileName) => {
        if (eventType === "rename" && fileName === "lockfile") {
          watcher.close();
          resolve();
        }
      }
    );
  });
}
      
async function reauthCycle() {
  if (
    !fs.existsSync(
      process.env.APPDATA +
        "/VALTracker/user_data/riot_games_data/cookies.json"
    )
  ) {
    const newCookiesFile = {};
    fs.writeFileSync(
      process.env.APPDATA +
        "/VALTracker/user_data/riot_games_data/cookies.json",
      JSON.stringify(newCookiesFile)
    );
  }
  var rawCookies = fs.readFileSync(
    process.env.APPDATA + "/VALTracker/user_data/riot_games_data/cookies.json"
  );
  var bakedCookies = JSON.parse(rawCookies);

  var ssid;

  var jsontype = typeof bakedCookies[0] === "string";

  //check if json is object or array

  if (jsontype == true) {
    for (var i = 0; i < bakedCookies.length; i++) {
      if (bakedCookies[i].includes("ssid=")) {
        ssid = bakedCookies[i];
      }
    }
  } else {
    for (var i = 0; i < bakedCookies.length; i++) {
      if (bakedCookies[i].name == "ssid") {
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

  const agent = new Agent({
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

  fs.writeFileSync(
    process.env.APPDATA +
      "/VALTracker/user_data/riot_games_data/cookies.json",
    JSON.stringify(access_tokens.headers["set-cookie"])
  );

  console.log(access_tokens)

  var tokensFromUrl = access_tokens.data.response.parameters.uri

  newTokenData = getTokenDataFromURL(tokensFromUrl);
  fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(newTokenData))
  return newTokenData;
}

if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json')) {
  var load_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json')
  var load_data = JSON.parse(load_data_raw)
  
  if(load_data.hasValorantRPenabled == "true" || load_data.hasValorantRPenabled == undefined) {
    setTimeout(async function() {
      (async () => {
        let lockData = null;
        do {
          try {
            lockData = await getLockfileData();
          } catch (e) {
            console.log("Waiting for lockfile...");
            await waitForLockfile();
          }
        } while (lockData === null);
      
        console.log("Got lock data...");
      
        let sessionData = null;
        let lastRetryMessage = 0;
        do {
          try {
            sessionData = await getSession(lockData.port, lockData.password);
            if (sessionData.loaded === false) {
              await asyncTimeout(1500);
              sessionData = null;
            }
          } catch (e) {
            console.log(e)
            const currentTime = new Date().getTime();
            if (currentTime - lastRetryMessage > 1000) {
              console.log("Unable to get session data, retrying...");
              lastRetryMessage = currentTime;
            }
          }
        } while (sessionData === null);
      
        let helpData = null;
        do {
          helpData = await getHelp(lockData.port, lockData.password);
          if (!helpData.events.hasOwnProperty("OnJsonApiEvent_chat_v4_presences")) {
            console.log("Retrying help data events...");
            helpData = null;
            await asyncTimeout(1500);
          }
        } while (helpData === null);
      
        console.log("Got PUUID...");
      
        const ws = new WebSocket(
          `wss://riot:${lockData.password}@localhost:${lockData.port}`,
          {
            rejectUnauthorized: false,
          }
        );
        
        const { Agent } = require('https');
      
        const ciphers = [
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256',
          'TLS_AES_256_GCM_SHA384',
          'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256'
        ];
      
        const agent = new Agent({ ciphers: ciphers.join(':'), honorCipherOrder: true, minVersion: 'TLSv1.2' });
        
        var presencePID = null;
      
        var rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
        var tokenData = JSON.parse(rawTokenData)
      
        var rawUserData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
        var userData = JSON.parse(rawUserData)
      
        var user_region = userData.playerRegion
        var user_puuid = userData.playerUUID
      
        // Assign Global VARs
        var map = null;
        var mapText = null;
        var matchType = null;
        var matchTypeText = null;
        
        var agentName = null;
        var agentText = null;
      
        var preGameStatus = null;
        var activeGameStatus = null;
      
        var entitlement_token = null;
      
        var discordRPObj = null;
      
        var matchHadPreGame = false;
      
        var isPractice = false;
    
        var gameTimeout = false;

        var globalPartyState = String;

        var globalRPCstart = null;
      
        ws.on("open", async () => {
          await find('name', 'VALORANT-Win64-Shipping.exe', true)
            .then(function (list) {
              if(list.length > 0) {
                console.log('VALORANT IS RUNNING');
                presencePID = list[0].pid
              }
          });
    
          Object.entries(helpData.events).forEach(([name, desc]) => {
            if (name === "OnJsonApiEvent") return;
            ws.send(JSON.stringify([5, name]));
          });
      
          console.log("Connected to websocket!");  
          console.log("Checking for Match..."); 
    
          var tokens = await reauthCycle();
    
          entitlement_token = await axios.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, { headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          }}).catch(error => {console.log(error);})
    
          entitlement_token = entitlement_token.data.entitlements_token;
      
          rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
          tokenData = JSON.parse(rawTokenData)
    
          var isInPreGame = false;
      
          await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/pregame/v1/players/${user_puuid}`, {
            headers: {
              'X-Riot-Entitlements-JWT': entitlement_token,
              Authorization: 'Bearer ' + tokenData.accessToken
            },
            httpAgent: agent
          }).then(async (response) => {
            RPState = "GAME"
            isInPreGame = true;
            console.log('USER IN PRE-GAME.')
            var matchID = response.data.MatchID
    
            var gameStatus = await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/pregame/v1/matches/${matchID}`, {
              headers: {
                'X-Riot-Entitlements-JWT': entitlement_token,
                Authorization: 'Bearer ' + tokenData.accessToken
              },
              httpAgent: agent
            }).catch(error => {console.log(error);})
    
            // Map
            map = gameStatus.data.MapID;
    
            var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
    
            for(var i = 0; i < allMaps.data.length; i++) {
              if(map == allMaps.data[i].mapUrl) {
                mapText = allMaps.data[i].displayName;
                map = allMaps.data[i].displayName.toLowerCase();
              }
            }
    
            // Mode
            matchType = gameStatus.data.Mode;
    
            // Make a switch statement to get the correct mode
            switch(matchType) {
              case '/Game/GameModes/Bomb/BombGameMode.BombGameMode_C':
                if(gameStatus.data.isRanked == true) {
                  matchType = 'competitive';
                  matchTypeText = 'Competitive';
                } else {
                  matchType = 'unrated';
    
                  if(gameStatus.data.ProvisioningFlowID == 'CustomGame' || gameStatus.data.ProvisioningFlow == 'CustomGame') {
                    matchTypeText = 'Unrated (Custom)';
                  } else {
                    matchTypeText = 'Unrated';
                  }
                }
                break;
    
              case '/Game/GameModes/QuickBomb/QuickBombGameMode.QuickBombGameMode_C':
                matchType = 'spike_rush';
                  
                if(gameStatus.data.ProvisioningFlowID == 'CustomGame' || gameStatus.data.ProvisioningFlow == 'CustomGame') {
                  matchTypeText = 'Spike Rush (Custom)';
                } else {
                  matchTypeText = 'Spike Rush';
                }
                break;
    
              case '/Game/GameModes/OneForAll/OneForAll_GameMode.OneForAll_GameMode_C':
                matchType = 'replication';
                  
                if(gameStatus.data.ProvisioningFlowID == 'CustomGame' || gameStatus.data.ProvisioningFlow == 'CustomGame') {
                  matchTypeText = 'Replication (Custom)';
                } else {
                  matchTypeText = 'Replication';
                }
                break;
              case '/Game/GameModes/Deathmatch/DeathmatchGameMode.DeathmatchGameMode_C':
                // Map 
                map = gameStatus.data.MapID;
      
                var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
      
                for(var i = 0; i < allMaps.data.length; i++) {
                  if(map == allMaps.data[i].mapUrl) {
                    mapText = allMaps.data[i].displayName;
                    map = allMaps.data[i].displayName.toLowerCase();
                  }
                }
      
                matchType = 'ffa'
    
                // Mode
                if(gameStatus.data.ProvisioningFlow == 'CustomGame') {
                  matchTypeText = 'Deathmatch (Custom)';
                } else {
                  matchTypeText = 'Deathmatch';
                }
                break;
              case '/Game/GameModes/GunGame/GunGameTeamsGameMode.GunGameTeamsGameMode_C': 
                // Map 
                map = gameStatus.data.MapID;
      
                var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
      
                for(var i = 0; i < allMaps.data.length; i++) {
                  if(map == allMaps.data[i].mapUrl) {
                    mapText = allMaps.data[i].displayName;
                    map = allMaps.data[i].displayName.toLowerCase();
                  }
                }
      
                matchType = 'escalation'
    
                // Mode
                if(gameStatus.data.ProvisioningFlow == 'CustomGame') {
                  matchTypeText = 'Escalation (Custom)';
                } else {
                  matchTypeText = 'Escalation';
                }
                break;
              case '/Game/GameModes/ShootingRange/ShootingRangeGameMode.ShootingRangeGameMode_C':
                isPractice = true;
                break;
            }

            if(globalRPCstart == null) {
              globalRPCstart = Date.now()
            }
    
            discordRPObj = {
              details: matchTypeText + ' - Agent Select',
              assets: {
                large_image: map, // Map
                large_text: mapText, // Playing a VALORANT Match
                small_image: matchType, // Mode
                small_text: matchTypeText, // Mode
              },
              buttons: [
                {
                  "label": "Download VALTracker",
                  "url": "https://valtracker.gg"
                },
              ],
              timestamps: {
                start: globalRPCstart
              },
              instance: true
            }
  
            discordClient.clearActivity(process.pid)
            discordVALPresence.request("SET_ACTIVITY", {
              pid: parseInt(presencePID),
              activity: discordRPObj,
            });
          }).catch(error => {
            isInPreGame = false;
            console.log('USER NOT IN PRE-GAME.')
          })
      
          if(isInPreGame == false) {
            await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/core-game/v1/players/${user_puuid}`, {
              headers: {
                'X-Riot-Entitlements-JWT': entitlement_token,
                Authorization: 'Bearer ' + tokenData.accessToken
              },
              httpAgent: agent
            }).then(async (response) => {
              RPState = "GAME"
              console.log('USER IN MATCH.')
              var matchID = response.data.MatchID
      
              var gameStatus = await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/core-game/v1/matches/${matchID}`, {
                headers: {
                  'X-Riot-Entitlements-JWT': entitlement_token,
                  Authorization: 'Bearer ' + tokenData.accessToken
                },
                httpAgent: agent
              }).catch(error => {console.log(error);})

              for(var i = 0; i < gameStatus.data.Players.length; i++) {
                if(gameStatus.data.Players[i].Subject == user_puuid) {
                  var playerAgent = await axios.get(`https://valorant-api.com/v1/agents/${gameStatus.data.Players[i].CharacterID}`)
                  agentText = playerAgent.data.data.displayName
                  agentName = agentText.toLowerCase()
                }
              }
      
              // Map 
              map = gameStatus.data.MapID;
      
              var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
      
              for(var i = 0; i < allMaps.data.length; i++) {
                if(map == allMaps.data[i].mapUrl) {
                  mapText = allMaps.data[i].displayName;
                  map = allMaps.data[i].displayName.toLowerCase();
                }
              }
      
              // Mode
              matchType = gameStatus.data.ModeID;
      
              // Make a switch statement to get the correct mode
              switch(matchType) {
                case '/Game/GameModes/Bomb/BombGameMode.BombGameMode_C':
                  if(gameStatus.data.isRanked == true) {
                    matchType = 'competitive';
                    matchTypeText = 'Competitive';
                  } else {
                    matchType = 'unrated';
      
                    if(gameStatus.data.ProvisioningFlowID == 'CustomGame' || gameStatus.data.ProvisioningFlow == 'CustomGame') {
                      matchTypeText = 'Unrated (Custom)';
                    } else {
                      matchTypeText = 'Unrated';
                    }
                  }
                  break;
      
                case '/Game/GameModes/QuickBomb/QuickBombGameMode.QuickBombGameMode_C':
                  matchType = 'spike_rush';
                    
                  if(gameStatus.data.ProvisioningFlowID == 'CustomGame' || gameStatus.data.ProvisioningFlow == 'CustomGame') {
                    matchTypeText = 'Spike Rush (Custom)';
                  } else {
                    matchTypeText = 'Spike Rush';
                  }
                  break;
      
                case '/Game/GameModes/OneForAll/OneForAll_GameMode.OneForAll_GameMode_C':
                  matchType = 'replication';
                    
                  if(gameStatus.data.ProvisioningFlowID == 'CustomGame' || gameStatus.data.ProvisioningFlow == 'CustomGame') {
                    matchTypeText = 'Replication (Custom)';
                  } else {
                    matchTypeText = 'Replication';
                  }
                  break;
                case '/Game/GameModes/Deathmatch/DeathmatchGameMode.DeathmatchGameMode_C':
                  // Map 
                  map = gameStatus.data.MapID;
        
                  var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
        
                  for(var i = 0; i < allMaps.data.length; i++) {
                    if(map == allMaps.data[i].mapUrl) {
                      mapText = allMaps.data[i].displayName;
                      map = allMaps.data[i].displayName.toLowerCase();
                    }
                  }
        
                  matchType = 'ffa'
      
                  // Mode
                  if(gameStatus.data.ProvisioningFlow == 'CustomGame') {
                    matchTypeText = 'Deathmatch (Custom)';
                  } else {
                    matchTypeText = 'Deathmatch';
                  }
                  break;
                case '/Game/GameModes/GunGame/GunGameTeamsGameMode.GunGameTeamsGameMode_C': 
                  // Map 
                  map = gameStatus.data.MapID;
        
                  var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
        
                  for(var i = 0; i < allMaps.data.length; i++) {
                    if(map == allMaps.data[i].mapUrl) {
                      mapText = allMaps.data[i].displayName;
                      map = allMaps.data[i].displayName.toLowerCase();
                    }
                  }
        
                  matchType = 'escalation'
    
                  // Mode
                  if(gameStatus.data.ProvisioningFlow == 'CustomGame') {
                    matchTypeText = 'Escalation (Custom)';
                  } else {
                    matchTypeText = 'Escalation';
                  }
                  break;
                case '/Game/GameModes/ShootingRange/ShootingRangeGameMode.ShootingRangeGameMode_C':
                  isPractice = true;
                  break;
              }
              
              var options = {
                method: 'GET',
                url: 'https://127.0.0.1:'+ lockData.port + '/chat/v4/presences',
                headers: {Authorization: 'Basic ' + lockData.password},
                httpsAgent: localAgent,
              };
              
              var matchStanding = await axios.request(options).catch(function (error) { console.error(error); });

              var presences = matchStanding.data.presences;

              for(var i = 0; i < presences.length; i++) {
                if(presences[i].puuid == user_puuid) {
                  var buff = Buffer.from(presences[i].private.toString(), 'base64');
                  var data = JSON.parse(buff.toString('utf-8'))

                  globalPartyState = data["sessionLoopState"]
                  console.log(data["sessionLoopState"])
                  var setState = data["partyOwnerMatchScoreAllyTeam"] + " - " + data["partyOwnerMatchScoreEnemyTeam"]
                }
              }

              if(globalRPCstart == null) {
                globalRPCstart = Date.now()
              }
      
              if(isPractice == false) {
                discordRPObj = {
                  details: matchTypeText + ' - In Match',
                  state: setState,
                  assets: {
                    large_image: map, // Map
                    large_text: mapText, // Playing a VALORANT Match
                    small_image: agentName, // Mode
                    small_text: agentText, // Mode
                  },
                  buttons: [
                    {
                      "label": "Download VALTracker",
                      "url": "https://valtracker.gg"
                    },
                  ],
                  timestamps: {
                    start: globalRPCstart
                  },
                  instance: true
                }
              } else {
                discordRPObj = {
                  details: 'In the Range',
                  assets: {
                    large_image: 'practice',
                    large_text: 'The Range',
                  },
                  buttons: [
                    {
                      "label": "Download VALTracker",
                      "url": "https://valtracker.gg"
                    },
                  ],
                  timestamps: {
                    start: globalRPCstart
                  },
                  instance: true
                }
                isPractice = false;
              }
              
              discordClient.clearActivity(process.pid)
              discordVALPresence.request("SET_ACTIVITY", {
                pid: parseInt(presencePID),
                activity: discordRPObj,
              });
            })
            .catch(error => {
              console.log('USER NOT IN MATCH.')
            })
          }
        });
      
        ws.on("message", async (data) => {
          // Get new entitlement token for every match in case it refreshed
          if(entitlement_token == null) {
            entitlement_token = true;
            var tokens = await reauthCycle();
      
            entitlement_token = await axios.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, { headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            }}).catch(error => {console.log(error);})
      
            entitlement_token = entitlement_token.data.entitlements_token;
      
            rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
            tokenData = JSON.parse(rawTokenData)
          }
      
          var stringData = data.toString();
      
          // Check if buffer was empty
          if(stringData != "") {
            var matchData = JSON.parse(stringData);
      
            // Pregame Event
            if(matchData[1] == 'OnJsonApiEvent_riot-messaging-service_v1_message' && matchData[2].uri.split('/').slice(0, -1).join('/') == '/riot-messaging-service/v1/message/ares-pregame/pregame/v1/matches') {
              RPState = "GAME"
              // Match ID
              var matchID = matchData[2].data.resource.split("/").pop();
      
              // Get Token Data from File
              var rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
              tokenData = JSON.parse(rawTokenData)
      
              // Use Tokens to fetch current game
              if(preGameStatus == null) {
                preGameStatus = true;
      
                var gameStatus = await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/pregame/v1/matches/${matchID}`, {
                  headers: {
                    'X-Riot-Entitlements-JWT': entitlement_token,
                    Authorization: 'Bearer ' + tokenData.accessToken
                  },
                  httpAgent: agent
                }).catch(error => {console.log(error);})
      
                gameStatus = gameStatus.data
      
                // Map 
                map = gameStatus.MapID;
      
                var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
      
                for(var i = 0; i < allMaps.data.length; i++) {
                  if(map == allMaps.data[i].mapUrl) {
                    mapText = allMaps.data[i].displayName;
                    map = allMaps.data[i].displayName.toLowerCase();
                  }
                }
      
                // Mode
                matchType = gameStatus.Mode;
      
                // Make a switch statement to get the correct mode
                switch(matchType) {
                  case '/Game/GameModes/Bomb/BombGameMode.BombGameMode_C':
                    if(gameStatus.isRanked == true) {
                      matchType = 'competitive';
                      matchTypeText = 'Competitive';
                    } else {
                      matchType = 'unrated';
      
                      if(gameStatus.ProvisioningFlowID == 'CustomGame') {
                        matchTypeText = 'Unrated (Custom)';
                      } else {
                        matchTypeText = 'Unrated';
                      }
                    }
                    break;
      
                  case '/Game/GameModes/QuickBomb/QuickBombGameMode.QuickBombGameMode_C':
                    matchType = 'spike_rush';
                      
                    if(gameStatus.ProvisioningFlowID == 'CustomGame') {
                      matchTypeText = 'Spike Rush (Custom)';
                    } else {
                      matchTypeText = 'Spike Rush';
                    }
                    break;
      
                  case '/Game/GameModes/OneForAll/OneForAll_GameMode.OneForAll_GameMode_C':
                    matchType = 'replication';
                      
                    if(gameStatus.ProvisioningFlowID == 'CustomGame') {
                      matchTypeText = 'Replication (Custom)';
                    } else {
                      matchTypeText = 'Replication';
                    }
                    break;
                }

                if(globalRPCstart == null) {
                  globalRPCstart = Date.now()
                }
      
                discordRPObj = {
                  details: matchTypeText + ' - Agent Select',
                  assets: {
                    large_image: map, // Map
                    large_text: mapText, // Playing a VALORANT Match
                    small_image: matchType, // Mode
                    small_text: matchTypeText, // Mode
                  },
                  buttons: [
                    {
                      "label": "Download VALTracker",
                      "url": "https://valtracker.gg"
                    },
                  ],
                  timestamps: {
                    start: globalRPCstart
                  },
                  instance: true
                }
                
                discordClient.clearActivity(process.pid)
                discordVALPresence.request("SET_ACTIVITY", {
                  pid: parseInt(presencePID),
                  activity: discordRPObj,
                });
                matchHadPreGame = true;
              }
            }
      
            // Get Match ID (Emitted when match is starting, so switch RP)
            if(matchData[1] == 'OnJsonApiEvent_riot-messaging-service_v1_message' && matchData[2].uri.split('/').slice(0, -1).join('/') == '/riot-messaging-service/v1/message/ares-core-game/core-game/v1/matches') {
              RPState = "GAME"
              if(gameTimeout == false) {
                var matchID = matchData[2].data.resource.split("/").pop()
  
                var gameStatus = await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/core-game/v1/matches/${matchID}`, {
                  headers: {
                    'X-Riot-Entitlements-JWT': entitlement_token,
                    Authorization: 'Bearer ' + tokenData.accessToken
                  },
                  httpAgent: agent
                }).catch(error => {console.log(error);})

                for(var i = 0; i < gameStatus.data.Players.length; i++) {
                  if(gameStatus.data.Players[i].Subject == user_puuid) {
                    var playerAgent = await axios.get(`https://valorant-api.com/v1/agents/${gameStatus.data.Players[i].CharacterID}`)
                    agentText = playerAgent.data.data.displayName
                    agentName = agentText.toLowerCase()
                  }
                }
        
                if(activeGameStatus == null && gameStatus.data.State == "IN_PROGRESS") {
                  if(matchHadPreGame == false) { // Deachmatch / Escalation Match
        
                    gameStatus = gameStatus.data
        
                    if(gameStatus.ModeID == '/Game/GameModes/Deathmatch/DeathmatchGameMode.DeathmatchGameMode_C') { // FFA
                      // Map 
                      map = gameStatus.MapID;
            
                      var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
            
                      for(var i = 0; i < allMaps.data.length; i++) {
                        if(map == allMaps.data[i].mapUrl) {
                          mapText = allMaps.data[i].displayName;
                          map = allMaps.data[i].displayName.toLowerCase();
                        }
                      }
            
                      matchType = 'ffa'
        
                      // Mode
                      if(gameStatus.ProvisioningFlowID == 'CustomGame') {
                        matchTypeText = 'Deathmatch (Custom)';
                      } else {
                        matchTypeText = 'Deathmatch';
                      }
                    } else if(gameStatus.ModeID == '/Game/GameModes/GunGame/GunGameTeamsGameMode.GunGameTeamsGameMode_C') {
                      // Map 
                      map = gameStatus.MapID;
            
                      var allMaps = await(await axios.get('https://valorant-api.com/v1/maps').catch(error => {console.log(error);})).data;
            
                      for(var i = 0; i < allMaps.data.length; i++) {
                        if(map == allMaps.data[i].mapUrl) {
                          mapText = allMaps.data[i].displayName;
                          map = allMaps.data[i].displayName.toLowerCase();
                        }
                      }
            
                      matchType = 'escalation'
        
                      // Mode
                      if(gameStatus.ProvisioningFlowID == 'CustomGame') {
                        matchTypeText = 'Escalation (Custom)';
                      } else {
                        matchTypeText = 'Escalation';
                      }
                    } else if(gameStatus.ModeID == '/Game/GameModes/ShootingRange/ShootingRangeGameMode.ShootingRangeGameMode_C') {
                      isPractice = true;
                    }
                  } 

                  if(globalRPCstart == null) {
                    globalRPCstart = Date.now()
                  }
        
                  if(isPractice == false) {
                    discordRPObj = {
                      details: matchTypeText + ' - In Match',
                      state: '0 - 0',
                      assets: {
                        large_image: map, // Map
                        large_text: mapText, // Playing a VALORANT Match
                        small_image: agentName, // Mode
                        small_text: agentText, // Mode
                      },
                      buttons: [
                        {
                          "label": "Download VALTracker",
                          "url": "https://valtracker.gg"
                        },
                      ],
                      timestamps: {
                        start: globalRPCstart,
                      },
                      instance: true
                    }
                  } else {
                    discordRPObj = {
                      details: 'In the Range',
                      assets: {
                        large_image: 'practice', // Map
                        large_text: 'The Range', // Playing a VALORANT Match
                      },
                      buttons: [
                        {
                          "label": "Download VALTracker",
                          "url": "https://valtracker.gg"
                        },
                      ],
                      timestamps: {
                        start: globalRPCstart,
                      },
                      instance: true
                    }
                    isPractice = true;
                  }
                  
                  discordClient.clearActivity(process.pid)
                  discordVALPresence.request("SET_ACTIVITY", {
                    pid: parseInt(presencePID),
                    activity: discordRPObj,
                  });
                  activeGameStatus = true;
                }
              }
            }
            
            if(matchData[1] == 'OnJsonApiEvent_chat_v5_participants' && matchData[2].eventType == 'Delete') {
              RPState = "APP"
              if(activeGameStatus == true && matchData[2].uri != '/chat/v5/participants' && matchData[2].uri != '/chat/v5/participants/ares-pregame') {
                console.log("Game ended.")
                // End Rich presence and clear variables
                map = null;
                mapText = null;
                agentName = null;
                agentText = null;
                matchType = null;
                matchTypeText = null;
              
                preGameStatus = null;
                activeGameStatus = null;
              
                entitlement_token = null;
              
                discordRPObj = null;
              
                pregameCalcFinished = false;
              
                matchHadPreGame = false;

                globalPartyState = "null";
  
                if(isPractice == true) {
                  isPractice = false;
                }
                
                gameTimeout = true;
                async function timeout() {
                  setTimeout(function() {
                    gameTimeout = false;
                  }, 7500)
                }
                timeout();
            
                mainWindow.webContents.send('restartDiscordRP')
        
                discordVALPresence.clearActivity(presencePID)
              }
              
              if(activeGameStatus == null && matchData[2].uri == '/chat/v5/participants/ares-pregame') {
                console.log("May have quit!")
                setTimeout(function() {
                  if(globalPartyState != "INGAME") {
                    console.log("User quit!")
                    mainWindow.webContents.send('restartDiscordRP')
            
                    discordVALPresence.clearActivity(presencePID)
                  }
                }, 2500)
              }
            }

            if(matchData[1] == 'OnJsonApiEvent_chat_v4_presences' && matchData[2]) {
              for(var i = 0; i < matchData[2].data.presences.length; i++) {
                if(matchData[2].data.presences[i].puuid == user_puuid) {
                  var buff = Buffer.from(matchData[2].data.presences[i].private.toString(), 'base64');
                  var data = JSON.parse(buff.toString('utf-8'))

                  globalPartyState = data["sessionLoopState"]
                  console.log(data["sessionLoopState"])
                  if(data["sessionLoopState"] == "INGAME") {
                    console.log("TEAM_1: " + data["partyOwnerMatchScoreAllyTeam"] + "\n" + "TEAM_2: " + data["partyOwnerMatchScoreEnemyTeam"]);
                    // data.partyOwnerMatchScoreAllyTeam is the score of your own team, data.partyOwnerMatchScoreEnemyTeam is the enemy team
                    // UPDATE SCORE PRESENCE HERE, EVERY TIME.
                    discordRPObj = {
                      details: matchTypeText + ' - In Match',
                      state: data["partyOwnerMatchScoreAllyTeam"] + " - " + data["partyOwnerMatchScoreEnemyTeam"],
                      assets: {
                        large_image: map, // Map
                        large_text: mapText, // Playing a VALORANT Match
                        small_image: agentName, // Mode
                        small_text: agentText, // Mode
                      },
                      buttons: [
                        {
                          "label": "Download VALTracker",
                          "url": "https://valtracker.gg"
                        },
                      ],
                      timestamps: {
                        start: globalRPCstart,
                      },
                      instance: true
                    }
                    discordVALPresence.request("SET_ACTIVITY", {
                      pid: parseInt(presencePID),
                      activity: discordRPObj,
                    });
                  }
                }
              }
            }
          }
        });
      
        ws.on("close", () => {
          RPState = "APP"
          map = null;
          mapText = null;
          agentName = null;
          agentText = null;
          matchType = null;
          matchTypeText = null;
        
          preGameStatus = null;
          activeGameStatus = null;
        
          entitlement_token = null;
        
          discordRPObj = null;
        
          pregameCalcFinished = false;
        
          matchHadPreGame = false;

          globalPartyState = "null";

          isPractice = false;

          globalRPCstart = null;
    
          mainWindow.webContents.send('restartDiscordRP')
          discordVALPresence.clearActivity(presencePID)
          console.log("Websocket closed!");
        });
      })();
    
    }, 5000)
  }
}
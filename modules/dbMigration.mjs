import fs from 'fs';
import Surreal from 'surrealdb.js';
import { v5 as uuidv5 } from 'uuid';
import { requestInstanceToken } from './requestInstanceToken.mjs';

const SurrealDB = Surreal.default

const basePath = process.env.APPDATA + '/VALTracker/user_data/';
const db = new SurrealDB(process.env.DB_URL);

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

export async function migrateDataToDB(win) {
  const sendMessageToWindow = (channel, args) => {
    win.webContents.send(channel, args);
  }

  try {
    await db.signin({
      user: process.env.DB_USER,
      pass: process.env.DB_PASS
    });

    var favMatches = 0;
    var hubMatches = 0;

    var allSettings = {};
    
    allSettings.user_data = JSON.parse(fs.readFileSync(basePath + 'user_creds.json')); // Actual data of current user.
    
    allSettings.favMatchConfig = {};
    const favMatchesDir = fs.readdirSync(basePath + 'favourite_matches');

    favMatchesDir.forEach(folderUUID => {
      const matchesJson = JSON.parse(fs.readFileSync(basePath + 'favourite_matches/' + folderUUID + '/matches.json'));

      const downloadedMatchesDir =  fs.readdirSync(basePath + 'favourite_matches/' + folderUUID + '/matches');

      var downloadedMatchesData = [];

      downloadedMatchesDir.forEach(downloadedMatch => {
        var match = JSON.parse(fs.readFileSync(basePath + 'favourite_matches/' + folderUUID + '/matches/' + downloadedMatch));
        favMatches++;
        downloadedMatchesData.push(match);
      });

      allSettings.favMatchConfig[folderUUID] = {
        matchIDs: matchesJson.favourites,
        matches: downloadedMatchesData
      };
    });

    allSettings.hubConfig = {};
    const homeConfigDir = fs.readdirSync(basePath + 'home_settings');
    allSettings.hubConfig.preferredMatchFilter = (JSON.parse(fs.readFileSync(basePath + 'home_settings/settings.json'))).preferredMatchFilter;

    allSettings.hubConfig.currentMatches = {};
    allSettings.hubConfig.contractProgress = {};

    homeConfigDir.forEach(folder => {
      if(folder.split(".").pop() !== "json") {
        allSettings.hubConfig.contractProgress[folder] = JSON.parse(fs.readFileSync(basePath + 'home_settings/' + folder + '/current_contract_progress.json'));
        allSettings.hubConfig.currentMatches[folder] = JSON.parse(fs.readFileSync(basePath + 'home_settings/' + folder + '/current_matches.json'));
      }
    });

    allSettings.loadConfig = JSON.parse(fs.readFileSync(basePath + 'load_files/on_load.json'));

    allSettings.messagesConfig = {};
    allSettings.lastMessageDate = (JSON.parse(fs.readFileSync(basePath + 'message_data/last_checked_date.json'))).date;

    allSettings.inventoryConfig = {};
    allSettings.inventoryConfig.currentInv = JSON.parse(fs.readFileSync(basePath + 'player_inventory/current_inventory.json'));

    allSettings.inventoryConfig.presets = {};
    const presetsDir = fs.readdirSync(basePath + 'player_inventory/presets');
    presetsDir.forEach(folderUUID => {
      const allPresets = fs.readdirSync(basePath + 'player_inventory/presets/' + folderUUID);

      allPresets.forEach(presetFile => {
        const presetName = presetFile.split(".")[0].replace(" ", "-").toLowerCase();
        allSettings.inventoryConfig.presets[folderUUID] = {};
        allSettings.inventoryConfig.presets[folderUUID][presetName] = JSON.parse(fs.readFileSync(basePath + 'player_inventory/presets/' + folderUUID + '/' + presetFile));
      });
    });

    allSettings.riotData = {};
    allSettings.gamePresenceConfig = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/settings.json'));

    const riotDataDir = fs.readdirSync(basePath + 'riot_games_data');
    riotDataDir.forEach(folderUUID => {
      if(folderUUID.split(".").pop() !== "json") {
        allSettings.riotData[folderUUID] = {};
        allSettings.riotData[folderUUID].cookies = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/' + folderUUID + '/cookies.json'));
        allSettings.riotData[folderUUID].entitlement = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/' + folderUUID + '/entitlement.json'));
        allSettings.riotData[folderUUID].tokens = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/' + folderUUID + '/token_data.json'));
      }
    })

    allSettings.searchHistory = (JSON.parse(fs.readFileSync(basePath + 'search_history/history.json'))).arr;

    allSettings.playerStoreConfig = {};
    try {
      allSettings.playerStoreConfig.featuredBundle = JSON.parse(fs.readFileSync(basePath + 'shop_data/featured_bundle.json'));
    } catch(e) {}

    allSettings.playerStoreConfig.savedStores = {};

    const allPlayerStoreDataDirs = fs.readdirSync(basePath + 'shop_data');
    allPlayerStoreDataDirs.forEach(folderUUID => {
      if(folderUUID.split(".").pop() !== "json") {
        allSettings.playerStoreConfig.savedStores[folderUUID] = JSON.parse(fs.readFileSync(basePath + 'shop_data/' + folderUUID + '/daily_shop.json'));
      }
    });

    allSettings.themeConfig = {};
    allSettings.themeConfig.usedTheme = (JSON.parse(fs.readFileSync(basePath + 'themes/color_theme.json'))).themeName;

    allSettings.userAccounts = {};

    const allUserAccountFilesDir = fs.readdirSync(basePath + 'user_accounts');
    allUserAccountFilesDir.forEach(fileUUID => {
      const userUUID = fileUUID.split(".")[0];

      allSettings.userAccounts[userUUID] = JSON.parse(fs.readFileSync(basePath + 'user_accounts/' + fileUUID));
    });

    allSettings.wishlists = {};

    const allWishlistFilesDir = fs.readdirSync(basePath + 'wishlists');
    allWishlistFilesDir.forEach(fileUUID => {
      const userUUID = fileUUID.split(".")[0];

      allSettings.wishlists[userUUID] = JSON.parse(fs.readFileSync(basePath + 'wishlists/' + fileUUID));
    });

    const allPUUIDs = Object.keys(allSettings.userAccounts);

    for(var i = 0; i < allPUUIDs.length; i++) {
      for(var j = 0; j < Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games).length; j++) {
        var key_1 = Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games)[j]; // Name of the Day
        for(var k = 0; k < Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games[key_1]).length; k++) {
          hubMatches++;
        }
      }
    }

    var totalMatches = favMatches + hubMatches;
    var favMatchVal = Math.round((favMatches / totalMatches) * 90);
    var hubMatchVal = Math.round((hubMatches / totalMatches) * 90);

    var totalPercentage = 0;

    var avgSeconds = totalMatches * 17;

    function fmtMSS(s){return(s-(s%=60))/60+(9<s?'m, ':': 0')+s +'s'};

    sendMessageToWindow("estMigrationTime", fmtMSS(avgSeconds));

    totalPercentage += 2;
    sendMessageToWindow("migrateProgressUpdate", { "message": "Connecting to Database...", "num": totalPercentage });

    await db.use("app", "main");
    
    totalPercentage += 3;
    sendMessageToWindow("migrateProgressUpdate", { "message": "Fetching Favorite Matches...", "num": totalPercentage });

    var allFavMatches = [];
    for(var i = 0; i < allPUUIDs.length; i++) {
      for(var j = 0; j < allSettings.favMatchConfig[allPUUIDs[i]].matches.length; j++) {
        let result = await db.query(`SELECT 1 FROM match:⟨${allSettings.favMatchConfig[allPUUIDs[i]].matches[j].matchInfo.matchId}⟩`);
        if(!result[0].result[0]) {
          var allRoundResults = [];
          for(var k = 0; k < allSettings.favMatchConfig[allPUUIDs[i]].matches[j].roundResults.length; k++) {
            var round = {
              "bombPlanter": allSettings.favMatchConfig[allPUUIDs[i]].matches[j].roundResults[k].bombPlanter,
              "playerStats": allSettings.favMatchConfig[allPUUIDs[i]].matches[j].roundResults[k].playerStats,
              "roundResult": allSettings.favMatchConfig[allPUUIDs[i]].matches[j].roundResults[k].roundResult,
              "winningTeam": allSettings.favMatchConfig[allPUUIDs[i]].matches[j].roundResults[k].winningTeam
            }
            allRoundResults.push(round);
          }
  
          var match = {
            matchInfo: allSettings.favMatchConfig[allPUUIDs[i]].matches[j].matchInfo,
            players: allSettings.favMatchConfig[allPUUIDs[i]].matches[j].players,
            roundResults: allRoundResults,
            stats_data: allSettings.favMatchConfig[allPUUIDs[i]].matches[j].stats_data,
            teams: allSettings.favMatchConfig[allPUUIDs[i]].matches[j].teams
          }
  
          await db.create(`match:⟨${allSettings.favMatchConfig[allPUUIDs[i]].matches[j].matchInfo.matchId}⟩`, match);
        }
    
        totalPercentage += (favMatchVal / favMatches);
        sendMessageToWindow("migrateProgressUpdate", { "message": "Fetching Favorite Matches...", "num": totalPercentage });
        allFavMatches.push(allSettings.favMatchConfig[allPUUIDs[i]].matches[j].matchInfo.matchId);
      }
    }

    var favMatchConfigs = {};

    for(var i = 0; i < allPUUIDs.length; i++) {
      var matchIDResult = await db.query(`SELECT 1 FROM matchIDCollection:⟨favMatches::${allPUUIDs[i]}⟩`);
      if(!matchIDResult[0].result[0]) {
        var matchIDResult = await db.create(`matchIDCollection:⟨favMatches::${allPUUIDs[i]}⟩`, {
          "matchIDs": allFavMatches
        });
      }

      var result = await db.query(`SELECT 1 FROM favMatchConfig:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        favMatchConfigs[allPUUIDs[i]] = (await db.create(`favMatchConfig:⟨${allPUUIDs[i]}⟩`, {
          matchIDCollection: matchIDResult.id ? matchIDResult.id : matchIDResult[0].result[0].id
        })).id;
      }
    }

    var allHubMatches = [];
    for(var i = 0; i < allPUUIDs.length; i++) {
      for(var j = 0; j < Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games).length; j++) {
        var key_1 = Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games)[j]; // Name of the Day
        for(var k = 0; k < Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games[key_1]).length; k++) {
          var key_2 = Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games[key_1])[k];
          var matchObj = allSettings.hubConfig.currentMatches[allPUUIDs[i]].items.games[key_1][key_2];

          var result = await db.query(`SELECT * FROM match:⟨${matchObj.matchInfo.matchId}⟩`);
          if(!result[0].result[0]) {
            var allRoundResults = [];
            for(var l = 0; l < matchObj.roundResults.length; l++) {
              var round = {
                "bombPlanter": matchObj.roundResults[l].bombPlanter,
                "playerStats": matchObj.roundResults[l].playerStats,
                "roundResult": matchObj.roundResults[l].roundResult,
                "winningTeam": matchObj.roundResults[l].winningTeam
              }
              allRoundResults.push(round);
            }
    
            var match = {
              matchInfo: matchObj.matchInfo,
              players: matchObj.players,
              roundResults: allRoundResults,
              stats_data: matchObj.stats_data,
              teams: matchObj.teams
            }
  
            await db.create(`match:⟨${match.matchInfo.matchId}⟩`, match);
          }
    
          totalPercentage += (hubMatchVal / hubMatches);
          sendMessageToWindow("migrateProgressUpdate", { "message": "Fetching Hub Matches...", "num": totalPercentage });
          allHubMatches.push(matchObj.matchInfo.matchId);
        }
      }
    }

    var hubConfigs = {};

    for(var i = 0; i < allPUUIDs.length; i++) {
      var matchIDResult = await db.query(`SELECT 1 FROM matchIDCollection:⟨hub::${allPUUIDs[i]}⟩`);
      if(!matchIDResult[0].result[0]) {
        var matchIDResult = await db.create(`matchIDCollection:⟨hub::${allPUUIDs[i]}⟩`, {
          "matchIDs": allHubMatches
        });
      }

      var result = await db.query(`SELECT 1 FROM hubConfig:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        hubConfigs[allPUUIDs[i]] = (await db.create(`hubConfig:⟨${allPUUIDs[i]}⟩`, {
          matchIDResult: matchIDResult.id ? matchIDResult.id : matchIDResult[0].result[0].id
        })).id;
      }
    }

    var allPlayerConfigs = {};

    for(var i = 0; i < allPUUIDs.length; i++) {
      var result = await db.query(`SELECT 1 FROM playerConfig:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        var result = await db.create(`playerConfig:⟨${allPUUIDs[i]}⟩`, {
          "favMatchConfig": favMatchConfigs[allPUUIDs[i]],
          "hubConfig": hubConfigs[allPUUIDs[i]]
        });
      }

      allPlayerConfigs[allPUUIDs[i]] = result.id;
    }

    var allPlayerDataIDs = [];
    for(var i = 0; i < allPUUIDs.length; i++) {
      var result = await db.query(`SELECT 1 FROM player:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        var result = await db.create(`player:⟨${allPUUIDs[i]}⟩`, {
          "name": allSettings.userAccounts[allPUUIDs[i]].playerName,
          "tag": allSettings.userAccounts[allPUUIDs[i]].playerTag,
          "region": allSettings.userAccounts[allPUUIDs[i]].playerRegion,
          "uuid": allSettings.userAccounts[allPUUIDs[i]].playerUUID,
          "rank": allSettings.userAccounts[allPUUIDs[i]].playerRank,
          "playerConfig": allPlayerConfigs[allPUUIDs[i]]
        });
      }

      allPlayerDataIDs.push(result.id);
    }

    var result = await db.query(`SELECT 1 FROM playerCollection:⟨app⟩`);
    if(!result[0].result[0]) {
      var result = await db.create(`playerCollection:⟨app⟩`, {
        "players": allPlayerDataIDs
      });
    }

    for(var i = 0; i < allPUUIDs.length; i++) {
      var result = await db.query(`SELECT 1 FROM rgConfig:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        await db.create(`rgConfig:⟨${allPUUIDs[i]}⟩`, {
          "accesstoken": allSettings.riotData[allPUUIDs[i]].tokens.accessToken,
          "idtoken": allSettings.riotData[allPUUIDs[i]].tokens.id_token,
          "ssid": "ssid=" + allSettings.riotData[allPUUIDs[i]].cookies.split("ssid=").pop().split(";")[0],
          "tdid": "tdid=" + allSettings.riotData[allPUUIDs[i]].cookies.split("tdid=").pop().split(";")[0],
          "entitlement": allSettings.riotData[allPUUIDs[i]].entitlement.entitlement_token
        });
      }
    }
    
    totalPercentage += 3;
    sendMessageToWindow("migrateProgressUpdate", { "message": "Migrating Riot Games Data...", "num": totalPercentage });

    try {
      var result = await db.query(`SELECT 1 FROM currentPlayer`);
      if(!result[0].result[0]) {
        await db.query(`RELATE playerCollection:⟨app⟩->currentPlayer->player:⟨${allSettings.user_data.playerUUID}⟩`);
      }
    } catch(e) {
      console.log(e);
    }

    var appSettings = [
      { "name": "hubMatchFilter", "value": allSettings.hubConfig.preferredMatchFilter, "settingsType": "hub" },
      { "name": "setupCompleted", "value": allSettings.loadConfig.hasFinishedSetupSequence, "settingsType": "main" },
      { "name": "useAppRP", "value": allSettings.loadConfig.hasDiscordRPenabled, "settingsType": "main" },
      { "name": "minOnClose", "value": allSettings.loadConfig.minimizeOnClose, "settingsType": "main" },
      { "name": "wishlistNotifs", "value": allSettings.loadConfig.skinWishlistNotifications, "settingsType": "main" },
      { "name": "hardwareAccel", "value": allSettings.loadConfig.enableHardwareAcceleration, "settingsType": "main" },
      { "name": "launchOnBoot", "value": allSettings.loadConfig.startOnBoot, "settingsType": "main" },
      { "name": "lauchHiddenOnBoot", "value": allSettings.loadConfig.startHidden, "settingsType": "main" },
      { "name": "hideAppPresenceWhenHidden", "value": allSettings.loadConfig.hideDiscordRPWhenHidden, "settingsType": "main" },
      { "name": "useGameRP", "value": allSettings.loadConfig.hasValorantRPenabled, "settingsType": "main" },
      { "name": "appLang", "value": allSettings.loadConfig.appLang, "settingsType": ["main", "app"] },
      { "name": "showGameRPMode", "value": allSettings.gamePresenceConfig.showMode, "settingsType": "main" },
      { "name": "showGameRPRank", "value": allSettings.gamePresenceConfig.showRank, "settingsType": "main" },
      { "name": "showGameRPTimer", "value": allSettings.gamePresenceConfig.showTimer, "settingsType": "main" },
      { "name": "showGameRPScore", "value": allSettings.gamePresenceConfig.showScore, "settingsType": "main" },
      { "name": "appColorTheme", "value": allSettings.themeConfig.usedTheme, "settingsType": ["main", "app"] }
    ];

    var allSettingItemIDs = [];
    
    for(var i = 0; i < appSettings.length; i++) {
      var uuid = uuidv5(appSettings[i].name, process.env.SETTINGS_UUID);

      var result = await db.query(`SELECT 1 FROM setting:⟨${uuid}⟩`);
      if(!result[0].result[0]) {
        var result = await db.create(`setting:⟨${uuid}⟩`, {
          "name": appSettings[i].name,
          "value": appSettings[i].value,
          "type": appSettings[i].settingsType
        });
      }
      allSettingItemIDs.push(result.id);
    }
    
    
    totalPercentage += 3;
    sendMessageToWindow("migrateProgressUpdate", { "message": "Migrating Settings...", "num": totalPercentage });

    var instancetoken = await requestInstanceToken(allSettings.user_data.playerName, allSettings.user_data.playerTag);

    var dirs = getDirectories(process.env.APPDATA + '/VALTracker/user_data');
    dirs.forEach(dir => {
      fs.rmSync(process.env.APPDATA + '/VALTracker/user_data/' + dir, { recursive: true, force: true });
    });
    fs.rmSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
    
    totalPercentage += 4;
    sendMessageToWindow("migrateProgressUpdate", { "message": "Finishing up...", "num": totalPercentage });

    var result = await db.query(`SELECT 1 FROM appConfig:⟨${process.env.APPCONFIG_UUID}⟩`);
    if(!result[0].result[0]) {
      await db.create(`appConfig:⟨${process.env.APPCONFIG_UUID}⟩`, {
        "settingsCollection": allSettingItemIDs,
      });
    } else {
      await db.update(`appConfig:⟨${process.env.APPCONFIG_UUID}⟩`, {
        "settingsCollection": allSettingItemIDs,
      });
    }

    for(var i = 0; i < allPUUIDs.length; i++) {
      var result = await db.query(`SELECT 1 FROM hubContractProgress:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        await db.create(`hubContractProgress:⟨${allPUUIDs[i]}⟩`, {
          "agentContractProgress": allSettings.hubConfig.contractProgress[allPUUIDs[i]].agentContractProgress,
          "battlePassProgress": allSettings.hubConfig.contractProgress[allPUUIDs[i]].battlePassProgress,
          "date": allSettings.hubConfig.contractProgress[allPUUIDs[i]].date
        });
      }
    }

    var result = await db.query(`SELECT 1 FROM featuredBundle:⟨${process.env.SERVICE_UUID}⟩`);
    if(!result[0].result[0]) {
      var result = await db.create(`featuredBundle:⟨${process.env.SERVICE_UUID}⟩`, allSettings.playerStoreConfig.featuredBundle.data);
    }

    var result = await db.query(`SELECT 1 FROM services:⟨${process.env.SERVICE_UUID}⟩`);
    if(!result[0].result[0]) {
      await db.create(`services:⟨${process.env.SERVICE_UUID}⟩`, {
        "lastMessageUnix": allSettings.lastMessageDate,
        "featuredBundle": bundle.id,
        "instancetoken": instancetoken.data
      });
    }

    for(var i = 0; i < allPUUIDs.length; i++) {
      var result = await db.query(`SELECT 1 FROM playerStore:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        await db.create(`playerStore:⟨${allPUUIDs[i]}⟩`, allSettings.playerStoreConfig.savedStores[allPUUIDs[i]]);
      }
    }

    var result = await db.query(`SELECT 1 FROM inventory:⟨current⟩`);
    if(!result[0].result[0]) {
      await db.create(`inventory:⟨current⟩`, allSettings.inventoryConfig.currentInv);
    }

    for(var i = 0; i < allPUUIDs.length; i++) {
      var allPlayerPresets = [];

      if(allSettings.inventoryConfig.presets[allPUUIDs[i]]) {
        for(var j = 0; j < Object.keys(allSettings.inventoryConfig.presets[allPUUIDs[i]]).length; j++) {
          var key = Object.keys(allSettings.inventoryConfig.presets[allPUUIDs[i]])[j];
          
          var result = await db.create(`preset`, allSettings.inventoryConfig.presets[allPUUIDs[i]][key]);
          allPlayerPresets.push(result.id);
        }
      }

      var result = await db.query(`SELECT 1 FROM presetCollection:⟨${allPUUIDs[i]}⟩`);
      if(!result[0].result[0]) {
        await db.create(`presetCollection:⟨${allPUUIDs[i]}⟩`, {
          "presets": allPlayerPresets
        });
      }
    }

    var allSearchHistoryResults = [];
    for(var i = 0; i < allSettings.searchHistory.length; i++) {
      var result = await db.query(`SELECT 1 FROM searchHistoryResult:⟨${allSettings.searchHistory[i].encoded_user}⟩`);
      if(!result[0].result[0]) {
        var result = await db.create(`searchHistoryResult:⟨${allSettings.searchHistory[i].encoded_user}⟩`, allSettings.searchHistory[i]);
        allSearchHistoryResults.push(result.id);
      }
    }
    
    var result = await db.query(`SELECT 1 FROM searchHistory:⟨app⟩`);
    if(!result[0].result[0]) {
      await db.create(`searchHistory:⟨app⟩`, {
        "items": allSearchHistoryResults
      });
    }

    for(var i = 0; i < allPUUIDs.length; i++) {
      if(allSettings.wishlists[allPUUIDs[i]]) {
        var result = await db.query(`SELECT 1 FROM wishlist:⟨${allPUUIDs[i]}⟩`);
        if(!result[0].result[0]) {
          await db.create(`wishlist:⟨${allPUUIDs[i]}⟩`, allSettings.wishlists[allPUUIDs[i]]);
        }
      }
    }

    return allSettings;
  } catch(e) {
    console.log(e);
  }
  
}
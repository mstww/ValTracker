import fs from 'fs';
import notifier from 'node-notifier';
import Surreal from 'surrealdb.js';
import { v5 as uuidv5 } from 'uuid';

const basePath = process.env.APPDATA + '/VALTracker/user_data/';
const db = new Surreal(process.env.DB_URL);

export async function migrateDataToDB() {
  await db.signin({
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  });

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

  // TODO: DELETE ICONS DIR AND RE-DOWNLOAD INTO /user_data DIR

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
      allSettings.inventoryConfig.presets[presetName] = JSON.parse(fs.readFileSync(basePath + 'player_inventory/presets/' + folderUUID + '/' + presetFile));
    });
  });

  allSettings.riotData = {};
  allSettings.gamePresenceConfig = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/settings.json'));

  const riotDataDir = fs.readdirSync(basePath + 'user_data/riot_games_data');
  riotDataDir.forEach(folderUUID => {
    if(folder.split(".").pop() !== "json") {
      allSettings.riotData[folderUUID] = {};
      allSettings.riotData[folderUUID].cookies = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/' + folderUUID + '/cookies.json'));
      allSettings.riotData[folderUUID].entitlement = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/' + folderUUID + '/entitlement.json'));
      allSettings.riotData[folderUUID].tokens = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/' + folderUUID + '/token_data.json'));
    }
  })

  allSettings.searchHistory = (JSON.parse(fs.readFileSync(basePath + 'search_history/history.json'))).arr;

  allSettings.playerStoreConfig = {};
  allSettings.playerStoreConfig.featuredBundle = JSON.parse(fs.readFileSync(basePath + 'shop_data/featured_bundle.json'));

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

  //fs.writeFileSync('C:/Users/reali/Desktop/allVALTrackerSettings.json', JSON.stringify(allSettings));

  await db.use("app", "test");

  const allPUUIDs = Object.keys(allSettings.userAccounts);

  var allFavMatches = [];
  for(var i = 0; i < allPUUIDs.length; i++) {
    for(var j = 0; j < allSettings.favMatchConfig[allPUUIDs[i]].matches.length; j++) {
      var result = await db.create(`match:⟨${allSettings.favMatchConfig[allPUUIDs[i]].matches[j].matchInfo.matchId}⟩`, allSettings.favMatchConfig[allPUUIDs[i]].matches[j]);
      allFavMatches.push(allSettings.favMatchConfig[allPUUIDs[i]].matches[j].matchInfo.matchId);
    }
  }

  var favMatchConfigs = {};

  for(var i = 0; i < allPUUIDs.length; i++) {
    favMatchConfigs[allPUUIDs[i]] = (await db.create(`favMatchConfig:⟨${allPUUIDs[i]}⟩`, {})).id;
    await db.create(`matchIDCollection:⟨favMatches::${allPUUIDs[i]}⟩`, {
      "matchIDs": allFavMatches
    });

    await db.query(`RELATE favMatchConfig:⟨${allPUUIDs[i]}⟩->cache:⟨favMatches::${allPUUIDs[i]}⟩->matchIDCollection:⟨favMatches::${allPUUIDs[i]}⟩`);
  }

  var allHubMatches = [];
  for(var i = 0; i < allPUUIDs.length; i++) {
    for(var j = 0; j < Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]]).length; j++) {
      var key_1 = Object.keys(allSettings.hubConfig.currentMatches[allPUUIDs[i]])[j];
      for(var k = 0; k < Object.keys(allSettings.hubConfig.currentMatches[key_1].items.games).length; k++) {
        var key_2 = Object.keys(allSettings.hubConfig.currentMatches[key_1].items.games)[k];
        var match = allSettings.hubConfig.currentMatches[key_1].items.games[key_2];
        await db.create(`match:⟨${match.matchInfo.matchId}⟩`, match);

        allHubMatches.push(match.matchInfo.matchId);
      }
    }
  }

  var hubConfigs = {};

  for(var i = 0; i < allPUUIDs.length; i++) {
    hubConfigs[allPUUIDs[i]] = (await db.create(`hubConfig:⟨${allPUUIDs[i]}⟩`, {})).id;
    await db.create(`matchIDCollection:⟨hub::${allPUUIDs[i]}⟩`, {
      "matchIDs": allHubMatches
    });

    await db.query(`RELATE hubConfig:⟨${allPUUIDs[i]}⟩->cache:⟨hub::${allPUUIDs[i]}⟩->matchIDCollection:⟨hub::${allPUUIDs[i]}⟩`);
  }

  var allPlayerConfigs = {};

  for(var i = 0; i < allPUUIDs.length; i++) {
    let result = await db.create(`playerConfig:⟨${allPUUIDs[i]}⟩`, {
      "favMatchConfig": favMatchConfigs[allPUUIDs[i]],
      "hubConfig": hubConfigs[allPUUIDs[i]]
    });
    allPlayerConfigs[allPUUIDs[i]] = result.id;
  }

  var allPlayerDataIDs = [];
  for(var i = 0; i < allPUUIDs.length; i++) {
    var result = await db.create(`player:⟨${allPUUIDs[i]}⟩`, {
      "name": allSettings.userAccounts[allPUUIDs[i]].playerName,
      "tag": allSettings.userAccounts[allPUUIDs[i]].playerTag,
      "region": allSettings.userAccounts[allPUUIDs[i]].playerRegion,
      "uuid": allSettings.userAccounts[allPUUIDs[i]].playerUUID,
      "rank": allSettings.userAccounts[allPUUIDs[i]].playerRank,
      "playerConfig": allPlayerConfigs[allPUUIDs[i]]
    });

    allPlayerDataIDs.push(result.id);
  }

  var result = await db.create(`playerCollection:⟨app⟩`, {
    "players": allPlayerDataIDs
  });

  for(var i = 0; i < allPUUIDs.length; i++) {
    await db.create(`rgConfig:⟨${allPUUIDs[i]}⟩`, {
      "accesstoken": allSettings.riotData[allPUUIDs[i]].tokens.accessToken,
      "idtoken": allSettings.riotData[allPUUIDs[i]].tokens.id_token,
      "ssid": "ssid=" + allSettings.riotData[allPUUIDs[i]].cookies.split("ssid=").pop().split(";")[0],
      "tdid": "tdid=" + allSettings.riotData[allPUUIDs[i]].cookies.split("tdid=").pop().split(";")[0],
      "entitlement": allSettings.riotData[allPUUIDs[i]].entitlement.entitlement_token
    });
  }

  await db.query(`RELATE playerCollection:⟨app⟩->cache:⟨currentPlayer⟩->player:⟨${allSettings.user_data.playerUUID}⟩`);

  return allSettings;
}
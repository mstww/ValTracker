import fs from 'fs';
import notifier from 'node-notifier';

const basePath = process.env.APPDATA + '/VALTracker/user_data/';

export async function migrateDataToDB() {
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

  allSettings.riotData.cookies = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/cookies.json'));
  allSettings.riotData.entitlement = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/entitlement.json'));
  allSettings.riotData.tokens = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/token_data.json'));

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

  notifier.notify({
    title: "Done",
    message: "Done Migrating Boss",
    icon: process.env.APPDATA + "/VALTracker/user_data/icons/VALTracker_Logo_default.png",
    wait: 3,
    appID: 'VALTracker'
  }, function (err, response, metadata) {
    if(response === undefined && err === null && JSON.stringify(metadata) === JSON.stringify({})) {
      mainWindow.show();
    }
  });

  fs.writeFileSync('C:/Users/reali/Desktop/allVALTrackerSettings.json', JSON.stringify(allSettings));
  return allSettings;
}
import fs from 'fs';

const basePath = process.env.APPDATA * '/VALTracker/user_data/';

var allSettings = {};

(async () => {
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
      allSettings.hubConfig.contractProgress[folder] = JSON.parse(fs.readdirSync(basePath + 'home_settings/' + folder + '/current_contract_progress.json'));
      allSettings.hubConfig.currentMatches[folder] = JSON.parse(fs.readdirSync(basePath + 'home_settings/' + folder + '/current_matches.json'));
    }
  });

  // TODO: DELETE ICONS DIR AND RE-DOWNLOAD INTO /user_data DIR

  allSettings.loadConfig = JSON.parse(fs.readFileSync(basePath + 'load_files/on_load.json'));

  allSettings.messagesConfig = {};
  allSettings.lastMessageDate = (JSON.parse(fs.readFileSync(basePath + 'message_data/last_checked_date.json'))).date;

  allSettings.inventoryConfig = {};
  allSettings.inventoryConfig.currentInv = JSON.parse(fs.readFileSync(basePath + 'player_inventory/current_inventory.json'));

  allSettings.inventoryConfig.presets = {};
  const presetsDir = fs.readdirSync(basePath + 'playerInventory/presets');
  presetsDir.forEach(folderUUID => {
    const allPresets = fs.readdirSync(basePath + 'playerInventory/presets/' + folderUUID);

    allPresets.forEach(presetFile => {
      const presetName = presetFile.split(".")[0].replace(" ", "-").toLowerCase();
      allSettings.inventoryConfig.presets[presetName] = JSON.parse(fs.readFileSync(basePath + 'playerInventory/presets/' + folderUUID + '/' + presetFile));
    });
  });

  allSettings.riotData = {};

  // TODO: riot_games_data/settings file (Add to either appConfig or mainProcessConfig)

  allSettings.riotData.cookies = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/cookies.json'));
  allSettings.riotData.entitlement = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/entitlement.json'));
  allSettings.riotData.tokens = JSON.parse(fs.readFileSync(basePath + 'riot_games_data/token_data.json'));

  allSettings.searchHistory = JSON.parse(fs.readFileSync(basePath + 'search_history/history.json'));

  allSettings.playerStoreConfig = {};
  // TODO: /shop_data, /themes, /user_accounts, /wishlists, other TODOs in this file
})();
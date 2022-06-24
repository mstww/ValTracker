var fs = require('fs');
var https = require("https");
var path = require("path");
var axios = require("axios");

const localAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function asyncTimeout(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

async function getLockfileData() {
  const lockfilePath = path.join(process.env["LOCALAPPDATA"], "Riot Games\\Riot Client\\Config\\lockfile");
  const contents = await fs.promises.readFile(lockfilePath, "utf8");

  let d = {};

  [d.name, d.pid, d.port, d.password, d.protocol] = contents.split(":");
  return d;
}

async function getSession(port, password) {
  return (
    await axios.get(`https://127.0.0.1:${port}/chat/v1/session`, {
      headers: {
        authorization: "Basic " + Buffer.from(`riot:${password}`).toString("base64"),
      },
      httpsAgent: localAgent,
    })
  ).data;
}

async function getHelp(port, password) {
  return (
    await axios.get(`https://127.0.0.1:${port}/help`, {
      headers: {
        authorization: "Basic " + Buffer.from(`riot:${password}`).toString("base64"),
      },
      httpsAgent: localAgent,
    })
  ).data;
}

async function waitForLockfile() {
  return new Promise(async (resolve, reject) => {
    const watcher = fs.watch(
      path.join(process.env["LOCALAPPDATA"], "Riot Games\\Riot Client\\Config\\"),
      (eventType, fileName) => {
        if(eventType === "rename" && fileName === "lockfile") {
          watcher.close();
          resolve();
        }
      }
    );
  });
}

try {
  function runValorantPresence(discordClient, discordVALPresence, mainWindow) {
    if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json")) {
      var load_data_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
      var load_data = JSON.parse(load_data_raw);
    
      if(load_data.hasValorantRPenabled == "true" || load_data.hasValorantRPenabled == undefined || load_data.hasValorantRPenabled == true) {
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
  
          function delay(time) {
            return new Promise(resolve => setTimeout(resolve, time));
          }
  
          do {
            try {
              sessionData = await getSession(lockData.port, lockData.password);
              if(sessionData.loaded === false) {
                await asyncTimeout(1500);
                sessionData = null;
              }
            } catch (e) {
              const currentTime = new Date().getTime();
  
              if(currentTime - lastRetryMessage > 1000) {
                console.log("Unable to get session data, retrying...");
                await delay(2500);
                lastRetryMessage = currentTime;
              }
            }
          } while (sessionData === null);
  
          let helpData = null;
          do {
            helpData = await getHelp(lockData.port, lockData.password);
            if(!helpData.events.hasOwnProperty("OnJsonApiEvent_chat_v4_presences")) {
              console.log("Retrying help data events...");
              helpData = null;
              await asyncTimeout(1500);
            }
          } while (helpData === null);
  
          console.log("Got PUUID...");
  
          const WebSocket = require("ws");
  
          const ws = new WebSocket(`wss://riot:${lockData.password}@localhost:${lockData.port}`, {
            rejectUnauthorized: false,
          });
  
          const { Agent } = require("https");
  
          const ciphers = [
            "TLS_CHACHA20_POLY1305_SHA256",
            "TLS_AES_128_GCM_SHA256",
            "TLS_AES_256_GCM_SHA384",
            "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
          ];
  
          const agent = new Agent({
            ciphers: ciphers.join(":"),
            honorCipherOrder: true,
            minVersion: "TLSv1.3",
          });
  
          // Read local files
          var rawTokenData = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/token_data.json");
          var tokenData = JSON.parse(rawTokenData);
  
          var rawUserData = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/user_creds.json");
          var userData = JSON.parse(rawUserData);
  
          // Assign Global VARs
  
          var user_region = userData.playerRegion;
          var user_puuid = userData.playerUUID;
  
          const presencePID = 69;
  
          let map, mapText, matchType, matchTypeText, agentName, agentText, preGameStatus, activeGameStatus, entitlement_token, globalRPCstart = null;
          let matchHadPreGame, isPractice, gameTimeout = false;
          let globalPartyState = null;
  
          async function fetchEntitlement(bearer) {
            var entitlement_data = await axios.post("https://entitlements.auth.riotgames.com/api/token/v1", {},
              {
                headers: {
                  authorization: `Bearer ${bearer}`,
                },
              })
              .catch((error) => { console.log(error); }
            );
            entitlement_token = entitlement_data.data.entitlements_token;
            return entitlement_token;
          }
  
          function decideMatchMode(str = String, gameStatus = Object) {
            if(str == "/Game/GameModes/Bomb/BombGameMode.BombGameMode_C") {
              if(gameStatus.data.isRanked == true) return ["competitive", "Competitive"];
              
              if(gameStatus.data.ProvisioningFlowID == "CustomGame" || gameStatus.data.ProvisioningFlow == "CustomGame") {
                return ["unrated", "Unrated (Custom)"];
              } else {
                return ["unrated", "Unrated"];
              }
  
            } else if(str == "/Game/GameModes/QuickBomb/QuickBombGameMode.QuickBombGameMode_C") {
  
              if(gameStatus.data.ProvisioningFlowID == "CustomGame" || gameStatus.data.ProvisioningFlow == "CustomGame") {
                return ["spike_rush", "Spike Rush (Custom)"];
              } else {
                return ["spike_rush", "Spike Rush"];
              }
  
            } else if(str == "/Game/GameModes/OneForAll/OneForAll_GameMode.OneForAll_GameMode_C") {
  
              if(gameStatus.data.ProvisioningFlowID == "CustomGame" || gameStatus.data.ProvisioningFlow == "CustomGame") {
                return ["replication", "Replication (Custom)"];
              } else {
                return ["replication", "Replication"];
              }
  
            } else if(str == "/Game/GameModes/Deathmatch/DeathmatchGameMode.DeathmatchGameMode_C") {
  
              if(gameStatus.data.ProvisioningFlow == "CustomGame") {
                return ["ffa", "Deathmatch (Custom)"];
              } else {
                return ["ffa", "Deathmatch"];
              }
  
            } else if(str == "/Game/GameModes/GunGame/GunGameTeamsGameMode.GunGameTeamsGameMode_C") {
  
              if(gameStatus.data.ProvisioningFlow == "CustomGame") {
                return ["escalation", "Escalation (Custom)"];
              } else {
                return ["escalation", "Escalation"];
              }
  
            } else if(str == "/Game/GameModes/ShootingRange/ShootingRangeGameMode.ShootingRangeGameMode_C") {
              return ["practice", "Practice"]
            }
          }
  
          async function decideMap(mapUrl = String) {
            var maps = await (await axios.get("https://valorant-api.com/v1/maps/")).data;
  
            for(var i = 0; i < maps.data.length; i++) {
              if(maps.data[i].mapUrl == mapUrl) {
                var mapName = maps.data[i].displayName;
                var mapIcon = maps.data[i].displayName.toLowerCase();
                return [mapIcon, mapName];
              }
            }
          }
  
          async function setRichPresence(large_img = String, large_img_tip = String, small_img = String, small_img_tip = String, mode = String, status = String, state_1, state_2) {
            if(!globalRPCstart) {
              globalRPCstart = Date.now();
            }
  
            if(!small_img) {
              var playerAgentArray = await fetchPlayerAgent(gameStatus);
              small_img = playerAgentArray[0];
              small_img_tip = playerAgentArray[1];
            }
  
            if(small_img == null)
  
            if(state_1 !== false && state_2 !== false) {
              var RichPresenceObject = {
                details: mode + " - " + status,
                state: state_1 + " - " + state_2,
                assets: {
                  large_image: large_img,
                  large_text: large_img_tip,
                  small_image: small_img,
                  small_text: small_img_tip,
                },
                buttons: [
                  {
                    label: "Download VALTracker",
                    url: "https://valtracker.gg",
                  },
                ],
                timestamps: {
                  start: globalRPCstart,
                },
                instance: true,
              }
            } else {
              var RichPresenceObject = {
                details: mode + " - " + status,
                assets: {
                  large_image: large_img,
                  large_text: large_img_tip,
                  small_image: small_img,
                  small_text: small_img_tip,
                },
                buttons: [
                  {
                    label: "Download VALTracker",
                    url: "https://valtracker.gg",
                  },
                ],
                timestamps: {
                  start: globalRPCstart,
                },
                instance: true,
              }
            }
  
            setTimeout(() => {
              discordClient.clearActivity(process.pid);
              discordVALPresence.request("SET_ACTIVITY", {
                pid: presencePID,
                activity: RichPresenceObject,
              });
            }, 500)
          }
  
          async function fetchPreGame(entitlement_token = String) {
            return new Promise(async (resolve, reject) => {
              await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/pregame/v1/players/${user_puuid}`, {
                headers: {
                  "X-Riot-Entitlements-JWT": entitlement_token,
                  authorization: "Bearer " + tokenData.accessToken,
                },
                httpAgent: agent,
              })
              .then(async (response) => {
                RPState = "GAME";
                isInPreGame = true;
                console.log("USER IN PRE-GAME.");
      
                var matchID = response.data.MatchID;
      
                var gameStatus = await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/pregame/v1/matches/${matchID}`, {
                  headers: {
                    "X-Riot-Entitlements-JWT": entitlement_token,
                    authorization: "Bearer " + tokenData.accessToken,
                  },
                  httpAgent: agent,
                });
      
                // Map
                map = gameStatus.data.MapID;
                var decidedMap = await decideMap(map);
    
                map = decidedMap[0];
                mapText = decidedMap[1];
      
                // Mode
                matchType = gameStatus.data.Mode;
      
                var decidedMode = decideMatchMode(matchType, gameStatus);
                matchType = decidedMode[0];
                matchTypeText = decidedMode[1];
      
                setRichPresence(map, mapText, matchType, matchTypeText, matchTypeText, "Agent Select", false, false);
                resolve(true);
              })
              .catch((error) => {
                console.log("USER NOT IN PRE-GAME!");
                resolve(false);
              });
            });
          }
  
          async function fetchPlayerAgent(gameStatus = Object) {
            for (var i = 0; i < gameStatus.data.Players.length; i++) {
              if(gameStatus.data.Players[i].Subject == user_puuid) {
                var playerAgent = await axios.get(`https://valorant-api.com/v1/agents/${gameStatus.data.Players[i].CharacterID}`);
  
                agentText = playerAgent.data.data.displayName;
                agentName = agentText.toLowerCase();
  
                return [agentName, agentText];
              }
            }
          }
  
          async function fetchPresences() {
            var str = 'riot:' + lockData.password
            var buff = Buffer.from(str);
            var password = buff.toString('base64')
  
            var options = {
              method: 'GET',
              url: `https://127.0.0.1:${lockData.port}/chat/v4/presences`,
              headers: {authorization: 'Basic ' + password},
              httpsAgent: localAgent
            };
  
            var matchStanding = await axios.request(options)
            .catch(function (error) {
              console.error(error);
            });
            return matchStanding
          }
  
          async function fetchCoreGame(entitlement_token = String, matchID = String, gameStatus = Object) {
            return new Promise(async (resolve, reject) => {
              RPState = "GAME";
    
              if(!matchID) {
                await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/core-game/v1/players/${user_puuid}`,
                  {
                    headers: {
                      "X-Riot-Entitlements-JWT": entitlement_token,
                      authorization: "Bearer " + tokenData.accessToken,
                    },
                    httpAgent: agent,
                  }
                )
                .then((response) => {
                  matchID = response.data.MatchID;
                })
                .catch((error) => { 
                  return "USER NOT IN CORE-GAME!."; 
                });
              }
              
              if(!gameStatus) {
                await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/core-game/v1/matches/${matchID}`, {
                    headers: {
                      "X-Riot-Entitlements-JWT": entitlement_token,
                      authorization: "Bearer " + tokenData.accessToken,
                    },
                    httpAgent: agent,
                  }
                ).then(async (response) => {
                  gameStatus = response;
                  console.log("USER IN MATCH.");
        
                  // Mode
                  matchType = gameStatus.data.ModeID;
        
                  map = gameStatus.data.MapID;
                  var decidedMap = await decideMap(map);
        
                  map = decidedMap[0];
                  mapText = decidedMap[1];
        
                  var decidedMode = decideMatchMode(matchType, gameStatus);
        
                  matchType = decidedMode[0];
                  matchTypeText = decidedMode[1];
        
                  if(isPractice == false) {
                    var playerAgentArray = await fetchPlayerAgent(gameStatus);
                    agentName = playerAgentArray[0];
                    agentText = playerAgentArray[1];
                  }
        
                  var matchStanding = await fetchPresences();
                  var presences = matchStanding.data.presences;
        
                  for (var i = 0; i < presences.length; i++) {
                    if(presences[i].puuid == user_puuid) {
                      var buff = Buffer.from(presences[i].private.toString(), "base64");
                      var data = JSON.parse(buff.toString("utf-8"));
        
                      globalPartyState = data["sessionLoopState"];
        
                      var team_1_state = data["partyOwnerMatchScoreAllyTeam"];
                      var team_2_state = data["partyOwnerMatchScoreEnemyTeam"];
                    }
                  }
        
                  if(isPractice == false) {
                    setRichPresence(map, mapText, agentName, agentText, matchTypeText, "In Match", team_1_state, team_2_state);
                  } else {
                    setRichPresence(map, mapText, "practice", "Shooting Bots", "The Range", "Practice");
                    isPractice = false;
                  }
                  resolve();
                })
                .catch((error) => { console.log("User not in Match."); });
              }
            });
          }
  
          ws.on("open", async () => {
            RPState = "LOGIN";
  
            Object.entries(helpData.events).forEach(([name, desc]) => {
              if(name === "OnJsonApiEvent") return;
              ws.send(JSON.stringify([5, name]));
            });
  
            console.log("Connected to websocket!");
            console.log("Checking for Pre-Game...")
  
            var isInPreGame = false;
  
            entitlement_token = await fetchEntitlement(tokenData.accessToken);
  
            isInPreGame = await fetchPreGame(entitlement_token);
  
            if(isInPreGame == false) {
              console.log("Checking for Core Game...")
              await fetchCoreGame(entitlement_token, false, false);
            }
          });
  
          ws.on("message", async (data) => {
            // Get new entitlement token for every match in case it refreshed
            var stringData = data.toString();
  
            // Check if buffer was empty
            if(stringData != "") {
              var matchData = JSON.parse(stringData);
              // Pregame Event
              if(matchData[1] == "OnJsonApiEvent_riot-messaging-service_v1_message" && matchData[2].uri.split("/").slice(0, -1).join("/") == "/riot-messaging-service/v1/message/ares-pregame/pregame/v1/matches") {
                if(entitlement_token == null) {
                  entitlement_token = true;
                  var tokens_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/token_data.json");
                  var tokens = JSON.parse(tokens_raw);
      
                  entitlement_token = await fetchEntitlement(tokens.accessToken);
                }
                RPState = "GAME";
  
                // Match ID
                var matchID = matchData[2].data.resource.split("/").pop();
  
                // Get Token Data from File
                var rawTokenData = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/riot_games_data/token_data.json");
                tokenData = JSON.parse(rawTokenData);
  
                // Use Tokens to fetch current game
                if(preGameStatus == null) {
                  preGameStatus = await fetchPreGame(entitlement_token);
  
                  matchHadPreGame = true;
                }
              }
  
              // Get Match ID (Emitted when match is starting, so switch RP)
              if(matchData[1] == "OnJsonApiEvent_riot-messaging-service_v1_message" && matchData[2].uri.split("/").slice(0, -1).join("/") == "/riot-messaging-service/v1/message/ares-core-game/core-game/v1/matches") {
                var matchID = matchData[2].data.resource.split("/").pop();
  
                var gameStatus = await axios.get(`https://glz-${user_region}-1.${user_region}.a.pvp.net/core-game/v1/matches/${matchID}`,
                  {
                    headers: {
                      "X-Riot-Entitlements-JWT": entitlement_token,
                      authorization: "Bearer " + tokenData.accessToken,
                    },
                    httpAgent: agent,
                  }
                ).catch((error) => { console.log(error); });
  
                if(gameTimeout == false && activeGameStatus == null && gameStatus.data.State == "IN_PROGRESS") {
                  activeGameStatus = true;
                  await fetchCoreGame(entitlement_token, matchID, gameStatus);
                }
              }
  
              if(matchData[1] == "OnJsonApiEvent_chat_v5_participants" && matchData[2].eventType == "Delete") {
                RPState = "APP";
                if(activeGameStatus == true && matchData[2].uri != "/chat/v5/participants" && matchData[2].uri != "/chat/v5/participants/ares-pregame") {
                  console.log("Game ended.");
  
                  // End Rich presence and clear variables
                  map, mapText, agentName, agentText, matchType, matchTypeText, preGameStatus, activeGameStatus, entitlement_token, matchHadPreGame, globalPartyState, globalRPCstart = null;
  
                  if(isPractice == true) {
                    isPractice = false;
                  }
  
                  gameTimeout = true;
  
                  async function timeout() {
                    setTimeout(function () {
                      gameTimeout = false;
                    }, 7500);
                  }
  
                  timeout();
  
                  mainWindow.webContents.send("restartDiscordRP");
  
                  discordVALPresence.clearActivity(presencePID);
                }
  
                if(activeGameStatus == null && matchData[2].uri == "/chat/v5/participants/ares-pregame") {
                  setTimeout(function () {
                    if(globalPartyState != "INGAME") {
                      console.log("User quit the match!");
  
                      RPState = "APP";
  
                      map, mapText, agentName, agentText, matchType, matchTypeText, preGameStatus, activeGameStatus, entitlement_token, matchHadPreGame, globalPartyState, isPractice, globalRPCstart = null;
  
                      mainWindow.webContents.send("restartDiscordRP");
  
                      discordVALPresence.clearActivity(presencePID);
                    }
                  }, 2500);
                }
              }
  
              if(matchData[1] == "OnJsonApiEvent_chat_v4_presences" && matchData[2]) {
                for (var i = 0; i < matchData[2].data.presences.length; i++) {
                  if(matchData[2].data.presences[i].puuid == user_puuid) {
                    var buff = Buffer.from(matchData[2].data.presences[i].private.toString(), "base64");
                    var data = JSON.parse(buff.toString("utf-8"));
  
                    globalPartyState = data["sessionLoopState"];
  
                    if(data["sessionLoopState"] == "INGAME") {
                      setRichPresence(map, mapText, agentName, agentText, matchTypeText, "In Match", data["partyOwnerMatchScoreAllyTeam"], data["partyOwnerMatchScoreEnemyTeam"]);
                    }
                  }
                }
              }
            }
          });
  
          ws.on("close", () => {
            RPState = "APP";
            map, mapText, agentName, agentText, matchType, matchTypeText, preGameStatus, activeGameStatus, entitlement_token, matchHadPreGame, globalPartyState, isPractice, globalRPCstart = null;
  
            mainWindow.webContents.send("restartDiscordRP");
            discordVALPresence.clearActivity(presencePID);
            console.log("Websocket closed!");
          });
        })();
      }
    }
  }
  
  module.exports = runValorantPresence
} catch(e) {
  console.log(e)
}
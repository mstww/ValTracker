import React from 'react';
import { ipcRenderer } from 'electron';
import fetch from 'node-fetch'
import { Loading, Tooltip } from '@nextui-org/react';
import moment from 'moment';
import AwesomeSlider from 'react-awesome-slider';
import SmallStatsCard from '../components/hub/SmallStatsCard';
import LargeStatsCard from '../components/hub/LargeStatsCard';
import FlatLargeStatsCard from '../components/hub/FlatLargeStatsCard';
import ContractProgressCard from '../components/hub/ContractProgressCard';
import ModeSelectionCard from '../components/hub/ModeSelectionCard';
import { useFirstRender } from '../components/useFirstRender';
import InfoChart from '../components/hub/InfoChart';
import { useRouter } from 'next/router';
import L from '../locales/translations/home.json';
import LocalText from '../components/translation/LocalText';
import Layout from '../components/Layout';
import APIi18n from '../components/translation/ValApiFormatter';
import { StarFilled, Star, Reload } from '../components/SVGs';
import ValIconHandler from '../components/ValIconHandler';
import { executeQuery, getCurrentPUUID, getCurrentUserData, getUserAccessToken, getUserEntitlement, removeMatch, updateThing } from '../js/dbFunctions.mjs';
import { v5 as uuidv5 } from 'uuid';

const imgArray = [
  '/agents/breach_black.png',
  '/agents/cypher_black.png',
  '/agents/jett_black.png',
  '/agents/jett_black.png',
  '/agents/jett_black.png',
  '/agents/breach_black.png',
  '/agents/omen_black.png',
  '/agents/fade_black.png',
  '/agents/fade_black.png',
  '/agents/jett_black.png',
  '/agents/cypher_black.png',
  '/agents/fade_black.png',
  '/agents/breach_black.png',
  '/agents/cypher_black.png',
  '/agents/omen_black.png',
];

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

async function getPlayerContracts(region, puuid, entitlement_token, bearer, client_version) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/contracts/v1/contracts/${puuid}`, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      'Authorization': 'Bearer ' + bearer,
      'X-Riot-ClientVersion': client_version,
      'Content-Type': 'application/json'
    },
    keepalive: true
  })).json());
}

function getDifferenceInDays(date1, date2) {
  const diffInMs = Math.abs(date2 - date1);
  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
}

const fetchMatches = async (startIndex, endIndex, currentMatches, queue, puuid, region, lang, isTestFetch) => {
  try {
    var newMatches = currentMatches;

    const bearer = await getUserAccessToken();
    const entitlement_token =  await getUserEntitlement();

    const playerMatches = await getMatchHistory(region, puuid, startIndex, endIndex, queue, entitlement_token, bearer);
    
    const newEndIndex = playerMatches.EndIndex;
    const totalMatches = playerMatches.Total;
    const history = playerMatches.History;

    var matches = [];
    var matchIDs = [];

    for (var i = 0; i < history.length; i++) {
      const match = await getMatch(region, history[i].MatchID, entitlement_token, bearer);
      ipcRenderer.send(`createMatch`, match);
      matches.push(match);
      matchIDs.push(match.matchInfo.matchId);
    }

    for(var i = 0; i < matches.length; i++) {
      var dateDiff = getDifferenceInDays(matches[i].matchInfo.gameStartMillis, Date.now());
      moment.locale(lang);
      var startdate = moment();
      startdate = startdate.subtract(dateDiff, "days");
      var matchDate = startdate.format("D. MMMM");

      // Create array if it doesn't exist
      if(!newMatches[matchDate]) newMatches[matchDate] = [];

      newMatches[matchDate].push(matches[i]);
    }

    if(isTestFetch === false) {
      var hubConfig = await executeQuery(`SELECT * FROM hubConfig:⟨${puuid}⟩`);

      await updateThing(`hubConfig:⟨${puuid}⟩`, {
        ...hubConfig[0],
        loadedMatches: newEndIndex,
        totalMatches: totalMatches
      });

      var matchIDCollection = await executeQuery(`SELECT * FROM matchIDCollection:⟨hub::${puuid}⟩`);
      var arr = new Set([...matchIDCollection[0].matchIDs, ...matchIDs]);
  
      await updateThing(`matchIDCollection:⟨hub::${puuid}⟩`, {
        matchIDs: [...arr]
      });
    }
      
    var json = {
      "totalMatches": totalMatches,
      "endIndex": newEndIndex,
      "games": newMatches,
      "matchIDs": matchIDs
    }

    return { errored: false, items: json };
  } catch(err) {
    console.error(err);
    return { errored: true, items: err };
  }
}

function calculatePlayerStatsFromMatches(matchdays, puuid) {
  var player_wins = 0;
  var player_losses = 0;

  var total_kills = 0;
  var total_deaths = 0;
  var total_assists = 0;

  // Divide all stats here by the match count to get the avg thing/match
  var total_match_count = 0;
  // ---------------------------------------------------------------
  // total_kills here 

  // Divide all stats here by the round count to get the avg thing/round
  var total_round_count = 0;
  // ---------------------------------------------------------------
  var total_player_round_score = 0;
  var total_round_damage_dealt = 0;
  // total_kills here 

  // Calculate these as normal
  var total_headshots = 0;
  var total_bodyshots = 0;
  var total_legshots = 0;

  var agent_stats = [];
  var weapon_kills = [];
  var map_stats = [];

  // For each key in the matchdays object
  for(var key in matchdays) {
    var matches = matchdays[key];

    for(var i = 0; i < matches.length; i++) {
      if(matches[i].matchInfo.completionState !== 'Surrendered') {
        total_match_count++;

        var map_kills = 0;
        var map_deaths = 0;
        var map_assists = 0;
        var map_wins = 0;
        var map_losses = 0;

        // Get Player Team and Round Damage
        for(var j = 0; j < matches[i].players.length; j++) {
          if(matches[i].players[j].subject == puuid) {
            var player_team = matches[i].players[j].teamId;

            var player_match_stats = matches[i].players[j];

            total_kills += matches[i].players[j].stats.kills;
            map_kills += matches[i].players[j].stats.kills;

            total_deaths += matches[i].players[j].stats.deaths;
            map_deaths += matches[i].players[j].stats.deaths;

            total_assists += matches[i].players[j].stats.assists;
            map_assists += matches[i].players[j].stats.assists;
          }
        }

        // Get if player won or lost
        for(var j = 0; j < matches[i].teams.length; j++) {
          if(matches[i].teams[j].won == true) {
            var winning_team = matches[i].teams[j].teamId;
          }
        }
        if(player_team == winning_team) {
          player_wins++;
          map_wins++;
        } else {
          player_losses++;
          map_losses++;
        }

        if(!agent_stats[player_match_stats.characterId]) {
          agent_stats[player_match_stats.characterId] = {
            "kills": player_match_stats.stats.kills,
            "deaths": player_match_stats.stats.deaths,
            "assists": player_match_stats.stats.assists,
            "score": player_match_stats.stats.score,
            "rounds_played": player_match_stats.stats.roundsPlayed,
            "times_played": 1,
            "wins": map_wins,
            "losses": map_losses
          }
        } else {
          agent_stats[player_match_stats.characterId].kills += player_match_stats.stats.kills;
          agent_stats[player_match_stats.characterId].deaths += player_match_stats.stats.deaths;
          agent_stats[player_match_stats.characterId].assists += player_match_stats.stats.assists;
          agent_stats[player_match_stats.characterId].score += player_match_stats.stats.score;
          agent_stats[player_match_stats.characterId].rounds_played += player_match_stats.stats.roundsPlayed;
          agent_stats[player_match_stats.characterId].times_played++;
          agent_stats[player_match_stats.characterId].wins += map_wins;
          agent_stats[player_match_stats.characterId].losses += map_losses;
        }

        // Loop through every round and every player in every round to find damage stats for player
        for(var j = 0; j < matches[i].roundResults.length; j++) {
          total_round_count++;
          for(var k = 0; k < matches[i].roundResults[j].playerStats.length; k++) {
            if(matches[i].roundResults[j].playerStats[k].subject == puuid) {
              total_player_round_score += matches[i].roundResults[j].playerStats[k].score;

              for(var l = 0; l < matches[i].roundResults[j].playerStats[k].damage.length; l++) {
                total_headshots += matches[i].roundResults[j].playerStats[k].damage[l].headshots;
                total_bodyshots += matches[i].roundResults[j].playerStats[k].damage[l].bodyshots;
                total_legshots += matches[i].roundResults[j].playerStats[k].damage[l].legshots;

                total_round_damage_dealt += matches[i].roundResults[j].playerStats[k].damage[l].damage;
              }

              for(var l = 0; l < matches[i].roundResults[j].playerStats[k].kills.length; l++) {
                if(matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageType === 'Weapon') {
                  if(!weapon_kills[matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageItem]) {
                    weapon_kills[matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageItem] = {
                      "kills": 1,
                    }
                  } else {
                    weapon_kills[matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageItem].kills++;
                  }
                }
              }
            }
          }
        }

        // Create obj with name of "matches[i].matchInfo.matchId" in map_stats array if it doesn't exist
        if(!map_stats[matches[i].matchInfo.mapId]) {
          map_stats[matches[i].matchInfo.mapId] = {
            "map_kills": map_kills,
            "map_deaths": map_deaths,
            "map_assists": map_assists,
            "map_wins": map_wins,
            "map_losses": map_losses,
            "total_times_played": 1
          }
        } else {
          map_stats[matches[i].matchInfo.mapId].map_kills += map_kills;
          map_stats[matches[i].matchInfo.mapId].map_deaths += map_deaths;
          map_stats[matches[i].matchInfo.mapId].map_assists += map_assists;
          map_stats[matches[i].matchInfo.mapId].map_wins += map_wins;
          map_stats[matches[i].matchInfo.mapId].map_losses += map_losses;
          map_stats[matches[i].matchInfo.mapId].total_times_played++;
        }
      }
    }
  }

  var win_percentage = (player_wins / total_match_count) * 100;
  var win_percentage_rounded = win_percentage.toFixed(0);

  var win_loss_ratio = (player_wins / player_losses);

  var total_shots_hit = total_headshots + total_bodyshots + total_legshots;

  var headshot_percent = (total_headshots / total_shots_hit) * 100;
  var headshot_percent_rounded = headshot_percent.toFixed(0);

  var kills_per_round = total_kills / total_round_count;
  var kills_per_round_rounded = kills_per_round.toFixed(2);

  var kills_per_match = total_kills / total_match_count;
  var kills_per_match_rounded = kills_per_match.toFixed(2);

  for(var key in agent_stats) {
    var agent_kills = agent_stats[key].kills;
    var agent_deaths = agent_stats[key].deaths;
    var agent_assists = agent_stats[key].assists;
    var agent_score = agent_stats[key].score;
    var agent_rounds_played = agent_stats[key].rounds_played;
    var agent_times_played = agent_stats[key].times_played;
    var agent_wins = agent_stats[key].wins;
    var agent_losses = agent_stats[key].losses;

    var agent_kda_ratio = (agent_kills + agent_assists) / agent_deaths;
    var agent_kda_ratio_rounded = agent_kda_ratio.toFixed(2); // IMPORTANT

    var avg_kills_per_match = agent_kills / agent_times_played;
    var avg_kills_per_match_rounded = avg_kills_per_match.toFixed(0); // IMPORTANT

    var avg_deaths_per_match = agent_deaths / agent_times_played;
    var avg_deaths_per_match_rounded = avg_deaths_per_match.toFixed(0);

    var avg_assists_per_match = agent_assists / agent_times_played;
    var avg_assists_per_match_rounded = avg_assists_per_match.toFixed(0);

    var avg_agent_kda = `${avg_kills_per_match_rounded}/${avg_deaths_per_match_rounded}/${avg_assists_per_match_rounded}`; // IMPORTANT

    var average_match_score = agent_score / agent_times_played;
    var average_match_score_rounded = average_match_score.toFixed(0); // IMPORTANT

    var agent_win_loss_ratio = (agent_wins / agent_losses);
    var agent_win_loss_ratio_rounded = agent_win_loss_ratio.toFixed(0); // IMPORTANT

    var agent_kills_per_round = agent_kills / agent_rounds_played;
    var agent_kills_per_round_rounded = agent_kills_per_round.toFixed(2); // IMPORTANT

    agent_stats[key].avg_kda_ratio = agent_kda_ratio_rounded;
    agent_stats[key].avg_kda = avg_agent_kda;
    agent_stats[key].avg_kills_per_match = avg_kills_per_match_rounded;
    agent_stats[key].kills_per_round = agent_kills_per_round_rounded;
    agent_stats[key].avg_match_score = average_match_score_rounded;
    agent_stats[key].win_loss_ratio = agent_win_loss_ratio_rounded;
  }

  for(var key in map_stats) {
    var map_kills = map_stats[key].map_kills;
    var map_deaths = map_stats[key].map_deaths;
    var map_assists = map_stats[key].map_assists;
    var map_wins = map_stats[key].map_wins;
    var map_losses = map_stats[key].map_losses;
    var total_times_played = map_stats[key].total_times_played;

    var map_kda_ratio = (map_kills + map_assists) / map_deaths;
    var map_kda_ratio_rounded = map_kda_ratio.toFixed(2); // IMPORTANT

    var map_win_percentage = (map_wins / total_times_played) * 100;
    var map_win_percentage_rounded = map_win_percentage.toFixed(0); // IMPORTANT

    var map_win_loss_ratio = (map_wins / map_losses);
    var map_win_loss_ratio_rounded = map_win_loss_ratio.toFixed(2); // IMPORTANT

    map_stats[key].map_kda_ratio = map_kda_ratio_rounded;
    map_stats[key].map_win_percentage = map_win_percentage_rounded;
    map_stats[key].map_win_loss_ratio = map_win_loss_ratio_rounded;
  }

  var returnObj = {
    "win_percentage": win_percentage_rounded,
    "win_loss_ratio": win_loss_ratio,
    "headshot_percent": headshot_percent_rounded,
    "kills_per_round": kills_per_round_rounded,
    "kills_per_match": kills_per_match_rounded,
    "total_kills": total_kills,
    "total_deaths": total_deaths,
    "total_assists": total_assists,
    "agent_stats": agent_stats,
    "map_stats": map_stats,
    "weapon_kills": weapon_kills
  }

  return returnObj;
}

const getLevelRewardData = async (uuid, rewardType, lang) => {
  try {
    switch(rewardType) {
      case "EquippableSkinLevel":
        return {
          isText: false,
          image: 'https://media.valorant-api.com/weaponskinlevels/' + uuid + '/displayicon.png',
          uuid: uuid,
          text: null
        }
      case "EquippableCharmLevel":
        return {
          isText: false, 
          image: 'https://media.valorant-api.com/buddylevels/' + uuid + '/displayicon.png',
          uuid: uuid,
          text: null
        }
      case "Currency":
        return {
          isText: false, 
          image: '/images/radianite_icon.png',
          text: null
        }
      case "PlayerCard":
        return { 
          isText: false, 
          image: 'https://media.valorant-api.com/playercards/' + uuid + '/smallart.png' ,
          uuid: uuid,
          text: null
        }
      case "Spray":
        return { 
          isText: false, 
          image: 'https://media.valorant-api.com/sprays/' + uuid + '/fulltransparenticon.png',
          uuid: uuid,
          text: null
        }
      case "Title":
        var titleData = await (await fetch('https://valorant-api.com/v1/playertitles/' + uuid + `?language=${APIi18n(lang)}`, { 'Content-Type': 'application/json' })).json();
        return {
          isText: true,
          image: null,
          uuid: uuid,
          text: titleData.data.displayName
        }
      case "Character":
        return {
          isText: false,
          image: 'https://media.valorant-api.com/agents/' + uuid + '/displayicon.png',
          uuid: uuid,
          text: null
        }
    } 
  } catch(e) {
    console.log(e);
  }
}

const calculateContractProgress = async (region, puuid, bearer, entitlement, client_version, lang) => {
  var contracts = await (await fetch('https://valorant-api.com/v1/contracts?language=' + APIi18n(lang), { 'Content-Type': 'application/json' })).json();
  var player_contracts = await getPlayerContracts(region, puuid, entitlement, bearer, client_version);

  var activeAgentContractUUID = player_contracts.ActiveSpecialContract;
  var activeBattlePassContractUUID = contracts.data[contracts.data.length-1].uuid;

  // Get Progress in agent contract 
  for(var i = 0; i < player_contracts.Contracts.length; i++) {
    if(player_contracts.Contracts[i].ContractDefinitionID === activeAgentContractUUID) {
      var agentContractUUID = player_contracts.Contracts[i].ContractDefinitionID
      var agentContractProgressionLevel = player_contracts.Contracts[i].ProgressionLevelReached;
      var agentContractXpRemaining = player_contracts.Contracts[i].ProgressionTowardsNextLevel;
    }
  }

  var agentContractData = await(await fetch('https://valorant-api.com/v1/contracts/' + agentContractUUID + '?language=' + APIi18n(lang), { 'Content-Type': 'application/json' })).json();
  var tierCount = 0;

  var agentContractProgression = {
    current_level: {},
    next_level: {},
  };

  if(agentContractProgressionLevel === 10) {
    var current_chapter = agentContractData.data.content.chapters[agentContractData.data.content.chapters.length-1];
    
    var current_level = current_chapter.levels[current_chapter.levels.length-2];
    var next_level = current_chapter.levels[current_chapter.levels.length-1];

    var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);

    agentContractProgression.current_level.reward = current_level_data;
    agentContractProgression.current_level.levelNum = 9;

    var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);

    agentContractProgression.next_level.reward = next_level_data;
    agentContractProgression.next_level.levelNum = 10;

    agentContractProgression.totalXPneeded = 1;
    agentContractProgression.currentXPowned = 1;
  } else {
    for(var i = 0; i < agentContractData.data.content.chapters.length; i++) {
      var current_chapter = agentContractData.data.content.chapters[i];
      var next_chapter = undefined;
  
      if(agentContractData.data.content.chapters[i+1]) {
        next_chapter = agentContractData.data.content.chapters[i+1];
      }
      
      for(var j = 0; j < current_chapter.levels.length; j++) {
        var next_level = undefined;
        var current_level = current_chapter.levels[j-1];
  
        if(current_level === undefined && tierCount === 5) {
          var prev_chapter = agentContractData.data.content.chapters[i-1];
          current_level = prev_chapter.levels[prev_chapter.levels.length-1];
        }
  
        if(current_chapter.levels[j]) {
          next_level = current_chapter.levels[j];
        }
  
        if(next_level === undefined && next_chapter !== undefined) {
          current_level = current_chapter.levels[current_chapter.levels.length-1];
          next_level = next_chapter.levels[0]; 
        }
  
        if(next_level === undefined) {
          next_level = current_chapter.levels[j+1];
          current_level = current_chapter.levels[j];
          var atEnd = true;
        }
  
        if(tierCount == agentContractProgressionLevel) {
          if(current_level) {
            if(atEnd === true) {
              var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
    
              agentContractProgression.current_level.reward = current_level_data;
              agentContractProgression.current_level.levelNum = tierCount -1;
            } else {
              var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
    
              agentContractProgression.current_level.reward = current_level_data;
              agentContractProgression.current_level.levelNum = tierCount;
            }
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
  
            agentContractProgression.current_level.reward = current_level_data;
            agentContractProgression.current_level.levelNum = tierCount;
          } else {
            agentContractProgression.current_level.reward = null;
            agentContractProgression.current_level.levelNum = 0;
          }
          
          if(atEnd === true) {
            var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);
  
            agentContractProgression.next_level.reward = next_level_data;
            agentContractProgression.next_level.levelNum = tierCount;
  
            agentContractProgression.totalXPneeded = 1;
            agentContractProgression.currentXPowned = 1;
          } else {
            var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);
  
            agentContractProgression.next_level.reward = next_level_data;
            agentContractProgression.next_level.levelNum = tierCount + 1;
  
            agentContractProgression.totalXPneeded = next_level.xp;
            agentContractProgression.currentXPowned = agentContractXpRemaining;
          }
          break;
        }
  
        tierCount++;
      }
    }
  }

  // Get Progress in battle pass contract 
  for(var i = 0; i < player_contracts.Contracts.length; i++) {
    if(player_contracts.Contracts[i].ContractDefinitionID === activeBattlePassContractUUID) {
      var battlePassUUID = player_contracts.Contracts[i].ContractDefinitionID
      var battlePassProgressionLevel = player_contracts.Contracts[i].ProgressionLevelReached;
      var battlePassXpRemaining = player_contracts.Contracts[i].ProgressionTowardsNextLevel;
    }
  }

  var battlePassData = await(await fetch('https://valorant-api.com/v1/contracts/' + battlePassUUID + '?language=' + APIi18n(lang), { 'Content-Type': 'application/json' })).json();
  tierCount = 0;

  var battlePassProgression = {
    current_level: {},
    next_level: {},
  };

  for(var i = 0; i < battlePassData.data.content.chapters.length; i++) {
    var current_chapter = battlePassData.data.content.chapters[i];
    var next_chapter = undefined;
    var atEnd = false;
    
    if(battlePassData.data.content.chapters[i+1]) {
      next_chapter = battlePassData.data.content.chapters[i+1];
    }

    for(var j = 0; j < current_chapter.levels.length; j++) {
      var current_level = current_chapter.levels[j];
      var next_level = undefined;

      if(current_chapter.levels[j+1]) {
        next_level = current_chapter.levels[j+1];
      }

      if(next_level === undefined && next_chapter !== undefined) {
        next_level = next_chapter.levels[0];
      }

      if(next_level === undefined && next_chapter == undefined) {
        next_level = current_level;
        current_level = current_chapter.levels[j-1];
        atEnd = true;
      }

      tierCount++;

      if(tierCount == battlePassProgressionLevel) {
        if(current_level) {
          if(atEnd === true) {
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
  
            battlePassProgression.current_level.reward = current_level_data;
            battlePassProgression.current_level.levelNum = tierCount -1;
          } else {
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
  
            battlePassProgression.current_level.reward = current_level_data;
            battlePassProgression.current_level.levelNum = tierCount;
          }
        } else {
          battlePassProgression.current_level.reward = null;
          battlePassProgression.current_level.levelNum = 0;
        }

        if(atEnd === true) {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);

          battlePassProgression.totalXPneeded = 1;
          battlePassProgression.currentXPowned = 1;

          battlePassProgression.next_level.reward = next_level_data;
          battlePassProgression.next_level.levelNum = tierCount;
        } else {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);

          battlePassProgression.totalXPneeded = next_level.xp;
          battlePassProgression.currentXPowned = battlePassXpRemaining;

          battlePassProgression.next_level.reward = next_level_data;
          battlePassProgression.next_level.levelNum = tierCount + 1;
        }
      }
    }
  } 

  var data = {
    agentContractProgress: agentContractProgression,
    battlePassProgress: battlePassProgression,
    date: Date.now()
  }
  
  await updateThing(`hubContractProgress:⟨${puuid}⟩`, data);

  return data;
}

function Home({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const firstRender = useFirstRender();
  const router = useRouter();

// ------------------------------- MATCH HISTORY -------------------------------

  const [ currentMatches, setCurrentMatches ] = React.useState([]);
  const [ currentlyLoadedMatchCount, setCurrentlyLoadedMatchCount ] = React.useState(0);
  const [ maxMatchesFound, setMaxMatchesFound ] = React.useState(0);
  const [ mapData, setMapData ] = React.useState({});
  const [ loading, setLoading ] = React.useState(true);
  const [ errored, setErrored ] = React.useState(false);
  const [ activeQueueTab, setActiveQueueTab ] = React.useState('');
  const [ isPrefChange, setIsPrefChange ] = React.useState(true);

  const [ isSilentLoading, setIsSilentLoading ] = React.useState(false);

  const [ fetchingFurtherMatches, setFetchingFurtherMatches ] = React.useState(false);
  const [ matchFetchingError, setMatchFetchingError ] = React.useState(false);

// ------------------------------- MATCH STATS -------------------------------

  const [ avgKillsPerMatch, setAvgKillsPerMatch ] = React.useState('');
  const [ avgKillsPerRound, setAvgKillsPerRound ] = React.useState('');
  const [ winratePercent, setWinratePercent ] = React.useState('');
  const [ headshotPercent, setHeadshotPercent ] = React.useState('');
  const [ bestMapName, setBestMapName ] = React.useState('');
  const [ bestMapImage, setBestMapImage ] = React.useState('');
  const [ bestMapWinPercent, setBestMapWinPercent ] = React.useState('');
  const [ bestMapKdaRatio, setBestMapKdaRatio ] = React.useState('');
  const [ bestAgentName, setBestAgentName ] = React.useState('');
  const [ bestAgentImage, setBestAgentImage ] = React.useState('');
  const [ bestAgentAvgScore, setBestAgentAvgScore ] = React.useState('');
  const [ bestAgentAvgKda, setBestAgentAvgKda ] = React.useState('');
  const [ bestAgentKillsPerRound, setBestAgentKillsPerRound ] = React.useState('');
  const [ bestAgentKillsPerMatch, setBestAgentKillsPerMatch ] = React.useState('');

  const [ areStatsActive, setAreStatsActive ] = React.useState(true);

// ------------------------------- FEATURED BUNDLE -------------------------------

  const [ featuredBundleName, setFeaturedBundleName ] = React.useState('');
  const [ featuredBundlePrice, setFeaturedBundlePrice ] = React.useState('');
  const [ featuredBundleImage, setFeaturedBundleImage ] = React.useState('');

// ------------------------------- CONTRACTS -------------------------------

  const [ contractsLoading, setContractsLoading ] = React.useState(true);
  const [ contractsError, setContractsError ] = React.useState(false);

// ------------------------------- AGENT CONTRACT -------------------------------

  const [ agentContract_prevLevelNum, setAgentContract_prevLevelNum ] = React.useState('');
  const [ agentContract_prevLevelReward, setAgentContract_prevLevelReward ] = React.useState({});

  const [ agentContract_currentLevelNum, setAgentContract_currentLevelNum ] = React.useState('');
  const [ agentContract_currentLevelReward, setAgentContract_currentLevelReward ] = React.useState({});

  const [ agentContract_maxXP, setAgentContract_maxXP ] = React.useState(0);
  const [ agentContract_currentXP, setAgentContract_currentXP ] = React.useState(0);

// ------------------------------- BATTLE PASS -------------------------------

  const [ battlePass_prevLevelNum, setBattlePass_prevLevelNum ] = React.useState('');
  const [ battlePass_prevLevelReward, setBattlePass_prevLevelReward ] = React.useState({});

  const [ battlePass_currentLevelNum, setBattlePass_currentLevelNum ] = React.useState('');
  const [ battlePass_currentLevelReward, setBattlePass_currentLevelReward ] = React.useState({});

  const [ battlePass_maxXP, setBattlePass_maxXP ] = React.useState(0);
  const [ battlePass_currentXP, setBattlePass_currentXP ] = React.useState(0);

// ------------------------------- CHARTS -------------------------------

  const [ headshotPercentagesOfLast5, setHeadshotPercentagesOfLast5 ] = React.useState([]);
  const [ adrOfLast5, setAdrOfLast5 ] = React.useState([]);
  const [ kdOfLast5, setKdOfLast5 ] = React.useState([]);

  const [ headshotChartData, setHeadshotChartData ] = React.useState([]);
  const [ damageChartData, setDamageChartData ] = React.useState([]);
  const [ killsDeathsChartData, setKillsDeathsChartData] = React.useState([]);

  const [ chartsLoading, setChartsLoading ] = React.useState(true);
  const [ chartsError, setChartsError ] = React.useState(false);

  const [ areChartsActive, setAreChartsActive ] = React.useState(true);

// ------------------------------- MISC. -------------------------------
  
  const [ favMatches, setFavMatches ] = React.useState([]);
  const [ ranks, setRanks ] = React.useState([]);

  const [ userCreds, setUserCreds ] = React.useState({});

// ------------------------------- END STATES -------------------------------

  const fetchMatchesAndCalculateStats = async (isNewQueue, beginIndex, endIndex, mode, isFirstLoad, isSilentLoading, keepCurrentMatches) => {
    var user_creds = await getCurrentUserData();
    var puuid = user_creds.uuid;

    if(keepCurrentMatches === true) {
      var data = await fetchMatches(beginIndex, endIndex, [], mode, puuid, user_creds.region, router.query.lang, false);

      setMaxMatchesFound(data.items.totalMatches);

      var new_matches = [];

      for(var key in data.items.games) {
        for(var i = 0; i < data.items.games[key].length; i++) {
          new_matches.push(data.items.games[key][i])
        }
      }
  
      var newMatches = currentMatches;

      for(var i = 0; i < new_matches.length; i++) {
        var dateDiff = getDifferenceInDays(new_matches[i].matchInfo.gameStartMillis, Date.now());
        moment.locale(router.query.lang);
        var startdate = moment();
        startdate = startdate.subtract(dateDiff, "days");
        var matchDate = startdate.format("D. MMMM");
  
        // Create array if it doesn't exist
        if(!newMatches[matchDate]) newMatches[matchDate] = [];
  
        newMatches[matchDate].push(new_matches[i]);
      }

      data.items.games = newMatches;

      if(data.errored == false && data.items.totalMatches > 0) {
        var playerstats = calculatePlayerStatsFromMatches(data.items.games, puuid);
        
        setAvgKillsPerMatch(playerstats.kills_per_match);
        setAvgKillsPerRound(playerstats.kills_per_round);
        setWinratePercent(playerstats.win_percentage);
        setHeadshotPercent(playerstats.headshot_percent);
  
        var map_stats = playerstats.map_stats;
        var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
          return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
        });

        console.log(sorted_map_stats);
  
        if(mapData) {
          var map_data = mapData
        } else {
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
          var map_data = await map_data_raw.json();
        }
  
        var best_map = map_stats[sorted_map_stats[0]];
        
        for(var i = 0; i < map_data.data.length; i++) {
          if(map_data.data[i].mapUrl == sorted_map_stats[0]) {
            setBestMapName(map_data.data[i].displayName);
            setBestMapImage('https://media.valorant-api.com/maps/' + map_data.data[i].uuid + '/splash.png', { 'Content-Type': 'application/json' });
          }
        }
        
        setBestMapWinPercent(best_map.map_win_percentage);
        setBestMapKdaRatio(best_map.map_kda_ratio);
  
        var agent_stats = playerstats.agent_stats;
        
        var sorted_agent_stats = Object.keys(agent_stats).sort(function(a, b) {
          return (parseInt(agent_stats[b].avg_match_score) - parseInt(agent_stats[a].avg_match_score)) + (parseInt(agent_stats[b].kills) - parseInt(agent_stats[a].kills)) + (agent_stats[b].wins - agent_stats[a].wins);
        });

        console.log(sorted_agent_stats);
  
        var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0] + '?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
        var agent_data = await agent_data_raw.json();
  
        setBestAgentName(agent_data.data.displayName);
        setBestAgentImage('https://media.valorant-api.com/agents/' + agent_data.data.uuid + '/displayiconsmall.png');
        setBestAgentAvgKda(agent_stats[sorted_agent_stats[0]].avg_kda_ratio);
        setBestAgentAvgScore(agent_stats[sorted_agent_stats[0]].avg_match_score);
        setBestAgentKillsPerRound(agent_stats[sorted_agent_stats[0]].kills_per_round);
        setBestAgentKillsPerMatch(agent_stats[sorted_agent_stats[0]].avg_kills_per_match);
  
        setCurrentlyLoadedMatchCount(currentlyLoadedMatchCount+5);
        setCurrentMatches(data.items.games);
        setLoading(false);
        setIsSilentLoading(false);
        setFetchingFurtherMatches(false);
        setMatchFetchingError(false);
        return;
      }
      return;
    }

    if(isSilentLoading === true) {
      var old_matches_data = await executeQuery(`SELECT * FROM matchIDCollection:⟨hub::${user_creds.uuid}⟩`);

      var old_matches = old_matches_data[0].matchIDs;
      
      if(old_matches.length === 0) {
        var new_matches_amount = 5;
      } else {
        var latest_old_matches = old_matches.slice(0, 5);
        
        // Get newest 4 Matches from Match history
        var data = await fetchMatches(0, 5, [], mode, user_creds.uuid, user_creds.region, router.query.lang, true);
        setMaxMatchesFound(data.items.totalMatches);
  
        var new_matches = [];
  
        for(var key in data.items.games) {
          for(var i = 0; i < data.items.games[key].length; i++) {
            new_matches.push(data.items.games[key][i]);
          }
        }
        
        if(new_matches.length === 0) return;

        new_matches.sort(function(a, b) {
          if(b.matchInfo === undefined) return a;
          if(a.matchInfo === undefined) return b;
          return b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis;
        });
  
        var latest_new_matches = new_matches.slice(0, 5);
  
        // Using Some Method
        const res2 = latest_old_matches.filter((match1) => !latest_new_matches.some(match2 => match1 === match2.matchInfo.matchId ));
        var new_matches_amount = res2.length;
      }

      if(new_matches_amount === 0) {
        setIsSilentLoading(false);
        return;
      } else if(new_matches_amount > 0 && new_matches_amount < 4) {
        fetchContractData(true);
    
        var new_old_matches = old_matches.slice(0, (15 - new_matches_amount));
        var new_new_matches = new_matches.slice(0, new_matches_amount);

        var allOldMatches = [];
        for(var i = 0; i < new_old_matches.length; i++) {
          var match = await executeQuery(`SELECT * FROM match:⟨${new_old_matches[i]}⟩`);
          allOldMatches.push(match[0]);
        }

        var newMatchesArray = new_new_matches.concat(allOldMatches);

        newMatchesArray.sort(function(a, b) {
          return b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis;
        });
  
        var newMatches = [];
  
        for(var i = 0; i < newMatchesArray.length; i++) {
          var dateDiff = getDifferenceInDays(newMatchesArray[i].matchInfo.gameStartMillis, Date.now());
          moment.locale(router.query.lang);
          var startdate = moment();
          startdate = startdate.subtract(dateDiff, "days");
          var matchDate = startdate.format("D. MMMM");
    
          // Create array if it doesn't exist
          if(!newMatches[matchDate]) newMatches[matchDate] = [];
    
          newMatches[matchDate].push(newMatchesArray[i]);
        }
  
        data.items.games = newMatches;
  
        if(data.errored == false && data.items.totalMatches > 0) {
          var obj = {};
  
          var dataToWrite = data;
          for(var key in dataToWrite.items.games) {
            obj[key] = dataToWrite.items.games[key];
          }
          dataToWrite.items.games = obj;
    
          var playerstats = calculatePlayerStatsFromMatches(data.items.games, puuid);
          console.log(playerstats);
          
          setAvgKillsPerMatch(playerstats.kills_per_match);
          setAvgKillsPerRound(playerstats.kills_per_round);
          setWinratePercent(playerstats.win_percentage);
          setHeadshotPercent(playerstats.headshot_percent);
          var map_stats = playerstats.map_stats;
          var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
            return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
          });
    
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
          var map_data = await map_data_raw.json();
    
          var best_map = map_stats[sorted_map_stats[0]];
          
          for(var i = 0; i < map_data.data.length; i++) {
            if(map_data.data[i].mapUrl == sorted_map_stats[0]) {
              setBestMapName(map_data.data[i].displayName);
              setBestMapImage('https://media.valorant-api.com/maps/' + map_data.data[i].uuid + '/splash.png', { 'Content-Type': 'application/json' });
            }
          }
          
          setBestMapWinPercent(best_map.map_win_percentage);
          setBestMapKdaRatio(best_map.map_kda_ratio);
    
          var agent_stats = playerstats.agent_stats;
        
          var sorted_agent_stats = Object.keys(agent_stats).sort(function(a, b) {
            return (parseInt(agent_stats[b].avg_match_score) - parseInt(agent_stats[a].avg_match_score)) + (parseInt(agent_stats[b].kills) - parseInt(agent_stats[a].kills)) + (agent_stats[b].wins - agent_stats[a].wins);
          });
    
          var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0] + '?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
          var agent_data = await agent_data_raw.json();
    
          setBestAgentName(agent_data.data.displayName);
          setBestAgentImage('https://media.valorant-api.com/agents/' + agent_data.data.uuid + '/displayiconsmall.png');
          setBestAgentAvgKda(agent_stats[sorted_agent_stats[0]].avg_kda_ratio);
          setBestAgentAvgScore(agent_stats[sorted_agent_stats[0]].avg_match_score);
          setBestAgentKillsPerRound(agent_stats[sorted_agent_stats[0]].kills_per_round);
          setBestAgentKillsPerMatch(agent_stats[sorted_agent_stats[0]].avg_kills_per_match);
    
          setCurrentMatches(data.items.games);
          setLoading(false);
          setIsSilentLoading(false);
          return;
        }
        return;
      } else if(new_matches_amount >= 4) {
        fetchContractData(true);
    
        setIsSilentLoading(false);
        fetchMatchesAndCalculateStats(true, 0, 15, mode, false, false, false);
        return;
      }
    }

    if(isFirstLoad === true) {
      var puuid = await getCurrentPUUID();
      var hubConfig = await executeQuery(`SELECT * FROM hubConfig:⟨${puuid}⟩`);
      var matchIDData = await executeQuery(`SELECT * FROM matchIDCollection:⟨hub::${puuid}⟩`);
  
      setCurrentlyLoadedMatchCount(hubConfig[0].loadedMatches);

      var matches = [];
      var newMatches = [];
      
      if(matchIDData[0].matchIDs.length === 0) return;

      for(var i = 0; i < matchIDData[0].matchIDs.length; i++) {
        var match = await executeQuery(`SELECT * FROM match:⟨${matchIDData[0].matchIDs[i]}⟩`);
        if(match[0] === undefined) continue;
        matches.push(match[0]);
      }

      if(matches.length === 0) {
        fetchMatchesAndCalculateStats(true, 0, 15, mode, false, false, false);
        return;
      };

      for(var i = 0; i < matches.length; i++) {
        var dateDiff = getDifferenceInDays(matches[i].matchInfo.gameStartMillis, Date.now());
        moment.locale(router.query.lang);
        var startdate = moment();
        startdate = startdate.subtract(dateDiff, "days");
        var matchDate = startdate.format("D. MMMM");
  
        // Create array if it doesn't exist
        if(!newMatches[matchDate]) newMatches[matchDate] = [];
  
        newMatches[matchDate].push(matches[i]);
      }

      var arr = [];

      for(var key in newMatches) {
        arr[key] = newMatches[key];
      }
      
      newMatches = arr;

      var playerstats = calculatePlayerStatsFromMatches(newMatches, puuid);
      console.log(playerstats);
        
      setAvgKillsPerMatch(playerstats.kills_per_match);
      setAvgKillsPerRound(playerstats.kills_per_round);
      setWinratePercent(playerstats.win_percentage);
      setHeadshotPercent(playerstats.headshot_percent);
      
      var map_stats = playerstats.map_stats;
      var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
        return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
      });

      var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
      var map_data = await map_data_raw.json();

      var best_map = map_stats[sorted_map_stats[0]];
      
      for(var i = 0; i < map_data.data.length; i++) {
        if(map_data.data[i].mapUrl == sorted_map_stats[0]) {
          setBestMapName(map_data.data[i].displayName);
          setBestMapImage('https://media.valorant-api.com/maps/' + map_data.data[i].uuid + '/splash.png', { 'Content-Type': 'application/json' });
        }
      }

      setBestMapWinPercent(best_map.map_win_percentage);
      setBestMapKdaRatio(best_map.map_kda_ratio);

      var agent_stats = playerstats.agent_stats;
        
      var sorted_agent_stats = Object.keys(agent_stats).sort(function(a, b) {
        return (parseInt(agent_stats[b].avg_match_score) - parseInt(agent_stats[a].avg_match_score)) + (parseInt(agent_stats[b].kills) - parseInt(agent_stats[a].kills)) + (agent_stats[b].wins - agent_stats[a].wins);
      });

      var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0] + '?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
      var agent_data = await agent_data_raw.json();

      setBestAgentName(agent_data.data.displayName);
      setBestAgentImage('https://media.valorant-api.com/agents/' + agent_data.data.uuid + '/displayiconsmall.png');
      setBestAgentAvgKda(agent_stats[sorted_agent_stats[0]].avg_kda_ratio);
      setBestAgentAvgScore(agent_stats[sorted_agent_stats[0]].avg_match_score);
      setBestAgentKillsPerRound(agent_stats[sorted_agent_stats[0]].kills_per_round);
      setBestAgentKillsPerMatch(agent_stats[sorted_agent_stats[0]].avg_kills_per_match);

      setCurrentMatches(newMatches);
      setLoading(false);
      setIsSilentLoading(true);
      return;
    } else {
      setLoading(true);
      setErrored(false);
  
      setChartsLoading(true);
      setChartsError(false);
  
      setAreChartsActive(true);
      setAreStatsActive(true);
  
      setAvgKillsPerMatch('');
      setAvgKillsPerRound('');
      setWinratePercent('');
      setHeadshotPercent('');
      setBestMapName('');
      setBestMapImage('');
      setBestMapWinPercent('');
      setBestMapKdaRatio('');
      setBestAgentName('');
      setBestAgentImage('');
      setBestAgentAvgScore('');
      setBestAgentAvgKda('');
      setBestAgentKillsPerRound('');
      setBestAgentKillsPerMatch('');
  
      setCurrentlyLoadedMatchCount(0);
      setMaxMatchesFound(0);
  
      setHeadshotPercentagesOfLast5([]);
      setAdrOfLast5([]);
      setKdOfLast5([]);
    
      setHeadshotChartData([]);
      setDamageChartData([]);
      setKillsDeathsChartData([]);
  
      if(isNewQueue) {
        await updateThing(`matchIDCollection:⟨hub::${puuid}⟩`, {
          matchIDs: []
        });
        var data = await fetchMatches(beginIndex, endIndex, [], mode, user_creds.uuid, user_creds.region, router.query.lang, false);
      } else {
        var data = await fetchMatches(beginIndex, endIndex, currentMatches, mode, user_creds.uuid, user_creds.region, router.query.lang, false);
      }
  
      setCurrentlyLoadedMatchCount(data.items.endIndex);
      setMaxMatchesFound(data.items.totalMatches);
  
      if(data.errored == false && data.items.totalMatches > 0) {
        var obj = {};

        var dataToWrite = data;
        for(var key in dataToWrite.items.games) {
          obj[key] = dataToWrite.items.games[key];
        }
        dataToWrite.items.games = obj;
  
        var playerstats = calculatePlayerStatsFromMatches(data.items.games, puuid);
        console.log(playerstats);
        
        setAvgKillsPerMatch(playerstats.kills_per_match);
        setAvgKillsPerRound(playerstats.kills_per_round);
        setWinratePercent(playerstats.win_percentage);
        setHeadshotPercent(playerstats.headshot_percent);
  
        var map_stats = playerstats.map_stats;
        var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
          return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
        });
  
        var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
        var map_data = await map_data_raw.json();
  
        var best_map = map_stats[sorted_map_stats[0]];
        
        for(var i = 0; i < map_data.data.length; i++) {
          if(map_data.data[i].mapUrl == sorted_map_stats[0]) {
            setBestMapName(map_data.data[i].displayName);
            setBestMapImage('https://media.valorant-api.com/maps/' + map_data.data[i].uuid + '/splash.png', { 'Content-Type': 'application/json' });
          }
        }
  
        setBestMapWinPercent(best_map.map_win_percentage);
        setBestMapKdaRatio(best_map.map_kda_ratio);
  
        var agent_stats = playerstats.agent_stats;
        
        var sorted_agent_stats = Object.keys(agent_stats).sort(function(a, b) {
          return (parseInt(agent_stats[b].avg_match_score) - parseInt(agent_stats[a].avg_match_score)) + (parseInt(agent_stats[b].kills) - parseInt(agent_stats[a].kills)) + (agent_stats[b].wins - agent_stats[a].wins);
        });
  
        var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0] + '?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
        var agent_data = await agent_data_raw.json();
  
        setBestAgentName(agent_data.data.displayName);
        setBestAgentImage('https://media.valorant-api.com/agents/' + agent_data.data.uuid + '/displayiconsmall.png');
        setBestAgentAvgKda(agent_stats[sorted_agent_stats[0]].avg_kda_ratio);
        setBestAgentAvgScore(agent_stats[sorted_agent_stats[0]].avg_match_score);
        setBestAgentKillsPerRound(agent_stats[sorted_agent_stats[0]].kills_per_round);
        setBestAgentKillsPerMatch(agent_stats[sorted_agent_stats[0]].avg_kills_per_match);
  
        setCurrentMatches(data.items.games);
        setLoading(false);
      } else if(data.items.totalMatches === 0) {
        setCurrentMatches([]);
        setLoading(false);
        setAreStatsActive(false);
  
        setChartsLoading(false);
        setAreChartsActive(false);
      } else {
        setLoading(false);
        setErrored(true);
  
        setChartsError(true);
        setChartsLoading(false);
      }
    }
  }

  const fetchContractData = async (refetch) => {
    var user_creds = await getCurrentUserData();
    var contractData = await executeQuery(`SELECT * FROM hubContractProgress:⟨${user_creds.uuid}⟩`);

    try {
      if(refetch === false && contractData[0]) {
        var contract_progress = contractData[0];
      } else {
        var version_data = await (await fetch('https://valorant-api.com/v1/version')).json();
    
        const bearer = await getUserAccessToken();
  
        const entitlement_token = await getUserEntitlement();
  
        var contract_progress = await calculateContractProgress(user_creds.region, user_creds.uuid, bearer, entitlement_token, version_data.data.riotClientVersion, router.query.lang);
      }
    
      setAgentContract_prevLevelNum(contract_progress.agentContractProgress.current_level.levelNum);
      setAgentContract_prevLevelReward(contract_progress.agentContractProgress.current_level.reward);
      setAgentContract_currentLevelNum(contract_progress.agentContractProgress.next_level.levelNum);
      setAgentContract_currentLevelReward(contract_progress.agentContractProgress.next_level.reward);
      setAgentContract_maxXP(contract_progress.agentContractProgress.totalXPneeded);
      setAgentContract_currentXP(contract_progress.agentContractProgress.currentXPowned);
    
      setBattlePass_prevLevelNum(contract_progress.battlePassProgress.current_level.levelNum);
      setBattlePass_prevLevelReward(contract_progress.battlePassProgress.current_level.reward);
      setBattlePass_currentLevelNum(contract_progress.battlePassProgress.next_level.levelNum);
      setBattlePass_currentLevelReward(contract_progress.battlePassProgress.next_level.reward);
      setBattlePass_maxXP(contract_progress.battlePassProgress.totalXPneeded);
      setBattlePass_currentXP(contract_progress.battlePassProgress.currentXPowned);
  
      setContractsLoading(false);
      setContractsError(false);
    } catch(e) {
      console.log(e);
      setContractsLoading(false);
      setContractsError(true);
    }
  }

  const calculateMatchStats = (match) => {
    var gameStartUnix = match.matchInfo.gameStartMillis;
    var gameLengthMS = match.matchInfo.gameLengthMillis;
    var gameMode = match.matchInfo.queueID;
    var gameServer = match.matchInfo.gamePodId;
    var gameVersion = match.matchInfo.gameVersion;

    /* MATCH INFO */
    var winningTeamScore;
    var losingTeamScore;
    
    for(var i = 0; i < match.teams.length; i++) {
      if(match.teams[i].won == true) {
        var winning_team = match.teams[i].teamId;
        winningTeamScore = match.teams[i].numPoints;
      } else {
        losingTeamScore = match.teams[i].numPoints;
      }
    }

    if((!winningTeamScore && winningTeamScore !== 0) || (!losingTeamScore && losingTeamScore !== 0)) {
      var winning_team = 'draw';
    }

    /* MAP INFO */
    for(var i = 0; i < mapData.data.length; i++) {
      if(mapData.data[i].mapUrl == match.matchInfo.mapId) {
        var mapName = mapData.data[i].displayName;
        var mapUUID = mapData.data[i].uuid;
      }
    }

    /* PLAYER STATS */
    for(var i = 0; i < match.players.length; i++) {
      var homenameTag = `${userCreds.name}#${userCreds.tag}`;
      
      if(match.players[i].subject == userCreds.uuid) {
        var playerInfo = match.players[i];
        var playerCurrentTier = match.players[i].competitiveTier;
        var rankFixed = ranks[playerCurrentTier];
      }
    }

    if(playerInfo) {
      var uuid = playerInfo.subject;
      var playerTeam = playerInfo.teamId;

      if(playerTeam == winning_team) {
        var matchOutcome = "VICTORY";
        var matchOutcomeColor = 'text-val-blue val-blue-glow';
        var matchScore = winningTeamScore + ' - ' + losingTeamScore;
      } else if(winning_team == 'draw') {
        var matchOutcome = "DRAW";
        var matchOutcomeColor = 'text-val-yellow val-yellow-glow';

        if(!winningTeamScore) {
          winningTeamScore = losingTeamScore;
        } else if(!losingTeamScore) {
          losingTeamScore = winningTeamScore;
        }
        var matchScore = winningTeamScore + ' - ' + losingTeamScore;
      } else {
        var matchOutcome = "DEFEAT";
        var matchOutcomeColor = 'text-val-red val-red-glow';
        var matchScore = losingTeamScore + ' - ' + winningTeamScore;
      }

      var playerAgent = playerInfo.characterId; 

      var playerKills = playerInfo.stats.kills;
      var playerDeaths = playerInfo.stats.deaths;
      var playerAssists = playerInfo.stats.assists;

      var playerKdRaw = playerKills / playerDeaths;
      var playerKD = playerKdRaw.toFixed(2);

      var playerScore = playerInfo.stats.score;
      var playerACS = playerScore / match.roundResults.length;
      var playerACS = playerACS.toFixed(0);

      if(kdOfLast5.length < 5) {
        setKdOfLast5(current => [...current, playerKD ])
      }

      if(playerKD >= 1) {
        var playerKdColor = 'text-val-blue';
      } else {
        var playerKdColor = 'text-val-red';
      }
      
      /* SCOREBOARD POSITION */
      var players = match.players;
      players.sort(function(a, b) {
        return b.stats.score - a.stats.score;
      });
      
      var playerPosition = players.findIndex(player => player.subject == uuid) + 1;

      if(playerPosition == 1) {
        // Player is Match MVP
        var playerPositionColor = 'yellow-glow text-yellow-300 font-medium';
        var playerPositionText = 'Match MVP';
      } else {
        // Player is not Match MVP, check for Team MVP
        var teamPlayers = [];
        for(var i = 0; i < players.length; i++) {
          if(players[i].teamId == playerTeam) {
            teamPlayers.push(players[i]);
          }
        }

        var teamPlayerPosition = teamPlayers.findIndex(player => player.subject == uuid) + 1;

        if(teamPlayerPosition == 1) {
          // Player is Team MVP
          var playerPositionColor = 'silver-glow text-gray-300 font-medium';
          var playerPositionText = 'Team MVP';
        } else {
          // Player is not Team MVP
          var playerPositionColor = 'font-medium';

          if(playerPosition == 2) var playerPositionText = `${playerPosition}nd`;
          else if(playerPosition == 3) var playerPositionText = `${playerPosition}rd`;
          else var playerPositionText = `${playerPosition}th`;
        }
      }
      var playerHeadShots = 0;
      var playerBodyShots = 0;
      var playerLegShots = 0;

      var totalDamage = 0;

      for(var i = 0; i < match.roundResults.length; i++) {
        for(var i2 = 0; i2 < match.roundResults[i].playerStats.length; i2++) {
          if(match.roundResults[i].playerStats[i2].subject == uuid) {
            for(var i3 = 0; i3 < match.roundResults[i].playerStats[i2].damage.length; i3++) {
              playerHeadShots += match.roundResults[i].playerStats[i2].damage[i3].headshots;
              playerBodyShots += match.roundResults[i].playerStats[i2].damage[i3].bodyshots;
              playerLegShots += match.roundResults[i].playerStats[i2].damage[i3].legshots;

              totalDamage += match.roundResults[i].playerStats[i2].damage[i3].damage;
            }
          }
        }
      }

      // Calculate HS%
      var totalShotsHit = playerHeadShots + playerBodyShots + playerLegShots;

      var headShotsPercent = (playerHeadShots / totalShotsHit) * 100;
      var headShotsPercentRounded = headShotsPercent.toFixed(0);

      var bodyShotsPercent = (playerBodyShots / totalShotsHit) * 100;
      var bodyShotsPercentRounded = bodyShotsPercent.toFixed(0);

      var legShotsPercent = (playerLegShots / totalShotsHit) * 100;
      var legShotsPercentRounded = legShotsPercent.toFixed(0);

      if(headshotPercentagesOfLast5.length < 5) {
        setHeadshotPercentagesOfLast5(current => [...current, headShotsPercentRounded ])
      }

      // Calculate ADR
      var averageDamage = totalDamage / match.roundResults.length;
      var averageDamageRounded = averageDamage.toFixed(0);

      if(adrOfLast5.length < 5) {
        setAdrOfLast5(current => [...current, averageDamageRounded ])
      }

      // Calculate First Bloods. 
      // For every round, add all kills to an array. Filter out the earliest kill with the "roundTime" key. If the killer's PUUID is the same as the players, add a FB.
      var playerFBs = 0;
      for(var i = 0; i < match.roundResults.length; i++) {
        var totalRoundKills = [];
        for(var j = 0; j < match.roundResults[i].playerStats.length; j++) {
          for(var k = 0; k < match.roundResults[i].playerStats[j].kills.length; k++) {
            totalRoundKills.push(match.roundResults[i].playerStats[j].kills[k]);
          }
        }
        
        totalRoundKills.sort(function(a, b) {
          return a.roundTime - b.roundTime;
        });

        var firstRoundKill = totalRoundKills[0];
        if(firstRoundKill && firstRoundKill.killer == uuid) {
          playerFBs++;
        }
      }
    }

    var matchData = {
      playerAgent, 
      uuid,
      homenameTag,
      mapName, 
      playerCurrentTier, 
      rankFixed, 
      matchOutcomeColor, 
      matchOutcome, 
      matchScore, 
      playerPositionColor, 
      playerPositionText, 
      playerKills, 
      playerDeaths, 
      playerAssists, 
      playerKdColor, 
      playerKD, 
      headShotsPercentRounded, 
      averageDamageRounded,
      playerACS,
      matchUUID: match.matchInfo.matchId,
    }

    var playerKDA = playerKills + '/' + playerDeaths + '/' + playerAssists
    
    var matchViewData = {
      matchScore, matchOutcome, mapUUID, mapName, gameStartUnix, gameLengthMS, gameMode, gameServer, gameVersion,
      name: homenameTag.split("#")[0], uuid, playerTeam, playerAgent, playerKD, playerKDA, playerKD, playerScore, playerACS, playerKillsPerRound: averageDamageRounded, playerCurrentTier, rankFixed, headShotsPercentRounded, bodyShotsPercentRounded, legShotsPercentRounded, playerPositionText, playerPosition, playerFBs
    }

    return { matchData, matchViewData };
  }

  const fetchFurtherMatches = async () => {
    setFetchingFurtherMatches(true);
    setMatchFetchingError(false);

    fetchMatchesAndCalculateStats(false, currentlyLoadedMatchCount, currentlyLoadedMatchCount + 5, activeQueueTab, false, false, true, currentMatches);
  }

  const toggleMatchInFavs = async (MatchID, isFav) => {
    var favMatches = await executeQuery(`SELECT * FROM matchIDCollection:⟨favMatches::${userCreds.uuid}⟩`);
    if(!isFav) {
      await updateThing(`matchIDCollection:⟨favMatches::${userCreds.uuid}⟩`, {
        "matchIDs": [
          ...favMatches[0].matchIDs,
          MatchID
        ]
      });

      setFavMatches([...favMatches[0].matchIDs, MatchID]);
    } else {
      await removeMatch('favMatches', MatchID);
    }
  }
  
  React.useEffect(async () => {
    ipcRenderer.send('changeDiscordRP', "hub_activity");

    var user_creds = await getCurrentUserData();
    setUserCreds(user_creds);

    var favs_data = await executeQuery(`SELECT * FROM matchIDCollection:⟨favMatches::${user_creds.uuid}⟩`);

    setFavMatches(favs_data[0].matchIDs);

    var map_data_raw = await fetch('https://valorant-api.com/v1/maps', { 'Content-Type': 'application/json' });
    var map_data = await map_data_raw.json();
    setMapData(map_data);

    var uuid = uuidv5("hubMatchFilter", process.env.SETTINGS_UUID);
    var result = await executeQuery(`SELECT * FROM setting:⟨${uuid}⟩`);

    setActiveQueueTab(result[0].value);

    if(!result[0].value || result[0].value === "") {
      await fetchMatchesAndCalculateStats(true, 0, 15, 'unrated', true);
      await fetchMatchesAndCalculateStats(true, 0, 15, 'unrated', false, true);
    } else {
      try {
        await fetchMatchesAndCalculateStats(true, 0, 15, result[0].value, true);
        await fetchMatchesAndCalculateStats(true, 0, 15, result[0].value, false, true);
      } catch(e) {
        console.log(e);
      }
    }

    return () => {
      setLoading(true);
      setErrored(false);
      setFetchingFurtherMatches(false);
      setMatchFetchingError(false);
    }
  }, []);

  React.useEffect(async () => {
    const refetchFeaturedBundle = async () => {
      var featured_bundle = await (await fetch(`https://beta-api.valtracker.gg/v1/bundles/featured`, { headers: { "x-valtracker-lang": APIi18n(router.query.lang) } })).json();
      
      setFeaturedBundleName(featured_bundle.data.name);
      setFeaturedBundlePrice(featured_bundle.data.price);
      setFeaturedBundleImage(featured_bundle.data.displayIcon);
      
      await updateThing(`featuredBundle:⟨${process.env.SERVICE_UUID}⟩`, featured_bundle.data);
    }

    var old_featured_bundle = await executeQuery(`SELECT * FROM featuredBundle:⟨${process.env.SERVICE_UUID}⟩`);

    if(Date.now() < old_featured_bundle[0].expiry_date) {
      setFeaturedBundleName(old_featured_bundle[0].name);
      setFeaturedBundlePrice(old_featured_bundle[0].price);
      setFeaturedBundleImage(old_featured_bundle[0].displayIcon);
    } else {
      refetchFeaturedBundle();
    }
  }, []);

  React.useEffect(async () => {
    if(!firstRender) {
      if(isPrefChange === true) {
        setIsPrefChange(false);
      } else {
        var uuid = uuidv5("hubMatchFilter", process.env.SETTINGS_UUID);
        await updateThing(`setting:⟨${uuid}⟩`, {
          "name": "hubMatchFilter",
          "value": activeQueueTab,
          "type": "app"
        });
  
        fetchMatchesAndCalculateStats(true, 0, 15, activeQueueTab, false);
      }
    }
  }, [ activeQueueTab ]);

  React.useEffect(async () => {
    return () => {
      setContractsLoading(true);
      setContractsError(false);
    }
  }, []);

  React.useEffect(() => {
    if(!firstRender && headshotPercentagesOfLast5.length > 0) {
      var headshotData = headshotPercentagesOfLast5.slice(0, 8);
      var adrData = adrOfLast5.slice(0, 8);
      var kdData = kdOfLast5.slice(0, 8);

      var headshotChartData = [];
      var adrChartData = [];
      var kdChartData = [];

      headshotData.forEach((hs, index) => {
        var obj = {
          match: headshotData.length - index,
          stat: parseFloat(hs)
        };
        headshotChartData.push(obj);
      });

      adrData.forEach((adr, index) => {
        var obj = {
          match: adrData.length - index,
          stat: parseFloat(adr)
        };
        adrChartData.push(obj);
      });

      kdData.forEach((kd, index) => {
        var obj = {
          match: kdData.length - index,
          stat: parseFloat(kd)
        };
        kdChartData.push(obj);
      });

      setHeadshotChartData(headshotChartData);
      setDamageChartData(adrChartData);
      setKillsDeathsChartData(kdChartData);

      setChartsLoading(false);
      setChartsError(false);
    }
    
    return () => {
      setChartsLoading(true);
      setChartsError(false);
    }
  }, [ headshotPercentagesOfLast5, adrOfLast5, kdOfLast5 ]);

  React.useEffect(() => {
    ipcRenderer.on("hub_smartLoadNewMatches", async function(event, args) {
      fetchContractData(true);
      if(args !== 'newmap' && args !== 'snowball' && args !== '') {
        if(args === activeQueueTab) {
          await fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false);
        } else {
          setActiveQueueTab(args);
          await fetchMatchesAndCalculateStats(true, 0, 15, args, false);
        }
      }
    });
  }, []);

  React.useEffect(async () => {
    if(!firstRender) {
      try {
        var ranksRaw = await(await fetch('https://valorant-api.com/v1/competitivetiers?language=' + APIi18n(router.query.lang))).json()
        setRanks(ranksRaw.data[ranksRaw.data.length-1].tiers);
      } catch(e) {
        console.log(e);
      }
    }
  }, [ router.query ]);

  React.useEffect(() => {
    document.body.setAttribute("lang", router.query.lang);
    fetchContractData(false);
  }, [ router.query ]);

  return (
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <div id='home-container' className='flex flex-row flex-wrap'>
        <div id='top-left-container' className='relative rounded flex flex-wrap'>
          <div className='home-top-info-tile border rounded border-maincolor-dim h-full p-1 relative'>
            <div className='flex flex-col h-full'>
              <div>
                <span className='leading-none px-1 font-bold'>{LocalText(L, "top_l.bundle_header")} - {featuredBundleName}</span>
              </div>
              <div className='flex w-full relative max-h-full my-auto justify-center items-center overflow-hidden border border-tile-color rounded shadow-img h-[calc(100%-28px)]'>
                <div className='relative h-full'>
                  <img src={featuredBundleImage ? featuredBundleImage : '/images/bundle_invisible.png'} className='shadow-img rounded object-cover min-h-full' />
                </div>
                {
                  featuredBundlePrice ?
                  <div 
                    id='bundle-price'
                    className='text-xl text-gray-300 flex flex-row items-center absolute bottom-2 left-2 bg-opacity-60 bg-black rounded px-2 py-1'
                  >
                    <span className='relative top-px'>{featuredBundlePrice}</span>
                    <img src="/images/vp_icon.png" className='w-6 ml-2 transition-opacity duration-100 ease-in shadow-img' />
                  </div>
                  :
                  null
                }
              </div>
            </div>
          </div>
          <div className='home-top-info-tile relative border rounded border-maincolor-dim flex flex-col'>
            <Tooltip content={LocalText(L, "top_l.contracts.loading_tooltip")} color="error" placement={'left'} className='rounded absolute top-4 right-7'>
              <div className={'absolute -top-2.5 -right-5 w-6 h-6 z-30 ' + (isSilentLoading ? '' : 'hidden')}>
                <Loading color={'error'} size={'sm'} />
              </div>
            </Tooltip>
            <Reload 
              className={`w-5 h-5 absolute top-2 right-2 cursor-pointer ${isSilentLoading === true || contractsLoading === true || contractsError === true ? "hidden" : ""}`}
              onClick={() => {
                setContractsLoading(true);
                setIsSilentLoading(true);
                fetchContractData(true);
              }}
            />
            <div className={'flex flex-col h-full p-1 ' + (contractsError ? 'hidden' : '')}>
              <ContractProgressCard 
                title={LocalText(L, "top_l.contracts.battle_pass_header")} 
                level_locale={LocalText(L, "top_l.contracts.level_text")}
                xp_locale={LocalText(L, "top_l.contracts.xp_text")}
                reward_1={battlePass_prevLevelReward} 
                level_1={battlePass_prevLevelNum}
                level_1_isTextReward={battlePass_prevLevelReward ? battlePass_prevLevelReward.isText : null}
                progress_max={battlePass_maxXP}
                progress_value={battlePass_currentXP}
                reward_2={battlePass_currentLevelReward}
                level_2={battlePass_currentLevelNum}
                level_2_isTextReward={battlePass_currentLevelReward ? battlePass_currentLevelReward.isText : null}
                isVisible={!contractsLoading}
                loading={loading}
              />

              <hr className='bg-maincolor-dim h-px border-none' />

              <ContractProgressCard 
                title={LocalText(L, "top_l.contracts.agent_contract_header")}
                level_locale={LocalText(L, "top_l.contracts.level_text")}
                xp_locale={LocalText(L, "top_l.contracts.xp_text")}
                reward_1={agentContract_prevLevelReward}
                level_1={agentContract_prevLevelNum}
                level_1_isTextReward={agentContract_prevLevelReward ? agentContract_prevLevelReward.isText : null}
                progress_max={agentContract_maxXP}
                progress_value={agentContract_currentXP}
                reward_2={agentContract_currentLevelReward}
                level_2={agentContract_currentLevelNum}
                level_2_isTextReward={agentContract_currentLevelReward ? agentContract_currentLevelReward.isText : null}
                isVisible={!contractsLoading}
                loading={loading}
              />
            </div>
            <div className={'w-full mr-auto h-full absolute top-0 left-0 ' + (contractsLoading || contractsError ? 'flex' : 'hidden')}>
              <div
                className={'flex flex-col w-full h-4/5 justify-center items-center text-center ' + (contractsError ? ' ' : 'hidden ') + (contractsLoading ? 'hidden' : '')}
              >
                <div>{LocalText(L, "component_err.err_text")}</div>
                <button 
                  className='mt-2 button default' 
                  onClick={async () => {
                    fetchContractData(true);
                  }}
                >
                  {LocalText(L, "component_err.button_text")}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div id='top-right-container' className='relative overflow-y-auto rounded p-1.5 border border-maincolor-dim'>
          <div className={'flex-row items-center justify-center h-full ' + (chartsLoading || chartsError ? 'hidden ' : 'flex') + (areChartsActive ? '' : ' hidden')}>
            <AwesomeSlider 
              className={'AwesomeSliderMainContainer rounded h-full z-10'}
            >
              <div>
                <InfoChart
                  label={LocalText(L, "top_r.headers.h_1")}
                  data={headshotChartData}
                  LocalLatest={LocalText(L, "top_r.latest_text")}
                />
              </div>
              <div>
                <InfoChart
                  label={LocalText(L, "top_r.headers.h_2")}
                  data={damageChartData}
                  LocalLatest={LocalText(L, "top_r.latest_text")}
                />
              </div>
              <div>
                <InfoChart
                  label={LocalText(L, "top_r.headers.h_3")}
                  data={killsDeathsChartData}
                  LocalLatest={LocalText(L, "top_r.latest_text")}
                />
              </div>
            </AwesomeSlider>
          </div>
          <div
            className={'absolute top-0 left-0 z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (chartsError ? ' ' : 'hidden ') + (chartsLoading ? 'hidden' : '')}
          >
            <div>{LocalText(L, "component_err.err_text")}</div>
            <button 
              className='mt-2 button default' 
              onClick={async () => { 
                fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false);
              }}
            >
              {LocalText(L, "component_err.button_text")}
            </button>
          </div>
          <div
            className={'absolute top-0 left-0 z-20 flex w-full h-4/5 justify-center items-center ' + (chartsError ? 'hidden ' : ' ') + (chartsLoading ? '' : 'hidden')}
          >
            <Loading color={'error'} size={'lg'} />
          </div>
          <div
            className={'absolute top-0 left-0 z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (areChartsActive ? 'hidden ' : ' ')}
          >
            <div>{LocalText(L, "bot_l.errors.no_matches_found")}</div>
          </div>
        </div>
        <div id='bottom-left-container' className='relative overflow-y-auto rounded p-1 border border-maincolor-dim'>
          <div 
            id='match-timeline' 
            className={
              'relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1 ' 
              + (loading || errored ? 'hidden' : '')
              + (currentlyLoadedMatchCount <= 0 ? ' disabled hidden ' : ' ')
            }
          >
            <Tooltip content={LocalText(L, "bot_l.loading_tooltip")} color="error" placement={'left'} className='rounded absolute top-2 right-7'>
              <div className={'absolute -top-2 -right-5 w-6 h-6 z-30 ' + (isSilentLoading ? '' : 'hidden')}>
                <Loading color={'error'} size={'sm'} />
              </div>
            </Tooltip>
            {currentlyLoadedMatchCount > 0 ?
              Object.keys(currentMatches).map((key, index) => {
                moment.locale(router.query.lang);
                var startdate = moment();
                var today = startdate.format("D. MMMM");
                return (
                  <div className='day relative' key={index}>
                    <div id='day-header' className='text-lg ml-4 day-header font-bold'>{today === key ? 'Today' : key}</div>
                    {currentMatches[key].map((match, index) => {
                      var { matchData, matchViewData } = calculateMatchStats(match);

                      return (
                        <div 
                          id='match'
                          className='group relative flex flex-row h-20 border p-1.5 mb-2 border-tile-color bg-tile-color bg-opacity-20 rounded mr-2 hover:bg-opacity-50 active:bg-opacity-0 cursor-default transition-all duration-100 ease-linear' 
                          key={index}
                          onClick={(e) => {
                            if(e.target.tagName !== "G" && e.target.tagName !== "SVG" && e.target.tagName !== "LINE" && e.target.tagName !== "g" && e.target.tagName !== "svg" && e.target.tagName !== "line" && e.target.tagName !== "path") {
                              var Blue = [];
                              var Red = [];
                              for(var i = 0; i < match.players.length; i++) {
                                if(match.players[i].teamId == "Blue") {
                                  Blue.push(match.players[i].subject);
                                } else if(match.players[i].teamId == "Red") {
                                  Red.push(match.players[i].subject);
                                }
                              }
                              sessionStorage.setItem("knownMatchData", JSON.stringify(matchViewData));
                              sessionStorage.setItem("roundData", JSON.stringify(match.roundResults));
                              sessionStorage.setItem("teamData", JSON.stringify({ Blue, Red }));
                              sessionStorage.setItem("playerData", JSON.stringify(match.players));
                              router.push(`/matchview?isDeathmatch=${activeQueueTab == 'deathmatch'}&isRanked=${activeQueueTab == 'competitive'}&lang=${router.query.lang}`);
                            }
                          }}
                        >
                          <div className='matchview-gradient-overlay'>
                            <div className='absolute top-0 left-3 flex flex-row z-40 w-1/6 h-full items-center'>
                              {
                                favMatches.find(x => x === match.matchInfo.matchId) !== undefined ?
                                <StarFilled 
                                  color 
                                  className='w-6 h-6 ml-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-100 ease-linear relative right-3'
                                  click={() => { toggleMatchInFavs(match.matchInfo.matchId, true) }} 
                                />
                                :
                                <Star 
                                  color 
                                  className='w-6 h-6 ml-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-100 ease-linear relative right-3'
                                  click={() => { toggleMatchInFavs(match.matchInfo.matchId, false) }} 
                                />
                              }
                            </div>
                          </div>
                          
                          <div className='w-1/3 flex flex-row'>
                            <div id='agent-img'>
                              <img className='h-full shadow-img group-hover:opacity-30 transition-all duration-100 ease-linear' src={matchData.playerAgent ? `https://media.valorant-api.com/agents/${matchData.playerAgent}/displayicon.png` : ''} />
                            </div>
                            <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                              <span className='text-lg font-semibold'>{matchData.mapName}</span>
                              <span className='text-base font-light flex flex-row items-center'> 
                                <Tooltip 
                                  content={matchData.playerCurrentTier > 3 && matchData.rankFixed !== undefined ? matchData.rankFixed.tierName : ''}
                                  color="error" 
                                  placement={'top'} 
                                  className={'rounded'}
                                >
                                  {
                                    activeQueueTab == 'competitive' ? 
                                    <img 
                                      src={
                                        matchData.playerCurrentTier ? 
                                        `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${matchData.playerCurrentTier}/smallicon.png`
                                        :
                                        `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                                      } 
                                      className={
                                        'w-7 scale-75 shadow-img '
                                        +
                                        (activeQueueTab == 'competitive' ?
                                          `w-10`
                                          :
                                          ''
                                        )
                                      }
                                    />
                                    :
                                    <ValIconHandler icon={'/images/standard.png'} classes={'w-7 scale-75 shadow-img'} />
                                  }
                                </Tooltip>
                                <span>{LocalText(L, "bot_l.gamemodes." + match.matchInfo.queueID)}</span>
                              </span>
                            </div>
                          </div>
                          <div id='match-score' className='w-1/3 flex flex-row items-center'>
                            <div id='scoreline' className='flex flex-col text-center w-1/2'>
                              <span className={'text-xl font-semibold outcome-text ' + matchData.matchOutcomeColor}>{LocalText(L, "bot_l.match_outcomes." + matchData.matchOutcome)}</span>
                              {activeQueueTab != 'deathmatch' ? (<span className='text-lg'>{matchData.matchScore}</span>) : ''}
                            </div>
                            {activeQueueTab != 'deathmatch' ? 
                              (
                                <div 
                                  id='scoreboard-pos' 
                                  className={'rounded text-base h-8 py-0.5 px-1 ml-7 font-light ' + matchData.playerPositionColor}
                                >
                                  {LocalText(L, "bot_l.match_pos." + (matchData.playerPositionText.replace(" ", "-")))}
                                </div>
                              )
                              : 
                              ''
                            }
                          </div>
                          <div id='match-stats-1' className='w-1/3 flex flex-row items-center pl-4'>
                            <div id='left-side' className='flex flex-col'>
                              <span className='text-lg'>KDA</span>
                              <span className='text-lg font-light'>KD</span>
                            </div>
                            <div id='right-side' className='flex flex-col ml-4'>
                              <div className='text-lg' id='kda-display'>
                                <span className='kda-display-span'>{matchData.playerKills}</span> 
                                <span className='kda-display-span'>{matchData.playerDeaths}</span>
                                <span className=''>{matchData.playerAssists}</span>
                              </div>
                              <div className='text-lg font-light ml-2' id='score-display'>
                              <span className={matchData.playerKdColor}>{matchData.playerKD}</span>
                              </div>
                            </div>
                          </div>
                          <div id='match-stats-2' className='w-1/6 flex flex-row items-center'>
                            {
                              activeQueueTab != 'deathmatch' ?
                              (
                                <>
                                  <div className='w-1/2 flex flex-col items-center'>
                                    <span className='text-lg'>HS%</span> 
                                    <span className='text-lg font-light text-gray-500'>{matchData.headShotsPercentRounded}%</span>
                                  </div>
                                  <div className='w-1/2 flex flex-col items-center'>
                                    <span className='text-lg'>ACS</span>
                                    <span className='text-lg font-light text-gray-500'>{matchData.playerACS}</span>
                                  </div>
                                </>
                              )
                              :
                              (
                                ''
                              )
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
              :
              <span>{LocalText(L, "bot_l.errors.no_matches_found")}</span>
            }
          </div>
          <div className={'' + (loading || errored || currentlyLoadedMatchCount <= 0 ? 'hidden' : '')}>
            <div id='match-loading-error' className={'mt-4 ml-6 w-full flex flex-row justify-center ' + (matchFetchingError ? '' : 'hidden')}>
              <span id='' className='text-gray-500'>{LocalText(L, "bot_l.errors.err_while_fetching")}</span>
            </div>
            <div id='shown-matches-info' className={'mt-4 ml-6 w-1/2 flex flex-row justify-between ' + (fetchingFurtherMatches ? 'hidden' : '')}>
              <span id='x-out-of-n-matches' className='text-gray-500'>
                {LocalText(L, "bot_l.bottom_text.loaded_matches_count", (currentlyLoadedMatchCount > maxMatchesFound ? maxMatchesFound : currentlyLoadedMatchCount), maxMatchesFound)}
              </span>
              <span id='load-more-matches' className={'hover:underline mb-8 ' + (fetchingFurtherMatches ? 'cursor-wait' : 'cursor-pointer')} onClick={() => { fetchingFurtherMatches ? '' : fetchFurtherMatches() }}>{LocalText(L, "bot_l.bottom_text.load_more")}</span>
            </div>
            <div className={'w-full flex mt-8 h-14 mb-6 justify-center items-center ' + (fetchingFurtherMatches || matchFetchingError ? '' : 'hidden')}>
              <Loading color={'error'} size={'lg'} />
            </div>
          </div>
          <div 
            id='errored' 
            className={'z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (errored ? ' ' : 'hidden ') + (loading ? 'hidden' : '')}
          >
            <div>{LocalText(L, "component_err.err_text")}</div>
            <button 
              className='mt-2 button default' 
              onClick={async () => { 
                fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false);
              }}
            >
              {LocalText(L, "component_err.button_text")}
            </button>
          </div>
          <div 
            id='loading' 
            className={'z-30 flex w-full justify-center items-center ' + (errored ? 'hidden ' : ' ') + (loading ? '' : 'hidden')}
          >
            <div 
              id='match-timeline' 
              className={
                'relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1 w-full'
              }
            >
              <div className='day relative'>
                <div id='day-header' className='text-lg ml-4 day-header font-bold skeleton-text'>SKELETO</div>
                {imgArray.map((x, index) => {
                  return (
                    <div 
                      id='match'
                      className='group relative flex flex-row h-20 border p-1.5 mb-2 border-tile-color bg-tile-color bg-opacity-20 rounded mr-2 hover:bg-opacity-50 active:bg-opacity-0 cursor-default transition-all duration-100 ease-linear' 
                      key={index}
                    >
                      <div className='w-1/3 flex flex-row'>
                        <div id='agent-img'>
                          <img className='h-full shadow-img transition-all duration-100 ease-linear skeleton-image' src={x} />
                        </div>
                        <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                          <span className='text-lg font-semibold skeleton-text'>SKELETO</span>
                          <span className='text-base font-light flex flex-row items-center'>
                            <span className='skeleton-text'>SKELETONSKE</span>
                          </span>
                        </div>
                      </div>
                      <div id='match-score' className='w-1/3 flex flex-row items-center'>
                        <div id='scoreline' className='flex flex-col text-center w-1/2'>
                          <span className={'text-xl font-semibold outcome-text skeleton-text mid'}>SKELET</span>
                          <span className='text-lg skeleton-text mid'>SKEL</span>
                        </div>
                        <div 
                          id='scoreboard-pos' 
                          className={'rounded text-base h-8 py-0.5 px-1 ml-7 font-light skeleton-text'}
                        >
                          SKE
                        </div>
                      </div>
                      <div id='match-stats-1' className='w-1/3 flex flex-row items-center pl-4'>
                        <div id='left-side' className='flex flex-col'>
                          <span className='text-lg'>KDA</span>
                          <span className='text-lg font-light'>KD</span>
                        </div>
                        <div id='right-side' className='flex flex-col ml-4'>
                          <div className='text-lg' id='kda-display'>
                            <span className='kda-display-span skeleton-text'>SK</span> 
                            <span className='kda-display-span skeleton-text'>SK</span>
                            <span className='kda-display-span last skeleton-text'>SK</span>
                          </div>
                          <div className='text-lg font-light ml-2' id='score-display'>
                            <span className='skeleton-text'>SKEL</span>
                          </div>
                        </div>
                      </div>
                      <div id='match-stats-2' className='w-1/6 flex flex-row items-center'>
                        <div className='w-1/2 flex flex-col items-center'>
                          <span className='text-lg'>HS%</span> 
                          <span className='text-lg font-light text-gray-500 skeleton-text'>SKE</span>
                        </div>
                        <div className='w-1/2 flex flex-col items-center'>
                          <span className='text-lg'>ACS</span>
                          <span className='text-lg font-light text-gray-500 skeleton-text'>SKE</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div 
            id='errored' 
            className={'z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (areChartsActive ? 'hidden ' : ' ')}
          >
            <div>{LocalText(L, "bot_l.errors.no_matches_found")}</div>
          </div>
        </div>
        <div id='bottom-right-container' className='relative overflow-y-auto rounded p-2 border border-maincolor-dim'>
          <div className={'overflow-y-auto'}>
            <div className={'p-0 m-0' + (areStatsActive ? '' : ' hidden ')}>
              <span className={`font-bold ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.stats.header", currentlyLoadedMatchCount)}</span>
              <div className='flex flex-row justify-between mt-1.5'>
                <SmallStatsCard number={avgKillsPerMatch} desc={LocalText(L, "bot_r.stats.stat_1")} loading={loading} />
                <SmallStatsCard number={avgKillsPerRound} desc={LocalText(L, "bot_r.stats.stat_2")} loading={loading} />
              </div>

              <div className='flex flex-row justify-between mt-1.5 mb-3'>
                <SmallStatsCard number={winratePercent + '%'} desc={LocalText(L, "bot_r.stats.stat_3")} loading={loading} />
                <SmallStatsCard number={headshotPercent + '%'} desc={LocalText(L, "bot_r.stats.stat_4")} loading={loading} />
              </div>

              <span className={`mt-1 font-bold ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.best_map.header")}</span>
              <LargeStatsCard 
                header={bestMapName}
                stat_1_locale={LocalText(L, "bot_r.best_map.stats.stat_1")}
                stat_2_locale={LocalText(L, "bot_r.best_map.stats.stat_2")}
                img_src={bestMapImage} 
                win_percent={bestMapWinPercent}
                avg_kda={bestMapKdaRatio}
                extraClasses={'mb-3'} 
                loading={loading}
              />

              <span className={`mt-1 font-bold ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.best_agent.header")}</span>
              <FlatLargeStatsCard
                img_src={bestAgentImage}
                header={bestAgentName}
                top_num={bestAgentAvgScore}
                top_desc={LocalText(L, "bot_r.best_agent.stat_1")}
                stat_1_num={bestAgentAvgKda}
                stat_1_desc={LocalText(L, "bot_r.best_agent.stat_2")}
                stat_2_num={bestAgentKillsPerRound}
                stat_2_desc={LocalText(L, "bot_r.best_agent.stat_3")}
                stat_3_num={bestAgentKillsPerMatch}
                stat_3_desc={LocalText(L, "bot_r.best_agent.stat_4")}
                loading={loading}
              />
            </div>
            <span className='font-bold'>{LocalText(L, "bot_r.match_filter.header")}</span>
            <div className='flex flex-row flex-wrap justify-between' id='hub-match-filter'>
              <ModeSelectionCard id="unrated" mode_name={'unrated'} display_name={LocalText(L, "bot_r.match_filter.fl_1")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard id="competitive" mode_name={'competitive'} display_name={LocalText(L, "bot_r.match_filter.fl_2")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard id="deathmatch" mode_name={'deathmatch'} display_name={LocalText(L, "bot_r.match_filter.fl_3")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard id="spikerush" mode_name={'spikerush'} display_name={LocalText(L, "bot_r.match_filter.fl_4")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard id="custom" mode_name={'custom'} display_name={LocalText(L, "bot_r.match_filter.fl_7")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard id="swiftplay" mode_name={'swiftplay'} display_name={LocalText(L, "bot_r.match_filter.fl_8")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard id="onefa" mode_name={'onefa'} display_name={LocalText(L, "bot_r.match_filter.fl_5")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard id="ggteam" mode_name={'ggteam'} display_name={LocalText(L, "bot_r.match_filter.fl_6")} active={activeQueueTab} setActive={setActiveQueueTab} />
            </div>
          </div>
          <div 
            id='errored' 
            className={'z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (errored ? ' ' : 'hidden ') + (loading ? 'hidden' : '')}
          >
            <div>{LocalText(L, "component_err.err_text")}</div>
            <button 
              className='mt-2 button default' 
              onClick={async () => { 
                fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false);
              }}
            >
              {LocalText(L, "component_err.button_text")}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
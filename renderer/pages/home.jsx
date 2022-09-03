import React from 'react';
import Layout from '../components/Layout';
import { ipcRenderer } from 'electron';
import fetch from 'node-fetch'
import fs from 'fs';
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

const playerRanks = {
  '0': 'Unranked',
  '1': 'UNUSED',
  '2': 'UNUSED',
  '3': 'Iron 1',
  '4': 'Iron 2',
  '5': 'Iron 3',
  '6': 'Bronze 1',
  '7': 'Bronze 2',
  '8': 'Bronze 3',
  '9': 'Silver 1',
  '10': 'Silver 2',
  '11': 'Silver 3',
  '12': 'Gold 1',
  '13': 'Gold 2',
  '14': 'Gold 3',
  '15': 'Platinum 1',
  '16': 'Platinum 2',
  '17': 'Platinum 3',
  '18': 'Diamond 1',
  '19': 'Diamond 2',
  '20': 'Diamond 3',
  '21': 'Ascendant 1',
  '22': 'Ascendant 2',
  '23': 'Ascendant 3',
  '24': 'Immortal 1',
  '25': 'Immortal 2',
  '26': 'Immortal 3',
  '27': 'Radiant',
}

const gamemodes = {
  "newmap": "Unrated",
  "competitive": "Competitive",
  "unrated": "Unrated",
  "spikerush": "Spike Rush",
  "deathmatch": "Deathmatch",
  "ggteam": "Escalation",
  "onefa": "Replication",
  "snowball": "Snowball Fight", 
  "custom": "Custom",
  "": "Custom"
}

async function getEntitlement(bearer) {
  return (await (await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + bearer,
      'Content-Type': 'application/json',
      'User-Agent': '',
    },
    keepalive: true
  })).json())['entitlements_token'];
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

const fetchMatches = async (startIndex, endIndex, currentMatches, queue, puuid, region) => {
  try {
    var newMatches = currentMatches;
    const rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
    const tokenData = JSON.parse(rawTokenData);

    const bearer = tokenData.accessToken;
    const entitlement_token = await getEntitlement(bearer);

    const playerMatches = await getMatchHistory(region, puuid, startIndex, endIndex, queue, entitlement_token, bearer);
    
    const newEndIndex = playerMatches.EndIndex;
    const totalMatches = playerMatches.Total;
    const history = playerMatches.History;

    var matches = [];

    for (var i = 0; i < history.length; i++) {
      const match = await getMatch(region, history[i].MatchID, entitlement_token, bearer);
      matches.push(match);
    }

    for(var i = 0; i < matches.length; i++) {
      var dateDiff = getDifferenceInDays(matches[i].matchInfo.gameStartMillis, Date.now());
      if(dateDiff == 0) {
        // Create array if it doesn't exist
        if(!newMatches['today']) newMatches['today'] = [];

        newMatches['today'].push(matches[i]);
      } else if(dateDiff == 1) {
        // Create array if it doesn't exist
        if(!newMatches['yesterday']) newMatches['yesterday'] = [];

        newMatches['yesterday'].push(matches[i]);
      } else {
        // Get date difference between now and match date
        var startdate = moment();
        startdate = startdate.subtract(dateDiff, "days");
        var matchDate = startdate.format("MMMM Do");

        // Create array if it doesn't exist
        if(!newMatches[matchDate]) newMatches[matchDate] = [];

        newMatches[matchDate].push(matches[i]);
      }
    }
      
    var json = {
      "totalMatches": totalMatches,
      "endIndex": newEndIndex,
      "games": newMatches
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

const getLevelRewardData = async (uuid, rewardType) => {
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
      var titleData = await (await fetch('https://valorant-api.com/v1/playertitles/' + uuid, { 'Content-Type': 'application/json' })).json();
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
}

const calculateContractProgress = async (region, puuid, bearer, entitlement, client_version) => {
  var contracts = await (await fetch('https://valorant-api.com/v1/contracts', { 'Content-Type': 'application/json' })).json();
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

  var agentContractData = await(await fetch('https://valorant-api.com/v1/contracts/' + agentContractUUID, { 'Content-Type': 'application/json' })).json();
  var tierCount = 0;

  var agentContractProgression = {
    current_level: {},
    next_level: {},
  };

  for(var i = 0; i < agentContractData.data.content.chapters.length; i++) {
    var current_chapter = agentContractData.data.content.chapters[i];
    var next_chapter = undefined;

    if(agentContractData.data.content.chapters[i+1]) {
      next_chapter = agentContractData.data.content.chapters[i+1];
    }
    
    for(var j = 0; j < current_chapter.levels.length; j++) {
      var next_level = undefined;
      var current_level = current_chapter.levels[j];

      if(current_chapter.levels[j+1]) {
        next_level = current_chapter.levels[j+1];
      }

      if(next_level === undefined && next_chapter !== undefined) {
        next_level = next_chapter.levels[0];
      }

      if(next_level === undefined) {
        next_level = current_level;
        var current_level = current_chapter.levels[j-1];
        var atEnd = true;
      }
      

      tierCount++;

      if(tierCount == agentContractProgressionLevel) {
        if(current_level) {
          if(atEnd === true) {
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type);
  
            agentContractProgression.current_level.reward = current_level_data;
            agentContractProgression.current_level.levelNum = tierCount -1;
          } else {
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type);
  
            agentContractProgression.current_level.reward = current_level_data;
            agentContractProgression.current_level.levelNum = tierCount;
          }
          var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type);

          agentContractProgression.current_level.reward = current_level_data;
          agentContractProgression.current_level.levelNum = tierCount;
        } else {
          agentContractProgression.current_level.reward = null;
          agentContractProgression.current_level.levelNum = 0;
        }
        
        if(atEnd === true) {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type);

          agentContractProgression.next_level.reward = next_level_data;
          agentContractProgression.next_level.levelNum = tierCount;

          agentContractProgression.totalXPneeded = 1;
          agentContractProgression.currentXPowned = 1;
        } else {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type);

          agentContractProgression.next_level.reward = next_level_data;
          agentContractProgression.next_level.levelNum = tierCount + 1;

          agentContractProgression.totalXPneeded = next_level.xp;
          agentContractProgression.currentXPowned = agentContractXpRemaining;
        }
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

  var battlePassData = await(await fetch('https://valorant-api.com/v1/contracts/' + battlePassUUID, { 'Content-Type': 'application/json' })).json();
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
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type);
  
            battlePassProgression.current_level.reward = current_level_data;
            battlePassProgression.current_level.levelNum = tierCount -1;
          } else {
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type);
  
            battlePassProgression.current_level.reward = current_level_data;
            battlePassProgression.current_level.levelNum = tierCount;
          }
        } else {
          battlePassProgression.current_level.reward = null;
          battlePassProgression.current_level.levelNum = 0;
        }

        if(atEnd === true) {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type);

          battlePassProgression.totalXPneeded = 1;
          battlePassProgression.currentXPowned = 1;

          battlePassProgression.next_level.reward = next_level_data;
          battlePassProgression.next_level.levelNum = tierCount;
        } else {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type);

          battlePassProgression.totalXPneeded = next_level.xp;
          battlePassProgression.currentXPowned = battlePassXpRemaining;

          battlePassProgression.next_level.reward = next_level_data;
          battlePassProgression.next_level.levelNum = tierCount + 1;
        }
      }
    }
  } 

  return {
    agentContractProgress: agentContractProgression,
    battlePassProgress: battlePassProgression
  }
}

function Home() {
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
  
  const [ homePrefs, setHomePrefs ] = React.useState({});

  const [ favMatches, setFavMatches ] = React.useState([]);

// ------------------------------- END STATES -------------------------------

  const fetchMatchesAndCalculateStats = async (isNewQueue, beginIndex, endIndex, mode, isFirstLoad, isSilentLoading, keepCurrentMatches) => {
    var user_creds_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
    var user_creds = JSON.parse(user_creds_raw);
    var puuid = user_creds.playerUUID;

    if(keepCurrentMatches === true) {
      var data = await fetchMatches(beginIndex, endIndex, [], mode, user_creds.playerUUID, user_creds.playerRegion);

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
        if(dateDiff == 0) {
          // Create array if it doesn't exist
          if(!newMatches['today']) newMatches['today'] = [];
  
          newMatches['today'].push(new_matches[i]);
        } else if(dateDiff == 1) {
          // Create array if it doesn't exist
          if(!newMatches['yesterday']) newMatches['yesterday'] = [];
  
          newMatches['yesterday'].push(new_matches[i]);
        } else {
          // Get date difference between now and match date
          var startdate = moment();
          startdate = startdate.subtract(dateDiff, "days");
          var matchDate = startdate.format("MMMM Do");
  
          // Create array if it doesn't exist
          if(!newMatches[matchDate]) newMatches[matchDate] = [];
  
          newMatches[matchDate].push(new_matches[i]);
        }
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
          return map_stats[b].map_kda_ratio - map_stats[a].map_kda_ratio;
        });
  
        if(mapData) {
          var map_data = mapData
        } else {
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps', { 'Content-Type': 'application/json' });
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
          return agent_stats[b].avg_match_score - agent_stats[a].avg_match_score;
        });
  
        var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0], { 'Content-Type': 'application/json' });
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
      var old_matches_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID + '/current_matches.json'));

      setMaxMatchesFound(old_matches_data.items.totalMatches);

      // Get latest 4 matches from old data
      var old_matches = [];

      for(var key in old_matches_data.items.games) {
        for(var i = 0; i < old_matches_data.items.games[key].length; i++) {
          old_matches.push(old_matches_data.items.games[key][i])
        }
      }

      old_matches.sort(function(a, b) {
        return b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis;
      });

      var latest_old_matches = old_matches.slice(0, 5);
      
      // Get newest 4 Matches from Match history
      var data = await fetchMatches(0, 5, [], mode, user_creds.playerUUID, user_creds.playerRegion);

      setMaxMatchesFound(data.items.totalMatches);

      var new_matches = [];

      for(var key in data.items.games) {
        for(var i = 0; i < data.items.games[key].length; i++) {
          new_matches.push(data.items.games[key][i])
        }
      }

      new_matches.sort(function(a, b) {
        return b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis;
      });

      var latest_new_matches = new_matches.slice(0, 5);

      // Using Some Method
      const res2 = latest_old_matches.filter((match1) => !latest_new_matches.some(match2 => match1.matchInfo.matchId === match2.matchInfo.matchId ));

      var new_matches_amount = res2.length;

      if(new_matches_amount === 0) {
        setIsSilentLoading(false);
        return;
      } else if(new_matches_amount > 0 && new_matches_amount < 4) {
        var new_old_matches = old_matches.slice(0, (15 - new_matches_amount));
        var new_new_matches = new_matches.slice(0, new_matches_amount);

        var newMatchesArray = new_new_matches.concat(new_old_matches);

        newMatchesArray.sort(function(a, b) {
          return b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis;
        });
  
        var newMatches = [];
  
        for(var i = 0; i < newMatchesArray.length; i++) {
          var dateDiff = getDifferenceInDays(newMatchesArray[i].matchInfo.gameStartMillis, Date.now());
          if(dateDiff == 0) {
            // Create array if it doesn't exist
            if(!newMatches['today']) newMatches['today'] = [];
    
            newMatches['today'].push(newMatchesArray[i]);
          } else if(dateDiff == 1) {
            // Create array if it doesn't exist
            if(!newMatches['yesterday']) newMatches['yesterday'] = [];
    
            newMatches['yesterday'].push(newMatchesArray[i]);
          } else {
            // Get date difference between now and match date
            var startdate = moment();
            startdate = startdate.subtract(dateDiff, "days");
            var matchDate = startdate.format("MMMM Do");
    
            // Create array if it doesn't exist
            if(!newMatches[matchDate]) newMatches[matchDate] = [];
    
            newMatches[matchDate].push(newMatchesArray[i]);
          }
        }
  
        data.items.games = newMatches;
  
        if(data.errored == false && data.items.totalMatches > 0) {
          var obj = {};
  
          var dataToWrite = data;
          for(var key in dataToWrite.items.games) {
            obj[key] = dataToWrite.items.games[key];
          }
          dataToWrite.items.games = obj;

          if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID)) {
            fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID);
          }
  
          fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID + '/current_matches.json', JSON.stringify(dataToWrite));
    
          var playerstats = calculatePlayerStatsFromMatches(data.items.games, puuid);
          
          setAvgKillsPerMatch(playerstats.kills_per_match);
          setAvgKillsPerRound(playerstats.kills_per_round);
          setWinratePercent(playerstats.win_percentage);
          setHeadshotPercent(playerstats.headshot_percent);
    
          var map_stats = playerstats.map_stats;
          var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
            return map_stats[b].map_kda_ratio - map_stats[a].map_kda_ratio;
          });
    
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps', { 'Content-Type': 'application/json' });
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
            return agent_stats[b].avg_match_score - agent_stats[a].avg_match_score;
          });
    
          var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0], { 'Content-Type': 'application/json' });
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
        fetchMatchesAndCalculateStats(true, 0, 15, mode, false, false);
        return;
      }
    }

    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID + '/current_matches.json') && isFirstLoad) {
      var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID + '/current_matches.json'));
  
      setCurrentlyLoadedMatchCount(data.items.endIndex);

      var arr = [];

      for(var key in data.items.games) {
        arr[key] = data.items.games[key];
      }
      
      data.items.games = arr;

      var playerstats = calculatePlayerStatsFromMatches(data.items.games, puuid);
        
      setAvgKillsPerMatch(playerstats.kills_per_match);
      setAvgKillsPerRound(playerstats.kills_per_round);
      setWinratePercent(playerstats.win_percentage);
      setHeadshotPercent(playerstats.headshot_percent);

      var map_stats = playerstats.map_stats;
      var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
        return map_stats[b].map_kda_ratio - map_stats[a].map_kda_ratio;
      });

      var map_data_raw = await fetch('https://valorant-api.com/v1/maps', { 'Content-Type': 'application/json' });
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
        return agent_stats[b].avg_match_score - agent_stats[a].avg_match_score;
      });

      var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0], { 'Content-Type': 'application/json' });
      var agent_data = await agent_data_raw.json();

      setBestAgentName(agent_data.data.displayName);
      setBestAgentImage('https://media.valorant-api.com/agents/' + agent_data.data.uuid + '/displayiconsmall.png');
      setBestAgentAvgKda(agent_stats[sorted_agent_stats[0]].avg_kda_ratio);
      setBestAgentAvgScore(agent_stats[sorted_agent_stats[0]].avg_match_score);
      setBestAgentKillsPerRound(agent_stats[sorted_agent_stats[0]].kills_per_round);
      setBestAgentKillsPerMatch(agent_stats[sorted_agent_stats[0]].avg_kills_per_match);

      setCurrentMatches(data.items.games);
      setLoading(false);
      setIsSilentLoading(true);
      return;
    } else {
      if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID)) {
        fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID);
      }

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
        var data = await fetchMatches(beginIndex, endIndex, [], mode, user_creds.playerUUID, user_creds.playerRegion);
      } else {
        var data = await fetchMatches(beginIndex, endIndex, currentMatches, mode, user_creds.playerUUID, user_creds.playerRegion);
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

        if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID)) {
          fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID);
        }

        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/' + user_creds.playerUUID + '/current_matches.json', JSON.stringify(dataToWrite));
  
        var playerstats = calculatePlayerStatsFromMatches(data.items.games, puuid);
        
        setAvgKillsPerMatch(playerstats.kills_per_match);
        setAvgKillsPerRound(playerstats.kills_per_round);
        setWinratePercent(playerstats.win_percentage);
        setHeadshotPercent(playerstats.headshot_percent);
  
        var map_stats = playerstats.map_stats;
        var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
          return map_stats[b].map_kda_ratio - map_stats[a].map_kda_ratio;
        });
  
        var map_data_raw = await fetch('https://valorant-api.com/v1/maps', { 'Content-Type': 'application/json' });
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
          return agent_stats[b].avg_match_score - agent_stats[a].avg_match_score;
        });
  
        var agent_data_raw = await fetch('https://valorant-api.com/v1/agents/' + sorted_agent_stats[0], { 'Content-Type': 'application/json' });
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

  const fetchContractData = async () => {
    try {
      var version_data = await (await fetch('https://valorant-api.com/v1/version')).json();

      var user_creds_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
      var user_creds = JSON.parse(user_creds_raw);

      const rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
      const tokenData = JSON.parse(rawTokenData);
  
      const bearer = tokenData.accessToken;

      const entitlement_token = await getEntitlement(bearer);

      var contract_progress = await calculateContractProgress(user_creds.playerRegion, user_creds.playerUUID, bearer, entitlement_token, version_data.data.riotClientVersion);
  
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

  var user_creds_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
  var user_creds = JSON.parse(user_creds_raw);

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

    if(!winningTeamScore || !losingTeamScore) {
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
      var homePlayerNameTag = `${user_creds.playerName}#${user_creds.playerTag}`;
      
      if(match.players[i].subject == user_creds.playerUUID) {
        var playerInfo = match.players[i];
        var playerCurrentTier = match.players[i].competitiveTier;
        var playerRankFixed = playerRanks[playerCurrentTier];
      }
    }

    if(playerInfo) {
      var playerUUID = playerInfo.subject;
      var playerTeam = playerInfo.teamId;

      if(playerTeam == winning_team) {
        var matchOutcome = "VICTORY";
        var matchOutcomeColor = 'text-val-blue';
        var matchScore = winningTeamScore + ' - ' + losingTeamScore;
      } else if(winning_team == 'draw') {
        var matchOutcome = "DRAW";
        var matchOutcomeColor = 'text-val-yellow';

        if(!winningTeamScore) {
          winningTeamScore = losingTeamScore;
        } else if(!losingTeamScore) {
          losingTeamScore = winningTeamScore;
        }
        var matchScore = winningTeamScore + ' - ' + losingTeamScore;
      } else {
        var matchOutcome = "DEFEAT";
        var matchOutcomeColor = 'text-val-red';
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
      
      var playerPosition = players.findIndex(player => player.subject == playerUUID) + 1;

      if(playerPosition == 1) {
        // Player is Match MVP
        var playerPositionColor = 'yellow-glow bg-yellow-300 bg-opacity-50 border-2 border-yellow-400';
        var playerPositionText = 'Match MVP';
      } else {
        // Player is not Match MVP, check for Team MVP
        var teamPlayers = [];
        for(var i = 0; i < players.length; i++) {
          if(players[i].teamId == playerTeam) {
            teamPlayers.push(players[i]);
          }
        }

        var teamPlayerPosition = teamPlayers.findIndex(player => player.subject == playerUUID) + 1;

        if(teamPlayerPosition == 1) {
          // Player is Team MVP
          var playerPositionColor = 'silver-glow bg-gray-600 bg-opacity-80 border-2 border-slate-400';
          var playerPositionText = 'Team MVP';
        } else {
          // Player is not Team MVP
          var playerPositionColor = 'bg-maincolor-lightest bg-opacity-30 border-2 border-maincolor-lightest border-opacity-30';

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
          if(match.roundResults[i].playerStats[i2].subject == playerUUID) {
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
        if(firstRoundKill && firstRoundKill.killer == playerUUID) {
          playerFBs++;
        }
      }
    }

    var matchData = {
      playerAgent, 
      playerUUID,
      homePlayerNameTag,
      mapName, 
      playerCurrentTier, 
      playerRankFixed, 
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
      playerName: homePlayerNameTag.split("#")[0], playerUUID, playerTeam, playerAgent, playerKD, playerKDA, playerKD, playerScore, playerACS, playerKillsPerRound: averageDamageRounded, playerCurrentTier, playerRankFixed, headShotsPercentRounded, bodyShotsPercentRounded, legShotsPercentRounded, playerPositionText, playerPosition, playerFBs
    }

    return { matchData, matchViewData };
  }

  const fetchFurtherMatches = async () => {
    setFetchingFurtherMatches(true);
    setMatchFetchingError(false);

    fetchMatchesAndCalculateStats(false, currentlyLoadedMatchCount, currentlyLoadedMatchCount + 5, activeQueueTab, false, false, true, currentMatches);
  }

  const toggleMatchInFavs = (MatchID, isFav) => {
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json');
    var data = JSON.parse(raw);

    if(!isFav) {
      data.favourites.push({
        "MatchID": MatchID,
      });
      
      var newArray = data.favourites.filter(value => Object.keys(value).length !== 0);

      setFavMatches(newArray);
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json', JSON.stringify({"favourites": newArray}));
    } else {
      for (var i = 0; i < data.favourites.length; i++) {
        if(data.favourites[i].MatchID == MatchID) {
          delete data.favourites[i];
        }
      }
      
      var newArray = data.favourites.filter(value => Object.keys(value).length !== 0);

      setFavMatches(newArray);
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json', JSON.stringify({"favourites": newArray}));

      if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches/' + MatchID + '.json')) {
        fs.unlinkSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches/' + MatchID + '.json');
      }
    }
  }
  
  React.useEffect(async () => {
    ipcRenderer.send('changeDiscordRP', "hub_activity");
    
    if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID)) {
      fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID);
    }

    if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches')) {
      fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches');
    }

    if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json')) {
      var obj = {"favourites": []};
      
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json', JSON.stringify(obj));
    }

    var favs_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json');
    var favs_data = JSON.parse(favs_data_raw);

    setFavMatches(favs_data.favourites);

    var map_data_raw = await fetch('https://valorant-api.com/v1/maps', { 'Content-Type': 'application/json' });
    var map_data = await map_data_raw.json();
    setMapData(map_data);

    var home_prefs_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/settings.json');
    var home_prefs = JSON.parse(home_prefs_raw);

    setHomePrefs(home_prefs);
    setActiveQueueTab(home_prefs.preferredMatchFilter);

    if(!home_prefs.preferredMatchFilter || home_prefs.preferredMatchFilter === "") {
      await fetchMatchesAndCalculateStats(true, 0, 15, 'unrated', true);
      await fetchMatchesAndCalculateStats(true, 0, 15, 'unrated', false, true);
    } else {
      try {
        await fetchMatchesAndCalculateStats(true, 0, 15, home_prefs.preferredMatchFilter, true);
        await fetchMatchesAndCalculateStats(true, 0, 15, home_prefs.preferredMatchFilter, false, true);
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
      var featured_bundle_raw = await fetch('https://api.valtracker.gg/featured-bundle', { 'Content-Type': 'application/json' });
      var featured_bundle = await featured_bundle_raw.json();

      setFeaturedBundleName(featured_bundle.data.name);
      setFeaturedBundlePrice(featured_bundle.data.price);
      setFeaturedBundleImage(featured_bundle.data.displayIcon);
  
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/featured_bundle.json', JSON.stringify(featured_bundle));
    }

    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/featured_bundle.json')) {
      var old_featured_bundle_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/featured_bundle.json');
      var old_featured_bundle = JSON.parse(old_featured_bundle_raw);

      if(Date.now() < old_featured_bundle.data.expiry_date) {
        setFeaturedBundleName(old_featured_bundle.data.name);
        setFeaturedBundlePrice(old_featured_bundle.data.price);
        setFeaturedBundleImage(old_featured_bundle.data.displayIcon);
      } else {
        refetchFeaturedBundle();
      }
    } else {
      refetchFeaturedBundle();
    }
  });

  React.useEffect(async () => {
    if(!firstRender) {
      if(isPrefChange === true) {
        setIsPrefChange(false);
      } else {
        homePrefs.preferredMatchFilter = activeQueueTab;
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/settings.json', JSON.stringify(homePrefs));
  
        fetchMatchesAndCalculateStats(true, 0, 15, activeQueueTab, false);
      }
    }
  }, [ activeQueueTab ]);

  React.useEffect(async () => {
    await fetchContractData();

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
    var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));
    if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + user_data.playerUUID + '.json')) {
      var data = {
        "skins": []
      }
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + user_data.playerUUID + '.json', JSON.stringify(data));
    }
  }, [])

  React.useEffect(() => {
    ipcRenderer.on("hub_smartLoadNewMatches", async function(event, args) {
      if(args !== 'newmap' || args !== 'snowball') {
        if(args === activeQueueTab) {
          await fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false);
        } else {
          setActiveQueueTab(args);
          await fetchMatchesAndCalculateStats(true, 0, 15, args, false);
        }
      }
    });
  }, []);

  return (
    <Layout>
      <div id='home-container' className='flex flex-row flex-wrap'>
        <div id='top-left-container' className='relative bg-maincolor-lightest bg-opacity-60 rounded-sm p-1.5 flex flex-wrap'>
          <div className='home-top-info-tile border-2 rounded-sm border-maincolor-lightest h-full p-1 relative'>
            <div className='flex flex-col h-full px-1'>
              <div>
                <span className='leading-none'>{LocalText(L, "top_l.bundle_header")} - {featuredBundleName}</span>
                <hr className='' />
              </div>
              <div className='flex w-full mt-2 relative h-full justify-center items-center'>
                <div className='relative'>
                  <img src={featuredBundleImage ? featuredBundleImage : '/images/bundle_invisible.png'} className='shadow-img border-2 border-maincolor-lightest' />
                  {
                    featuredBundlePrice ?
                    <div 
                      id='bundle-price'
                      className='text-xl text-gray-300 flex flex-row items-center absolute bottom-2 left-2 bg-opacity-60 bg-black rounded-sm px-2 py-1'
                    >
                      <span className='relative top-px'>{featuredBundlePrice}</span>
                      <img src="/images/vp_icon.png" className='w-6 ml-2 transition-opacity duration-100 ease-in shadow-img' />
                    </div>
                    :
                    null
                  }
                </div>
              </div>
              <div className='p-1 flex flex-row mt-0.5'>
              </div>
            </div>
          </div>
          <div className='home-top-info-tile relative border-2 rounded-sm border-maincolor-lightest flex flex-col'>
            <div className={'flex flex-col h-full ' + (contractsLoading || contractsError ? 'hidden' : '')}>
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
              />

              <hr className='bg-maincolor-lightest h-0.5 border-none' />
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
              />
            </div>
            <div className={'w-full mr-auto h-full absolute top-0 left-0 ' + (contractsLoading || contractsError ? 'flex' : 'hidden')}>
              <div
                className={'flex flex-col w-full h-4/5 justify-center items-center text-center ' + (contractsError ? ' ' : 'hidden ') + (contractsLoading ? 'hidden' : '')}
              >
                <div>{LocalText(L, "component_err.err_text")}</div>
                <button 
                  className='mt-2' 
                  onClick={async () => { 
                    fetchContractData();
                  }}
                >
                  {LocalText(L, "component_err.button_text")}
                </button>
              </div>
              <div
                className={'flex w-full h-4/5 justify-center items-center ' + (contractsError ? 'hidden ' : ' ') + (contractsLoading ? '' : 'hidden')}
              >
                <Loading color={'error'} size={'lg'} />
              </div>
            </div>
          </div>
        </div>
        <div id='top-right-container' className='relative overflow-y-auto bg-maincolor-lightest bg-opacity-60 rounded-sm p-1.5'>
          <div className={'flex-row items-center justify-center h-full ' + (chartsLoading || chartsError ? 'hidden ' : 'flex') + (areChartsActive ? '' : ' hidden')}>
            <AwesomeSlider 
              className={'AwesomeSliderMainContainer border-2 border-maincolor-lightest h-full z-10'}
            >
              <div>
                <InfoChart
                  label={LocalText(L, "top_r.headers.h_1")}
                  data={headshotChartData}
                />
              </div>
              <div>
                <InfoChart
                  label={LocalText(L, "top_r.headers.h_2")}
                  data={damageChartData}
                />
              </div>
              <div>
                <InfoChart
                  label={LocalText(L, "top_r.headers.h_3")}
                  data={killsDeathsChartData}
                />
              </div>
            </AwesomeSlider>
          </div>
          <div
            className={'absolute top-0 left-0 z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (chartsError ? ' ' : 'hidden ') + (chartsLoading ? 'hidden' : '')}
          >
            <div>{LocalText(L, "component_err.err_text")}</div>
            <button 
              className='mt-2' 
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
        <div id='bottom-left-container' className='relative overflow-y-auto bg-maincolor-lightest bg-opacity-60 rounded-sm p-2'>
          <div 
            id='match-timeline' 
            className={
              'relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1 ' 
              + (loading || errored ? 'hidden' : '')
              + (currentlyLoadedMatchCount <= 0 ? ' disabled ' : ' ')
            }
          >
            <Tooltip content={LocalText(L, "bot_l.loading_tooltip")} color="error" placement={'left'} className='rounded-sm absolute top-2 right-7'>
              <div className={'absolute -top-2.5 -right-5 w-6 h-6 z-30 ' + (isSilentLoading ? '' : 'hidden')}>
                <Loading color={'error'} size={'sm'} />
              </div>
            </Tooltip>
            {currentlyLoadedMatchCount > 0 ?
              Object.keys(currentMatches).map((key, index) => {
                return (
                  <div className='day relative' key={index}>
                    <div id='day-header' className='text-lg ml-4 day-header'>{key}</div>
                    {currentMatches[key].map((match, index) => {
                      var { matchData, matchViewData } = calculateMatchStats(match);

                      return (
                        <div 
                          id='match'
                          className='group relative flex flex-row h-20 border-2 p-1.5 mb-2 border-maincolor-lightest rounded-sm mr-2 hover:bg-maincolor-lightest cursor-default transition-all duration-100 ease-linear' 
                          key={index}
                          onClick={(e) => {
                            if(e.target.id !== 'add-to-favs') {
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
                              <img
                                src={
                                  favMatches.length > 0 ?
                                    (favMatches.find(x => x.MatchID === match.matchInfo.matchId) !== undefined ?
                                    '/images/star_filled.svg'
                                    :
                                    '/images/star.svg')
                                  :
                                  '/images/star.svg'
                                }
                                className='w-6 h-6 ml-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-100 ease-linear relative right-3'
                                id='add-to-favs'
                                onClick={(e) => {
                                  var src = e.target.src.split("/").pop();
                                  var before_ = e.target.src.substring(0, e.target.src.lastIndexOf('/'));

                                  if(src == 'star.svg') {
                                    e.target.src = before_ + 'star_filled.svg';
                              
                                    toggleMatchInFavs(match.matchInfo.matchId, false);
                                  } else {
                                    e.target.src = before_ + 'star.svg';

                                    toggleMatchInFavs(match.matchInfo.matchId, true);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className='w-1/3 flex flex-row'>
                            <div id='agent-img'>
                              <img className='h-full shadow-img group-hover:opacity-30 transition-all duration-100 ease-linear' src={matchData.playerAgent ? `https://media.valorant-api.com/agents/${matchData.playerAgent}/displayicon.png` : ''} />
                            </div>
                            <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                              <span className='text-xl'>{matchData.mapName}</span>
                              <span className='text-base font-light flex flex-row items-center'> 
                                <Tooltip 
                                  content={matchData.playerCurrentTier > 3 ? matchData.playerRankFixed : ''}
                                  color="error" 
                                  placement={'top'} 
                                  className={'rounded-sm'}
                                >
                                  <img 
                                    src={
                                      activeQueueTab == 'competitive' ? 
                                      (matchData.playerCurrentTier ? 
                                        `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${matchData.playerCurrentTier}/smallicon.png`
                                        :
                                        `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                                      )
                                      :
                                      'https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png'
                                    } 
                                    className={
                                      'w-7 transform scale-75 shadow-img '
                                      +
                                      (activeQueueTab == 'competitive' ?
                                        `w-10`
                                        :
                                        ''
                                      )
                                    }
                                  />
                                  
                                </Tooltip>
                                <span>{LocalText(L, "bot_l.gamemodes." + match.matchInfo.queueID)}</span>
                              </span>
                            </div>
                          </div>
                          <div id='match-score' className='w-1/3 flex flex-row items-center'>
                            <div id='scoreline' className='flex flex-col text-center w-1/3'>
                              <span className={'text-xl ' + matchData.matchOutcomeColor}>{LocalText(L, "bot_l.match_outcomes." + matchData.matchOutcome)}</span>
                              {activeQueueTab != 'deathmatch' ? (<span className='text-lg'>{matchData.matchScore}</span>) : ''}
                            </div>
                            {activeQueueTab != 'deathmatch' ? 
                              (
                                <div 
                                  id='scoreboard-pos' 
                                  className={'rounded-sm text-base h-8 py-0.5 px-1 ml-7 ' + matchData.playerPositionColor}
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
                              <span className='text-xl'>KDA</span>
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
                                    <span className='text-lg font-light text-gray-400'>{matchData.headShotsPercentRounded}%</span>
                                  </div>
                                  <div className='w-1/2 flex flex-col items-center'>
                                    <span className='text-lg'>ACS</span>
                                    <span className='text-lg font-light text-gray-400'>{matchData.playerACS}</span>
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
          <div className={'' + (loading || errored ? 'hidden' : '')}>
            <div id='match-loading-error' className={'mt-4 ml-6 w-full flex flex-row justify-center ' + (matchFetchingError ? '' : 'hidden')}>
              <span id='' className='text-gray-500'>{LocalText(L, "bot_l.errors.err_while_fetching")}</span>
            </div>
            <div id='shown-matches-info' className={'mt-4 ml-6 w-1/2 flex flex-row justify-between ' + (fetchingFurtherMatches ? 'hidden' : '')}>
              <span id='x-out-of-n-matches' className='text-gray-500'>{LocalText(L, "bot_l.bottom_text.loaded_matches_count", currentlyLoadedMatchCount, maxMatchesFound)}</span>
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
              className='mt-2' 
              onClick={async () => { 
                fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false);
              }}
            >
              {LocalText(L, "component_err.button_text")}
            </button>
          </div>
          <div 
            id='loading' 
            className={'z-20 flex w-full h-4/5 justify-center items-center ' + (errored ? 'hidden ' : ' ') + (loading ? '' : 'hidden')}
          >
            <Loading color={'error'} size={'lg'} />
          </div>
          <div 
            id='errored' 
            className={'z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (areChartsActive ? 'hidden ' : ' ')}
          >
            <div>{LocalText(L, "bot_l.errors.no_matches_found")}</div>
          </div>
        </div>
        <div id='bottom-right-container' className='relative overflow-y-auto bg-maincolor-lightest bg-opacity-60 rounded-sm p-2'>
          <div className={'overflow-y-auto ' + (loading || errored ? 'hidden' : '')}>
            {
              currentlyLoadedMatchCount > 0 ?
              <div className={'p-0 m-0' + (areStatsActive ? '' : ' hidden ')}>
                <span>{LocalText(L, "bot_r.stats.header", currentlyLoadedMatchCount)}</span>
                <hr />
                <div className='flex flex-row justify-between mt-1.5'>
                  <SmallStatsCard number={avgKillsPerMatch} desc={LocalText(L, "bot_r.stats.stat_1")} />
                  <SmallStatsCard number={avgKillsPerRound} desc={LocalText(L, "bot_r.stats.stat_2")} />
                </div>

                <div className='flex flex-row justify-between mt-1.5'>
                  <SmallStatsCard number={winratePercent} desc={LocalText(L, "bot_r.stats.stat_3")} />
                  <SmallStatsCard number={headshotPercent} desc={LocalText(L, "bot_r.stats.stat_4")} />
                </div>

                <span className='mt-1'>{LocalText(L, "bot_r.best_map.header")}</span>
                <LargeStatsCard 
                  header={bestMapName}
                  stat_1_locale={LocalText(L, "bot_r.best_map.stats.stat_1")}
                  stat_2_locale={LocalText(L, "bot_r.best_map.stats.stat_2")}
                  img_src={bestMapImage} 
                  win_percent={bestMapWinPercent}
                  avg_kda={bestMapKdaRatio}
                  extraClasses={''} 
                />

                <span className='mt-1'>{LocalText(L, "bot_r.best_agent.header")}</span>
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
                />
              </div>
              : 
              null
            }
            <span>{LocalText(L, "bot_r.match_filter.header")}</span>
            <hr className='mb-2' />
            <div className='flex flex-row flex-wrap justify-between'>
              <ModeSelectionCard mode_name={'unrated'} display_name={LocalText(L, "bot_r.match_filter.fl_1")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard mode_name={'competitive'} display_name={LocalText(L, "bot_r.match_filter.fl_2")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard mode_name={'deathmatch'} display_name={LocalText(L, "bot_r.match_filter.fl_3")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard mode_name={'spikerush'} display_name={LocalText(L, "bot_r.match_filter.fl_4")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard mode_name={'onefa'} display_name={LocalText(L, "bot_r.match_filter.fl_5")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard mode_name={'ggteam'} display_name={LocalText(L, "bot_r.match_filter.fl_6")} active={activeQueueTab} setActive={setActiveQueueTab} />
              <ModeSelectionCard mode_name={'custom'} display_name={LocalText(L, "bot_r.match_filter.fl_7")} active={activeQueueTab} setActive={setActiveQueueTab} />
            </div>
          </div>
          <div 
            id='errored' 
            className={'z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (errored ? ' ' : 'hidden ') + (loading ? 'hidden' : '')}
          >
            <div>{LocalText(L, "component_err.err_text")}</div>
            <button 
              className='mt-2' 
              onClick={async () => { 
                fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false);
              }}
            >
              {LocalText(L, "component_err.button_text")}
            </button>
          </div>
          <div 
            id='loading' 
            className={'z-20 flex w-full h-4/5 justify-center items-center ' + (errored ? 'hidden ' : ' ') + (loading ? '' : 'hidden')}
          >
            <Loading color={'error'} size={'lg'} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
import React, { useRef } from 'react';
import { motion } from "framer-motion"
import { useRouter } from 'next/router';
import fetch from 'node-fetch';
import MatchTypeTile from '../components/profiles/MatchTypeTile';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { Loading } from "@nextui-org/react";
import { Tooltip } from '@nextui-org/react';
import L from '../locales/translations/player.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';
import Layout from '../components/Layout';
import { getUserAccessToken, getUserEntitlement } from '../js/dbFunctions.mjs';
import { Select } from '../components/Select';

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
  '/agents/jett_black.png',
  '/agents/jett_black.png',
  '/agents/breach_black.png',
  '/agents/breach_black.png',
  '/agents/cypher_black.png',
  '/agents/jett_black.png',
  '/agents/jett_black.png',
  '/agents/breach_black.png',
  '/agents/cypher_black.png',
  '/agents/cypher_black.png',
];

const variants = {
  hidden: { opacity: 0, x: -100, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 100, y: 0 },
}

const loading_variants = {
  open: { opacity: 1, y: 0, x: 0, scale: 1, transition: {
      duration: 1,
      ease: [0.6, 0.05, -0.01, 0.9]
    },
    display: "block",
  },
  closed: { opacity: 0, y: 0, x: 0, transition: {
      duration: 1,
      ease: [0.6, 0.05, -0.01, 0.9]
    },
    transitionEnd: {
      display: "none",
    },
  }
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
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/match-details/v1/matches/${matchId}`, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      "X-Riot-ClientPlatform": "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
      'Authorization': 'Bearer ' + bearer,
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json());
}

function getDifferenceInDays(date1, date2) {
  const diffInMs = Math.abs(date2 - date1);
  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Function that returns the match history of a user.
 * @param {String} region 
 * @param {String} puuid 
 * @param {String} entitlement_token 
 * @param {String} bearer 
 * @param {Number} client_version 
 * @returns Returns the match history of the user. If this request fails, it returns the HTML response from the server.
 */

async function getMMRInfo(region, puuid, entitlement_token, bearer, client_version) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/mmr/v1/players/${puuid}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer,
      'X-Riot-Entitlements-JWT': entitlement_token,
      'X-Riot-ClientPlatform': "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
      'X-Riot-ClientVersion': client_version,
      'Content-Type': 'application/json',
      'User-Agent': ''
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
  var seasons = await(await fetch(`https://valorant-api.com/v1/seasons`)).json();
  
  var season = seasons.data.find(x => (new Date(x.startTime) < new Date()) && (new Date() < new Date(x.endTime)) && x.type === "EAresSeasonType::Act");
  var seasonUUID = season.uuid;

  var versionInfo = await (await fetch(`https://valorant-api.com/v1/version`)).json();

  var mmrInfo = await getMMRInfo(region, puuid, entitlement_token, bearer, versionInfo.data.riotClientVersion);
  
  var currentSeason = mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID[seasonUUID];

  if(currentSeason) {
    var currenttier = currentSeason.CompetitiveTier;
  } else {
    var currenttier = 0;
  }

  var peaktier = currenttier;

  for(var i = 0; i < mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID.length; i++) {
    if(mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID[i].CompetitiveTier > peaktier) peaktier = mmrInfo.QueueSkills.competitive.SeasonalInfoBySeasonID[i].CompetitiveTier;
  }

  var totalOverallMatches = 0;

  var matchesByAct = {};

  for(var i = 0; i < Object.keys(mmrInfo.QueueSkills).length; i++) {
    var queue = mmrInfo.QueueSkills[Object.keys(mmrInfo.QueueSkills)[i]];
    for(var j = 0; j < Object.keys(queue.SeasonalInfoBySeasonID).length; j++) {
      if(!matchesByAct[Object.keys(queue.SeasonalInfoBySeasonID)[j]]) {
        matchesByAct[Object.keys(queue.SeasonalInfoBySeasonID)[j]] = 0;
      }
        
      totalOverallMatches += queue.SeasonalInfoBySeasonID[Object.keys(queue.SeasonalInfoBySeasonID)[j]].NumberOfGames;

      if(Object.keys(mmrInfo.QueueSkills)[i] === "competitive") queue.SeasonalInfoBySeasonID[Object.keys(queue.SeasonalInfoBySeasonID)[j]].NumberOfGames;

      matchesByAct[Object.keys(queue.SeasonalInfoBySeasonID)[j]] += queue.SeasonalInfoBySeasonID[Object.keys(queue.SeasonalInfoBySeasonID)[j]].NumberOfGames;
    }
  }

  var totalActMatches = matchesByAct[seasonUUID];

  const rankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/smallicon.png`;

  var obj = {
    "peaktier": peaktier, // Peak Rank
    "ActWinsByTier": currentSeason.WinsByTier, // Act Rank Triangle
    "currenttier": currenttier,
    "ranked_rating": currentSeason.RankedRating,
    "currenttier_icon": rankIcon,
    "total_matches_played": currentSeason.NumberOfGames,
    "win_percentage": ((currentSeason.NumberOfWins / currentSeason.NumberOfGames) * 100).toFixed(2),
    "additional_info": mmrInfo.QueueSkills,
    "act_matches_total": totalActMatches,
    "overall_matches_total": totalOverallMatches
  }

  return obj;
}

const fetchPlayer = async (pname, ptag, lang) => {
  try {
    const playerInfoRaw = await fetch(`https://api.valtracker.gg/v1/riot/player/${pname}/${ptag}`, { keepalive: true });
    const pInfo = await playerInfoRaw.json();

    if(pInfo.status !== 200) {
      return { errored: true, items: {status: pInfo.status, message: pInfo.message }};
    }

    const puuid = pInfo.data.puuid;
    const region = pInfo.data.region;
    const name = pInfo.data.name;
    const tag = pInfo.data.tag;

    const bearer = await getUserAccessToken();
    const entitlement_token = await getUserEntitlement();

    const mmrInfo = await getPlayerMMR(region, puuid, entitlement_token, bearer);

    const playerMatches = await getMatchHistory(region, puuid, 0, 10, 'competitive', entitlement_token, bearer);
    
    const endIndex = playerMatches.EndIndex;
    const totalMatches = playerMatches.Total;
    const history = playerMatches.History;

    var matches = [];

    for (var i = 0; i < endIndex; i++) {
      const match = await getMatch(region, history[i].MatchID, entitlement_token, bearer);
      matches.push(match);
    }

    var matchesByDates = {};

    for(var i = 0; i < matches.length; i++) {
      var dateDiff = getDifferenceInDays(matches[i].matchInfo.gameStartMillis, Date.now());
      moment.locale(lang);
      var startdate = moment();
      startdate = startdate.subtract(dateDiff, "days");
      var matchDate = startdate.format("D. MMMM");

      // Create array if it doesn't exist
      if(!matchesByDates[matchDate]) matchesByDates[matchDate] = [];

      matchesByDates[matchDate].push(matches[i]);
    }
      
    var json = {
      player: {
        "name": name,
        "tag": tag,
        "puuid": puuid,
        "region": region.toUpperCase(),
        "account_level": pInfo.data.account_level,
        "card": pInfo.data.card,
        ...mmrInfo
      },
      matches: {
        "totalMatches": totalMatches,
        "endIndex": endIndex,
        "games": matchesByDates
      }
    }

    return { errored: false, items: json };
  } catch(err) {
    return { errored: true, items: err };
  }
}

const fetchMatches = async (startIndex, endIndex, currentMatches, queue, puuid, region, lang) => {
  try {
    const bearer = await getUserAccessToken();
    const entitlement_token = await getUserEntitlement();

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
      moment.locale(lang);
      var startdate = moment();
      startdate = startdate.subtract(dateDiff, "days");
      var matchDate = startdate.format("D. MMMM");

      // Create array if it doesn't exist
      if(!currentMatches[matchDate]) currentMatches[matchDate] = [];

      currentMatches[matchDate].push(matches[i]);
    }
      
    var json = {
      matches: {
        "totalMatches": totalMatches,
        "endIndex": newEndIndex,
        "games": currentMatches
      }
    }

    return { errored: false, items: json };
  } catch(err) {
    return { errored: true, items: err };
  }
}

function calculatePlayerStatsFromMatches(matchdays, puuid) {
  var player_wins = 0;
  var player_losses = 0;

  var total_kills = 0;
  var total_deaths = 0;
  var total_assists = 0;

  var total_score = 0;

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

            total_score += matches[i].players[j].stats.score;
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

  var avg_kd = (total_kills / total_deaths).toFixed(2);
  var avg_score = (total_score / total_round_count).toFixed(0);

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
    "weapon_kills": weapon_kills,
    "avg_kd": avg_kd,
    "avg_score": avg_score
  }

  return returnObj;
}

function PlayerProfile({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();

  const [ matches, setMatches ] = React.useState([]); // Use length for shown matches
  const [ playerInfo, setPlayerInfo ] = React.useState({card:{}});

  const [ ranks, setRanks ] = React.useState([]);
  const [ levelBorders, setLevelBorders ] = React.useState([]);
  const [ playerBorder, setPlayerBorder ] = React.useState(null);
  const [ actWins, setActWins ] = React.useState([]);

  const [ reloading, setReloading ] = React.useState(false);
  const [ loading, setLoading ] = React.useState(true);
  const [ error, setError ] = React.useState(false);
  const [ errorMessage, setErrorMessage ] = React.useState(false);
  const [ noMatchesFound, setNoMatchesFound ] = React.useState(false);

  const [ hideStats, setHideStats ] = React.useState(false);

  const [ activeQueueTab, setActiveQueueTab ] = React.useState('competitive');

  const [ mapData, setMapData ] = React.useState({});

  const [ avgKillsPerMatch, setAvgKillsPerMatch ] = React.useState(null);
  const [ headshotPercent, setHeadshotPercent ] = React.useState(null);
  const [ avgKD, setAvgKD ] = React.useState(null);
  const [ avgCS, setAvgCS ] = React.useState(null);
  
  const [ gameAmountInfo, setGameAmountInfo ] = React.useState({ "actMatches": null, "overallMatches": null, "compMatches": null });

  const [ modeSelectValue, setModeSelectValue ] = React.useState("0");

  const calculateMatchStats = (match) => {
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
      var nameTag = `${match.players[i].gameName.toLowerCase()}#${match.players[i].tagLine.toLowerCase()}`;
      var searchedNameTag = `${router.query.name.toLowerCase()}#${router.query.tag.toLowerCase()}`;
      
      if(nameTag === searchedNameTag) {
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

      // Calculate ADR
      var averageDamage = totalDamage / match.roundResults.length;
      var averageDamageRounded = averageDamage.toFixed(0);

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

    var playerKDA = playerKills + '/' + playerDeaths + '/' + playerAssists;

    var matchData = {
      playerAgent, 
      uuid,
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
      playerKDA,
      headShotsPercentRounded, 
      averageDamageRounded,
      playerACS,
      playerScore,
      matchUUID: match.matchInfo.matchId,
    }

    return { matchData };
  }
  
  const changeMatchType = async (type) => {
    if(type === "0" || type === activeQueueTab) return;
    if(type === "unrated" || type === "competitive" || type === "swiftplay") {
      setModeSelectValue("0");
    }
    setMatches([]);
    setReloading(true);
    setHideStats(false);
    setNoMatchesFound(false);
    setActiveQueueTab(type);
    const fetchApi = async () => {
      const { errored, items } = await fetchMatches(0, 10, [], type, playerInfo.puuid, playerInfo.region, router.query.lang);
      
      if(!errored) {
        console.log("DuringChange", items);
        if(items.matches.totalMatches === 0) {
          setHideStats(true);
          setNoMatchesFound(true);
          setReloading(false);
          return;
        }
        var playerstats = calculatePlayerStatsFromMatches(items.matches.games, playerInfo.puuid);
        
        setAvgKillsPerMatch(playerstats.kills_per_match);
        setHeadshotPercent(playerstats.headshot_percent);
        setAvgKD(playerstats.avg_kd);
        setAvgCS(playerstats.avg_score);
  
        setMatches(items.matches.games);
  
        setReloading(false);
      } else {
        setReloading(false);
        setErrorMessage(items.message);
        setError(true);
      }
    }
    
    fetchApi();
  }

  React.useEffect(() => {
    ipcRenderer.send('changeDiscordRP', 'pprofile_activity');
  }, []);

  React.useEffect(async () => {
    var name = router.query.name;
    var tag = router.query.tag;

    var mapInfo = await(await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang))).json();
    setMapData(mapInfo);

    var levelBorderData = await(await fetch(`https://valorant-api.com/v1/levelborders?language=${APIi18n(router.query.lang)}`)).json();
    setLevelBorders(levelBorderData.data);
    const { errored, items } = await fetchPlayer(name, tag, router.query.lang);
      
    if(!errored) {
      console.log("DuringLoad", items);
      if(items.matches.totalMatches === 0) {
        setHideStats(true);
        setNoMatchesFound(true);
        setLoading(false);
        return;
      }
      var playerstats = calculatePlayerStatsFromMatches(items.matches.games, items.player.puuid);
      
      setAvgKillsPerMatch(playerstats.kills_per_match);
      setHeadshotPercent(playerstats.headshot_percent);
      setAvgKD(playerstats.avg_kd);
      setAvgCS(playerstats.avg_score);

      setGameAmountInfo({ "actMatches": items.player.act_matches_total, "overallMatches": items.player.overall_matches_total });

      setMatches(items.matches.games);

      setPlayerInfo(items.player);

      var arr = [];

      Object.keys(items.player.ActWinsByTier).forEach(singleKey => {
        if(singleKey != "0") {
          for(var i = 0; i < items.player.ActWinsByTier[singleKey]; i++) {
            arr.push(singleKey);
          }
        }
      });
      arr = arr.reverse().slice(0, 49);
      setActWins(arr);

      setLoading(false);
    } else {
      setLoading(false);
      setErrorMessage(items.message);
      setError(true);
    }
  }, []);

  React.useEffect(() => {
    var border = levelBorders.find(x => x.startingLevel <= playerInfo.account_level && playerInfo.account_level < (x.startingLevel + 20));
    if(border) {
      setPlayerBorder(border.levelNumberAppearance);
    }
  }, [playerInfo]);

  React.useEffect(async () => {
    var ranksRaw = await(await fetch('https://valorant-api.com/v1/competitivetiers?language=' + APIi18n(router.query.lang))).json();
    setRanks(ranksRaw.data[ranksRaw.data.length-1].tiers);
  }, []);

  const trianglePositionClassNames = [ // 49
    { orientation: "up", className: 'absolute top-[2rem] left-px right-0 mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[3.75rem] left-px right-8 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[3.75rem] left-px right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[3.75rem] left-[33px] right-0 mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[5.5rem] left-px right-16 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[5.5rem] left-px right-8 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[5.5rem] left-px right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[5.5rem] left-[33px] right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[5.5rem] left-16 right-0 mx-auto w-[1.9rem]' },
    
    { orientation: "up", className: 'absolute top-[7.25rem] left-px right-24 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[7.25rem] left-px right-16 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[7.25rem] left-px right-8 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[7.25rem] left-px right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[7.25rem] left-8 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[7.25rem] left-16 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[7.25rem] left-24 right-0 mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[9rem] left-px right-32 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-px right-24 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-px right-16 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-px right-8 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-px right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-8 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-16 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-24 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-32 right-0 mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[10.75rem] left-0 right-40 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-0 right-32 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-0 right-24 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-0 right-16 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-0 right-8 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-8 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-16 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-24 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-32 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-40 right-0 mx-auto w-[1.9rem]' },
    
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-48 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-0 right-40 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-32 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-0 right-24 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-16 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-0 right-8 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-8 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-16 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-24 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-32 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-40 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-48 right-0 mx-auto w-[1.9rem]' },
  ]

  return (
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <div className={`w-full flex flex-row h-full relative p-4 ${error === true && "hidden"}`}>
        <div className='w-[70%] h-full border border-tile-color rounded p-2 overflow-y-auto'>
          <div className={`h-10 w-full flex flex-row justify-between mb-2 ${(loading === true || reloading === true) && "pointer-events-none"}`}>
            <MatchTypeTile type='competitive' text={LocalText(L, "matches.gamemodes.competitive")} delay={0.05} active={activeQueueTab} onClick={() => {changeMatchType('competitive')}} />
            <MatchTypeTile type='unrated' text={LocalText(L, "matches.gamemodes.unrated")} delay={0} active={activeQueueTab} onClick={() => {changeMatchType('unrated')}} />
            <MatchTypeTile type='swiftplay' text={LocalText(L, "matches.gamemodes.swiftplay")} delay={0.1} active={activeQueueTab} onClick={() => {changeMatchType('swiftplay')}} />
            <Select
              className={"w-40"}
              items={[
                { value: "0", text: "Other Modes", disabled: true, important: false },
                { "seperator": true },
                { value: "deathmatch", text: LocalText(L, "matches.gamemodes.deathmatch"), disabled: false, important: false },
                { value: "spikerush", text: LocalText(L, "matches.gamemodes.spikerush"), disabled: false, important: false },
                { value: "replication", text: LocalText(L, "matches.gamemodes.onefa"), disabled: false, important: false },
                { value: "escalation", text: LocalText(L, "matches.gamemodes.ggteam"), disabled: false, important: false },
              ]}
              value={modeSelectValue}
              setValue={setModeSelectValue}
              onChange={() => {
                changeMatchType(modeSelectValue);
              }}
            />
          </div>
          <div className={`w-full flex items-center text-center mt-10 ${noMatchesFound === false && "hidden"}`}>
            <span className='mx-auto'>No matches for this gamemode found.</span>
          </div>
          <div 
            id='loading' 
            className={'z-30 flex w-full justify-center items-center ' + (loading === true || reloading === true ? '' : 'hidden')}
          >
            <div 
              id='match-timeline' 
              className={
                'relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1 w-full'
              }
            >
              <div className='day relative'>
                <div id='day-header' className='text-lg ml-4 day-header font-bold relative bottom-px skeleton-text'>SKELETO</div>
                {imgArray.map((x, index) => {
                  return (
                    <div 
                      id='match'
                      className='group relative flex flex-row h-20 border p-1.5 mb-2 border-tile-color bg-tile-color bg-opacity-20 rounded mr-2 cursor-default transition-all duration-100 ease-linear' 
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
                      <div id='match-stats-2' className={`w-1/6 flex flex-row items-center ${activeQueueTab === "deathmatch" && "hidden"}`}>
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
          
          <div id='match-timeline' className={`relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1 ${(loading === true || reloading === true) && "hidden"}`}>
            {Object.keys(matches).map((key, index) => {
              moment.locale(router.query.lang);
              var startdate = moment();
              var today = startdate.format("D. MMMM");
              return (
                <div className='day relative' key={index}>
                  <div id='day-header' className='text-lg ml-4 day-header font-bold'>{today === key ? 'Today' : key}</div>
                  {matches[key].map((match, index) => {
                    var { matchData } = calculateMatchStats(match);

                    return (
                      <div id='match' className='relative flex flex-row h-20 border p-1.5 mb-2 bg-tile-color bg-opacity-10 border-tile-color rounded mr-2 cursor-default transition-all duration-100 ease-linear' key={index}>
                        <div className='w-1/3 flex flex-row'>
                          <div id='agent-img'>
                            <img className='h-full shadow-img' src={matchData.playerAgent ? `https://media.valorant-api.com/agents/${matchData.playerAgent}/displayicon.png` : ''} />
                          </div>
                          <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                            <span className='text-xl font-semibold'>{matchData.mapName}</span>
                            <span className='text-base font-light flex flex-row items-center'> 
                              <Tooltip 
                                content={matchData.playerCurrentTier > 3 ? matchData.rankFixed.tierName : ''}
                                color="error" 
                                placement={'top'} 
                                className={'rounded'}
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
                                    'w-8 scale-75 '
                                    +
                                    (activeQueueTab == 'competitive' ?
                                      `w-10`
                                      :
                                      ''
                                    )
                                  }
                                />
                              </Tooltip>
                              <span>{activeQueueTab != 'spikerush' ? (activeQueueTab[0].toUpperCase() + activeQueueTab.slice(1)) : ('Spike Rush')}</span>
                            </span>
                          </div>
                        </div>
                        <div id='match-score' className='w-1/3 flex flex-row items-center'>
                          <div id='scoreline' className='flex flex-col text-center w-1/3'>
                            <span className={'text-xl font-semibold ' + matchData.matchOutcomeColor}>{LocalText(L, "matches.match_outcomes." + matchData.matchOutcome)}</span>
                            {activeQueueTab != 'deathmatch' ? (<span className='text-lg'>{matchData.matchScore}</span>) : ''}
                          </div>
                          {activeQueueTab != 'deathmatch' ? 
                            (
                              <div 
                                id='scoreboard-pos' 
                                className={'rounded text-base h-8 py-0.5 px-1 ml-7 font-light ' + matchData.playerPositionColor}
                              >
                                {LocalText(L, "matches.match_pos." + (matchData.playerPositionText ? matchData.playerPositionText.replace(" ", "-") : ''))}
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
                          <div id='right-side' className='flex flex-col ml-8'>
                            <div className='text-lg' id='kda-display'>
                              <span className='kda-display-span'>{matchData.playerKills}</span> 
                              <span className='kda-display-span'>{matchData.playerDeaths}</span>
                              <span className=''>{matchData.playerAssists}</span>
                            </div>
                            <div className={`text-lg font-light ${matchData.playerKdColor} ${matchData.playerKills < 9 ? "ml-2" : "ml-1"}`} id='score-display'>
                              {matchData.playerKD}
                            </div>
                          </div>
                        </div>
                        <div id='match-stats-2' className={`w-1/6 flex flex-row items-center ${activeQueueTab === "deathmatch" && "hidden"}`}>
                          <div className='w-1/2 flex flex-col items-center'>
                            <span className='text-lg'>HS%</span>
                            <span className='text-lg font-light text-gray-500'>{matchData.headShotsPercentRounded}%</span>
                          </div>
                          <div className='w-1/2 flex flex-col items-center'>
                            <span className='text-lg'>ACS</span>
                            <span className='text-lg font-light text-gray-500'>{matchData.averageDamageRounded}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        <div className={`w-[30%] h-fit ml-4 border border-tile-color rounded relative p-2 ${loading === true && "hidden"}`}>
          <div className='banner-wrapper w-full h-[128px] absolute top-0 left-0 !z-10'>
            <div className='relative w-full h-full rounded'>
              <img src={playerInfo.card.wide} className={'w-full object-cover min-h-full max-h-full !rounded-t'} />
              <div className='bg-gradient-to-b from-maincolor-less-opacity to-maincolor w-full h-full absolute top-0 left-0 z-10 rounded-t' />
            </div>
          </div>
          <div className='min-h-[128px] !z-20 relative'>
            <span className='player-profile-name font-bold flex flex-row items-center justify-between'>
              <span>{playerInfo.name}<span className='text-gray-500 tracking-tighter'>{"#" + playerInfo.tag}</span></span>
            </span>
            <span className='flex flex-row items-center text-xl font-semibold'>
              <span className='relative top-px'>Level</span>
              <span className='relative items-center'>
                <img src={playerBorder} />
                <span className='absolute font-normal top-[3px] pt-px text-base left-0 right-0 mx-auto w-fit'>{playerInfo.account_level}</span>
              </span>
              <span className='ml-auto'>{playerInfo.region}</span>
            </span>
            <hr className='my-2' />
            <div className='w-full relative'>
              <span className='text-xl font-semibold block'>Competitive Data</span>
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>Current Season</span>
              <div 
                className='h-64 relative bg-opacity-75 flex justify-center mb-4' 
                style={{ 
                  backgroundImage: 'url(https://media.valorant-api.com/seasonborders/06289abe-489d-690b-edf1-51b9c063f3da/displayicon.png)',
                  backgroundSize: '350px',
                  backgroundPosition: 'center center',
                  backgroundRepeat: "no-repeat"
                }}
              >
                {actWins.map((winData, index) => {
                  return (
                    <img 
                      src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${winData}/ranktriangle${trianglePositionClassNames[index].orientation}icon.png`}
                      className={trianglePositionClassNames[index].className}
                      key={index}
                    />
                  )
                })}
                <div className='absolute top-0 left-0 w-full h-full bg-maincolor bg-opacity-50 flex flex-col items-center justify-center'>
                  <img src={playerInfo.currenttier_icon} className={`z-20 shadow-img relative mb-4 top-4`} />
                  <span className='text-xl font-semibold rank-triangle-text relative top-1'>{ranks[playerInfo.currenttier] ? ranks[playerInfo.currenttier].tierName : null}</span>
                  <span className='text-sm font-normal rank-triangle-text'>- {playerInfo.ranked_rating} RR -</span>
                </div>
              </div>
              <div className='flex flex-row items-center'>
                <span className='text-xl font-semibold'>Matches played</span>
                <span className='text-xl font-semibold ml-auto'>{playerInfo.total_matches_played}</span>
              </div>
              <div className='flex flex-row items-center'>
                <span className='text-xl font-semibold'>Winrate</span>
                <span className='text-xl font-semibold ml-auto'>{playerInfo.win_percentage}%</span>
              </div>
            </div>
            <hr className='my-2' />
            <div className='flex flex-row items-center'>
              <span className='text-xl font-semibold relative top-px'>Peak Rank</span>
              <div className='flex flex-row items-center ml-auto'>
                <img 
                  src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${playerInfo.peaktier}/largeicon.png`} 
                  className={'w-10 mr-2 shadow-img'} 
                />
                <span className='text-xl font-semibold relative top-px'>{ranks[playerInfo.peaktier] ? ranks[playerInfo.peaktier].tierName : null}</span>
              </div>
            </div>
            <div className={`${(activeQueueTab === "deathmatch" || reloading === true || hideStats === true) && "hidden"}`}>
              <hr className='my-2' />
              <span className='text-xl font-semibold block'>Stats - {activeQueueTab[0].toUpperCase() + activeQueueTab.slice(1)}</span> {/* For Translation, only use active tab as a variable to change string to destination */}
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>Last 20 Matches</span>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg KD</span>
                <span className='text-base font-medium ml-auto'>{avgKD}</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Headshot%</span>
                <span className='text-base font-medium ml-auto'>{headshotPercent}%</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg Kills/Match</span>
                <span className='text-base font-medium ml-auto'>{avgKillsPerMatch}</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg ACS</span>
                <span className='text-base font-medium ml-auto'>{avgCS}</span>
              </div>
              <hr className='my-2' />
              <div className='flex flex-row justify-between items-center h-fit'>
                <span className='text-sm text-gray-500 mr-2'>Matches played this Act: {gameAmountInfo.actMatches}</span>
                <hr className='transform h-[20px] w-px border-l mx-2' />
                <span className='text-sm text-gray-500 text-right'>Matches played overall: {gameAmountInfo.overallMatches}</span>
              </div>
            </div>
            <div className={`${(reloading === false) && "hidden"}`}>
              <hr className='my-2' />
              <span className='text-xl font-semibold block'>Stats - {activeQueueTab[0].toUpperCase() + activeQueueTab.slice(1)}</span> {/* For Translation, only use active tab as a variable to change string to destination */}
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>Last 20 Matches</span>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg KD</span>
                <span className='text-base font-medium ml-auto skeleton-text'>S.KE</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Headshot%</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK%</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg Kills/Match</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg ACS</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SKE</span>
              </div>
              <hr className='my-2' />
              <div className='flex flex-row justify-between items-center h-fit'>
                <span className='text-sm text-gray-500 mr-2'>Matches played this Act: {gameAmountInfo.actMatches}</span>
                <hr className='transform h-[20px] w-px border-l mx-2' />
                <span className='text-sm text-gray-500 text-right'>Matches played overall: {gameAmountInfo.overallMatches}</span>
              </div>
            </div>
          </div>
        </div>
        <div className={`w-[30%] h-fit ml-4 border border-tile-color rounded relative p-2 ${loading === false && "hidden"}`}>
          <div className='banner-wrapper w-full h-[128px] absolute top-0 left-0 !z-10'>
            <div className='relative w-full h-full rounded'>
              <img src={playerInfo.card.wide} className={'w-full object-cover min-h-full max-h-full !rounded-t'} />
              <div className='bg-gradient-to-b from-maincolor-less-opacity to-maincolor w-full h-full absolute top-0 left-0 z-10 rounded-t' />
            </div>
          </div>
          <div className='min-h-[128px] !z-20 relative'>
            <span className='player-profile-name font-bold flex flex-row items-center justify-between'>
              <span className='skeleton-text'>SKELET<span className='text-gray-500 tracking-tighter opacity-0'>#SKEL</span></span>
            </span>
            <span className='flex flex-row items-center text-xl font-semibold'>
              <span className='relative top-px'>Level</span>
              <span className={'relative items-center w-[76px]'}>
                <span className='w-4/6 skeleton-text'>SKELI</span>
              </span>
              <span className='ml-auto skeleton-text'>SK</span>
            </span>
            <hr className='my-2' />
            <div className='w-full relative'>
              <span className='text-xl font-semibold block'>Competitive Data</span>
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>Current Season</span>
              <div 
                className='h-64 relative bg-opacity-75 flex justify-center mb-4' 
                style={{ 
                  backgroundImage: 'url(https://media.valorant-api.com/seasonborders/06289abe-489d-690b-edf1-51b9c063f3da/displayicon.png)',
                  backgroundSize: '350px',
                  backgroundPosition: 'center center',
                  backgroundRepeat: "no-repeat"
                }}
              >
                {actWins.map((winData, index) => {
                  return (
                    <img 
                      src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${winData}/ranktriangle${trianglePositionClassNames[index].orientation}icon.png`}
                      className={trianglePositionClassNames[index].className}
                      key={index}
                    />
                  )
                })}
              </div>
              <div className='flex flex-row items-center'>
                <span className='text-xl font-semibold'>Matches played</span>
                <span className='text-xl font-semibold ml-auto skeleton-text'>SK</span>
              </div>
              <div className='flex flex-row items-center'>
                <span className='text-xl font-semibold'>Winrate</span>
                <span className='text-xl font-semibold ml-auto skeleton-text'>SK.EL%</span>
              </div>
            </div>
            <hr className='my-2' />
            <div className='flex flex-row items-center'>
              <span className='text-xl font-semibold relative top-px'>Peak Rank</span>
              <div className='flex flex-row items-center ml-auto w-[123px] skeleton-text' />
            </div>
            <div className={`${activeQueueTab === "deathmatch" && "hidden"}`}>
              <hr className='my-2' />
              <span className='text-xl font-semibold block'>Stats - {activeQueueTab[0].toUpperCase() + activeQueueTab.slice(1)}</span> {/* For Translation, only use active tab as a variable to change string to destination */}
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>Last 20 Matches</span>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg KD</span>
                <span className='text-base font-medium ml-auto skeleton-text'>S.KE</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Headshot%</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK%</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg Kills/Match</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>Avg ACS</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SKE</span>
              </div>
              <hr className='my-2' />
              <div className='flex flex-row justify-between items-center h-fit'>
                <span className='text-sm text-gray-500 mr-2'>Matches played this Act: <span className='skeleton-text'>SKE</span></span>
                <hr className='transform h-[20px] w-px border-l mx-2' />
                <span className='text-sm text-gray-500 text-right'>Matches played overall: <span className='skeleton-text'>SKEL</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`w-full h-full flex flex-row items-center justify-center`}>
        <div className='h-40 text-center'>
          <span className='font-bold text-2xl block'>Ooops!</span>
          <span className='text-lg'>{errorMessage}</span>
        </div>
      </div>
    </Layout>
  );
}

export default PlayerProfile;
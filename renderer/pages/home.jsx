import React from 'react';
import { ipcRenderer, shell } from 'electron';
import fetch from 'node-fetch'
import { Loading, Tooltip } from '@nextui-org/react';
import moment from 'moment';
import { Carousel } from 'react-responsive-carousel';
import SmallStatsCard from '../components/hub/SmallStatsCard';
import LargeStatsCard from '../components/hub/LargeStatsCard';
import FlatLargeStatsCard from '../components/hub/FlatLargeStatsCard';
import ContractProgressCard from '../components/hub/ContractProgressCard';
import { useFirstRender } from '../components/useFirstRender';
import { useRouter } from 'next/router';
import L from '../locales/translations/home.json';
import LocalText from '../components/translation/LocalText';
import Layout from '../components/Layout';
import APIi18n from '../components/translation/ValApiFormatter';
import { StarFilled, Star, Reload, ArrowRoundUp, Close } from '../components/SVGs';
import ValIconHandler from '../components/ValIconHandler';
import { executeQuery, getCurrentPUUID, getCurrentUserData, getUserAccessToken, getUserEntitlement, removeMatch, updateThing } from '../js/dbFunctions.mjs';
import { v5 as uuidv5 } from 'uuid';
import { Select } from '../components/Select';
import { getMatchHistory, getMatch, checkForRankup, getPlayerMMR } from '../js/riotAPIFunctions.mjs';
import getDifferenceInDays from '../js/getDifferenceInDays.mjs';
import calculatePlayerStatsFromMatches from '../js/calculatePlayerStatsFromMatches.mjs';
import { calculateContractProgress } from '../js/calculateContractProgress.mjs';
import { calculateMatchStats } from '../js/calculateMatchStats.mjs';
import asyncDelay from '../js/asyncDelay.mjs';

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
      if(queue === "competitive") {
        //var isRankup = await checkForRankup(region, puuid, match.matchInfo.matchId, entitlement_token, bearer); TODO: Check this by looking at the first match, then the second. If the first one has a lower rank, it was a rankup game, if it has a higher rank, it was a rankdown game, if it is the same rank, it was neither and if it was the most recent match, check with an extra API call, except for if the last game was a rankup.
        //match.matchInfo.isRankupGame = isRankup;
      }
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
    console.log(err);
    return { errored: true, items: err };
  }
}

const trianglePositionClassNames = [
  { orientation: "up", className: 'absolute top-[0.95rem] left-0 right-0 mx-auto w-[2.4rem]' },

  { orientation: "up", className: 'absolute top-[3.15rem] left-0 right-[40px] mx-auto w-[2.4rem]' },
  { orientation: "down", className: 'absolute top-[3.15rem] left-0 right-0 mx-auto w-[2.4rem]' },
  { orientation: "up", className: 'absolute top-[3.15rem] left-[40px] right-0 mx-auto w-[2.4rem]' },

  { orientation: "up", className: 'absolute top-[5.3rem] left-0 right-[5rem] mx-auto w-[2.4rem]' },
  { orientation: "down", className: 'absolute top-[5.3rem] left-0 right-[40px] mx-auto w-[2.4rem]' },
  { orientation: "up", className: 'absolute top-[5.3rem] left-0 right-0 mx-auto w-[2.4rem]' },
  { orientation: "down", className: 'absolute top-[5.3rem] left-[40px] right-0 mx-auto w-[2.4rem]' },
  { orientation: "up", className: 'absolute top-[5.3rem] left-[5rem] right-0 mx-auto w-[2.4rem]' }
];

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

  const [ silentError, setSilentError ] = React.useState(false);

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

// ------------------------------- NEWS -------------------------------

  const [ valorantNews, setValorantNews ] = React.useState([]);
  const [ newsLoading, setNewsLoading ] = React.useState(true);
  const [ newsError, setNewsError ] = React.useState(false);

// ------------------------------- MISC. -------------------------------
  
  const [ favMatches, setFavMatches ] = React.useState([]);
  const [ ranks, setRanks ] = React.useState([]);

  const [ userCreds, setUserCreds ] = React.useState({});

  const [ actWins, setActWins ] = React.useState([]);
  const [ mmrData, setMMRData ] = React.useState({});

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
  
        if(mapData.data !== undefined) {
          var map_data = mapData;
        } else {
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
          var map_data = await map_data_raw.json();
          setMapData(map_data);
          do {
            await asyncDelay(20);
          } while (mapData.data === undefined);
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
      } else if(data.items.totalMatches === 0) {
        setCurrentMatches([]);
        setLoading(false);
        setAreStatsActive(false);
        setSilentError(false);
      } else {
        setLoading(false);
        setIsSilentLoading(false);
        setSilentError(true);

        ipcRenderer.send("relayTextbox", { persistent: true, text: "Error while fetching new matches. Only old matches will be shown." });

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
          
        setAvgKillsPerMatch(playerstats.kills_per_match);
        setAvgKillsPerRound(playerstats.kills_per_round);
        setWinratePercent(playerstats.win_percentage);
        setHeadshotPercent(playerstats.headshot_percent);
        
        var map_stats = playerstats.map_stats;
        var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
          return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
        });
  
        var best_map = map_stats[sorted_map_stats[0]];
  
        if(mapData.data !== undefined) {
          var map_data = mapData;
        } else {
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
          var map_data = await map_data_raw.json();
          setMapData(map_data);
          do {
            await asyncDelay(20);
          } while (mapData.data === undefined);
        }
        
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
      }
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
        const res2 = latest_old_matches.filter((match1) => !latest_new_matches.some(match2 => match1 === match2.matchInfo.matchId));
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
          
          setAvgKillsPerMatch(playerstats.kills_per_match);
          setAvgKillsPerRound(playerstats.kills_per_round);
          setWinratePercent(playerstats.win_percentage);
          setHeadshotPercent(playerstats.headshot_percent);
          var map_stats = playerstats.map_stats;
          var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
            return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
          });
    
          var best_map = map_stats[sorted_map_stats[0]];
  
          if(mapData.data !== undefined) {
            var map_data = mapData;
          } else {
            var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
            var map_data = await map_data_raw.json();
            setMapData(map_data);
            do {
              await asyncDelay(20);
            } while (mapData.data === undefined);
          }
          
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
        } else if(data.items.totalMatches === 0) {
          setCurrentMatches([]);
          setLoading(false);
          setAreStatsActive(false);
          setSilentError(false);
        } else {
          setLoading(false);
          setIsSilentLoading(false);
          setSilentError(true);
  
          ipcRenderer.send("relayTextbox", { persistent: true, text: "Error while fetching new matches. Only old matches will be shown." });
  
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
            
          setAvgKillsPerMatch(playerstats.kills_per_match);
          setAvgKillsPerRound(playerstats.kills_per_round);
          setWinratePercent(playerstats.win_percentage);
          setHeadshotPercent(playerstats.headshot_percent);
          
          var map_stats = playerstats.map_stats;
          var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
            return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
          });
    
          var best_map = map_stats[sorted_map_stats[0]];
    
          if(mapData.data !== undefined) {
            var map_data = mapData;
          } else {
            var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
            var map_data = await map_data_raw.json();
            setMapData(map_data);
            do {
              await asyncDelay(20);
            } while (mapData.data === undefined);
          }
          
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
        }
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
        
      setAvgKillsPerMatch(playerstats.kills_per_match);
      setAvgKillsPerRound(playerstats.kills_per_round);
      setWinratePercent(playerstats.win_percentage);
      setHeadshotPercent(playerstats.headshot_percent);
      
      var map_stats = playerstats.map_stats;
      var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
        return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
      });

      var best_map = map_stats[sorted_map_stats[0]];
  
      if(mapData.data !== undefined) {
        var map_data = mapData;
      } else {
        var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
        var map_data = await map_data_raw.json();
        setMapData(map_data);
        do {
          await asyncDelay(20);
        } while (mapData.data === undefined);
      }
      
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
      setSilentError(false);

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
  
      if(data.errored === false && data.items.totalMatches > 0) {
        var obj = {};

        var dataToWrite = data;
        for(var key in dataToWrite.items.games) {
          obj[key] = dataToWrite.items.games[key];
        }
        dataToWrite.items.games = obj;
  
        var playerstats = calculatePlayerStatsFromMatches(data.items.games, puuid);
        
        setAvgKillsPerMatch(playerstats.kills_per_match);
        setAvgKillsPerRound(playerstats.kills_per_round);
        setWinratePercent(playerstats.win_percentage);
        setHeadshotPercent(playerstats.headshot_percent);
  
        var map_stats = playerstats.map_stats;
        var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
          return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
        });
  
        var best_map = map_stats[sorted_map_stats[0]];
  
        if(mapData.data !== undefined) {
          var map_data = mapData;
        } else {
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
          var map_data = await map_data_raw.json();
          setMapData(map_data);
          do {
            await asyncDelay(20);
          } while (mapData.data === undefined);
        }
        
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
        setSilentError(false);
      } else if(data.items.totalMatches === 0) {
        setCurrentMatches([]);
        setLoading(false);
        setAreStatsActive(false);
        setSilentError(false);
      } else {
        setLoading(false);
        setIsSilentLoading(false);
        setSilentError(true);

        ipcRenderer.send("relayTextbox", { persistent: true, text: "Error while fetching new matches. Only old matches will be shown." });

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
          
        setAvgKillsPerMatch(playerstats.kills_per_match);
        setAvgKillsPerRound(playerstats.kills_per_round);
        setWinratePercent(playerstats.win_percentage);
        setHeadshotPercent(playerstats.headshot_percent);
        
        var map_stats = playerstats.map_stats;
        var sorted_map_stats = Object.keys(map_stats).sort(function(a, b) {
          return (parseInt(map_stats[b].map_kda_ratio) - parseInt(map_stats[a].map_kda_ratio)) + (parseInt(map_stats[b].map_win_percentage) - parseInt(map_stats[a].map_win_percentage));
        });
  
        var best_map = map_stats[sorted_map_stats[0]];
  
        if(mapData.data !== undefined) {
          var map_data = mapData;
        } else {
          var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
          var map_data = await map_data_raw.json();
          setMapData(map_data);
          do {
            await asyncDelay(20);
          } while (mapData.data === undefined);
        }
        
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
        const bearer = await getUserAccessToken();
  
        const entitlement_token = await getUserEntitlement();
  
        var contract_progress = await calculateContractProgress(user_creds.region, user_creds.uuid, bearer, entitlement_token, router.query.lang);
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

  const fetchFurtherMatches = async () => {
    setFetchingFurtherMatches(true);
    setMatchFetchingError(false);

    fetchMatchesAndCalculateStats(false, currentlyLoadedMatchCount, currentlyLoadedMatchCount + 5, activeQueueTab, false, false, true, currentMatches);
  } 

  const toggleMatchInFavs = async (MatchID, isFav) => {
    var dbFavMatches = await executeQuery(`SELECT * FROM matchIDCollection:⟨favMatches::${userCreds.uuid}⟩`);
    if(!isFav) {
      await updateThing(`matchIDCollection:⟨favMatches::${userCreds.uuid}⟩`, {
        "matchIDs": [
          ...dbFavMatches[0].matchIDs,
          MatchID
        ]
      });

      setFavMatches([...dbFavMatches[0].matchIDs, MatchID]);
    } else {
      await removeMatch('favMatches', MatchID);

      const index = favMatches.indexOf(MatchID);
      if (index > -1) {
        setFavMatches(current => current.filter(x => x !== MatchID));
      }
    }
  }
  
  React.useEffect(async () => {
    ipcRenderer.send('changeDiscordRP', "hub_activity");

    var user_creds = await getCurrentUserData();
    setUserCreds(user_creds);

    var favs_data = await executeQuery(`SELECT * FROM matchIDCollection:⟨favMatches::${user_creds.uuid}⟩`);

    setFavMatches(favs_data[0].matchIDs);
  
    if(mapData.data === undefined) {
      var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
      var map_data = await map_data_raw.json();
      setMapData(map_data);
    }

    var uuid = uuidv5("hubMatchFilter", process.env.SETTINGS_UUID);
    var result = await executeQuery(`SELECT * FROM setting:⟨${uuid}⟩`);

    setActiveQueueTab(result[0].value);

    var ent = await getUserEntitlement();
    var bearer = await getUserAccessToken();
    
    var data = await getPlayerMMR(user_creds.region, user_creds.uuid, ent, bearer);
    setMMRData(data);

    var arr = [];

    Object.keys(data.ActWinsByTier).forEach(singleKey => {
      if(singleKey != "0") {
        for(var i = 0; i < data.ActWinsByTier[singleKey]; i++) {
          arr.push(singleKey);
        }
      }
    });
    arr = arr.reverse().slice(0, 9);

    setActWins(arr);

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
      setSilentError(false);
      setFetchingFurtherMatches(false);
      setMatchFetchingError(false);
    }
  }, []);

  React.useEffect(async () => {
    const refetchFeaturedBundle = async () => {
      var featured_bundle = await (await fetch(`https://api.valtracker.gg/v1/bundles/featured`, { headers: { "x-valtracker-lang": APIi18n(router.query.lang) } })).json();
      
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
        var ranksRaw = await(await fetch('https://valorant-api.com/v1/competitivetiers?language=' + APIi18n(router.query.lang))).json();
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

  React.useEffect(async () => {
    try {
      var news = await (await fetch(`https://api.valtracker.gg/v1/riot/news`)).json();
      setValorantNews(news.data.articles);
      setNewsError(false);
      setNewsLoading(false);
    } catch(e) {
      setNewsError(true);
      setNewsLoading(false);
    }
  }, []);

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
              <div className={'absolute -top-2.5 -right-5 w-6 h-6 z-30 ' + (isSilentLoading === true || contractsLoading === true ? '' : 'hidden')}>
                <Loading color={'error'} size={'sm'} />
              </div>
            </Tooltip>
            <Reload 
              className={`w-5 h-5 absolute top-2 right-2 cursor-pointer ${isSilentLoading === true || contractsLoading === true || contractsError === true ? "hidden" : ""}`}
              onClick={() => {
                setContractsLoading(true);
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
          <div className={'h-full w-full ' + (newsLoading || newsError ? 'hidden ' : '')}>
            <Carousel 
              showArrows={false} 
              showStatus={false} 
              showIndicators={true} 
              infiniteLoop={true} 
              showThumbs={false} 
              useKeyboardArrows={true} 
              autoPlay={true} 
              stopOnHover={true}
              swipeable={false}
              dynamicHeight={true}
              emulateTouch={false}
              autoFocus={false}
              interval={4000}
              className={"w-full h-full border-red-500"}
              onClickItem={(index, item) => {
                shell.openExternal(valorantNews[index].external_link === "" ? valorantNews[index].url : valorantNews[index].external_link);
              }}
            >
              {valorantNews.map((article, index) => {
                return (
                  <div className='relative h-full' key={index}>
                    <img className='shadow-img rounded object-cover min-h-full' src={article.banner} />
                    <p className='legend'>{article.title}</p>
                  </div>
                )
              })}
            </Carousel>
          </div>
          <div
            className={'absolute top-0 left-0 z-20 flex flex-col w-full h-4/5 justify-center items-center text-center ' + (newsError ? ' ' : 'hidden ') + (newsLoading ? 'hidden' : '')}
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
            className={'absolute top-0 left-0 z-20 flex w-full h-4/5 justify-center items-center ' + (newsError ? 'hidden ' : ' ') + (newsLoading ? '' : 'hidden')}
          >
            <Loading color={'error'} size={'lg'} />
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
              <div className={'absolute -top-2 -right-5 w-6 h-6 z-30 ' + (isSilentLoading === true ? '' : 'hidden')}>
                <Loading color={'error'} size={'sm'} />
              </div>
            </Tooltip>
            <Tooltip content={LocalText(L, "component_err.err_text")} color="error" placement={'left'} className='rounded absolute top-2.5 right-7'>
              <div className={'absolute -top-2 -right-6 w-6 h-6 z-30 ' + (silentError === true && isSilentLoading === false && loading === false ? '' : 'hidden')}>
                <Close className={"close-red w-5 h-5"} onClick={() => { fetchMatchesAndCalculateStats(false, 0, 15, activeQueueTab, false) }}  /> 
              </div>
            </Tooltip>
            <div className={`absolute h-[26px] -top-px right-2 z-20 w-40 ${isSilentLoading === true && "hidden"} ${silentError === true ? "right-10" : "right-2"}`}>
              <Select
                items={[
                  { 
                    value: "unrated", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/unrated.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_1")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                  { 
                    value: "competitive", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/unrated.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_2")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                  { 
                    value: "deathmatch", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/deathmatch.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_3")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                  { 
                    value: "spikerush", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/spikerush.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_4")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                  { 
                    value: "custom", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/unrated.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_7")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                  { 
                    value: "swiftplay", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/swiftplay.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_8")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                  { 
                    value: "onefa", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/onefa.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_5")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                  { 
                    value: "ggteam", 
                    text: (
                      <span className='flex flex-row items-center'>
                        <ValIconHandler icon={'/images/ggteam.png'} classes={'w-4 h-4 mr-1'} /> {LocalText(L, "bot_r.match_filter.fl_6")}
                      </span>
                    ), 
                    disabled: false, important: false 
                  },
                ]}
                className={"w-full"}
                value={activeQueueTab}
                setValue={setActiveQueueTab}
                onChange={() => {}}
                thin={true}
              />
            </div>
            {currentlyLoadedMatchCount > 0 ?
              Object.keys(currentMatches).map((key, index) => {
                moment.locale(router.query.lang);
                var startdate = moment();
                var today = startdate.format("D. MMMM");
                return (
                  <div className='day relative' key={index}>
                    <div id='day-header' className='text-lg ml-4 day-header font-bold relative bottom-px'>{today === key ? 'Today' : key}</div>
                    {currentMatches[key].map((match, index) => {
                      var { matchData, matchViewData } = calculateMatchStats(match, userCreds.name, userCreds.tag, mapData, ranks);
                      
                      if(activeQueueTab === "competitive") {
                        var isRankup = match.matchInfo.isRankupGame;
                      }

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
                              <span className={`text-lg font-semibold ${activeQueueTab == 'competitive' ? "relative left-1.5 top-1.5" : ""}`}>{matchData.mapName}</span>
                              <span className='text-base font-light flex flex-row items-center relative'> 
                                <Tooltip 
                                  content={matchData.playerCurrentTier > 3 && matchData.rankFixed !== undefined ? matchData.rankFixed.tierName : ''}
                                  color="error" 
                                  placement={'top'} 
                                  className={'rounded'}
                                >
                                  {
                                    activeQueueTab === 'competitive' ? 
                                    <img 
                                      src={
                                        matchData.playerCurrentTier ? 
                                        `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${matchData.playerCurrentTier}/smallicon.png`
                                        :
                                        `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                                      } 
                                      className={'w-9 scale-75 shadow-img'}
                                    />
                                    :
                                    <ValIconHandler icon={`/images/${activeQueueTab}.png`} classes={'w-7 scale-75 shadow-img'} />
                                  }
                                </Tooltip>
                                {activeQueueTab === 'competitive' && isRankup === true ? (
                                  <ArrowRoundUp className={'rankup-arrow text-val-blue val-blue-glow w-[1rem] h-[1rem] absolute top-[1.4rem] left-[1.4rem]'} />
                                ) : null}
                                <span className='ml-0.5'>{LocalText(L, "bot_l.gamemodes." + match.matchInfo.queueID)}</span>
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
                {LocalText(L, "bot_l.bottom_text.loaded_matches_count", (currentlyLoadedMatchCount > maxMatchesFound ? maxMatchesFound : currentlyLoadedMatchCount), (maxMatchesFound ? maxMatchesFound : "???"))}
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
        </div>
        <div id='bottom-right-container' className='relative overflow-y-auto rounded p-2 border border-maincolor-dim'>
          <div className={`overflow-y-auto ${silentError === true && "opacity-0"}`}>
            <div className={'p-0 m-0' + (areStatsActive ? '' : ' hidden ')}>
              <span className={`font-bold text-lg block ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.comp_info.header")}</span>
              <span className={`font-normal relative bottom-0.5 text-sm text-gray-400 block mb-1 ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.comp_info.subheader", mmrData.days_remaining)}</span>
              <div className='flex comp-data-container min-h-32'>
                <div 
                  className={`relative home-rank-triangle flex justify-center mb-4 !h-32 ${loading === true && "skeleton-image"}`}
                  style={{ 
                    backgroundImage: 'url(https://media.valorant-api.com/seasonborders/d3b30fbf-445e-0bce-bf98-b2b58e5807c6/smallicon.png)',
                    backgroundSize: '180px',
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
                <div className='comp-data-text'>
                  <span className='flex flex-row items-center'>
                    <img src={mmrData.currenttier_icon ? mmrData.currenttier_icon : "/images/vandal_invisible.png"} className={`z-20 w-12 h-12 shadow-img inline relative mr-1`} />
                    <div className='flex flex-col relative top-1'>
                      <span 
                        style={{ color: (ranks[mmrData.currenttier] ? `#${ranks[mmrData.currenttier].color.slice(0, -2)}` : "#fff") }}
                        className={`font-bold text-2xl ${loading === true && "skeleton-text"}`}
                      >
                        {(ranks[mmrData.currenttier] ? ranks[mmrData.currenttier].tierName : "AMOGUSSUSSY")}
                      </span>
                      <span className={`text-sm font-normal relative bottom-1 ${loading === true && "skeleton-text"}`}>- {mmrData.ranked_rating} RR -</span>
                    </div>
                  </span>
                  <hr className='mt-1 mb-2' />
                  <span className='flex flex-row justify-between'>
                    <span className='text-base font-medium'>Matches played</span>
                    <span className={`text-base font-medium ${loading === true && "skeleton-text"}`}>{mmrData.total_matches_played ? mmrData.total_matches_played : "69"}</span>
                  </span>
                  <span className='flex flex-row justify-between'>
                    <span className='text-base font-medium'>Win%</span>
                    <span className={`text-base font-medium ${loading === true && "skeleton-text"}`}>{mmrData.win_percentage ? mmrData.win_percentage : "42.00"}%</span>
                  </span>
                </div>
              </div>
              <span className={`font-bold text-lg ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.stats.header", currentlyLoadedMatchCount)}</span>
              <div className='flex flex-row justify-between mt-1.5'>
                <SmallStatsCard number={avgKillsPerMatch} desc={LocalText(L, "bot_r.stats.stat_1")} loading={loading} />
                <SmallStatsCard number={avgKillsPerRound} desc={LocalText(L, "bot_r.stats.stat_2")} loading={loading} />
              </div>

              <div className='flex flex-row justify-between mt-1.5 mb-3'>
                <SmallStatsCard number={winratePercent + '%'} desc={LocalText(L, "bot_r.stats.stat_3")} loading={loading} />
                <SmallStatsCard number={headshotPercent + '%'} desc={LocalText(L, "bot_r.stats.stat_4")} loading={loading} />
              </div>

              <span className={`mt-1 font-bold text-lg ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.best_map.header")}</span>
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

              <span className={`mt-1 font-bold text-lg ${loading === true && "skeleton-text"}`}>{LocalText(L, "bot_r.best_agent.header")}</span>
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
import React from 'react';
import Layout from '../components/Layout';
import { motion } from "framer-motion"
import { useRouter } from 'next/router';
import fetch from 'node-fetch';
import fs from 'fs';
import MatchTypeTile from '../components/profiles/MatchTypeTile';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { Loading } from "@nextui-org/react";
import { Tooltip } from '@nextui-org/react';
import L from '../locales/translations/player.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';

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

async function getPlayerMMR(region, puuid, entitlement_token, bearer) {
  var valorant_version = await(await fetch('https://valorant-api.com/v1/version')).json();
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch(`https://pd.${region}.a.pvp.net/mmr/v1/players/` + puuid, {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      'Authorization': 'Bearer ' + bearer,
      'X-Riot-ClientVersion': valorant_version.data.riotClientVersion,
      'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json());
}

const fetchPlayer = async (name, tag, lang) => {
  try {
    const playerInfoRaw = await fetch(`https://api.henrikdev.xyz/valorant/v1/account/${name}/${tag}`, { keepalive: true });
    const playerInfo = await playerInfoRaw.json();

    if(playerInfo.status !== 200) {
      return { errored: true, items: {status: playerInfo.status, message: playerInfo.message }};
    }

    const puuid = playerInfo.data.puuid;
    const region = playerInfo.data.region;
    const playerName = playerInfo.data.name;
    const playerTag = playerInfo.data.tag;

    const rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
    const tokenData = JSON.parse(rawTokenData);

    const bearer = tokenData.accessToken;
    const entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;

    const playerMmr = await getPlayerMMR(region, puuid, entitlement_token, bearer);

    const currenttier = playerMmr.LatestCompetitiveUpdate.TierAfterUpdate;
    if(!currenttier) currenttier = 0;

    var playerRanksRaw = await(await fetch('https://valorant-api.com/v1/competitivetiers?language=' + APIi18n(lang))).json()
    var playerRanks = playerRanksRaw.data[playerRanksRaw.data.length-1].tiers

    const playerRank = playerRanks[playerMmr.LatestCompetitiveUpdate.TierAfterUpdate];
    const playerRankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${currenttier}/smallicon.png`;

    const playerMatches = await getMatchHistory(region, puuid, 0, 5, 'unrated', entitlement_token, bearer);
    
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
      playerInfo: {
        "name": playerName,
        "tag": playerTag,
        "puuid": puuid,
        "region": region.toUpperCase(),
        "account_level": playerInfo.data.account_level,
        "card": playerInfo.data.card.small,
        "playerRankNum": currenttier,
        "playerRank": playerRank,
        "playerRankIcon": playerRankIcon,
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
    const rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
    const tokenData = JSON.parse(rawTokenData);

    const bearer = tokenData.accessToken;
    const entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;

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

function PlayerInfo() {
  const router = useRouter();

  var errorReasons = LocalText(L, "errorReasons");

  const [ loading, setLoading ] = React.useState(true);
  const [ error, setError ] = React.useState(false);
  const [ errorReason, setErrorReason ] = React.useState('');
  const [ isReloadable, setIsReloadable ] = React.useState(false);

  const [ playerCard, setPlayerCard ] = React.useState(null);
  const [ playerNameTag, setPlayerNameTag ] = React.useState(null);
  const [ playerRankImg, setPlayerRankImage ] = React.useState(null);
  const [ playerRegion, setPlayerRegion ] = React.useState(null);
  const [ playerLevel, setPlayerLevel ] = React.useState(null);
  const [ playerUUID, setPlayerUUID ] = React.useState(null);
  const [ matches, setMatches ] = React.useState([]);

  const [ shownMatches, setShownMatches ] = React.useState(5);
  const [ maxMatches, setMaxMatches ] = React.useState(null);

  const [ isFetchingMatches, setIsFetchingMatches ] = React.useState(false);

  const [ activeQueueTab, setActiveQueueTab ] = React.useState('unrated');

  const [ matchFetchingError, setMatchFetchingError ] = React.useState(false);

  const [ mapData, setMapData ] = React.useState({});

  const [ playerRanks, setPlayerRanks ] = React.useState([]);

  React.useEffect(() => {
    const fetchApi = async () => {
      var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
      var map_data = await map_data_raw.json();
      setMapData(map_data);

      var name = router.query.name;
      var tag = router.query.tag;
      const { errored, items } = await fetchPlayer(name, tag, router.query.lang);
      
      if(!errored) {
        setMatches(items.matches.games);

        setPlayerCard(items.playerInfo.card);
        setPlayerNameTag(items.playerInfo.name + '#' + items.playerInfo.tag);
        setPlayerRankImage(items.playerInfo.playerRankIcon);
        setPlayerRegion(items.playerInfo.region);
        setPlayerLevel(items.playerInfo.account_level);
        setPlayerUUID(items.playerInfo.puuid);

        setMaxMatches(items.matches.totalMatches);
        setShownMatches(items.matches.endIndex);

        setLoading(false);
      } else {
        setLoading(false);
        setError(true);

        if(items.status) {
          setErrorReason(errorReasons[items.status]);
          if( 
            items.status == 400 || 
            items.status == 401 || 
            items.status == 402 || 
            items.status == 403 || 
            items.status == 405 || 
            items.status == 406 || 
            items.status == 408 ||
            items.status == 500 ||
            items.status == 501 ||
            items.status == 502 ||
            items.status == 503 ||
            items.status == 504 
          ) {
            setIsReloadable(true);
          }
        } else {
          setErrorReason(errorReasons['400']);
        }
      }
    }

    fetchApi();
  }, []);

  React.useEffect(async () => {
    var playerRanksRaw = await(await fetch('https://valorant-api.com/v1/competitivetiers?language=' + APIi18n(router.query.lang))).json()
    setPlayerRanks(playerRanksRaw.data[playerRanksRaw.data.length-1].tiers);
  }, []);

  const fetchFurtherMatches = async () => {
    setIsFetchingMatches(true);
    setMatchFetchingError(false);

    const fetchApi = async () => {
      const { errored, items } = await fetchMatches(shownMatches, shownMatches + 5, matches, activeQueueTab, playerUUID, playerRegion, router.query.lang);

      if(!errored) {
        setShownMatches(items.matches.endIndex);
        setMatches(items.matches.games);
        setIsFetchingMatches(false);
      } else {
        console.error(items);
        setMatchFetchingError(true);
        setIsFetchingMatches(false);

        if(items.status) {
          setErrorReason(errorReasons[items.status]);
          if( 
            items.status == 400 || 
            items.status == 401 || 
            items.status == 402 || 
            items.status == 403 || 
            items.status == 405 || 
            items.status == 406 || 
            items.status == 408 ||
            items.status == 500 ||
            items.status == 501 ||
            items.status == 502 ||
            items.status == 503 ||
            items.status == 504 
          ) {
            setIsReloadable(true);
          }
        } else {
          setErrorReason(errorReasons['400']);
        }
      }
    }
    
    fetchApi();
  }
  
  const changeMatchType = async (type) => {
    setMatches([]);
    setIsFetchingMatches(true);
    setActiveQueueTab(type);
    setShownMatches(0);
    setMaxMatches(0);
    const fetchApi = async () => {
      const { errored, items } = await fetchMatches(0, 5, [], type, playerUUID, playerRegion, router.query.lang);

      if(!errored) {
        setMatches(items.matches.games);

        setMaxMatches(items.matches.totalMatches);
        setShownMatches(items.matches.endIndex);
        setIsFetchingMatches(false);
      } else {
        if(items.status) {
          setErrorReason(errorReasons[items.status]);
          if( 
            items.status == 400 || 
            items.status == 401 || 
            items.status == 402 || 
            items.status == 403 || 
            items.status == 405 || 
            items.status == 406 || 
            items.status == 408 ||
            items.status == 500 ||
            items.status == 501 ||
            items.status == 502 ||
            items.status == 503 ||
            items.status == 504 
          ) {
            setIsReloadable(true);
          }
        } else {
          setErrorReason(errorReasons['400']);
        }
        setIsFetchingMatches(false);
      }
    }
    
    fetchApi();
  }

  return (
    <>
      <motion.div 
        key={"matches"}
        variants={loading_variants}
        initial="hidden"
        exit="exit"
        animate={loading ? 'closed' : 'open'}
        className={'w-full px-16 flex flex-col absolute top-0 left-0 ' + (loading || error ? 'hidden' : '')}
        transition={{ type: 'ease-in', duration: 0.2 }}
      >
        <div id='player-stats-header' className='flex flex-row w-5/6 mb-16'>
          <div id='card-wrapper' className='rounded relative'>
            <img id='player-card' src={playerCard} className='rounded shadow-img' />
            <span id='player-level' className='absolute bottom-0 rounded-b-sm left-0 w-full text-center bg-black opacity-80'>{playerLevel}</span>
          </div>
          <div id='player-info' className='text-2xl flex flex-col ml-4 py-auto'>
            <div id='rank-name' className=''>
              <span id='player-name-region'>{playerNameTag}</span><br /> 
              <span id='player-name-region' className='flex items-center'>
                <img 
                  src={playerRankImg}
                  className='w-12 inline-block shadow-img p-1 mr-1' 
                /> 
                - {playerRegion}
                </span>
            </div>
          </div>
        </div>
        <div id='matches'>
          <div id='match-type-selector' className='flex justify-between mb-4'>
            <MatchTypeTile type='unrated' text={LocalText(L, "matches.gamemodes.unrated")} delay={0} active={activeQueueTab} onClick={() => {changeMatchType('unrated')}} />
            <MatchTypeTile type='competitive' text={LocalText(L, "matches.gamemodes.competitive")} delay={0.05} active={activeQueueTab} onClick={() => {changeMatchType('competitive')}} />
            <MatchTypeTile type='deathmatch' text={LocalText(L, "matches.gamemodes.deathmatch")} delay={0.1} active={activeQueueTab} onClick={() => {changeMatchType('deathmatch')}} />
            <MatchTypeTile type='spikerush' text={LocalText(L, "matches.gamemodes.spikerush")} delay={0.15} active={activeQueueTab} onClick={() => {changeMatchType('spikerush')}} />
            <MatchTypeTile type='replication' text={LocalText(L, "matches.gamemodes.onefa")} delay={0.2} active={activeQueueTab} onClick={() => {changeMatchType('replication')}} />
            <MatchTypeTile type='escalation' text={LocalText(L, "matches.gamemodes.ggteam")} delay={0.25} active={activeQueueTab} onClick={() => {changeMatchType('escalation')}} />
            <MatchTypeTile type='custom' text={LocalText(L, "matches.gamemodes.custom")} delay={0.3} active={activeQueueTab} onClick={() => {changeMatchType('custom')}} />
          </div>
          <div id='match-timeline' className='relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1'>
            {Object.keys(matches).map((key, index) => {
              moment.locale(router.query.lang);
              var startdate = moment();
              var today = startdate.format("D. MMMM");
              return (
                <div className='day relative' key={index}>
                  <div id='day-header' className='text-lg ml-4 day-header'>{today === key ? 'Today' : key}</div>
                  {matches[key].map((match, index) => {
                    /* MATCH INFO */
                    var winningTeamScore;
                    var losingTeamScore;
                    
                    for(var i = 0; i < match.teams.length; i++) {
                      if(match.teams[i].won == true) {
                        var winning_team = match.teams[i].teamId;
                        winningTeamScore = match.teams[i].roundsWon;
                      } else {
                        losingTeamScore = match.teams[i].roundsWon;
                      }
                    }

                    if(!winningTeamScore || !losingTeamScore) {
                      var winningTeam = 'draw';
                    }
  
                    /* MAP INFO */
                    for(var i = 0; i < mapData.data.length; i++) {
                      if(match.matchInfo.mapId === mapData.data[i].mapUrl) {
                        var mapName = mapData.data[i].displayName;
                      }
                    }
  
                    /* PLAYER STATS */
                    if(router.query.name && router.query.tag) {
                      for(var i = 0; i < match.players.length; i++) {
                        var playerNameTag = `${match.players[i].gameName.toLowerCase()}#${match.players[i].tagLine.toLowerCase()}`;
                        var searchedNameTag = `${router.query.name.toLowerCase()}#${router.query.tag.toLowerCase()}`;
                        
                        if(playerNameTag == searchedNameTag) {
                          var playerInfo = match.players[i];
                          var playerCurrentTier = match.players[i].competitiveTier;
                          var playerRankFixed = playerRanks[playerCurrentTier];
                        }
                      }
                    }
  
                    // Again, Boilerplate if-statement to make sure JS doesnt cry about undefined
                    if(playerInfo) {
                      var playerUUID = playerInfo.subject;
                      var playerTeam = playerInfo.teamId;
    
                      if(playerTeam == winning_team) {
                        var matchOutcome = "VICTORY";
                        var matchOutcomeColor = 'text-val-blue';
                        var matchScore = winningTeamScore + ' - ' + losingTeamScore;
                      } else if(winningTeam == 'draw') {
                        // check if winningTeamScore or losingTeamScore is undefined, if yes, replace with other team's score
                        if(!winningTeamScore) {
                          winningTeamScore = losingTeamScore;
                        } else if(!losingTeamScore) {
                          losingTeamScore = winningTeamScore;
                        }

                        var matchOutcome = "DRAW";
                        var matchOutcomeColor = 'text-val-yellow';
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
    
                      var playerScore = playerInfo.stats.score;
    
                      var playerKdRaw = playerKills / playerDeaths;
                      var playerKD = playerKdRaw.toFixed(2);
    
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
                      
                      var playerPosition = players.findIndex(player => player.subject == playerUUID);
  
                      if(playerPosition == 0) {
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

                      /* OTHER PLAYER STATS */
                      if(activeQueueTab != 'deathmatch') {
                        var headShots = 0;
                        var bodyShots = 0;
                        var legShots = 0;
    
                        var totalDamage = 0;
    
                        for(var i = 0; i < match.roundResults.length; i++) {
                          for(var i2 = 0; i2 < match.roundResults[i].playerStats.length; i2++) {
                            if(match.roundResults[i].playerStats[i2].subject == playerUUID) {
                              for(var i3 = 0; i3 < match.roundResults[i].playerStats[i2].damage.length; i3++) {
                                headShots += match.roundResults[i].playerStats[i2].damage[i3].headshots;
                                bodyShots += match.roundResults[i].playerStats[i2].damage[i3].bodyshots;
                                legShots += match.roundResults[i].playerStats[i2].damage[i3].legshots;
    
                                totalDamage += match.roundResults[i].playerStats[i2].damage[i3].damage;
                              }
                            }
                          }
                        }
    
                        // Calculate HS%
                        var totalShotsHit = headShots + bodyShots + legShots;
    
                        var headShotsPercent = (headShots / totalShotsHit) * 100;
                        var headShotsPercentRounded = headShotsPercent.toFixed(0);

                        // Calculate ACS
                        var averageDamageRounded = (match.players[playerPosition].stats.score / match.roundResults.length).toFixed(0);
                      } else {
                        var headShots = 0;
                        var bodyShots = 0;
                        var legShots = 0;
    
                        var totalDamage = 0;
    
                        for(var i = 0; i < match.roundResults.length; i++) {
                          for(var i2 = 0; i2 < match.roundResults[i].playerStats.length; i2++) {
                            if(match.roundResults[i].playerStats[i2].subject == playerUUID) {
                              for(var i3 = 0; i3 < match.roundResults[i].playerStats[i2].damage.length; i3++) {
                                headShots += match.roundResults[i].playerStats[i2].damage[i3].headshots;
                                bodyShots += match.roundResults[i].playerStats[i2].damage[i3].bodyshots;
                                legShots += match.roundResults[i].playerStats[i2].damage[i3].legshots;
    
                                totalDamage += match.roundResults[i].playerStats[i2].damage[i3].damage;
                              }
                            }
                          }
                        }
    
                        // Calculate HS%
                        var totalShotsHit = headShots + bodyShots + legShots;
    
                        var headShotsPercent = (headShots / totalShotsHit) * 100;
                        var headShotsPercentRounded = headShotsPercent.toFixed(0);
    
                        // Calculate ADR
                        var averageDamage = totalDamage / match.roundResults.length;
                        var averageDamageRounded = averageDamage.toFixed(0);
                      }
                    }

                    return (
                      <div id='match' className='flex flex-row h-20 border-2 p-1.5 mb-2 border-maincolor-lightest rounded' key={index}>
                        <div className='w-1/4 flex flex-row'>
                          <div id='agent-img'>
                            <img className='h-full shadow-img' src={playerAgent ? `https://media.valorant-api.com/agents/${playerAgent}/displayicon.png` : ''} />
                          </div>
                          <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                            <span className='text-2xl'>{mapName}</span>
                            <span className='text-base font-light flex flex-row items-center'> 
                              <Tooltip 
                                content={playerCurrentTier > 3 ? playerRankFixed : ''}
                                color="error" 
                                placement={'top'} 
                                className={'rounded'}
                              >
                                <img 
                                  src={
                                    activeQueueTab == 'competitive' ? 
                                    (playerCurrentTier ? 
                                      `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${playerCurrentTier}/smallicon.png`
                                      :
                                      `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                                    )
                                    :
                                    'https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png'
                                  } 
                                  className={
                                    'w-8 transform scale-75 '
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
                        <div id='match-score' className='w-1/4 flex flex-row items-center'>
                          <div id='scoreline' className='flex flex-col text-center w-1/3'>
                            <span className={'text-xl ' + matchOutcomeColor}>{LocalText(L, "matches.match_outcomes." + matchOutcome)}</span>
                            {activeQueueTab != 'deathmatch' ? (<span className='text-lg'>{matchScore}</span>) : ''}
                          </div>
                          {activeQueueTab != 'deathmatch' ? 
                            (
                              <div 
                                id='scoreboard-pos' 
                                className={'rounded h-9 py-1 px-2 ml-6 ' + playerPositionColor}
                              >
                                {LocalText(L, "matches.match_pos." + (playerPositionText ? playerPositionText.replace(" ", "-") : ''))}
                              </div>
                            )
                            : 
                            ''
                          }
                        </div>
                        <div id='match-stats-1' className='w-1/4 flex flex-row items-center pl-4'>
                          <div id='left-side' className='flex flex-col'>
                            <span className='text-lg'>KDA</span>
                            <span className='text-base font-light'>Score</span>
                          </div>
                          <div id='right-side' className='flex flex-col ml-8'>
                            <div className='text-lg' id='kda-display'>
                              <span className='kda-display-span'>{playerKills}</span> 
                              <span className='kda-display-span'>{playerDeaths}</span>
                              <span className=''>{playerAssists}</span>
                            </div>
                            <div className='text-base font-light ml-2' id='score-display'>
                              {playerScore}
                            </div>
                          </div>
                        </div>
                        <div id='match-stats-2' className='w-1/4 flex flex-row items-center'>
                          <div className='w-1/3 flex flex-col items-center'>
                            <span className='text-lg'>KD</span>
                            <span className={'text-base font-light ' + playerKdColor}>{playerKD}</span>
                          </div>
                          {
                            activeQueueTab != 'deathmatch' ?
                            (
                              <>
                                <div className='w-1/3 flex flex-col items-center'>
                                  <span className='text-lg'>HS%</span>
                                  <span className='text-base font-light text-gray-500'>{headShotsPercentRounded}%</span>
                                </div>
                                <div className='w-1/3 flex flex-col items-center'>
                                  <span className='text-lg'>ACS</span>
                                  <span className='text-base font-light text-gray-500'>{averageDamageRounded}</span>
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
            })}
          </div>
          { 
            maxMatches != 0 ?
            (
              <>
                <div id='match-loading-error' className={'mt-4 ml-6 w-full flex flex-row justify-center ' + (matchFetchingError ? '' : 'hidden')}>
                  <span id='' className='text-gray-500'>{LocalText(L, "matches.errors.err_while_fetching")}</span>
                </div>
                <div id='shown-matches-info' className={'mt-4 ml-6 w-1/2 flex flex-row justify-between ' + (isFetchingMatches ? 'hidden' : '')}>
                  <span id='x-out-of-n-matches' className='text-gray-500'>{LocalText(L, "matches.bottom_text.loaded_matches_count", shownMatches, maxMatches)}</span>
                  <span id='load-more-matches' className={'hover:underline mb-8 ' + (isFetchingMatches ? 'cursor-wait' : 'cursor-pointer')} onClick={() => { isFetchingMatches ? '' : fetchFurtherMatches() }}>{LocalText(L, "matches.bottom_text.load_more")}</span>
                </div>
                <div className={'w-full flex mt-8 h-14 mb-6 justify-center items-center ' + (isFetchingMatches || matchFetchingError ? '' : 'hidden')}>
                  <Loading color={'error'} size={'lg'} />
                </div>
              </>
            )
            :
            (
              <>
                <div className={'w-full flex mt-8 h-14 mb-6 justify-center items-center ' + (isFetchingMatches ? '' : 'hidden')}>
                  <Loading color={'error'} size={'lg'} />
                </div>
                <div id='shown-matches-error' className={'mt-4 ml-6 w-full flex flex-row justify-center ' + (isFetchingMatches ? 'hidden' : '')}>
                  <span id='' className='text-gray-500'>{LocalText(L, "matches.errors.no_matches_found")}</span>
                </div>
              </>
            )
          }
        </div>
      </motion.div>
      <motion.div 
        key={"loading"}
        variants={loading_variants}
        initial="hidden"
        exit="exit"
        animate={loading ? 'open' : 'closed'}
        className={'w-full px-16 flex flex-col bg-maincolor-light h-full z-50 mt-80 absolute top-0 left-0'}
        transition={{ type: 'ease-in', duration: 0.2 }}
      >
        <div className='flex flex-row h-full justify-center items-center'>
          <div className='spinner-border text-maincolor-lightest'>
            <Loading color={'error'} size={'lg'} />
          </div>
        </div>
      </motion.div>
      <div className={'grid grid-col-1 text-2xl w-full text-center z-40 absolute top-0 left-0 bg-maincolor-light ' + (error ? '' : 'hidden')}>
        <img className='ml-auto mr-auto w-1/5' src='/icons/VALTracker_Logo_default.png' />
        <motion.div
          key={"error"}
          variants={variants}
          initial="hidden"
          animate="enter"
          exit="exit"
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <span className='text-3xl'>Whoops!</span><br />
          <span className='text-xl'>{errorReason}</span><br />
          <button className={isReloadable ? '' : 'hidden'} onClick={() => { router.push(`/player?name=${router.query.name}&tag=${router.query.tag}&lang=${router.query.lang}`) }}>{LocalText(L, "reload_button_text")}</button>
        </motion.div>
      </div>
    </>
  );
}

function PlayerProfile() {
  React.useEffect(() => {
    ipcRenderer.send('changeDiscordRP', 'pprofile_acitivity');
  });

  return (
    <Layout>
      <div className={'w-full flex flex-row justify-center mt-16 h-auto relative'}>
        <PlayerInfo />
      </div>
    </Layout>
  );
}

export default PlayerProfile;
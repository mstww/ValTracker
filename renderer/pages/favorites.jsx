import React from 'react';
import Layout from '../components/Layout';
import { ipcRenderer } from 'electron';
import { motion } from "framer-motion";
import fs from 'fs';
import fetch from 'node-fetch'
import { Tooltip, Radio, Loading } from '@nextui-org/react';
import { useRouter } from 'next/router';
import moment from 'moment';
import { useFirstRender } from '../components/useFirstRender';

const card_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}

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

async function getMatch(region, matchId, entitlement_token, bearer) {
  var valorant_version = await(await fetch('https://valorant-api.com/v1/version')).json();
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

function getDifferenceInDays(date1, date2) {
  const diffInMs = Math.abs(date2 - date1);
  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
}

function FavouriteMatches() {
  const router = useRouter();
  const firstRender = useFirstRender();

  // ----------------------- START STATES -----------------------

  const [ favMatchLength, setFavMatchLength ] = React.useState(0);
  const [ favMatches, setFavMatches ] = React.useState([]);
  const [ sortableFavMatches, setSortableFavMatches ] = React.useState([]);
  const [ mapData, setMapData ] = React.useState({});
  const [ activeQueueTab, setActiveQueueTab ] = React.useState('all');
  const [ activeSort, setActiveSort ] = React.useState('none');

  const [ shownMatchesPerDay, setShownMatchesPerDay ] = React.useState({});

  const [ isLoadingNewMatches, setIsLoadingNewMatches ] = React.useState(true);

  const [ backdropShown, setBackdropShown ] = React.useState(false);
  const [ deleteMatchCardShown, setDeleteMatchCardShown ] = React.useState(false);

  const [ matchInfo, setMatchInfo ] = React.useState({});

  // ----------------------- END STATES -----------------------

  var user_creds = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));

  if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json')) {
    var obj = {"favourites": []};
    
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json', JSON.stringify(obj));
  }

  if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID)) {
    fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID);
  }

  var favMatchesData = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json')).favourites;
  var bearer = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json')).accessToken;

  const loadAllFavMatches = async () => {
    var allMatches = [];

    setFavMatchLength(favMatchesData.length);

    for(var i = 0; i < favMatchesData.length; i++) {
      var match = favMatchesData[i]      

      if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches/' + match.MatchID + '.json')) {
        var entitlement = await getEntitlement(bearer);
        var data = await getMatch(user_creds.playerRegion, match.MatchID, entitlement, bearer);

        allMatches.push(data);

        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches/' + match.MatchID + '.json', JSON.stringify(data));
      } else {
        var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches/' + match.MatchID + '.json'));

        allMatches.push(data);
      }
    }

    allMatches.sort(function(a, b) {
      return b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis;
    });

    setSortableFavMatches(allMatches);

    var newMatches = [];

    for(var i = 0; i < allMatches.length; i++) {
      var dateDiff = getDifferenceInDays(allMatches[i].matchInfo.gameStartMillis, Date.now());
      if(dateDiff == 0) {
        // Create array if it doesn't exist
        if(!newMatches['today']) newMatches['today'] = [];

        newMatches['today'].push(allMatches[i]);
      } else if(dateDiff == 1) {
        // Create array if it doesn't exist
        if(!newMatches['yesterday']) newMatches['yesterday'] = [];

        newMatches['yesterday'].push(allMatches[i]);
      } else {
        // Get date difference between now and match date
        var startdate = moment();
        startdate = startdate.subtract(dateDiff, "days");
        var matchDate = startdate.format("MMMM Do, YYYY");

        // Create array if it doesn't exist
        if(!newMatches[matchDate]) newMatches[matchDate] = [];

        newMatches[matchDate].push(allMatches[i]);
      }
    }

    var sortedMatches = newMatches;

    if(Object.keys(sortedMatches)[0]) {
      for(var i = 0; i < Object.keys(sortedMatches).length; i++) {
        shownMatchesPerDay[Object.keys(sortedMatches)[i]] = {};
  
        shownMatchesPerDay[Object.keys(sortedMatches)[i]].totalMatches = sortedMatches[Object.keys(sortedMatches)[i]].length;
        shownMatchesPerDay[Object.keys(sortedMatches)[i]].shownMatches = sortedMatches[Object.keys(sortedMatches)[i]].length;
        shownMatchesPerDay[Object.keys(sortedMatches)[i]].matchModes = [];
  
        shownMatchesPerDay[Object.keys(sortedMatches)[i]].isShown = true;
  
        for(var j = 0; j < sortedMatches[Object.keys(sortedMatches)[i]].length; j++) {
          var queueID = sortedMatches[Object.keys(sortedMatches)[i]][j].matchInfo.queueID;
        }
  
        switch(queueID) {
          case('ggteam'): {
            var fixedQueueName = 'escalation';
            break;
          } 
          case('onefa'): {
            var fixedQueueName = 'replication';
            break;
          }
          case('spikerush'): {
            var fixedQueueName = 'spikerush';
            break;
          }
          default: {
            var fixedQueueName = queueID;
            break;
          }
        }
  
        shownMatchesPerDay[Object.keys(sortedMatches)[i]].matchModes.push(fixedQueueName);
  
        // Also save the modes in an extra array, check with shownThingy what's shown, remove everything that's not shown from (copy)array, count length of remaining array to see if day should be hidden
        
        setShownMatchesPerDay({ ...shownMatchesPerDay })
      }
  
      setFavMatches(sortedMatches);
      setIsLoadingNewMatches(false);
    } else {
      setFavMatches([]);
      setIsLoadingNewMatches(false);
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
      var playerNameTag = `${match.players[i].gameName.toLowerCase()}#${match.players[i].tagLine.toLowerCase()}`;
      var homePlayerNameTag = `${user_creds.playerName}#${user_creds.playerTag}`;
      var homePlayerNameTag_LowerCase = `${user_creds.playerName.toLowerCase()}#${user_creds.playerTag.toLowerCase()}`;
      
      if(playerNameTag == homePlayerNameTag_LowerCase) {
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

  const calculateSortStatsForMatch = (match) => {
    /* PLAYER STATS */
    for(var i = 0; i < match.players.length; i++) {
      var playerNameTag = `${match.players[i].gameName.toLowerCase()}#${match.players[i].tagLine.toLowerCase()}`;
      var homePlayerNameTag_LowerCase = `${user_creds.playerName.toLowerCase()}#${user_creds.playerTag.toLowerCase()}`;
      
      if(playerNameTag == homePlayerNameTag_LowerCase) {
        var playerInfo = match.players[i];
        var playerCurrentTier = match.players[i].competitiveTier;
      }
    }

    if(playerInfo) {
      var playerUUID = playerInfo.subject;

      var playerKills = playerInfo.stats.kills;
      var playerDeaths = playerInfo.stats.deaths;

      var playerKdRaw = playerKills / playerDeaths;
      var playerKD = playerKdRaw.toFixed(2);

      var playerScore = playerInfo.stats.score;
      var playerACS = playerScore / match.roundResults.length;
      var playerACS = playerACS.toFixed(0);

      var playerHeadShots = 0;
      var playerBodyShots = 0;
      var playerLegShots = 0;

      for(var i = 0; i < match.roundResults.length; i++) {
        for(var i2 = 0; i2 < match.roundResults[i].playerStats.length; i2++) {
          if(match.roundResults[i].playerStats[i2].subject == playerUUID) {
            for(var i3 = 0; i3 < match.roundResults[i].playerStats[i2].damage.length; i3++) {
              playerHeadShots += match.roundResults[i].playerStats[i2].damage[i3].headshots;
              playerBodyShots += match.roundResults[i].playerStats[i2].damage[i3].bodyshots;
              playerLegShots += match.roundResults[i].playerStats[i2].damage[i3].legshots;
            }
          }
        }
      }

      // Calculate HS%
      var totalShotsHit = playerHeadShots + playerBodyShots + playerLegShots;

      var headShotsPercent = (playerHeadShots / totalShotsHit) * 100;
      var headShotsPercentRounded = headShotsPercent.toFixed(0);
    }



    return { KD: parseFloat(playerKD), hsPercent: parseFloat(headShotsPercentRounded), ACS: parseFloat(playerACS) };
  }

  const sortMatchesAndSetActiveSort = (newValue) => {
    // TODO: Get the player's stats and calculate this data/get it from matches themselves

    sortableFavMatches.forEach(match => {
      if(!match.statsData) {
        var stats_data = calculateSortStatsForMatch(match);
        match.stats_data = stats_data;
        
        fs.writeFileSync(
          process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches/' + match.matchInfo.matchId + '.json', 
          JSON.stringify(match)
        );
      }
    });

    switch(newValue) {
      case('KD'): {
        sortableFavMatches.sort(function(a, b) {
          return b.stats_data.KD - a.stats_data.KD;
        });
    
        setActiveSort(newValue);
        
        break;
      }
      case('HS%'): {
        sortableFavMatches.sort(function(a, b) {
          return b.stats_data.hsPercent - a.stats_data.hsPercent;
        });
    
        setActiveSort(newValue);
        
        break;
      }
      case('ACS'): {
        sortableFavMatches.sort(function(a, b) {
          return b.stats_data.ACS - a.stats_data.ACS;
        });
    
        setActiveSort(newValue);
        
        break;
      }
      default: {
        setActiveSort('none');
      }
    }
  }

  const removeFavMatch = (MatchID, key, index, fixedQueueName) => {
    var favMatchesData = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json')).favourites;
                                      
    // WORKS
    for(var i = 0; i < favMatchesData.length; i++) {
      if(favMatchesData[i].MatchID === MatchID) {
        delete favMatchesData[i];

        var newArray = favMatchesData.filter(value => Object.keys(value).length !== 0);
        favMatchesData = newArray;

        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches.json', JSON.stringify({"favourites": favMatchesData}));
        break;
      }
    }

    // WORKS
    fs.unlinkSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/' + user_creds.playerUUID + '/matches/' + MatchID + '.json');

    // WORKS
    delete favMatches[key][index];

    var newArray = favMatches[key].filter(value => Object.keys(value).length !== 0);
    favMatches[key] = newArray;

    // WORKS
    setFavMatchLength(favMatchLength-1);

    for(var i = 0; i < shownMatchesPerDay[key].matchModes.length; i++) {
      if(shownMatchesPerDay[key].matchModes[i] === fixedQueueName) {
        delete shownMatchesPerDay[key].matchModes[i];

        var newArray = favMatches[key].filter(value => Object.keys(value).length !== 0);
        shownMatchesPerDay[key].matchModes = newArray;

        shownMatchesPerDay[key].shownMatches--;
        shownMatchesPerDay[key].totalMatches--;

        if(shownMatchesPerDay[key].shownMatches === 0 || shownMatchesPerDay[key].totalMatches === 0) {
          shownMatchesPerDay[key].isShown = false;
        }

        setShownMatchesPerDay({ ...shownMatchesPerDay });
        break;
      }
    }
  }

  const toggleDeleteMatchDialogue = () => {
    setBackdropShown(!backdropShown);
    setDeleteMatchCardShown(!deleteMatchCardShown);
  }
  
  React.useEffect(async () => {
    ipcRenderer.send('changeDiscordRP', "favmatches_activity");

    var map_data_raw = await fetch('https://valorant-api.com/v1/maps', { 'Content-Type': 'application/json' });
    var map_data = await map_data_raw.json();
    setMapData(map_data);

    loadAllFavMatches();
  }, []);

  React.useEffect(() => {
    if(!firstRender) {
      for(var key in shownMatchesPerDay) {
        if(shownMatchesPerDay[key]) {
          var shownMatches = 0;
          for(var i = 0; i < shownMatchesPerDay[key].matchModes.length; i++) {
            if(shownMatchesPerDay[key].matchModes[i] === activeQueueTab || activeQueueTab === 'all') {
              shownMatches++;
            }
          }
  
          shownMatchesPerDay[key].shownMatches = shownMatches;
  
          if(shownMatches === 0) {
            shownMatchesPerDay[key].isShown = false;
          } else {
            shownMatchesPerDay[key].isShown = true;
          }
        }
      }
      setShownMatchesPerDay({ ...shownMatchesPerDay });
    }
  }, [ activeQueueTab ]);
  
  return (
    <Layout>
      <motion.div 
        className='absolute bottom-0 left-0 w-full h-full flex items-center justify-center z-40 bg-black bg-opacity-80 pointer-events-none'
        key={"FavMatchesBackdrop"}
        variants={backdrop_variants}
        initial="hidden"
        animate={backdropShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <motion.div 
          className="w-96 rounded-sm bg-maincolor mb-8 flex flex-col justify-between p-4 pb-2 pointer-events-auto shadow-lg"
          key={"DeleteMatchCard"}
          variants={card_variants}
          initial="hidden"
          animate={deleteMatchCardShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <h1>Delete match</h1>
          <p>
            Do you really want to delete this match? 
            <div 
              id='match'
              className={'relative flex flex-row h-20 border-2 p-1.5 my-2 border-maincolor-lightest rounded-sm mr-2 cursor-default w-full'}
            >
              <div className='w-1/2 flex flex-row'>
                <div id='agent-img'>
                  <img className='h-full shadow-img group-hover:opacity-30 transition-all duration-100 ease-linear w-full' src={matchInfo.agent ? `https://media.valorant-api.com/agents/${matchInfo.agent}/displayicon.png` : ''} />
                </div>
                <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                  <span className='text-xl'>{matchInfo.map}</span>
                  <span className='text-base font-light flex flex-row items-center'> 
                    <img 
                      src={
                        matchInfo.fixedQueueName == 'competitive' ? 
                        (matchInfo.currenttier ? 
                          `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${matchInfo.currenttier}/smallicon.png`
                          :
                          `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                        )
                        :
                        'https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png'
                      } 
                      className={
                        'w-7 transform scale-75 shadow-img '
                        +
                        (matchInfo.fixedQueueName == 'competitive' ?
                          `w-10`
                          :
                          ''
                        )
                      }
                    />
                      
                    <span>
                      {matchInfo.fixedQueueDisplayName}
                    </span>
                  </span>
                </div>
              </div>
              <div id='match-score' className='w-1/2 flex flex-row items-center'>
                <div id='scoreline' className='flex flex-col text-center w-full'>
                  <span className={'text-xl ' + matchInfo.matchOutcomeColor}>{matchInfo.matchOutcome}</span>
                  {matchInfo.fixedQueueName != 'deathmatch' ? (<span className='text-lg'>{matchInfo.matchScore}</span>) : ''}
                </div>
              </div>
            </div>
            You can go to the hub to save it as a favorite again.
          </p>
          
          <div className='mt-4'>
            <button 
              onClick={() => {
                var MatchData = matchInfo;
                toggleDeleteMatchDialogue();
                setTimeout(() => {
                  setMatchInfo({});
                  removeFavMatch(MatchData.MatchID, MatchData.key, MatchData.index, MatchData.fixedQueueName);
                }, 310);
              }}
            >
              Delete Match
            </button>
            <button className='text-button' onClick={() => { toggleDeleteMatchDialogue() }}>Cancel</button>
          </div>
        </motion.div>
      </motion.div>
      <div className='flex flex-row h-full w-full p-4'>
        <div className='flex flex-col h-auto w-3/4'>
          <div id='match-timeline' className='relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1 after:transition-all after:duration-100 after:ease-linear'>
            <Tooltip content={'Checking for new matches...'} color="error" placement={'left'} className='rounded-sm absolute top-2 right-7'>
              <div className={'absolute -top-2.5 -right-5 w-6 h-6 z-30 ' + (isLoadingNewMatches ? '' : 'hidden')}>
                <Loading color={'error'} size={'sm'} />
              </div>
            </Tooltip>
            {
              activeSort === 'none' ?
              <>
                {favMatchLength > 0 ?
                  Object.keys(favMatches).map((key, index) => {
                    return (
                      <div className={'day relative ' + (shownMatchesPerDay[key].isShown === false ? 'hidden' : '')} key={index}>
                        <div id='day-header' className='text-lg ml-4 day-header'>{key}</div>
                        {favMatches[key].map((match, index) => {
                          var { matchData, matchViewData } = calculateMatchStats(match, '');
    
                          switch(match.matchInfo.queueID) {
                            case('ggteam'): {
                              var fixedQueueName = 'escalation';
                              break;
                            } 
                            case('onefa'): {
                              var fixedQueueName = 'replication';
                              break;
                            }
                            case('spikerush'): {
                              var fixedQueueName = 'spikerush';
                              break;
                            }
                            default: {
                              var fixedQueueName = match.matchInfo.queueID;
                              break;
                            }
                          }
    
                          switch(match.matchInfo.queueID) {
                            case('ggteam'): {
                              var fixedQueueDisplayName = 'Escalation';
                              break;
                            } 
                            case('onefa'): {
                              var fixedQueueDisplayName = 'Replication';
                              break;
                            }
                            case('spikerush'): {
                              var fixedQueueDisplayName = 'Spike Rush';
                              break;
                            }
                            default: {
                              var fixedQueueDisplayName = match.matchInfo.queueID[0].toUpperCase() + match.matchInfo.queueID.slice(1);
                              break;
                            }
                          }
    
                          return (
                            <div 
                              id='match'
                              className={'group relative flex flex-row h-20 border-2 p-1.5 mb-2 border-maincolor-lightest rounded-sm mr-2 hover:bg-maincolor-lightest cursor-default transition-all duration-100 ease-linear ' + (activeQueueTab !== 'all' && activeQueueTab !== fixedQueueName ? 'hidden' : '' )}
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
                                  router.push(`/matchview?isDeathmatch=${activeQueueTab == 'deathmatch'}?isRanked=${activeQueueTab == 'competitive'}`);
                                }
                              }}
                            >
                              <div className='matchview-gradient-overlay'>
                                <div className='absolute top-0 left-3 flex flex-row z-40 w-1/6 h-full items-center'>
                                  <img
                                    src={'/images/star_filled.svg'}
                                    className='w-6 h-6 ml-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-100 ease-linear relative right-3'
                                    id='add-to-favs'
                                    onClick={() => {
                                      toggleDeleteMatchDialogue();
                                      setMatchInfo({ MatchID: match.matchInfo.matchId, key, index, fixedQueueName, fixedQueueDisplayName, agent: matchData.playerAgent, map: matchData.mapName, currenttier: matchData.playerCurrentTier, matchOutcomeColor: matchData.matchOutcomeColor, matchOutcome: matchData.matchOutcome, matchScore: matchData.matchScore });
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
                                          match.matchInfo.queueID == 'competitive' ? 
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
                                          (match.matchInfo.queueID == 'competitive' ?
                                            `w-10`
                                            :
                                            ''
                                          )
                                        }
                                      />
                                      
                                    </Tooltip>
                                    <span>
                                      {fixedQueueDisplayName}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <div id='match-score' className='w-1/3 flex flex-row items-center'>
                                <div id='scoreline' className='flex flex-col text-center w-1/3'>
                                  <span className={'text-xl ' + matchData.matchOutcomeColor}>{matchData.matchOutcome}</span>
                                  {match.matchInfo.queueID != 'deathmatch' ? (<span className='text-lg'>{matchData.matchScore}</span>) : ''}
                                </div>
                                {match.matchInfo.queueID != 'deathmatch' ? 
                                  (
                                    <div 
                                      id='scoreboard-pos' 
                                      className={'rounded-sm text-base h-8 py-0.5 px-1 ml-7 ' + matchData.playerPositionColor}
                                    >
                                      {matchData.playerPositionText}
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
                                  match.matchInfo.queueID != 'deathmatch' ?
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
                  null
                }
              </>
              :
              <>
                <div className={'day relative'}>
                  <div id='day-header' className='text-lg ml-4 day-header'>Sorted by {activeSort[0].toUpperCase() + activeSort.slice(1)}</div>
                  {sortableFavMatches.map((match, index) => {
                    var { matchData, matchViewData } = calculateMatchStats(match, '');

                    switch(match.matchInfo.queueID) {
                      case('ggteam'): {
                        var fixedQueueName = 'escalation';
                        break;
                      } 
                      case('onefa'): {
                        var fixedQueueName = 'replication';
                        break;
                      }
                      case('spikerush'): {
                        var fixedQueueName = 'spikerush';
                        break;
                      }
                      default: {
                        var fixedQueueName = match.matchInfo.queueID;
                        break;
                      }
                    }

                    switch(match.matchInfo.queueID) {
                      case('ggteam'): {
                        var fixedQueueDisplayName = 'Escalation';
                        break;
                      } 
                      case('onefa'): {
                        var fixedQueueDisplayName = 'Replication';
                        break;
                      }
                      case('spikerush'): {
                        var fixedQueueDisplayName = 'Spike Rush';
                        break;
                      }
                      default: {
                        var fixedQueueDisplayName = match.matchInfo.queueID[0].toUpperCase() + match.matchInfo.queueID.slice(1);
                        break;
                      }
                    }

                    return (
                      <div 
                        id='match'
                        className={'group relative flex flex-row h-20 border-2 p-1.5 mb-2 border-maincolor-lightest rounded-sm mr-2 hover:bg-maincolor-lightest cursor-default transition-all duration-100 ease-linear ' + (activeQueueTab !== 'all' && activeQueueTab !== fixedQueueName ? 'hidden' : '' )}
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
                            router.push(`/matchview?isDeathmatch=${activeQueueTab == 'deathmatch'}?isRanked=${activeQueueTab == 'competitive'}`);
                          }
                        }}
                      >
                        <div className='matchview-gradient-overlay'>
                          <div className='absolute top-0 left-3 flex flex-row z-40 w-1/6 h-full items-center'>
                            <img
                              src={'/images/star_filled.svg'}
                              className='w-6 h-6 ml-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-100 ease-linear relative right-3'
                              id='add-to-favs'
                              onClick={() => {
                                toggleDeleteMatchDialogue();
                                setMatchInfo({ MatchID: match.matchInfo.matchId, key, index, fixedQueueName, fixedQueueDisplayName, agent: matchData.playerAgent, map: matchData.mapName, currenttier: matchData.playerCurrentTier, matchOutcomeColor: matchData.matchOutcomeColor, matchOutcome: matchData.matchOutcome, matchScore: matchData.matchScore });
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
                                    match.matchInfo.queueID == 'competitive' ? 
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
                                    (match.matchInfo.queueID == 'competitive' ?
                                      `w-10`
                                      :
                                      ''
                                    )
                                  }
                                />
                                
                              </Tooltip>
                              <span>
                                {fixedQueueDisplayName}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div id='match-score' className='w-1/3 flex flex-row items-center'>
                          <div id='scoreline' className='flex flex-col text-center w-1/3'>
                            <span className={'text-xl ' + matchData.matchOutcomeColor}>{matchData.matchOutcome}</span>
                            {match.matchInfo.queueID != 'deathmatch' ? (<span className='text-lg'>{matchData.matchScore}</span>) : ''}
                          </div>
                          {match.matchInfo.queueID != 'deathmatch' ? 
                            (
                              <div 
                                id='scoreboard-pos' 
                                className={'rounded-sm text-base h-8 py-0.5 px-1 ml-7 ' + matchData.playerPositionColor}
                              >
                                {matchData.playerPositionText}
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
                            match.matchInfo.queueID != 'deathmatch' ?
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
              </>
            }
          </div>
          <span className='text-center text-lg'>{isLoadingNewMatches ? 'Loading' : 'That\'s it!'}</span>
        </div>
        <div className='w-1/4 favs-right border-2 border-maincolor-lightest p-4 mt-7'>
          <span>Filters</span>
          <hr />
          <span className='text-gray-500 mb-0 relative top-4 text-lg'>Mode</span>
          <Radio.Group 
            value={activeQueueTab}
            onChange={setActiveQueueTab}
            className={'mt-0 pt-0 top-0 ml-4 font-thin'}
          >
            <Radio value="all" color={'error'} size='md'>All</Radio>
            <Radio value="unrated" color={'error'}>Unrated</Radio>
            <Radio value="competitive" color={'error'}>Competitive</Radio>
            <Radio value="deathmatch" color={'error'}>Deathmatch</Radio>
            <Radio value="spikerush" color={'error'}>Spike Rush</Radio>
            <Radio value="replication" color={'error'}>Replication</Radio>
            <Radio value="escalation" color={'error'}>Escalation</Radio>
            <Radio value="custom" color={'error'}>Custom</Radio>
          </Radio.Group>

          <span className='text-gray-500 mb-0 relative top-4 text-lg'>Sort by</span>
          <Radio.Group 
            value={activeSort}
            onChange={sortMatchesAndSetActiveSort}
            className={'mt-0 pt-0 top-0 ml-4 font-thin'}
          >
            <Radio value="none" color={'error'}>None</Radio>
            <Radio value="KD" color={'error'}>KD</Radio>
            <Radio value="HS%" color={'error'}>HS%</Radio>
            <Radio value="ACS" color={'error'}>ACS</Radio>
          </Radio.Group>

        </div>
      </div>
    </Layout>
  );
}

export default FavouriteMatches;
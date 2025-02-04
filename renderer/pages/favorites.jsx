import React from 'react';
import { ipcRenderer } from 'electron';
import { motion } from "framer-motion";
import fetch from 'node-fetch'
import { Tooltip, Radio, Loading } from '@nextui-org/react';
import { useRouter } from 'next/router';
import moment from 'moment';
import { useFirstRender } from '../components/useFirstRender';
import L from '../locales/translations/favorites.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';
import { ArrowRoundUp, StarFilled } from '../components/SVGs';
import Layout from '../components/Layout';
import { executeQuery, fetchMatch, getCurrentUserData, getUserAccessToken, getUserEntitlement, removeMatch, updateThing } from '../js/dbFunctions';
import ValIconHandler from '../components/ValIconHandler';
import getDifferenceInDays from '../js/getDifferenceInDays.mjs';
import { calculateMatchStats } from '../js/calculateMatchStats.mjs';
import { checkForRankup } from '../js/riotAPIFunctions.mjs';

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

function FavoriteMatches({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
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

  const [ ranks, setRanks ] = React.useState([]);

  const [ userCreds, setUserCreds ] = React.useState({});

  // ----------------------- END STATES -----------------------

  function sortMatches(sortedMatches) {
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
  }

  const loadAllFavMatches = async (reload) => {
    var user_creds = await getCurrentUserData();
    setUserCreds(user_creds);
    var favMatchesData = await executeQuery(`SELECT matchIDs FROM matchIDCollection:⟨favMatches::${user_creds.uuid}⟩`);

    var allMatches = [];

    setFavMatchLength(favMatchesData[0].matchIDs.length);

    for(var i = 0; i < favMatchesData[0].matchIDs.length; i++) {
      if(!allMatches.includes(favMatchesData[0].matchIDs[i])) {
        var match = await fetchMatch(favMatchesData[0].matchIDs[i]);
        if(match === undefined) {
          var entitlement_token = await getUserEntitlement();
          var bearer = await getUserAccessToken();

          const match = await getMatch(userCreds.region, favMatchesData[0].matchIDs[i], entitlement_token, bearer);

          if(match.matchInfo.queueID === "competitive" && (!match.matchInfo.isRankupGame || !match.matchInfo.isRankdownGame)) {
            var rankInfo = await checkForRankup(region, puuid, match.matchInfo.matchId, entitlement_token, bearer);
            match.matchInfo.isRankupGame = rankInfo.rankup;
            match.matchInfo.isRankdownGame = rankInfo.rankdown;
          }
          
          ipcRenderer.send(`createMatch`, match);
          allMatches.push(match);
        } else {
          allMatches.push(match);
        }
      }
    }
    
    if(allMatches.length === 0) return;

    allMatches.sort(function(a, b) {
      return b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis;
    });

    setSortableFavMatches(allMatches);

    var newMatches = [];

    for(var i = 0; i < allMatches.length; i++) {
      if(allMatches[i] === undefined) continue;
      var dateDiff = getDifferenceInDays(allMatches[i].matchInfo.gameStartMillis, Date.now());
      moment.locale(router.query.lang);
      var startdate = moment();
      startdate = startdate.subtract(dateDiff, "days");
      var matchDate = startdate.format("D. MMMM, YYYY");

      // Create array if it doesn't exist
      if(!newMatches[matchDate]) newMatches[matchDate] = [];

      newMatches[matchDate].push(allMatches[i]);
    }

    var sortedMatches = newMatches;

    if(Object.keys(sortedMatches)[0]) {
      sortMatches(sortedMatches);

      setFavMatches(sortedMatches);
      setIsLoadingNewMatches(false);
    } else {
      setFavMatches([]);
      setIsLoadingNewMatches(false);
    }
  }

  const calculateSortStatsForMatch = (match) => {
    var user_creds = userCreds;
  
    /* PLAYER STATS */
    for(var i = 0; i < match.players.length; i++) {
      var nameTag = `${match.players[i].gameName.toLowerCase()}#${match.players[i].tagLine.toLowerCase()}`;
      var homenameTag_LowerCase = `${user_creds.name.toLowerCase()}#${user_creds.tag.toLowerCase()}`;
      
      if(nameTag == homenameTag_LowerCase) {
        var pInfo = match.players[i];
        var playerCurrentTier = match.players[i].competitiveTier;
      }
    }

    if(pInfo) {
      var uuid = pInfo.subject;

      var playerKills = pInfo.stats.kills;
      var playerDeaths = pInfo.stats.deaths;

      var playerKdRaw = playerKills / playerDeaths;
      var playerKD = playerKdRaw.toFixed(2);

      var playerScore = pInfo.stats.score;
      var playerACS = playerScore / match.roundResults.length;
      var playerACS = playerACS.toFixed(0);

      var playerHeadShots = 0;
      var playerBodyShots = 0;
      var playerLegShots = 0;

      for(var i = 0; i < match.roundResults.length; i++) {
        for(var i2 = 0; i2 < match.roundResults[i].playerStats.length; i2++) {
          if(match.roundResults[i].playerStats[i2].subject == uuid) {
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
    var user_creds = userCreds;

    sortableFavMatches.forEach(match => {
      if(!match.statsData) {
        var stats_data = calculateSortStatsForMatch(match);
        match.stats_data = stats_data;
        
        updateThing(`match:⟨${match.matchInfo.matchId}⟩`, match);
      }
      return;
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
      case('AGE'): {
        sortableFavMatches.sort(function(a, b) {
          return a.matchInfo.gameStartMillis - b.matchInfo.gameStartMillis;
        });
    
        setActiveSort(newValue);

        break;
      }
      default: {
        setActiveSort('none');
      }
    }
  }

  const removeFavMatch = async (MatchID, key, index, fixedQueueName) => {
    await removeMatch('favMatches', MatchID);

    delete favMatches[key][index];

    var newArray = favMatches[key].filter(value => Object.keys(value).length !== 0);
    favMatches[key] = newArray;

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
    setIsOverlayShown(!isOverlayShown);
    setDeleteMatchCardShown(!deleteMatchCardShown);
  }
  
  React.useEffect(async () => {
    ipcRenderer.send('changeDiscordRP', "favmatches_activity");

    var map_data_raw = await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' });
    var map_data = await map_data_raw.json();
    setMapData(map_data);

    await loadAllFavMatches(false);
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

  React.useEffect(async () => {
    var ranksRaw = await(await fetch('https://valorant-api.com/v1/competitivetiers?language=' + APIi18n(router.query ? router.query.lang : 'en-US'))).json()
    setRanks(ranksRaw.data[ranksRaw.data.length-1].tiers);
  }, []);

  React.useEffect(async () => {
    var data = await getCurrentUserData();
    setUserCreds(data);
  }, []);
  
  return (
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <motion.div 
        className='modal-backdrop'
        key={"FavMatchesBackdrop"}
        variants={backdrop_variants}
        initial="hidden"
        animate={backdropShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <motion.div 
          className="modal fixed-wide"
          key={"DeleteMatchCard"}
          variants={card_variants}
          initial="hidden"
          animate={deleteMatchCardShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <h1 className='font-bold'>{LocalText(L, "modals.remove_match.header")}</h1>
          <p>
            {LocalText(L, "modals.remove_match.desc")}
            <div 
              id='match'
              className={'relative flex flex-row h-20 border p-1.5 my-2 border-tile-color rounded mr-2 cursor-default w-full'}
            >
              <div className='w-1/2 flex flex-row'>
                <div id='agent-img'>
                  <img className='h-full shadow-img group-hover:opacity-30 transition-all duration-[0ms] ease-linear w-full' src={matchInfo.agent ? `https://media.valorant-api.com/agents/${matchInfo.agent}/displayicon.png` : ''} />
                </div>
                <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                  <span className={`text-lg font-semibold ${matchInfo.queueID == 'competitive' ? "relative left-1.5 top-1.5" : ""}`}>{matchInfo.map}</span>
                  <span className='text-base font-light flex flex-row items-center relative'> 
                    <Tooltip 
                      content={matchInfo.currenttier > 3 && matchInfo.rankFixed !== undefined ? matchInfo.rankFixed.tierName : ''}
                      color="error" 
                      placement={'top'} 
                      className={'rounded'}
                    >
                      {
                        matchInfo.queueID === 'competitive' ? 
                        <img 
                          src={
                            matchInfo.currenttier ? 
                            `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${matchInfo.currenttier}/smallicon.png`
                            :
                            `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                          } 
                          className={'w-10 scale-75 shadow-img'}
                        />
                        :
                        <ValIconHandler icon={`/images/${matchInfo.queueID}.png`} classes={'w-7 scale-75 shadow-img'} />
                      }
                    </Tooltip>
                    {matchInfo.queueID === 'competitive' && matchInfo.isRankup === true ? (
                      <ArrowRoundUp className={'rankup-arrow text-val-blue val-blue-glow w-[1.1rem] h-[1.1rem] absolute top-[1.4rem] left-[1.4rem]'} />
                    ) : null}
                    <span className='ml-1'>{matchInfo.fixedQueueDisplayName}</span>
                  </span>
                </div>
              </div>
              <div id='match-score' className='w-1/2 flex flex-row items-center'>
                <div id='scoreline' className='flex flex-col text-center mx-auto'>
                  <span className={'text-xl ' + matchInfo.matchOutcomeColor}>{matchInfo.matchOutcome}</span>
                  {matchInfo.fixedQueueName != 'deathmatch' ? (<span className='text-lg'>{matchInfo.matchScore}</span>) : ''}
                </div>
              </div>
            </div>
            {LocalText(L, "modals.remove_match.desc2")}
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
              className="button default"
            >
              {LocalText(L, "modals.remove_match.button_1")}
            </button>
            <button className='button text' onClick={() => { toggleDeleteMatchDialogue() }}>{LocalText(L, "modals.remove_match.button_2")}</button>
          </div>
        </motion.div>
      </motion.div>
      <div className='flex flex-row h-full w-full p-4'>
        <div className='flex flex-col h-auto w-3/4 pr-4'>
          <div id='match-timeline' className='relative after:absolute after:w-12 after:bg-white after:h-full after:t-0 after:b-0 after:l-0 after:-ml-1 after:transition-all after:duration-[0ms] after:ease-linear'>
            <Tooltip content={'Checking for new matches...'} color="error" placement={'left'} className='rounded absolute top-2 right-7'>
              <div className={'absolute -top-2.5 -right-5 w-6 h-6 z-30 ' + (isLoadingNewMatches ? '' : 'hidden')}>
                <Loading color={'error'} size={'sm'} />
              </div>
            </Tooltip>
            {
              activeSort === 'none' ?
              <>
                {favMatchLength > 0 ?
                  Object.keys(favMatches).map((key, index) => {
                    moment.locale(router.query.lang);
                    var startdate = moment();
                    var today = startdate.format("D. MMMM");
                    return (
                      <div className={'day relative ' + (shownMatchesPerDay[key].isShown === false ? 'hidden' : '')} key={index}>
                        <div id='day-header' className='text-lg ml-4 day-header font-bold'>{today === key ? 'Today' : key}</div>
                        {favMatches[key].map((match, index) => {
                          var { matchData, matchViewData } = calculateMatchStats(match, userCreds.name, userCreds.tag, mapData, ranks);
    
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

                          var fixedQueueDisplayName = LocalText(L, "matches.gamemodes." + fixedQueueName);
    
                          return (
                            <div 
                              id='match'
                              className={'group relative flex flex-row h-20 bg-tile-color bg-opacity-20 active:bg-opacity-0 border p-1.5 mb-2 border-tile-color rounded mr-2 hover:bg-opacity-50 cursor-default transition-all duration-[0ms] ease-linear ' + (activeQueueTab !== 'all' && activeQueueTab !== fixedQueueName ? 'hidden' : '' )}
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
                                  <StarFilled 
                                    color 
                                    className='w-6 h-6 ml-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-[0ms] ease-linear relative right-3'
                                    click={() => {
                                      toggleDeleteMatchDialogue();
                                      setMatchInfo({ MatchID: match.matchInfo.matchId, key, index, fixedQueueName, fixedQueueDisplayName, agent: matchData.playerAgent, map: matchData.mapName, currenttier: matchData.playerCurrentTier, matchOutcomeColor: matchData.matchOutcomeColor, matchOutcome: matchData.matchOutcome, matchScore: matchData.matchScore, queueID: match.matchInfo.queueID });
                                    }}
                                  />
                                </div>
                              </div>
                              
                              <div className='w-1/3 flex flex-row'>
                                <div id='agent-img'>
                                  <img className='h-full shadow-img group-hover:opacity-30 transition-all duration-[0ms] ease-linear' src={matchData.playerAgent ? `https://media.valorant-api.com/agents/${matchData.playerAgent}/displayicon.png` : ''} />
                                </div>
                                <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                                  <span className={`text-lg font-semibold ${match.matchInfo.queueID == 'competitive' ? "relative left-1.5 top-1.5" : ""}`}>{matchData.mapName}</span>
                                  <span className='text-base font-light flex flex-row items-center relative'> 
                                    <Tooltip 
                                      content={matchData.playerCurrentTier > 3 && matchData.rankFixed !== undefined ? matchData.rankFixed.tierName : ''}
                                      color="error" 
                                      placement={'top'} 
                                      className={'rounded'}
                                    >
                                      {
                                        match.matchInfo.queueID === 'competitive' ? 
                                        <img 
                                          src={
                                            matchData.playerCurrentTier ? 
                                            `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${matchData.playerCurrentTier}/smallicon.png`
                                            :
                                            `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                                          } 
                                          className={'w-10 scale-75 shadow-img'}
                                        />
                                        :
                                        <ValIconHandler icon={`/images/${match.matchInfo.queueID}.png`} classes={'w-7 scale-75 shadow-img'} />
                                      }
                                    </Tooltip>
                                    {match.matchInfo.queueID === 'competitive' && matchData.isRankup === true ? (
                                      <ArrowRoundUp className={'rankup-arrow text-val-blue val-blue-glow w-[1.1rem] h-[1.1rem] absolute top-[1.4rem] left-[1.4rem]'} />
                                    ) : null}
                                    {match.matchInfo.queueID === 'competitive' && matchData.isRankdown === true ? (
                                      <ArrowRoundUp className={'rankdown-arrow rotate-180 text-val-red val-red-glow w-[1rem] h-[1rem] absolute top-[1.4rem] left-[1.4rem]'} />
                                    ) : null}
                                    <span className='ml-1'>{fixedQueueDisplayName}</span>
                                  </span>
                                </div>
                              </div>
                              <div id='match-score' className='w-1/3 flex flex-row items-center'>
                                <div id='scoreline' className='flex flex-col text-center w-1/2'>
                                  <span className={'text-xl font-semibold ' + matchData.matchOutcomeColor}>{matchData.matchOutcome}</span>
                                  {match.matchInfo.queueID != 'deathmatch' ? (<span className='text-lg'>{matchData.matchScore}</span>) : ''}
                                </div>
                                {match.matchInfo.queueID != 'deathmatch' ? 
                                  (
                                    <div 
                                      id='scoreboard-pos' 
                                      className={'rounded text-base h-8 py-0.5 px-1 ml-4 font-light ' + matchData.playerPositionColor}
                                    >
                                      {LocalText(L, "matches.match_pos." + (matchData.playerPositionText.replace(" ", "-")))}
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
                                  match.matchInfo.queueID != 'deathmatch' ?
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
                  null
                }
              </>
              :
              <>
                <div className={'day relative'}>
                  <div id='day-header' className='text-lg ml-4 day-header font-bold'>Sorted by {activeSort[0].toUpperCase() + activeSort.slice(1)}</div>
                  {sortableFavMatches.map((match, index) => {
                    var { matchData, matchViewData } = calculateMatchStats(match, userCreds.name, userCreds.tag, mapData, ranks);

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

                    var fixedQueueDisplayName = LocalText(L, "matches.gamemodes." + fixedQueueName);

                    return (
                      <div 
                        id='match'
                        className={'group relative flex flex-row h-20 bg-tile-color bg-opacity-20 active:bg-opacity-0 border p-1.5 mb-2 border-tile-color rounded mr-2 hover:bg-opacity-50 cursor-default transition-all duration-[0ms] ease-linear ' + (activeQueueTab !== 'all' && activeQueueTab !== fixedQueueName ? 'hidden' : '' )}
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
                            <StarFilled 
                              color 
                              className='w-6 h-6 ml-6 shadow-img opacity-0 group-hover:opacity-100 group-hover:block cursor-pointer transition-all duration-[0ms] ease-linear relative right-3'
                              click={() => {
                                toggleDeleteMatchDialogue();
                                setMatchInfo({ MatchID: match.matchInfo.matchId, key, index, fixedQueueName, fixedQueueDisplayName, agent: matchData.playerAgent, map: matchData.mapName, currenttier: matchData.playerCurrentTier, matchOutcomeColor: matchData.matchOutcomeColor, matchOutcome: matchData.matchOutcome, matchScore: matchData.matchScore, queueID: match.matchInfo.queueID });
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className='w-1/3 flex flex-row'>
                          <div id='agent-img'>
                            <img className='h-full shadow-img group-hover:opacity-30 transition-all duration-[0ms] ease-linear' src={matchData.playerAgent ? `https://media.valorant-api.com/agents/${matchData.playerAgent}/displayicon.png` : ''} />
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
                                  match.matchInfo.queueID === 'competitive' ? 
                                  <img 
                                    src={
                                      matchData.playerCurrentTier ? 
                                      `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${matchData.playerCurrentTier}/smallicon.png`
                                      :
                                      `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png`
                                    } 
                                    className={'w-10 scale-75 shadow-img'}
                                  />
                                  :
                                  <ValIconHandler icon={`/images/${match.matchInfo.queueID}.png`} classes={'w-7 scale-75 shadow-img'} />
                                }
                              </Tooltip>
                              {match.matchInfo.queueID === 'competitive' && matchData.isRankup === true ? (
                                <ArrowRoundUp className={'rankup-arrow text-val-blue val-blue-glow w-[1.1rem] h-[1.1rem] absolute top-[1.4rem] left-[1.4rem]'} />
                              ) : null}
                              {match.matchInfo.queueID === 'competitive' && matchData.isRankdown === true ? (
                                <ArrowRoundUp className={'rankdown-arrow rotate-180 text-val-red val-red-glow w-[1rem] h-[1rem] absolute top-[1.4rem] left-[1.4rem]'} />
                              ) : null}
                              <span className='ml-1'>{fixedQueueDisplayName}</span>
                            </span>
                          </div>
                        </div>
                        <div id='match-score' className='w-1/3 flex flex-row items-center'>
                          <div id='scoreline' className='flex flex-col text-center w-1/2'>
                            <span className={'text-xl font-semibold ' + matchData.matchOutcomeColor}>{matchData.matchOutcome}</span>
                            {match.matchInfo.queueID != 'deathmatch' ? (<span className='text-lg'>{matchData.matchScore}</span>) : ''}
                          </div>
                          {match.matchInfo.queueID != 'deathmatch' ? 
                            (
                              <div 
                                id='scoreboard-pos' 
                                className={'rounded text-base h-8 py-0.5 px-1 ml-4 font-light ' + matchData.playerPositionColor}
                              >
                              {LocalText(L, "matches.match_pos." + (matchData.playerPositionText.replace(" ", "-")))}
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
                            match.matchInfo.queueID != 'deathmatch' ?
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
              </>
            }
          </div>
          <span className='text-center text-lg font-light'>{isLoadingNewMatches ? LocalText(L, "loading") : LocalText(L, "matches_bottom")}</span>
        </div>
        <div className='w-[calc((100%-17rem)/4)] favs-right border border-tile-color p-4 mt-7 rounded !fixed right-4 top-11 !h-fit'>
          <span className='text-lg font-bold'>{LocalText(L, "filters.header")}</span>
          <Radio.Group 
            value={activeQueueTab}
            onChange={setActiveQueueTab}
            className={'mt-0 pt-0 top-0 ml-4 font-light mb-4'}
          >
            <Radio value="all" className='!mt-2' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_1")}</Radio>
            <Radio value="unrated" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_2")}</Radio>
            <Radio value="competitive" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_3")}</Radio>
            <Radio value="custom" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_4")}</Radio>
            <Radio value="deathmatch" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_5")}</Radio>
            <Radio value="spikerush" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_6")}</Radio>
            <Radio value="replication" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_7")}</Radio>
            <Radio value="escalation" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_8")}</Radio>
            <Radio value="custom" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.modes.fm_9")}</Radio>
          </Radio.Group>

          <span className='text-lg font-bold !mb-0 !pb-0'>{LocalText(L, "filters.sort_by.header")}</span>
          <Radio.Group 
            value={activeSort}
            onChange={sortMatchesAndSetActiveSort}
            className={'mt-0 pt-0 top-0 ml-4 font-light'}
          >
            <Radio value="none" className='!mt-2' color={'error'} size='sm'>{LocalText(L, "filters.sort_by.fs_1")}</Radio>
            <Radio value="KD" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.sort_by.fs_2")}</Radio>
            <Radio value="HS%" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.sort_by.fs_3")}</Radio>
            <Radio value="ACS" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.sort_by.fs_4")}</Radio>
            <Radio value="AGE" className='!mt-3' color={'error'} size='sm'>{LocalText(L, "filters.sort_by.fs_5")}</Radio>
          </Radio.Group>
        </div>
      </div>
    </Layout>
  );
}

export default FavoriteMatches;
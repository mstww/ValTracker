import React from 'react';
import { motion } from "framer-motion"
import { useRouter } from 'next/router';
import moment from 'moment';
import { Tooltip, Spacer } from '@nextui-org/react'
import AwardTile from '../components/matchview/AwardTile';
import L from '../locales/translations/matchview.json';
import LocalText from '../components/translation/LocalText';
import fetch from 'node-fetch';
import { ArrowIncrease, ArrowRoundUp, BackArrow, Calendar, Clock, Close, Crosshair, Flash, Globe, PartyIcon, ShareIcon, SignalGraph, Skull, Swap, ValorantV } from '../components/SVGs';
import ValIconHandler from '../components/ValIconHandler';
import Layout from '../components/Layout';
import { getCurrentUserData, getInstanceToken, getUserAccessToken, getUserEntitlement } from '../js/dbFunctions.mjs';
import { getMatch, requestUserCreds } from '../js/riotAPIFunctions.mjs';
import { useFirstRender } from '../components/useFirstRender';
import APIi18n from '../components/translation/ValApiFormatter';
import { calculateMatchStats } from '../js/calculateMatchStats.mjs';

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}

const card_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const overview_vars_first_load = {
  hidden: { opacity: 0, x: 0, y: 200, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'flex' },
}

const overview_vars_first_load_noflex = {
  hidden: { opacity: 0, x: 0, y: 200, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
}

const overview_vars = {
  hidden: { opacity: 0, x: 200, y: 0, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'flex' },
  exit: { opacity: 0, x: -200, y: 0, scale: 1, transitionEnd: { display: 'none' } },
}

const overview_vars_noflex = {
  hidden: { opacity: 0, x: 200, y: 0, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: -200, y: 0, scale: 1, transitionEnd: { display: 'none' } },
}

const scoreboard_vars = {
  hidden: { opacity: 0, x: -200, y: 0, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 200, y: 0, scale: 1, transitionEnd: { display: 'none' } },
}

const scoreboard_vars_initial = {
  hidden: { opacity: 0, x: -200, y: 0, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: '' },
  exit: { opacity: 0, x: 200, y: 0, scale: 1, transitionEnd: { display: 'none' } },
}

function Matchview({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();

  var gamemodes = LocalText(L, 'gamemodes');

  // -------------------- NAVIGATION --------------------

  const [ activeTab, setActiveTab ] = React.useState('overview');
  const [ lastTab, setLastTab ] = React.useState('');

  // -------------------- GENERAL INFO --------------------

  const [ teamData, setTeamData ] = React.useState({});
  const [ matchScore, setMatchScore ] = React.useState('');
  const [ playerMatchResult, setPlayerMatchResult ] = React.useState('');
  const [ rounds, setRounds ] = React.useState([]);

  // -------------------- MATCH INFO --------------------

  const [ matchMap, setMatchMap ] = React.useState('');
  const [ matchMapName, setMatchMapName ] = React.useState('');
  const [ matchDate, setMatchDate ] = React.useState('');
  const [ matchLenght, setMatchLength ] = React.useState('');
  const [ matchMode, setMatchMode ] = React.useState('');
  const [ matchServer, setMatchServer ] = React.useState('');
  const [ matchGameVersion, setMatchGameVersion ] = React.useState('');

  // -------------------- PLAYER INFO --------------------

  const [ name, setname ] = React.useState('');
  const [ uuid, setUUID ] = React.useState('');
  const [ playerAgentUUID, setPlayerAgentUUID ] = React.useState('');
  const [ playerKDA, setPlayerKDA ] = React.useState('');
  const [ playerKD, setPlayerKD ] = React.useState('');
  const [ playerACS, setPlayerACS ] = React.useState('');
  const [ playerKillsPerRound, setPlayerKillsPerRound ] = React.useState('');
  const [ playerCurrentTier, setPlayerCurrentTier ] = React.useState('');
  const [ playerHsPercent, setPlayerHsPercent ] = React.useState('');
  const [ playerBsPercent, setPlayerBsPercent ] = React.useState('');
  const [ playerLsPercent, setPlayerLsPercent ] = React.useState('');
  const [ playerFBs, setPlayerFBs ] = React.useState('');

  const [ playerAbilityUsagePerRound, setPlayerAbilityUsagePerRound ] = React.useState({});
  const [ playerAgentAbilities, setPlayerAgentAbilities ] = React.useState([]);

  // -------------------- PLAYER ACHIEVEMENTS --------------------

  const [ hasPlayerSpentMost, setHasPlayerSpentMost ] = React.useState(false);
  const [ hasPlayerSpentLeast, setHasPlayerSpentLeast ] = React.useState(false);
  const [ hasPlayerMostKills, setHasPlayerMostKills ] = React.useState(false);
  const [ hasPlayerMostAssists, setHasPlayerMostAssists ] = React.useState(false);
  const [ hasPlayerMostACS, setHasPlayerMostACS ] = React.useState(false);
  const [ hasPlayerDealtMostDmg, setHasPlayerDealtMostDmg ] = React.useState(false);
  const [ hasPlayerHighestHsPercent, setHasPlayerHighestHsPercent ] = React.useState(false);
  const [ hasPlayerMostFBs, setHasPlayerMostFBs ] = React.useState(false);

  // -------------------- Scoreboard --------------------

  const [ playerScoreboardStats, setPlayerScoreboardStats ] = React.useState([]);
  const [ currentSortStat, setCurrentSortStat ] = React.useState('acs');

  // -------------------- Misc. --------------------

  const [ isDeathmatch, setIsDeathmatch ] = React.useState(false);
  const [ isEscalation, setIsEscalation ] = React.useState(false);
  const [ isComp, setIsComp ] = React.useState(false);
  const [ bestRound, setBestRound ] = React.useState({ round: 0, score: 0 });
  const [ playerParties, setPlayerParties ] = React.useState({});
  const [ highlightedParty, setHighlightedParty ] = React.useState(null);
  const [ lockHighlightedParty, setLockHighlightedParty ] = React.useState({ state: false, lockedUUID: null });
  const [ shareMatchURL, setShareMatchURL ] = React.useState("");

  const [ showPopup, setShowPopup ] = React.useState(false);
  const [ urlCopied, setUrlCopied ] = React.useState(false);

  // DATA NEEDED: MapUUID, Map Name, Match Date, Match Length, Match Mode, Region, Server, Game Version, 
  // AgentUUID, Player KDA, Player KD, Player Score, Player ACS, Player Rank, HS%, BS%, LS%, is Player MVP, Player ADR

  const calculatePageContent = (knownMatchData, roundData, teamData, playerData, playerUUID) => {
    if(knownMatchData.gameMode !== 'deathmatch' && knownMatchData.gameMode !== 'ggteam' && knownMatchData.gameMode !== 'onefa') {
      const allPlayerAwardStats = [];
      var playerAbilityUsage = {};
      if(knownMatchData.gameMode === "competitive") {
        setIsComp(true);
      }

      var partyIDs = {};

      for(var i = 0; i < playerData.length; i++) {
        if(playerData[i].subject === playerUUID) {
          playerAbilityUsage.Ability1 = (playerData[i].stats.abilityCasts.ability1Casts / roundData.length).toFixed(1);
          playerAbilityUsage.Ability2 = (playerData[i].stats.abilityCasts.ability2Casts / roundData.length).toFixed(1);
          playerAbilityUsage.Grenade = (playerData[i].stats.abilityCasts.grenadeCasts / roundData.length).toFixed(1);
          playerAbilityUsage.Ultimate = (playerData[i].stats.abilityCasts.ultimateCasts / roundData.length).toFixed(1);
        }

        allPlayerAwardStats[playerData[i].subject] = {};
        if(knownMatchData.gameMode === "competitive") {
          allPlayerAwardStats[playerData[i].subject].competitiveTier = playerData[i].competitiveTier;
        }

        allPlayerAwardStats[playerData[i].subject].subject = playerData[i].subject;
        allPlayerAwardStats[playerData[i].subject].subjectName = playerData[i].gameName;
        allPlayerAwardStats[playerData[i].subject].subjectTag = playerData[i].tagLine;
        allPlayerAwardStats[playerData[i].subject].subjectAgent = playerData[i].characterId;
        allPlayerAwardStats[playerData[i].subject].partyUUID = playerData[i].partyId;

        if(!partyIDs[playerData[i].partyId]) {
          partyIDs[playerData[i].partyId] = {
            members: [playerData[i].subject]
          };
        } else {
          partyIDs[playerData[i].partyId].members.push(playerData[i].subject);
        }

        if(knownMatchData.playerTeam === 'Blue') {
          allPlayerAwardStats[playerData[i].subject].subjectTeam = playerData[i].teamId;
        } else {
          if(playerData[i].teamId == 'Blue') {
            allPlayerAwardStats[playerData[i].subject].subjectTeam = 'Red';
          } else {
            allPlayerAwardStats[playerData[i].subject].subjectTeam = 'Blue';
          }
        }

        allPlayerAwardStats[playerData[i].subject].kills = playerData[i].stats.kills;
        allPlayerAwardStats[playerData[i].subject].deaths = playerData[i].stats.deaths;
        allPlayerAwardStats[playerData[i].subject].assists = playerData[i].stats.assists;
        allPlayerAwardStats[playerData[i].subject].acs = (playerData[i].stats.score / roundData.length);
        allPlayerAwardStats[playerData[i].subject].kd = (playerData[i].stats.kills / playerData[i].stats.deaths);

        allPlayerAwardStats[playerData[i].subject].firstbloods = 0;
        allPlayerAwardStats[playerData[i].subject].headshots = 0;
        allPlayerAwardStats[playerData[i].subject].bodyshots = 0;
        allPlayerAwardStats[playerData[i].subject].legshots = 0;
        allPlayerAwardStats[playerData[i].subject].money_spent = 0;

        var playerDamage = 0;
        
        if(playerData[i].roundDamage !== null) {
          for(var j = 0; j < playerData[i].roundDamage.length; j++) {
            playerDamage += playerData[i].roundDamage[j].damage;
          }
  
          allPlayerAwardStats[playerData[i].subject].total_dmg = playerDamage;
        } else {
          allPlayerAwardStats[playerData[i].subject].total_dmg = 0;
        }
      }

      var knownParties = {};

      for(var i = 0; i < Object.keys(partyIDs).length; i++) {
        if(partyIDs[Object.keys(partyIDs)[i]].members.length > 1) {
          var className = `party-${Object.keys(knownParties).length}`
          knownParties[Object.keys(partyIDs)[i]] = className;
        }
      }

      setPlayerParties(knownParties);

      for(var i = 0; i < roundData.length; i++) {
        var totalRoundKills = [];
        
        for(var j = 0; j < roundData[i].playerStats.length; j++) {
          allPlayerAwardStats[roundData[i].playerStats[j].subject].money_spent += roundData[i].playerStats[j].economy.spent;

          for(var k = 0; k < roundData[i].playerStats[j].damage.length; k++) {
            allPlayerAwardStats[roundData[i].playerStats[j].subject].headshots += roundData[i].playerStats[j].damage[k].headshots;
            allPlayerAwardStats[roundData[i].playerStats[j].subject].bodyshots += roundData[i].playerStats[j].damage[k].bodyshots;
            allPlayerAwardStats[roundData[i].playerStats[j].subject].legshots += roundData[i].playerStats[j].damage[k].legshots;
          }

          for(var k = 0; k < roundData[i].playerStats[j].kills.length; k++) {
            totalRoundKills.push(roundData[i].playerStats[j].kills[k]);
          }
        }
          
        totalRoundKills.sort(function(a, b) {
          return a.roundTime - b.roundTime;
        });

        var firstRoundKill = totalRoundKills[0];

        if(firstRoundKill) {
          allPlayerAwardStats[firstRoundKill.killer].firstbloods++;
        }
      }

      var playerStatsSortingArray = [];

      for(var key in allPlayerAwardStats) {
        var totalShotsHit = allPlayerAwardStats[key].headshots + allPlayerAwardStats[key].bodyshots + allPlayerAwardStats[key].legshots;

        var headshot_percent = (allPlayerAwardStats[key].headshots / totalShotsHit) * 100;

        allPlayerAwardStats[key].hs_percent = parseInt(headshot_percent);

        playerStatsSortingArray.push(allPlayerAwardStats[key])
      }

      setPlayerScoreboardStats(playerStatsSortingArray);
        
      playerStatsSortingArray.sort(function(a, b) {
        return b.money_spent - a.money_spent;
      });
      var playerThatSpentMostMoney = playerStatsSortingArray[0].subject;
        
      playerStatsSortingArray.sort(function(a, b) {
        return a.money_spent - b.money_spent;
      });
      var playerThatSpentLeastMoney = playerStatsSortingArray[0].subject;
        
      playerStatsSortingArray.sort(function(a, b) {
        return b.kills - a.kills;
      });
      var playerWithMostKills = playerStatsSortingArray[0].subject;

      playerStatsSortingArray.sort(function(a, b) {
        return b.assists - a.assists;
      });
      var playerWithMostAssists = playerStatsSortingArray[0].subject;

      playerStatsSortingArray.sort(function(a, b) {
        return b.damage - a.damage;
      });
      var playerWithMostDmg = playerStatsSortingArray[0].subject;

      playerStatsSortingArray.sort(function(a, b) {
        return b.hs_percent - a.hs_percent;
      });
      var playerWithBestHsPercent = playerStatsSortingArray[0].subject;

      playerStatsSortingArray.sort(function(a, b) {
        return b.firstbloods - a.firstbloods;
      });
      var playerWithMostFBs = playerStatsSortingArray[0].subject;

      playerStatsSortingArray.sort(function(a, b) {
        return b.acs - a.acs;
      });
      var playerWithMostACS = playerStatsSortingArray[0].subject;

      setHasPlayerSpentMost(playerThatSpentMostMoney === knownMatchData.uuid);
      setHasPlayerSpentLeast(playerThatSpentLeastMoney === knownMatchData.uuid);
      setHasPlayerMostKills(playerWithMostKills === knownMatchData.uuid);
      setHasPlayerMostAssists(playerWithMostAssists === knownMatchData.uuid);
      setHasPlayerMostACS(playerWithMostACS === knownMatchData.uuid);
      setHasPlayerDealtMostDmg(playerWithMostDmg === knownMatchData.uuid);
      setHasPlayerHighestHsPercent(playerWithBestHsPercent === knownMatchData.uuid);
      setHasPlayerMostFBs(playerWithMostFBs === knownMatchData.uuid);

      setTeamData(teamData);

      setMatchScore(knownMatchData.matchScore);
      setPlayerMatchResult(knownMatchData.matchOutcome);

      moment.locale(router.query.lang);
      var newMatchDate = moment(knownMatchData.gameStartUnix).format('D. MMMM YYYY, h:mm a');

      var x = knownMatchData.gameLengthMS;
      var tempTime = moment.duration(x);
      if(tempTime.hours() > 0) {
        var newMatchLength = tempTime.hours() + ' hour, ' + tempTime.minutes() + ' minutes, ' + tempTime.seconds() + ' seconds';
      } else {
        var newMatchLength = tempTime.minutes() + ' minutes, ' + tempTime.seconds() + ' seconds';
      }
      if(newMatchLength.split(",").pop() === ' ') {
        newMatchLength = newMatchLength.substring(0, newMatchLength.lastIndexOf(','));
      }
      
      setMatchMap(knownMatchData.mapUUID);
      setMatchMapName(knownMatchData.mapName);
      setMatchDate(newMatchDate);
      setMatchLength(newMatchLength);
      setMatchMode(gamemodes[knownMatchData.gameMode]);
      setMatchServer(knownMatchData.gameServer);
      setMatchGameVersion(knownMatchData.gameVersion);

      setname(knownMatchData.name);
      setUUID(knownMatchData.uuid);
      setPlayerAgentUUID(knownMatchData.playerAgent);
      setPlayerKDA(knownMatchData.playerKDA);
      setPlayerKD(knownMatchData.playerKD);
      setPlayerACS(knownMatchData.playerACS);
      setPlayerKillsPerRound(knownMatchData.playerKillsPerRound);
      setPlayerCurrentTier(knownMatchData.playerCurrentTier);
      setPlayerHsPercent(knownMatchData.headShotsPercentRounded);
      setPlayerBsPercent(knownMatchData.bodyShotsPercentRounded);
      setPlayerLsPercent(knownMatchData.legShotsPercentRounded);
      setPlayerFBs(knownMatchData.playerFBs);

      setPlayerAbilityUsagePerRound(playerAbilityUsage);

      setRounds(roundData);
    } else if(knownMatchData.gameMode === 'deathmatch') {
      const allPlayerAwardStats = [];

      for(var i = 0; i < playerData.length; i++) {
        allPlayerAwardStats[playerData[i].subject] = {};

        allPlayerAwardStats[playerData[i].subject].subject = playerData[i].subject;
        allPlayerAwardStats[playerData[i].subject].subjectName = playerData[i].gameName;
        allPlayerAwardStats[playerData[i].subject].subjectTag = playerData[i].tagLine;
        allPlayerAwardStats[playerData[i].subject].subjectAgent = playerData[i].characterId;

        if(knownMatchData.playerTeam === 'Blue') {
          allPlayerAwardStats[playerData[i].subject].subjectTeam = playerData[i].teamId;
        } else {
          if(playerData[i].teamId == 'Blue') {
            allPlayerAwardStats[playerData[i].subject].subjectTeam = 'Red';
          } else {
            allPlayerAwardStats[playerData[i].subject].subjectTeam = 'Blue';
          }
        }

        allPlayerAwardStats[playerData[i].subject].kills = playerData[i].stats.kills;
        allPlayerAwardStats[playerData[i].subject].deaths = playerData[i].stats.deaths;
        allPlayerAwardStats[playerData[i].subject].assists = playerData[i].stats.assists;
        allPlayerAwardStats[playerData[i].subject].score = playerData[i].stats.score / roundData.length;
        allPlayerAwardStats[playerData[i].subject].kd = (playerData[i].stats.kills / playerData[i].stats.deaths);
        allPlayerAwardStats[playerData[i].subject].acs = 0;

        allPlayerAwardStats[playerData[i].subject].firstbloods = 0;
        allPlayerAwardStats[playerData[i].subject].headshots = 0;
        allPlayerAwardStats[playerData[i].subject].bodyshots = 0;
        allPlayerAwardStats[playerData[i].subject].legshots = 0;
        allPlayerAwardStats[playerData[i].subject].money_spent = 0;
      }

      var playerStatsSortingArray = [];

      for(var key in allPlayerAwardStats) {
        playerStatsSortingArray.push(allPlayerAwardStats[key])
      }

      setPlayerScoreboardStats(playerStatsSortingArray);

      setTeamData(teamData);

      setMatchScore(knownMatchData.matchScore);
      setPlayerMatchResult(knownMatchData.matchOutcome);

      setname(knownMatchData.name);
      setUUID(knownMatchData.uuid);
      setPlayerAgentUUID(knownMatchData.playerAgent);
      setPlayerKDA(knownMatchData.playerKDA);
      setPlayerKD(knownMatchData.playerKD);
      setPlayerKillsPerRound(knownMatchData.playerKillsPerRound);
      
      setActiveTab('scoreboard');
      setIsDeathmatch(true);

      setCurrentSortStat('score');
    } else if(knownMatchData.gameMode === 'ggteam') {
      setIsEscalation(true);
    } else if(knownMatchData.gameMode === 'onefa') {
      setIsEscalation(true);
    }
  }
  
  React.useEffect(async () => {
    if(!router.query.lang) return;

    if(router.query.isExternalSource === "true") {
      var user_data = await getCurrentUserData();
      var mapData = await (await fetch('https://valorant-api.com/v1/maps?language=' + APIi18n(router.query.lang), { 'Content-Type': 'application/json' })).json();
      var ranks = await(await fetch('https://valorant-api.com/v1/competitivetiers?language=' + APIi18n(router.query.lang))).json();

      var ent = await getUserEntitlement();
      var bearer = await getUserAccessToken();

      var match = await getMatch(router.query.region, router.query.matchID, ent, bearer);
      var viewed_user_data = await requestUserCreds(router.query.region, router.query.player)
      
      var { matchViewData } = calculateMatchStats(match, viewed_user_data[0].GameName, viewed_user_data[0].TagLine, mapData, ranks);

      var Blue = [];
      var Red = [];
      for(var i = 0; i < match.players.length; i++) {
        if(match.players[i].teamId == "Blue") {
          Blue.push(match.players[i].subject);
        } else if(match.players[i].teamId == "Red") {
          Red.push(match.players[i].subject);
        }
      }
      
      var knownMatchData = matchViewData;
      var roundData = match.roundResults;
      var teamData = { Blue, Red };
      var playerData = match.players; 

      var agent_data = await(await fetch(`https://valorant-api.com/v1/agents/${knownMatchData.playerAgent}?language=${APIi18n(router.query.lang)}`)).json();
      setPlayerAgentAbilities(agent_data.data.abilities);

      calculatePageContent(knownMatchData, roundData, teamData, playerData, router.query.player);
      return;
    }

    if(sessionStorage.getItem("knownMatchData")) {
      var user_data = await getCurrentUserData();
      var knownMatchData = JSON.parse(sessionStorage.knownMatchData);
      var roundData = JSON.parse(sessionStorage.roundData);
      var teamData = JSON.parse(sessionStorage.teamData);
      var playerData = JSON.parse(sessionStorage.playerData);

      calculatePageContent(knownMatchData, roundData, teamData, playerData, user_data.uuid);
    }
  }, [router.query]);

  React.useEffect(async () => {
    if(!router.query.lang) return;
    if(sessionStorage.getItem("knownMatchData") && !router.query.isExternalSource) {
      var knownMatchData = JSON.parse(sessionStorage.knownMatchData);
      var agent_data = await(await fetch(`https://valorant-api.com/v1/agents/${knownMatchData.playerAgent}?language=${APIi18n(router.query.lang)}`)).json();
      setPlayerAgentAbilities(agent_data.data.abilities);
    }
  }, [router.query]);

  const generateShareLink = async () => {
    var user_data = await getCurrentUserData();
    var puuid = user_data.uuid;

    var instanceToken = await getInstanceToken();

    var matchData = JSON.parse(sessionStorage.getItem("knownMatchData"));
    var matchID = matchData.matchID;
    
    var url = await (await fetch('https://api.valtracker.gg/v1/shared', {
      method: 'POST',
      headers: {
        Authentication: instanceToken,
        'x-shared-type': `match::${user_data.region}`,
        'x-uuid-string': `${matchID}::${puuid}`
      }
    })).json();

    setShareMatchURL(url.data);
    setShowPopup(true);
  }

  return (
    <Layout classNames={lastTab === '' && isDeathmatch === false ? 'overflow-hidden' : ''} isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <motion.div 
        className='modal-backdrop !z-50'
        variants={backdrop_variants}
        initial="hidden"
        animate={showPopup ? 'enter' : 'exit'}
        transition={{ type: 'ease-in', duration: 0.2 }}
      >
        <motion.div 
          className='modal fixed !h-auto !w-fit'
          variants={card_variants}
          initial="hidden"
          animate={showPopup ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.2 }}
        > 
          <div 
            className='close-icon-wrapper'
            onClick={() => {
              setIsOverlayShown(false);
              setShowPopup(false);
            }}
          >
            <Close className='w-8 p-1' />
          </div>
          <h1 className='z-20 text-2xl flex flex-row items-center font-bold'>{LocalText(L, "link_share.header")}</h1>
          <span 
            className={`transition-all duration-[0ms] ease-linear cursor-pointer ${urlCopied === true ? "text-val-blue hover:text-opacity-80" : "text-button-color hover:text-button-color-hover"}`}
            onClick={() => {
              navigator.clipboard.writeText(shareMatchURL);
              setUrlCopied(true);
              setTimeout(() => {
                setUrlCopied(false);
              }, 2000);
            }}
          >
            {shareMatchURL}
          </span>
          <span className='block w-96 text-gray-300 font-light'>{LocalText(L, "link_share.desc")}</span>
        </motion.div>
      </motion.div>
      <div 
        className='close-icon-wrapper' 
        onClick={() => { router.back() }}
      >
        <BackArrow className='w-8 p-1 shadow-img' />
      </div>
      <div 
        className='close-icon-wrapper !right-12' 
        onClick={() => {
          generateShareLink();
        }}
      >
        <ShareIcon className='w-8 p-1 shadow-img' />
      </div>
      <div id='matchview-header' className='w-full h-1/5 flex flex-col items-center drop-shadow-xl'>
        <h1 className='text-5xl mt-8'>
          <span className='text-val-blue val-blue-glow font-medium'>{matchScore ? matchScore.split("-")[0] : ''}</span>
          &nbsp;&nbsp;
          <span className='text-val-yellow font-bold'>{LocalText(L, "match_outcomes." + playerMatchResult)}</span>
          &nbsp;&nbsp;
          <span className='text-val-red val-red-glow font-medium'>{matchScore ? matchScore.split("-").pop() : ''}</span>
        </h1>
        <div className='mt-9 w-1/2 flex flex-row justify-around'>
          <span 
            className={'tab-tile ' + (activeTab == 'overview' ? 'active' : '') + (isDeathmatch == true ? ' hidden' : ' inline-block')}
            onClick={() => {
              setLastTab(activeTab);
              setActiveTab('overview');
            }}
          >
            {LocalText(L, "nav.overview")}
          </span>
          <span 
            className={'tab-tile ' + (activeTab == 'scoreboard' ? 'active' : '')}
            onClick={() => {
              setLastTab(activeTab);
              setActiveTab('scoreboard');
            }}
          >
          {LocalText(L, "nav.scoreboard")}
          </span>
        </div>
      </div>
      <motion.div 
        className={'w-full h-4/5 flex flex-row p-4 pt-2.5 '}
        variants={lastTab == '' ? overview_vars_first_load : overview_vars}
        initial="hidden"
        animate={activeTab === 'overview' ? "enter" : "exit"}
        transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'overview' && lastTab !== '' ? 0.5 : 0)}}
      >
        <div id='left' className='w-3/5 flex flex-col mr-4'>
          <motion.div 
            className='h-3/5 border border-tile-color p-2 relative w-full rounded mb-4 shadow-xl'
            variants={lastTab == '' ? overview_vars_first_load : overview_vars}
            initial="hidden"
            animate={activeTab === 'overview' ? "enter" : "exit"}
            transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'overview' && lastTab !== '' ? 0.7 : 0.05)}}
          >
            <div id='map-img' className='absolute top-0 left-0 z-20 h-full !rounded-l'>
              <img src={'https://media.valorant-api.com/maps/' + matchMap + '/splash.png'} className='h-full' />
            </div>
            <div id='map-name-text' className='z-30 absolute -bottom-6 left-0'>
              <span id='rotated-side-text' className='text-5xl font-bold text-black text-opacity-80 ml-8 mb-2'>{matchMapName ? matchMapName.toUpperCase() : ''}</span>
            </div>
            <div id='matchview-gradient-overlay' className='absolute top-0 h-full w-full left-0 z-30'>
              <div className='w-1/2 ml-auto p-4'>
                <span className='text-xl font-bold'>{LocalText(L, "match_info.header")}</span>
                <hr />
                <ul className='mt-4'>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={LocalText(L, "match_info.tooltips.date")} color="error" placement={'left'} className='rounded'><Calendar className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2 font-light'>{matchDate}</span>
                  </li>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={LocalText(L, "match_info.tooltips.time")} color="error" placement={'left'} className='rounded'><Clock className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2 font-light'>{matchLenght}</span>
                  </li>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={LocalText(L, "match_info.tooltips.mode")} color="error" placement={'left'} className='rounded'><ValIconHandler icon={'/images/unrated.png'} classes='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2 font-light'>{matchMode}</span>
                  </li>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={LocalText(L, "match_info.tooltips.region_server")} color="error" placement={'left'} className='rounded'><Globe className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2 font-light'>
                      {matchServer ? matchServer.split(".")[2].split("-")[0].toUpperCase() : ''} // {matchServer ? ((matchServer.split("-")[4].charAt(0).toUpperCase() + matchServer.split("-")[4].slice(1)) == "Gp" ? "Warsaw" : matchServer.split("-")[4].charAt(0).toUpperCase() + matchServer.split("-")[4].slice(1)) : ''}
                    </span>
                  </li>
                  <li className='flex flex-row items-center mb-8'>
                    <Tooltip content={LocalText(L, "match_info.tooltips.patch")} color="error" placement={'left'} className='rounded'><ValorantV className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2 font-light'>Patch {matchGameVersion ? (matchGameVersion.split("-")[1].startsWith('0') ? matchGameVersion.split("-")[1].slice(1) : matchGameVersion.split("-")[1]) : ''}</span>
                  </li>
                </ul> 
              </div>
            </div>
          </motion.div>

          <div 
            className='h-2/5 flex flex-row'
          >
            <motion.div 
              className='w-1/2 border border-tile-color p-1 rounded shadow-xl mr-4 relative overflow-hidden'
              variants={lastTab == '' ? overview_vars_first_load_noflex : overview_vars_noflex}
              initial="hidden"
              animate={activeTab === 'overview' ? "enter" : "exit"}
              transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'overview' && lastTab !== '' ? 0.75 : 0)}}
            >
              <div id='map-img' className='absolute flex items-center top-0 left-0 z-20 h-full overflow-x-hidden overflow-y-auto'>
                <img src={'/images/6k_new.png'} className='h-full relative right-4 shadow-img' />
              </div>
              <div id='map-name-text' className='z-30 absolute -bottom-6 left-0'>
                <span id='rotated-side-text' className='awards text-5xl font-bold text-black text-opacity-80 ml-8 mb-2 relative top-0.5'>{LocalText(L, "awards.rotated_text")}</span>
              </div>
              <div id='matchview-gradient-overlay-small' className='absolute top-0 h-full w-full left-0 z-30 overflow-auto'>
                <div className='w-2/3 ml-auto p-2'>
                  {
                    hasPlayerSpentMost === true && isEscalation === false ? 
                    <AwardTile 
                      icon={'/images/chess.svg'} 
                      title={LocalText(L, "awards.most_money.title")} 
                      desc={LocalText(L, `awards.most_money.desc${router.query.isExternalSource ? "_external" : ""}`, name)}
                    /> 
                    : null
                  }
                  {
                    hasPlayerSpentLeast === true && isEscalation === false ? 
                    <AwardTile 
                      icon={'/images/dollar.svg'} 
                      title={LocalText(L, "awards.least_money.title")} 
                      desc={LocalText(L, `awards.least_money.desc${router.query.isExternalSource ? "_external" : ""}`, name)} 
                    /> 
                    : null
                  }
                  {
                    hasPlayerMostKills === true ? 
                    <AwardTile 
                      icon={'/images/skull.svg'} 
                      title={LocalText(L, "awards.most_kills.title")} 
                      desc={LocalText(L, `awards.most_kills.desc${router.query.isExternalSource ? "_external" : ""}`, name)} 
                    /> 
                    : null
                  }
                  {
                    hasPlayerMostAssists === true ? 
                    <AwardTile 
                      icon={'/images/heart_pulse.svg'} 
                      title={LocalText(L, "awards.most_assists.title")} 
                      desc={LocalText(L, `awards.most_assists.desc${router.query.isExternalSource ? "_external" : ""}`, name)} 
                    /> 
                    : null
                  }
                  {
                    hasPlayerMostACS === true ? 
                    <AwardTile 
                      icon={'/images/robot.svg'} 
                      title={LocalText(L, "awards.most_acs.title")} 
                      desc={isEscalation === true ? LocalText(L, `awards.most_acs.desc_2${router.query.isExternalSource ? "_external" : ""}`, name) : LocalText(L, `awards.most_acs.desc_1${router.query.isExternalSource ? "_external" : ""}`, name)} /> 
                    : null
                  }
                  {
                    hasPlayerMostFBs === true && isEscalation === false ? 
                    <AwardTile 
                      icon={'/images/gauge.svg'} 
                      title={LocalText(L, "awards.most_fbs.title")} 
                      desc={LocalText(L, `awards.most_fbs.desc${router.query.isExternalSource ? "_external" : ""}`, name)} 
                    /> 
                    : null
                  }
                  {
                    hasPlayerDealtMostDmg === true ? 
                    <AwardTile 
                      icon={'/images/arrow_increase.svg'} 
                      title={LocalText(L, "awards.most_dmg.title")} 
                      desc={LocalText(L, `awards.most_dmg.desc${router.query.isExternalSource ? "_external" : ""}`, name)} 
                    /> 
                    : null
                  }
                  {
                    hasPlayerHighestHsPercent === true ? 
                    <AwardTile 
                      icon={'/images/crosshair.svg'} 
                      rotate_icon 
                      title={LocalText(L, "awards.best_hs.title")} 
                      desc={LocalText(L, `awards.best_hs.desc${router.query.isExternalSource ? "_external" : ""}`, name)} 
                    /> 
                    : null
                  }
                </div>
              </div>
            </motion.div>

            <motion.div 
              className='w-1/2 border border-tile-color p-1 rounded shadow-xl overflow-auto'
              variants={lastTab == '' ? overview_vars_first_load_noflex : overview_vars_noflex}
              initial="hidden"
              animate={activeTab === 'overview' ? "enter" : "exit"}
              transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'overview' && lastTab !== '' ? 0.75 : 0)}}
            >
              {rounds.map((round, index) => {
                if(round.roundResult !== "Surrendered") {
                  if(round.bombPlanter) {
                    var isSpikePlanted = true;
                  }

                  if(teamData[round.winningTeam].includes(uuid)) {
                    var hasPlayerTeamWonRound = true;
                  }

                  var playerKills = 0;

                  var teamBlueRoundKills = 0;
                  var teamRedRoundKills = 0;

                  for(var i = 0; i < round.playerStats.length; i++) {
                    if(teamData.Blue.includes(round.playerStats[i].subject)) {
                      teamBlueRoundKills = teamBlueRoundKills + round.playerStats[i].kills.length;
                    } else if(teamData.Red.includes(round.playerStats[i].subject)) {
                      teamRedRoundKills = teamRedRoundKills + round.playerStats[i].kills.length;
                    }

                    if(round.playerStats[i].subject == uuid) {
                      playerKills = playerKills + round.playerStats[i].kills.length;

                      if(round.playerStats[i].score > bestRound.score) {
                        setBestRound({
                          round: index,
                          score: round.playerStats[i].score
                        });
                      }
                    }
                  }

                  return(
                    <>
                      <div 
                        key={index}
                        className='h-14 border border-tile-color rounded p-1 mb-1 flex flex-row items-center pl-2 relative overflow-hidden bg-tile-color bg-opacity-10 transition-all duration-[0ms] ease-linear'
                      >
                        <div className='h-full flex flex-row items-center w-2/4'>
                          {
                            isSpikePlanted ? 
                            <Tooltip content={LocalText(L, "round_results.tooltips." + round.roundResult.replace(" ", "-"))} color="error" placement={'left'} className='rounded h-full flex items-center'>
                              <ValIconHandler icon={'/images/unrated.png'} classes={'h-4/6 shadow-img'} />
                            </Tooltip>
                            :
                            <Tooltip content={LocalText(L, "round_results.tooltips." + round.roundResult.replace(" ", "-"))} color="error" placement={'left'} className='rounded h-full flex items-center'>
                              <Skull className='h-4/6 shadow-img' />
                            </Tooltip>
                          }
                          <div className='ml-2.5 flex flex-col relative'>
                            <span className={`text-lg relative bottom-1.5 font-medium ${bestRound.round === index ? "text-val-yellow yellow-glow" : (hasPlayerTeamWonRound ? 'text-val-blue german-won-round val-blue-glow' : 'text-val-red val-red-glow')}`}>
                              {hasPlayerTeamWonRound ? LocalText(L, "match_outcomes.VICTORY") : (LocalText(L, "match_outcomes.DEFEAT") === "VERLOREN" ? LocalText(L, "match_outcomes.DEFEAT").split("O")[0] + '.' : LocalText(L, "match_outcomes.DEFEAT"))}
                            </span>
                            <span className='absolute -bottom-2 w-20 font-light text-sm'>{LocalText(L, "round_results.round_text")} {index+1}</span>
                          </div>
                        </div>

                        <div className='ml-2 flex flex-col relative w-1/3'>
                          <span className='text-xl relative bottom-1.5 '>
                            <span className='text-val-blue'>{teamBlueRoundKills}</span> / <span className='text-val-red'>{teamRedRoundKills}</span>
                          </span>
                          <span className='absolute -bottom-2 left-px font-light text-sm w-20'>{LocalText(L, "round_results.tks")}</span>
                        </div>
                        <div className='ml-2 flex flex-col relative w-1/3'>
                          <span className='text-xl relative bottom-1.5 '>
                            <span className='text-val-blue'>{playerKills}</span>
                          </span>
                          <span className='absolute -bottom-2 left-px font-light text-sm text-ellipsis whitespace-nowrap'>{LocalText(L, "round_results.pks")}</span>
                        </div>
                      </div>
                      {
                        // Index to check when 12 rounds are over here has to be 11, because index starts at 0.
                        index === 11 ?
                        <div className='h-8 p-1 mb-1 flex flex-row items-center justify-center relative overflow-hidden'>
                          <Tooltip content={LocalText(L, "round_results.tooltips.side-switch")} color="error" placement={'left'} className='rounded h-full flex items-center'>
                            <Swap className='h-8 shadow-img' />
                          </Tooltip>
                        </div>
                        :
                        null
                      }
                    </>
                  )
                }
              })}
            </motion.div>
          </div>
        </div>
        <motion.div 
          className='w-2/5 h-full border border-tile-color p-4 relative overflow-hidden shadow-xl rounded'
          variants={lastTab == '' ? overview_vars_first_load : overview_vars}
          initial="hidden"
          animate={activeTab === 'overview' ? "enter" : "exit"}
          transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'overview' && lastTab !== '' ? 0.6 : 0.1)}}
        > 
          <div id='player-agent-image' className='absolute bottom-8 -left-64 z-30 h-full flex items-center'>
            <img src={'https://media.valorant-api.com/agents/' + playerAgentUUID + '/fullportrait.png'} className='shadow-img' />
          </div>
          <div id='map-name-text' className='z-40 absolute -bottom-2 left-0'>
            <span 
              id='rotated-side-text' 
              className='text-5xl font-bold text-black text-opacity-80 ml-6 flex relative top-4 '
            >
              {
                router.query.isCompetitive 
                ? 
                (
                  playerCurrentTier 
                  ?
                  <img 
                    src={'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/'+ playerCurrentTier + '/largeicon.png'} 
                    className='w-16 inline opacity-80 shadow-img' 
                  />
                  :
                  ''
                )
                : 
                ''
              }
              <span className='relative top-1.5 ml-2'>{name}</span>
            </span>
          </div>
          <div id='matchview-gradient-overlay' className='absolute top-0 h-full w-full left-0 z-30'>
            <div className='2xl:w-1/2 w-2/3 ml-auto p-4 h-full overflow-auto relative'>
              <span className='text-xl font-bold'>{LocalText(L, "player_stats.header")}</span>
              <hr />
              <ul className='mt-4'>
                <li className='flex flex-row items-center mb-4'>
                  <Tooltip content={'KD // KDA'} color="error" placement={'left'} className='rounded'><SignalGraph className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2 font-light'>{playerKD} ({playerKDA})</span>
                </li>
                <li className='flex flex-row items-center mb-4'>
                  <Tooltip content={'ACS'} color="error" placement={'left'} className='rounded'><ArrowIncrease className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2 font-light'>{playerACS} {isEscalation === true ? 'Score' : 'ACS'}</span>
                </li>
                <li className='flex flex-row items-center mb-4'>
                  <Tooltip content={isEscalation === true ? LocalText(L, "player_stats.tooltips.dmg") : LocalText(L, "player_stats.tooltips.dmg_round")} color="error" placement={'left'} className='rounded'><Skull className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2 font-light'>{playerKillsPerRound} {isEscalation === true ? LocalText(L, "player_stats.stats.dmg") : LocalText(L, "player_stats.stats.dmg_round")}</span>
                </li>
                <li className={'flex flex-row items-center mb-4 ' + (isEscalation === true ? 'hidden' : '')}>
                  <Tooltip content={LocalText(L, "player_stats.stats.fbs")} color="error" placement={'left'} className='rounded'><Flash className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2 font-light'>{playerFBs} {LocalText(L, "player_stats.stats.fbs")}</span>
                </li>
                <li className='flex flex-row items-center mb-4'>
                  <Tooltip content={LocalText(L, "player_stats.stats.hit_percent")} color="error" placement={'left'} className='rounded'><Crosshair className='w-7 relative top-px rotate-45 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2.5 font-light'>{LocalText(L, "player_stats.stats.hit_percent")}</span>
                </li>
                <li className='flex flex-row items-center mb-4 2xl:h-56 h-44 ml-4'>
                  <img src='/images/human_body_silhouette.svg' className='2xl:h-56 h-44 opacity-80 shadow-img' />
                  <div className='flex flex-col justify-between h-full ml-6'>
                    <div className='relative top-1.5'>
                      <div className='border-b 2xl:w-16 w-14 absolute 2xl:top-3 top-1.5 right-10' />
                      <span className='relative 2xl:bottom-0 bottom-2 text-lg font-light'>{playerHsPercent}%</span>
                    </div>
                    <div className='relative bottom-6'>
                      <div className='border-b 2xl:w-14 w-12 absolute top-3 right-10' />
                      <span className='text-lg font-light'>{playerBsPercent}%</span>
                    </div>
                    <div className='relative bottom-8'>
                      <div className='border-b 2xl:w-12 w-10 absolute top-3 right-10' />
                      <span className='text-lg font-light'>{playerLsPercent}%</span>
                    </div>
                  </div>
                </li>
                <li className='flex flex-row items-center mb-4'>
                  <span className='relative font-semibold text-lg top-0.5'>{LocalText(L, "player_stats.stats.abilities_per_round")}</span>
                </li>
                {
                  playerAgentAbilities.map((ability, index) => {
                    if(ability.slot !== "Passive") {
                      return (
                        <li className='flex flex-row items-center mb-4 h-8 ml-4' key={index}>
                          <img src={ability.displayIcon} className='h-full mr-2' />
                          <span className='text-lg font-light'>{ability.displayName} - {playerAbilityUsagePerRound[ability.slot]}</span>
                        </li>
                      )
                    }
                  })
                }
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className={`w-full h-4/5 p-4 ${Object.keys(playerParties).length > 0 && "!pl-12"} pt-2.5`}
        variants={scoreboard_vars}
        initial="hidden"
        animate={activeTab === 'scoreboard' ? "enter" : "exit"}
        transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'scoreboard' ? 0.5 : 0) }}
      >
        <table className="w-full" id="scoreboard-table">
          <tbody id="test-scoreboard">
            <tr className="scoreboard-header">
              <td className="w-1/4 relative left-1 text-lg font-semibold">{LocalText(L, "scoreboard.headers.agent_name")}</td>
              <td className={"w-1/5 " + (isDeathmatch ? 'hidden' : '')} onClick={() => {
                setCurrentSortStat('acs');

                var newArray = playerScoreboardStats.sort(function(a, b) {
                  return b.acs - a.acs;
                });

                setPlayerScoreboardStats(newArray);
              }}>
                <span className='cursor-pointer text-lg font-semibold'>{isEscalation === true ? 'Score' : 'ACS'}</span>
                {
                  currentSortStat === 'acs' ?
                  <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
                  :
                  null
                }
              </td>
              <td className={"w-1/5 " + (!isDeathmatch ? 'hidden' : '')} onClick={() => {
                setCurrentSortStat('score');

                var newArray = playerScoreboardStats.sort(function(a, b) {
                  return b.score - a.score;
                });

                setPlayerScoreboardStats(newArray);
              }}>
                <span className='cursor-pointer text-lg font-semibold'>Score</span>
                {
                  currentSortStat === 'score' ?
                  <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
                  :
                  null
                }
              </td>
              <td className={"w-1/5 "} onClick={() => {
                setCurrentSortStat('kda');

                var newArray = playerScoreboardStats.sort(function(a, b) {
                  return b.kd - a.kd;
                });

                setPlayerScoreboardStats(newArray);
              }}>
                <span className='cursor-pointer text-lg font-semibold'>K/D/A</span>
                {
                  currentSortStat === 'kda' ?
                  <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
                  :
                  null
                }
              </td>
              <td className={"w-1/5 " + (isDeathmatch || isEscalation ? 'hidden' : '')} onClick={() => {
                setCurrentSortStat('fbs');

                var newArray = playerScoreboardStats.sort(function(a, b) {
                  return b.firstbloods - a.firstbloods;
                });

                setPlayerScoreboardStats(newArray);
              }}>
                <span className='cursor-pointer text-lg font-semibold'>{LocalText(L, "scoreboard.headers.fbs")}</span>
                {
                  currentSortStat === 'fbs' ?
                  <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
                  :
                  null
                }
              </td>
              <td className={"w-1/5 " + (isDeathmatch ? 'hidden' : '')} onClick={() => {
                setCurrentSortStat('round_dmg');

                var newArray = playerScoreboardStats.sort(function(a, b) {
                  return b.total_dmg - a.total_dmg;
                });

                setPlayerScoreboardStats(newArray);
              }}>
                <span className='cursor-pointer text-lg font-semibold'>{isEscalation === true ? LocalText(L, "scoreboard.headers.dmg") : LocalText(L, "scoreboard.headers.dmg_round")}</span>
                {
                  currentSortStat === 'round_dmg' ?
                  <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
                  :
                  null
                }
              </td>
            </tr>
            <Spacer y={0.5} />
          </tbody>
        </table>
        {playerScoreboardStats.map((playerStats, index) => {
          var isPlayer = false;
          if(playerStats.subject === uuid) isPlayer = true;
          var partyFound = Object.keys(playerParties).find(x => x === playerStats.partyUUID);
          return(
            <>
              <motion.div 
                className={`border border-tile-color bg-tile-color bg-opacity-10 transition-all duration-[0ms] ease-linear rounded flex flex-row items-center relative ${lockHighlightedParty.state === false ? ((highlightedParty !== playerStats.partyUUID && highlightedParty !== null) ? "!opacity-20" : "!opacity-100") : (lockHighlightedParty.lockedUUID !== playerStats.partyUUID ? "!opacity-20" : "!opacity-100")}`} key={index + 'tr'}
                variants={scoreboard_vars_initial}
                initial="hidden"
                animate={activeTab === 'scoreboard' ? "enter" : "exit"}
                transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'scoreboard' ? (0.5 + (index / 100)) : (index / 100)) }}
              >
                {partyFound !== undefined && (
                  <div className='w-6 h-6 absolute -left-9 cursor-pointer'>
                    <PartyIcon 
                      className={`w-full h-full ${playerParties[playerStats.partyUUID]}`} 
                      onEnter={() => {
                        if(lockHighlightedParty.state === false) {
                          setHighlightedParty(playerStats.partyUUID);
                        }
                      }}
                      onLeave={() => {
                        if(lockHighlightedParty.state === false) {
                          setHighlightedParty(null);
                        }
                      }}
                      onClick={() => {
                        if(lockHighlightedParty.state === false) {
                          setLockHighlightedParty({ state: true, lockedUUID: playerStats.partyUUID });
                        } else if(lockHighlightedParty.state === true && lockHighlightedParty.lockedUUID === playerStats.partyUUID) {
                          setLockHighlightedParty({ state: false, lockedUUID: null });
                        } else if(lockHighlightedParty.state === true && lockHighlightedParty.lockedUUID !== playerStats.partyUUID) {
                          setLockHighlightedParty({ state: true, lockedUUID: playerStats.partyUUID });
                        }
                      }}
                    />
                  </div>
                )}
                <div className='py-1 pl-1 flex flex-row items-center h-14 w-1/4'>
                  <img src={'https://media.valorant-api.com/agents/' + playerStats.subjectAgent + '/displayicon.png'} className='h-full shadow-img' />
                  {isComp === true && (
                    <img src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${playerStats.competitiveTier}/smallicon.png`} className={`w-8 ml-2`} />
                  )}
                  <Tooltip 
                    content={playerStats.subjectName + '#' + playerStats.subjectTag} 
                    color="error" 
                    placement={'right'} 
                    className='rounded'
                  >
                    <span 
                      className={isPlayer === false ? (
                        `ml-2 text-xl val-${playerStats.subjectTeam.toLowerCase()}-glow text-val-${playerStats.subjectTeam.toLowerCase()}`
                      ) : (
                        `ml-2 text-xl yellow-glow text-val-yellow`
                      )} 
                      onClick={() => {
                        var name_encoded = encodeURIComponent(playerStats.subjectName + '#' + playerStats.subjectTag);
                        router.push(`/player?name=${playerStats.subjectName}&tag=${playerStats.subjectTag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
                      }}
                    >
                      {playerStats.subjectName}
                    </span>
                  </Tooltip>
                </div>
                <div className={'py-1 text-xl w-1/5 ' + (isDeathmatch ? 'hidden' : '')}><span className='font-light'>{playerStats.acs.toFixed(0)}</span></div>
                <div className={'py-1 text-xl w-1/5 ' + (!isDeathmatch ? 'hidden' : '')}><span className='font-light'>{playerStats.score}</span></div>
                <div className={'py-1 text-xl w-1/5 '}><span className='font-light'>{playerStats.kills + '/' + playerStats.deaths + '/' + playerStats.assists}</span></div>
                <div className={'py-1 text-xl w-1/5 ' + (isDeathmatch || isEscalation ? 'hidden' : '')}><span className='font-light'>{playerStats.firstbloods}</span></div>
                <div className={'py-1 text-xl ' + (isDeathmatch ? 'hidden' : '')}><span className='font-light'>{(playerStats.total_dmg / rounds.length).toFixed(0)}</span></div>
              </motion.div>
              <Spacer y={0.2} key={index + 'spacer'} />
            </>
          )
        })}
      </motion.div>
    </Layout>
  );
}

export default Matchview;
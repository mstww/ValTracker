import React from 'react';
import Layout from '../components/Layout';
import { motion } from "framer-motion"
import { useRouter } from 'next/router';
import moment from 'moment';
import { Tooltip, Spacer } from '@nextui-org/react'
import AwardTile from '../components/matchview/AwardTile';

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

function Matchview() {
  const router = useRouter();

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

  const [ playerName, setPlayerName ] = React.useState('');
  const [ playerUUID, setPlayerUUID ] = React.useState('');
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

  // DATA NEEDED: MapUUID, Map Name, Match Date, Match Length, Match Mode, Region, Server, Game Version, 
  // AgentUUID, Player KDA, Player KD, Player Score, Player ACS, Player Rank, HS%, BS%, LS%, is Player MVP, Player ADR
  
  React.useEffect(() => {
    if(sessionStorage.getItem("knownMatchData")) {
      var knownMatchData = JSON.parse(sessionStorage.knownMatchData);
      var roundData = JSON.parse(sessionStorage.roundData);
      var teamData = JSON.parse(sessionStorage.teamData);
      var playerData = JSON.parse(sessionStorage.playerData);

      if(knownMatchData.gameMode !== 'deathmatch' && knownMatchData.gameMode !== 'ggteam' && knownMatchData.gameMode !== 'onefa') {
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
  
        setHasPlayerSpentMost(playerThatSpentMostMoney === knownMatchData.playerUUID);
        setHasPlayerSpentLeast(playerThatSpentLeastMoney === knownMatchData.playerUUID);
        setHasPlayerMostKills(playerWithMostKills === knownMatchData.playerUUID);
        setHasPlayerMostAssists(playerWithMostAssists === knownMatchData.playerUUID);
        setHasPlayerMostACS(playerWithMostACS === knownMatchData.playerUUID);
        setHasPlayerDealtMostDmg(playerWithMostDmg === knownMatchData.playerUUID);
        setHasPlayerHighestHsPercent(playerWithBestHsPercent === knownMatchData.playerUUID);
        setHasPlayerMostFBs(playerWithMostFBs === knownMatchData.playerUUID);
  
        setTeamData(teamData);
  
        setMatchScore(knownMatchData.matchScore);
        setPlayerMatchResult(knownMatchData.matchOutcome);
  
        var newMatchDate = moment(knownMatchData.gameStartUnix).format('D. MMMM YYYY, h:mm a');
  
        var x = knownMatchData.gameLengthMS;
        var tempTime = moment.duration(x);
        if(tempTime.hours() > 0) {
          var newMatchLength = tempTime.hours() + ' hours, ' + tempTime.minutes() + ' minutes, ' + tempTime.seconds() + ' seconds';
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
  
        setPlayerName(knownMatchData.playerName);
        setPlayerUUID(knownMatchData.playerUUID);
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
  
        setPlayerName(knownMatchData.playerName);
        setPlayerUUID(knownMatchData.playerUUID);
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
  }, []);

  return (
    <Layout classNames={lastTab === '' && isDeathmatch === false ? 'overflow-hidden' : ''}>
      <div 
        className='absolute top-4 right-4 hover:bg-maincolor-lightest rounded-sm cursor-pointer transition-all duration-100 ease-linear' 
        onClick={() => { router.back() }}
      >
        <img src='/images/back_arrow.svg' className='w-8 p-1 shadow-img' />
      </div>
      <div id='matchview-header' className='w-full h-1/5 flex flex-col items-center drop-shadow-xl'>
        <h1 className='text-5xl mt-8'>
          <span className='text-val-blue'>{matchScore ? matchScore.split("-")[0] : ''}</span>
          &nbsp;&nbsp;
          <span className='text-val-yellow'>{playerMatchResult}</span>
          &nbsp;&nbsp;
          <span className='text-val-red'>{matchScore ? matchScore.split("-").pop() : ''}</span>
        </h1>
        <div className='mt-9 text-lg w-1/3 flex flex-row justify-around'>
          <span 
            className={'matchview-navitem ' + (activeTab == 'overview' ? 'active' : '') + (isDeathmatch == true ? ' hidden' : ' inline-block')}
            onClick={() => {
              setLastTab(activeTab);
              setActiveTab('overview');
            }}
          >
            OVERVIEW
          </span> 
          {/*<span 
            className={'matchview-navitem inline-block ' + (activeTab == 'rounds' ? 'active' : '')}
            onClick={() => {
              setLastTab(activeTab);
              setActiveTab('rounds');
            }}
          >
            ROUNDS
          </span>*/}
          <span 
            className={'matchview-navitem inline-block ' + (activeTab == 'scoreboard' ? 'active' : '')}
            onClick={() => {
              setLastTab(activeTab);
              setActiveTab('scoreboard');
            }}
          >
            SCOREBOARD
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
            className='h-3/5 border-2 border-maincolor-lightest p-2 relative w-full rounded-sm mb-4 shadow-xl'
            variants={lastTab == '' ? overview_vars_first_load : overview_vars}
            initial="hidden"
            animate={activeTab === 'overview' ? "enter" : "exit"}
            transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'overview' && lastTab !== '' ? 0.7 : 0.05)}}
          >
            <div id='map-img' className='absolute top-0 left-0 z-20 h-full'>
              <img src={'https://media.valorant-api.com/maps/' + matchMap + '/splash.png'} className='h-full' />
            </div>
            <div id='map-name-text' className='z-30 absolute -bottom-6 left-0'>
              <span id='rotated-side-text' className='text-6xl font-bold text-black text-opacity-80 ml-10'>{matchMapName ? matchMapName.toUpperCase() : ''}</span>
            </div>
            <div id='matchview-gradient-overlay' className='absolute top-0 h-full w-full left-0 z-30'>
              <div className='w-1/2 ml-auto p-4'>
                <span className='text-xl'>MATCH INFORMATION</span>
                <hr />
                <ul className='mt-4'>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={'Match Date'} color="error" placement={'left'} className='rounded-sm'><img src='/images/calendar.svg' className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2'>{matchDate}</span>
                  </li>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={'Match Length'} color="error" placement={'left'} className='rounded-sm'><img src='/images/clock.svg' className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2'>{matchLenght}</span>
                  </li>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={'Mode'} color="error" placement={'left'} className='rounded-sm'><img src='/images/standard.png' className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2'>{matchMode}</span>
                  </li>
                  <li className='flex flex-row items-center mb-6'>
                    <Tooltip content={'Region // Server'} color="error" placement={'left'} className='rounded-sm'><img src='/images/globe.svg' className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2'>
                      {matchServer ? matchServer.split(".")[2].split("-")[0].toUpperCase() : ''} // {matchServer ? (matchServer.split("-")[4].charAt(0).toUpperCase() + matchServer.split("-")[4].slice(1)) : ''}
                    </span>
                  </li>
                  <li className='flex flex-row items-center mb-8'>
                    <Tooltip content={'Patch'} color="error" placement={'left'} className='rounded-sm'><img src='/images/valorant_v.svg' className='w-7 shadow-img' /></Tooltip>
                    <span className='relative text-lg top-0.5 left-2'>Patch {matchGameVersion ? (matchGameVersion.split("-")[1].startsWith('0') ? matchGameVersion.split("-")[1].slice(1) : matchGameVersion.split("-")[1]) : ''}</span>
                  </li>
                </ul> 
              </div>
            </div>
          </motion.div>

          <div 
            className='h-2/5 flex flex-row'
          >
            <motion.div 
              className='w-1/2 border-2 border-maincolor-lightest p-1 rounded-sm shadow-xl mr-4 relative overflow-hidden'
              variants={lastTab == '' ? overview_vars_first_load_noflex : overview_vars_noflex}
              initial="hidden"
              animate={activeTab === 'overview' ? "enter" : "exit"}
              transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'overview' && lastTab !== '' ? 0.75 : 0)}}
            >
              <div id='map-img' className='absolute flex items-center top-0 left-0 z-20 h-full overflow-x-hidden overflow-y-auto'>
                <img src={'/images/6k_new.png'} className='h-full relative right-4 shadow-img' />
              </div>
              <div id='map-name-text' className='z-30 absolute -bottom-6 left-0'>
                <span id='rotated-side-text' className='text-6xl font-bold text-black text-opacity-80 ml-10 relative top-0.5'>AWARDS</span>
              </div>
              <div id='matchview-gradient-overlay-small' className='absolute top-0 h-full w-full left-0 z-30 overflow-auto'>
                <div className='w-2/3 ml-auto p-2'>
                  {hasPlayerSpentMost === true && isEscalation === false ? <AwardTile icon={'/images/chess.svg'} title={'Monopoly Man'} desc={'You spent the most money.'} /> : null}
                  {hasPlayerSpentLeast === true && isEscalation === false ? <AwardTile icon={'/images/dollar.svg'} title={'Smart Spender'} desc={'You spent the least money.'} /> : null}
                  {hasPlayerMostKills === true ? <AwardTile icon={'/images/skull.svg'} title={'Shots fired!'} desc={'You had the most kills.'} /> : null}
                  {hasPlayerMostAssists === true ? <AwardTile icon={'/images/heart_pulse.svg'} title={'Pocket Sage'} desc={'You had the most assists.'} /> : null}
                  {hasPlayerMostACS === true ? <AwardTile icon={'/images/robot.svg'} title={'Automaton'} desc={isEscalation === true ? 'You had the highest Score.' : 'You had the highest ACS.'} /> : null}
                  {hasPlayerMostFBs === true && isEscalation === false ? <AwardTile icon={'/images/gauge.svg'} title={'Need for Speed'} desc={'You had the most first bloods.'} /> : null}
                  {hasPlayerDealtMostDmg === true ? <AwardTile icon={'/images/arrow_increase.svg'} title={'That\'s a lot of damage!'} desc={'You dealt the most damage.'} /> : null}
                  {hasPlayerHighestHsPercent === true ? <AwardTile icon={'/images/crosshair.svg'} rotate_icon title={'Check him PC!'} desc={'You had the highest Headshot%.'} /> : null}
                </div>
              </div>
            </motion.div>

            <motion.div 
              className='w-1/2 border-2 border-maincolor-lightest p-1 rounded-sm shadow-xl overflow-auto'
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

                  if(teamData[round.winningTeam].includes(playerUUID)) {
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

                    if(round.playerStats[i].subject == playerUUID) {
                      playerKills = playerKills + round.playerStats[i].kills.length;
                    }
                  }

                  return(
                    <>
                      <div 
                        key={index}
                        className='h-14 border-2 border-maincolor-lightest rounded-sm p-1 mb-1 flex flex-row items-center pl-2 relative overflow-hidden hover:bg-maincolor-lightest transition-all duration-100 ease-linear'
                      >
                        <div className='h-full flex flex-row items-center w-2/4'>
                          {
                            isSpikePlanted ? 
                            <Tooltip content={round.roundResult} color="error" placement={'left'} className='rounded-sm h-full flex items-center'>
                              <img src='/images/standard.png' className='h-4/6 shadow-img' />
                            </Tooltip>
                            :
                            <Tooltip content={round.roundResult} color="error" placement={'left'} className='rounded-sm h-full flex items-center'>
                              <img src='/images/skull.svg' className='h-4/6 shadow-img' />
                            </Tooltip>
                          }
                          <div className='ml-2.5 flex flex-col relative'>
                            <span className={'text-xl relative bottom-1.5 ' + (hasPlayerTeamWonRound ? 'text-val-blue' : 'text-val-red')}>
                              {hasPlayerTeamWonRound ? 'VICTORY' : 'DEFEAT'}
                            </span>
                            <span className='absolute -bottom-2 left-px font-light text-sm'>Round {index+1}</span>
                          </div>
                        </div>

                        <div className='ml-2 flex flex-col relative w-1/3'>
                          <span className='text-xl relative bottom-1.5 '>
                            <span className='text-val-blue'>{teamBlueRoundKills}</span> / <span className='text-val-red'>{teamRedRoundKills}</span>
                          </span>
                          <span className='absolute -bottom-2 left-px font-light text-sm'>Team Kills</span>
                        </div>
                        <div className='ml-2 flex flex-col relative w-1/3'>
                          <span className='text-xl relative bottom-1.5 '>
                            <span className='text-val-blue'>{playerKills}</span>
                          </span>
                          <span className='absolute -bottom-2 left-px font-light text-sm'>Player Kills</span>
                        </div>
                      </div>
                      {
                        // Index to check when 12 rounds are over here has to be 11, because index starts at 0.
                        index === 11 ?
                        <div className='h-8 p-1 mb-1 flex flex-row items-center justify-center relative overflow-hidden'>
                          <Tooltip content={"Switching sides"} color="error" placement={'left'} className='rounded-sm h-full flex items-center'>
                            <img src='/images/swap.svg' className='h-8 shadow-img' />
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
          className='w-2/5 h-full border-2 border-maincolor-lightest p-4 relative overflow-hidden shadow-xl'
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
              className='text-6xl font-bold text-black text-opacity-80 ml-11 flex relative top-2 '
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
              <span className='relative top-1.5 ml-2'>{playerName}</span>
            </span>
          </div>
          <div id='matchview-gradient-overlay' className='absolute top-0 h-full w-full left-0 z-30'>
            <div className='w-1/2 ml-auto p-4 relative h-full'>
              <span className='text-xl'>PLAYER STATS</span>
              <hr />
              <ul className='mt-4'>
                <li className='flex flex-row items-center mb-6'>
                  <Tooltip content={'KD // KDA'} color="error" placement={'left'} className='rounded-sm'><img src='/images/signal_graph.svg' className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2'>{playerKD} ({playerKDA})</span>
                </li>
                <li className='flex flex-row items-center mb-6'>
                  <Tooltip content={'ACS'} color="error" placement={'left'} className='rounded-sm'><img src='/images/arrow_increase.svg' className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2'>{playerACS} {isEscalation === true ? 'Score' : 'ACS'}</span>
                </li>
                <li className='flex flex-row items-center mb-6'>
                  <Tooltip content={'Damage/Round'} color="error" placement={'left'} className='rounded-sm'><img src='/images/skull.svg' className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2'>{playerKillsPerRound} {isEscalation === true ? 'Damage' : 'Damage/Round'}</span>
                </li>
                <li className={'flex flex-row items-center mb-6 ' + (isEscalation === true ? 'hidden' : '')}>
                  <Tooltip content={'First Bloods'} color="error" placement={'left'} className='rounded-sm'><img src='/images/flash.svg' className='w-7 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2 '>{playerFBs} First Bloods</span>
                </li>
                <li className='flex flex-row items-center mb-6'>
                  <Tooltip content={'Hit Percentages'} color="error" placement={'left'} className='rounded-sm'><img src='/images/crosshair.svg' className='w-7 relative top-px transform rotate-45 shadow-img' /></Tooltip>
                  <span className='relative text-lg top-0.5 left-2.5'>Hit Percentages:</span>
                </li>
                <li className='flex flex-row items-center mb-6 h-56 ml-4'>
                  <img src='/images/human_body_silhouette.svg' className='h-56 opacity-80 shadow-img' />
                  <div className='flex flex-col justify-between h-full ml-6'>
                    <div className='relative top-1.5'>
                      <div className='border-b w-16 absolute top-3 right-10' />
                      <span className='text-lg'>{playerHsPercent}%</span>
                    </div>
                    <div className='relative bottom-6'>
                      <div className='border-b w-14 absolute top-3 right-10' />
                      <span className='text-lg'>{playerBsPercent}%</span>
                    </div>
                    <div className='relative bottom-8'>
                      <div className='border-b w-12 absolute top-3 right-10' />
                      <span className='text-lg'>{playerLsPercent}%</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/*<motion.div 
        className={'w-full h-4/5 p-4 pt-2.5 flex flex-row'}
        variants={rounds_vars}
        initial="hidden"
        animate={activeTab === 'rounds' ? "enter" : "exit"}
        transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'rounds' ? 0.5 : 0) }}
      > 
        <div id='left' className='w-1/4 h-full flex flex-col mr-2'>
          <div className='w-full h-1/2 border-2 border-maincolor-lightest rounded-sm p-2 mb-4'>
            <span>Player Stats</span>
            <hr />
            Damage this round, combat score, eco stats, loadout, abilities bought/used
            <ul className='mt-4'>
              <li className='flex flex-row items-center mb-6 border-2 border-maincolor-lightest rounded-sm h-14 p-1'>
                <div className='h-full w-3/5 flex flex-row items-center'>
                  <img src='https://media.valorant-api.com/gear/822bcab2-40a2-324e-c137-e09195ad7692/shop/newimage.png' className='h-4/5' />
                  <img src='https://media.valorant-api.com/weapons/63e6c2b6-4a8e-869c-3d4c-e38355226584/killstreamicon.png' className='h-3/5 flip-img' />
                </div>
                <div className='h-full w-2/5 flex flex-row items-center'>
                  <div className='w-1/2 h-full'>
                    <img src={'https://media.valorant-api.com/agents/' + playerAgentUUID + '/abilities/ability1/displayicon.png'} className='h-4/5' />
                  </div>
                  <div className='w-1/2 h-full'>
                    <img src={'https://media.valorant-api.com/agents/' + playerAgentUUID + '/abilities/grenade/displayicon.png'} className='h-4/5' />
                  </div>
                </div>
              </li>
              <li className='flex flex-row items-center mb-6'>
                <Tooltip content={'KD // KDA'} color="error" placement={'left'} className='rounded-sm'><img src='/images/signal_graph.svg' className='w-7' /></Tooltip>
                <span className='relative text-lg top-0.5 left-2'>128 Damage</span>
              </li>
              <li className='flex flex-row items-center mb-6'>
                <Tooltip content={'KD // KDA'} color="error" placement={'left'} className='rounded-sm'><img src='/images/signal_graph.svg' className='w-7' /></Tooltip>
                <span className='relative text-lg top-0.5 left-2'>20 Combat Score</span>
              </li>
              <li className='flex flex-row items-center mb-6'>
                <Tooltip content={'KD // KDA'} color="error" placement={'left'} className='rounded-sm'><img src='/images/signal_graph.svg' className='w-7' /></Tooltip>
                <span className='relative text-lg top-0.5 left-2'>3900 Credits spent</span>
              </li>
            </ul>
          </div>
          <div className='w-full h-1/2 border-2 border-maincolor-lightest rounded-sm p-2'>
            <span>Team Stats</span>
            <hr />
            <span>Kills/Team, Total Money spent, loadout of everyone</span>
            <ul className='mt-4'>
              <li className='flex flex-row items-center mb-6'>
                <Tooltip content={'KD // KDA'} color="error" placement={'left'} className='rounded-sm'><img src='/images/signal_graph.svg' className='w-7' /></Tooltip>
                <span className='relative text-lg top-0.5 left-2'>{playerKD} ({playerKDA})</span>
              </li>
            </ul>
          </div>
        </div>
        <div id='mid' className='w-2/4 border-2 border-maincolor-lightest rounded-sm p-2 h-full mx-2'>
          Map
        </div>
        <div id='right' className='w-1/4 h-full flex flex-col ml-2'>
          <div className='w-full h-1/2 border-2 border-maincolor-lightest rounded-sm p-2 mb-4'>
            <span>Events</span>
            <hr />
            <span>Every kill, spike plant/defuse</span>
          </div>
          <div className='w-full h-1/2 border-2 border-maincolor-lightest rounded-sm p-2'>
            <span>Round Select</span>
            <hr />
            <span>All rounds, round 0 auto selected</span>
          </div>
          </div>
        </motion.div>*/}
      
      <motion.div 
        className={'w-full h-4/5 p-4 pt-2.5'}
        variants={scoreboard_vars}
        initial="hidden"
        animate={activeTab === 'scoreboard' ? "enter" : "exit"}
        transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'scoreboard' ? 0.5 : 0) }}
      >
        <table className="w-full" id="scoreboard-table">
          <tbody id="test-scoreboard">
            <tr className="scoreboard-header">
              <td className="w-1/4 relative left-1">Agent and Name</td>
              <td className={"w-1/5 " + (isDeathmatch ? 'hidden' : '')} onClick={() => {
                setCurrentSortStat('acs');

                var newArray = playerScoreboardStats.sort(function(a, b) {
                  return b.acs - a.acs;
                });

                setPlayerScoreboardStats(newArray);
              }}>
                <span className='cursor-pointer'>{isEscalation === true ? 'Score' : 'ACS'}</span>
                {
                  currentSortStat === 'acs' ?
                  <img src='/images/arrow_round_up.svg' className='w-5 ml-2 mb-0.5 inline shadow-img' />
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
                <span className='cursor-pointer'>Score</span>
                {
                  currentSortStat === 'score' ?
                  <img src='/images/arrow_round_up.svg' className='w-5 ml-2 mb-0.5 inline shadow-img' />
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
                <span className='cursor-pointer'>K/D/A</span>
                {
                  currentSortStat === 'kda' ?
                  <img src='/images/arrow_round_up.svg' className='w-5 ml-2 mb-0.5 inline shadow-img' />
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
                <span className='cursor-pointer'>First Bloods</span>
                {
                  currentSortStat === 'fbs' ?
                  <img src='/images/arrow_round_up.svg' className='w-5 ml-2 mb-0.5 inline shadow-img' />
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
                <span className='cursor-pointer'>{isEscalation === true ? 'Damage' : 'Damage/Round'}</span>
                {
                  currentSortStat === 'round_dmg' ?
                  <img src='/images/arrow_round_up.svg' className='w-5 ml-2 mb-0.5 inline shadow-img' />
                  :
                  null
                }
              </td>
            </tr>
            <Spacer y={0.5} />
            {playerScoreboardStats.map((playerStats, index) => {
              return(
                <>
                  <motion.tr 
                    className={'border-2 border-maincolor-lightest rounded-sm'} key={index + 'tr'}
                    variants={scoreboard_vars_initial}
                    initial="hidden"
                    animate={activeTab === 'scoreboard' ? "enter" : "exit"}
                    transition={{ type: 'linear', duration: 0.5, delay: (activeTab === 'scoreboard' ? (0.5 + (index / 100)) : (index / 100)) }}
                  >
                    <td className='py-1 pl-1 flex flex-row items-center h-14'>
                      <img src={'https://media.valorant-api.com/agents/' + playerStats.subjectAgent + '/displayicon.png'} className='h-full shadow-img' />
                      <Tooltip 
                        content={playerStats.subjectName + '#' + playerStats.subjectTag} 
                        color="error" 
                        placement={'top'} 
                        className='rounded-sm'
                      >
                        <span 
                          className={'ml-4 text-xl text-val-' + (playerStats.subjectTeam.toLowerCase())} 
                          onClick={() => {
                            var name_encoded = encodeURIComponent(playerStats.subjectName + '#' + playerStats.subjectTag);
                            router.push(`/player?name=${playerStats.subjectName}&tag=${playerStats.subjectTag}&searchvalue=${name_encoded}`);
                          }}
                        >
                          {playerStats.subjectName}
                        </span>
                      </Tooltip>
                    </td>
                    <td className={'py-1 text-xl ' + (isDeathmatch ? 'hidden' : '')}><span>{playerStats.acs.toFixed(0)}</span></td>
                    <td className={'py-1 text-xl ' + (!isDeathmatch ? 'hidden' : '')}><span>{playerStats.score}</span></td>
                    <td className={'py-1 text-xl '}><span>{playerStats.kills + '/' + playerStats.deaths + '/' + playerStats.assists}</span></td>
                    <td className={'py-1 text-xl ' + (isDeathmatch || isEscalation ? 'hidden' : '')}><span>{playerStats.firstbloods}</span></td>
                    <td className={'py-1 text-xl ' + (isDeathmatch ? 'hidden' : '')}><span>{(playerStats.total_dmg / rounds.length).toFixed(0)}</span></td>
                  </motion.tr>
                  <Spacer y={0.2} key={index + 'spacer'} />
                </>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </Layout>
  );
}

export default Matchview;
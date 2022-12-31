import React from 'react';
import { useRouter } from 'next/router';
import fetch from 'node-fetch';
import MatchTypeTile from '../components/profiles/MatchTypeTile';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { Tooltip } from '@nextui-org/react';
import L from '../locales/translations/player.json';
import LocalText from '../components/translation/LocalText';
import APIi18n from '../components/translation/ValApiFormatter';
import Layout from '../components/Layout';
import { getUserAccessToken, getUserEntitlement } from '../js/dbFunctions.mjs';
import { Select } from '../components/Select';
import getDifferenceInDays from '../js/getDifferenceInDays.mjs';
import calculatePlayerStatsFromMatches from '../js/calculatePlayerStatsFromMatches.mjs';
import { calculateMatchStats } from '../js/calculateMatchStats.mjs';
import { getMatchHistory, getMatch, getPlayerMMR } from '../js/riotAPIFunctions.mjs';

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
        setErrorMessage((typeof items.message === "string" ? items.message : "Internal Server Error"));
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
      setErrorMessage((typeof items.message === "string" ? items.message : "Internal Server Error"));
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
    { orientation: "up", className: 'absolute top-[2rem] left-0 right-0 mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[3.75rem] left-px right-[33px] mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[3.75rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[3.75rem] left-[33px] right-px mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[5.5rem] left-0 right-16 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[5.5rem] left-px right-[33px] mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[5.5rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[5.5rem] left-[33px] right-px mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[5.5rem] left-16 right-0 mx-auto w-[1.9rem]' },
    
    { orientation: "up", className: 'absolute top-[7.25rem] left-0 right-24 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[7.25rem] left-0 right-16 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[7.25rem] left-px right-[33px] mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[7.25rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[7.25rem] left-[33px] right-px mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[7.25rem] left-16 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[7.25rem] left-24 right-0 mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[9rem] left-0 right-32 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-0 right-24 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-0 right-16 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-px right-[33px] mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-[33px] right-px mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-16 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[9rem] left-24 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[9rem] left-32 right-0 mx-auto w-[1.9rem]' },

    { orientation: "up", className: 'absolute top-[10.75rem] left-0 right-40 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-0 right-32 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-0 right-24 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-0 right-16 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-px right-[33px] mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-[33px] right-px mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-16 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-24 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[10.75rem] left-32 right-0 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[10.75rem] left-40 right-0 mx-auto w-[1.9rem]' },
    
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-48 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-0 right-40 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-32 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-0 right-24 mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-16 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-px right-[33px] mx-auto w-[1.9rem]' },
    { orientation: "up", className: 'absolute top-[12.5rem] left-0 right-0 mx-auto w-[1.9rem]' },
    { orientation: "down", className: 'absolute top-[12.5rem] left-[33px] right-px mx-auto w-[1.9rem]' },
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
            <span className='mx-auto'>{LocalText(L, "errors.no_matches_found")}</span>
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
                          <span className={`text-xl font-semibold ${activeQueueTab == 'competitive' ? "relative left-1.5 top-0.5" : ""} skeleton-text`}>SKELETO</span>
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
                    var { matchData } = calculateMatchStats(match, router.query.name, router.query.tag, mapData, ranks);

                    return (
                      <div id='match' className='relative flex flex-row h-20 border p-1.5 mb-2 bg-tile-color bg-opacity-10 border-tile-color rounded mr-2 cursor-default transition-all duration-100 ease-linear' key={index}>
                        <div className='w-1/3 flex flex-row'>
                          <div id='agent-img'>
                            <img className='h-full shadow-img' src={matchData.playerAgent ? `https://media.valorant-api.com/agents/${matchData.playerAgent}/displayicon.png` : ''} />
                          </div>
                          <div id='match-info' className='h-full flex flex-col justify-center ml-2'>
                            <span className={`text-xl font-semibold ${activeQueueTab == 'competitive' ? "relative left-1.5 top-0.5" : ""}`}>{matchData.mapName}</span>
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
              <span className='relative top-px'>{LocalText(L, "ui.level_text")}</span>
              <span className='relative items-center'>
                <img src={playerBorder} />
                <span className='absolute font-normal top-[3px] pt-px text-base left-0 right-0 mx-auto w-fit'>{playerInfo.account_level}</span>
              </span>
              <span className='ml-auto'>{playerInfo.region}</span>
            </span>
            <hr className='my-2' />
            <div className='w-full relative'>
              <span className='text-xl font-semibold block'>{LocalText(L, "ui.comp_data_header")}</span>
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>{LocalText(L, "ui.comp_data_subheader")}</span>
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
                <span className='text-xl font-semibold'>{LocalText(L, "ui.matches_played")}</span>
                <span className='text-xl font-semibold ml-auto'>{playerInfo.total_matches_played}</span>
              </div>
              <div className='flex flex-row items-center'>
                <span className='text-xl font-semibold'>{LocalText(L, "ui.winrate")}</span>
                <span className='text-xl font-semibold ml-auto'>{playerInfo.win_percentage}%</span>
              </div>
            </div>
            <hr className='my-2' />
            <div className='flex flex-row items-center'>
              <span className='text-xl font-semibold relative top-px'>{LocalText(L, "ui.peak_rank")}</span>
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
              <span className='text-xl font-semibold block'>{LocalText(L, "ui.stats_header")} - {LocalText(L, `matches.gamemodes.${activeQueueTab}`)}</span>
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>{LocalText(L, "ui.stats_subheader")}</span>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.avg_kd")}</span>
                <span className='text-base font-medium ml-auto'>{avgKD}</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.headshot_percentage")}</span>
                <span className='text-base font-medium ml-auto'>{headshotPercent}%</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.kills_per_match")}</span>
                <span className='text-base font-medium ml-auto'>{avgKillsPerMatch}</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.acs")}</span>
                <span className='text-base font-medium ml-auto'>{avgCS}</span>
              </div>
              <hr className='my-2' />
              <div className='flex flex-row justify-between items-center h-fit'>
                <span className='text-sm text-gray-500 mr-2'>{LocalText(L, "ui.matches_played_act")} {gameAmountInfo.actMatches}</span>
                <hr className='transform h-[20px] w-px border-l mx-2' />
                <span className='text-sm text-gray-500 text-right'>{LocalText(L, "ui.matches_played_total")} {gameAmountInfo.overallMatches}</span>
              </div>
            </div>
            <div className={`${(reloading === false) && "hidden"}`}>
              <hr className='my-2' />
              <span className='text-xl font-semibold block'>{LocalText(L, "ui.stats_header")} - {LocalText(L, `matches.gamemodes.${activeQueueTab}`)}</span>
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>{LocalText(L, "ui.stats_subheader")}</span>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.avg_kd")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>S.KE</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.headshot_percentage")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK%</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.kills_per_match")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.acs")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SKE</span>
              </div>
              <hr className='my-2' />
              <div className='flex flex-row justify-between items-center h-fit'>
                <span className='text-sm text-gray-500 mr-2'>{LocalText(L, "ui.matches_played_act")} {gameAmountInfo.actMatches}</span>
                <hr className='transform h-[20px] w-px border-l mx-2' />
                <span className='text-sm text-gray-500 text-right'>{LocalText(L, "ui.matches_played_total")} {gameAmountInfo.overallMatches}</span>
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
              <span className='relative top-px'>{LocalText(L, "ui.level_text")}</span>
              <span className={'relative items-center w-[76px]'}>
                <span className='w-4/6 skeleton-text'>SKELI</span>
              </span>
              <span className='ml-auto skeleton-text'>SK</span>
            </span>
            <hr className='my-2' />
            <div className='w-full relative'>
              <span className='text-xl font-semibold block'>{LocalText(L, "ui.comp_data_header")}</span>
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>{LocalText(L, "ui.comp_data_subheader")}</span>
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
                <span className='text-xl font-semibold'>{LocalText(L, "ui.matches_played")}</span>
                <span className='text-xl font-semibold ml-auto skeleton-text'>SK</span>
              </div>
              <div className='flex flex-row items-center'>
                <span className='text-xl font-semibold'>{LocalText(L, "ui.winrate")}</span>
                <span className='text-xl font-semibold ml-auto skeleton-text'>SK.EL%</span>
              </div>
            </div>
            <hr className='my-2' />
            <div className='flex flex-row items-center'>
              <span className='text-xl font-semibold relative top-px'>{LocalText(L, "ui.peak_rank")}</span>
              <div className='flex flex-row items-center ml-auto w-[123px] skeleton-text' />
            </div>
            <div className={`${activeQueueTab === "deathmatch" && "hidden"}`}>
              <hr className='my-2' />
              <span className='text-xl font-semibold block'>{LocalText(L, "ui.stats_header")} - {LocalText(L, `matches.gamemodes.${activeQueueTab}`)}</span>
              <span className='text-base font-normal block text-gray-500 relative bottom-1'>{LocalText(L, "ui.stats_subheader")}</span>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.avg_kd")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>S.KE</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.headshot_percentage")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK%</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.kills_per_match")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SK</span>
              </div>
              <div className='flex flex-row items-center mb-1'>
                <span className='text-base font-medium'>{LocalText(L, "ui.acs")}</span>
                <span className='text-base font-medium ml-auto skeleton-text'>SKE</span>
              </div>
              <hr className='my-2' />
              <div className='flex flex-row justify-between items-center h-fit'>
                <span className='text-sm text-gray-500 mr-2'>{LocalText(L, "ui.matches_played_act")} <span className='skeleton-text'>SKE</span></span>
                <hr className='transform h-[20px] w-px border-l mx-2' />
                <span className='text-sm text-gray-500 text-right'>{LocalText(L, "ui.matches_played_total")} <span className='skeleton-text'>SKEL</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`w-full h-full flex flex-row items-center justify-center ${error === false && "hidden"}`}>
        <div className='h-40 text-center'>
          <span className='font-bold text-2xl block'>Ooops!</span>
          <span className='text-lg'>{errorMessage}</span>
        </div>
      </div>
    </Layout>
  );
}

export default PlayerProfile;
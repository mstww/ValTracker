import React from 'react';
import Link from './NoScrollLink';
import fs from 'fs';
import AccountTile from './accountTile';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import pjson from '../../package.json';
import SocialsIcon from './navigation/SocialsIcon';
import fetch from 'node-fetch';
import { ipcRenderer } from 'electron';
import PlayerSearch from './navigation/PlayerSearch';
import L from '../locales/translations/navbar.json';
import LocalText from './translation/LocalText';

import { Home, Store, User, Star, Clipboard, Settings, ExpandArrow, RetractArrow } from './SVGs';

const account_switcher_variants = {
  open: { opacity: 1, y: 0, x: 0, scale: 1, transition: {
      duration: 0.2,
      ease: [0.6, 0.05, -0.01, 0.9]
    },
    display: "block",
  },
  closed: { opacity: 0, y: 30, x: -30, scale: 0.7, transition: {
      duration: 0.2,
      ease: [0.6, 0.05, -0.01, 0.9]
    },
    transitionEnd: {
      display: "none",
    },
  }
}

const slide_left = {
  hidden: { 
    opacity: 0, 
    x: -50, 
    y: 0,
    ease: [0.6, 0.05, -0.01, 0.9],
  },
  enter: { 
    opacity: 1, 
    x: 0, 
    y: 0,
    ease: [0.6, 0.05, -0.01, 0.9]
  },
}

export default function Navbar({ isNavbarMinimized, setIsNavbarMinimized }) {
  const router = useRouter();
  var page = router.pathname.split("/").pop();

  const [ playerName, setPlayerName ] = React.useState('');
  const [ playerTag, setPlayerTag ] = React.useState('');
  const [ playerRank, setPlayerRank ] = React.useState(null);

  const [ open, setOpen ] = React.useState(false);

  const [ isInvShown, setIsInvShown ] = React.useState(true);
  const [ isFavsShown, setIsFavsShown ] = React.useState(true);
  const [ isShopShown, setIsShopShown ] = React.useState(true);
  const [ isSearchShown, setIsSearchShown ] = React.useState(true);
  const [ isSettingsShown, setIsSettingsShown ] = React.useState(true);
  const [ isWishlistShown, setIsWishlistShown ] = React.useState(true);

  const [ invHiddenDesc, setInvHiddenDesc ] = React.useState('');
  const [ favsHiddenDesc, setFavsHiddenDesc ] = React.useState('');
  const [ shopHiddenDesc, setShopHiddenDesc ] = React.useState('');
  const [ searchHiddenDesc, setSearchHiddenDesc ] = React.useState('');
  const [ settingsHiddenDesc, setSettingsHiddenDesc ] = React.useState('');
  const [ wishlistHiddenDesc, setWishlistHiddenDesc ] = React.useState('');

  const [ historyNotifSwitch, setHistoryNotifSwitch ] = React.useState(false);
  
  const playerSearchRef = React.useRef(null);

  const navbarVariants = {
    tiles: {
      initial: {
        opacity: 1,
        y: 0, 
        x: 0
      },
      minimize: {
        opacity: 1,
        y: -150, 
        x: 0
      },
      maximize: {
        opacity: 1,
        y: 0, 
        x: 0
      }
    },
    main: {
      initial: {
        opacity: 1,
        width: "16rem"
      },
      minimize: {
        opacity: 1,
        width: "4rem",
        x: 0,
        transition: { 
          type: 'ease-out', 
          duration: 0.1
        }
      },
      maximize: {
        opacity: 1,
        width: "16rem",
        transition: { 
          type: 'ease-in', 
          duration: 0.1
        }
      }
    },
    logo: {
      initial: {
        opacity: 1,
        x: 0
      },
      minimize: {
        opacity: 1,
        y: '-180px'
      },
      maximize: {
        opacity: 1,
        x: 0
      }
    }
  }

  // Make a toggle menu using react

  React.useEffect(() => {
    var data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json')
    var data = JSON.parse(data_raw);
    setPlayerRank(data.playerRank);
    setPlayerName(data.playerName);
    setPlayerTag(data.playerTag);
    sessionStorage.setItem('navbar-rank', data.playerRank);
    sessionStorage.setItem('navbar-name', data.playerName);
    sessionStorage.setItem('navbar-tag', data.playerTag);
    
    if(router.query.searchvalue) {
      // Decode the search value
      var decoded = decodeURIComponent(router.query.searchvalue);
      playerSearchRef.current.value = decoded;
    }
  }, []);

  React.useEffect(async () => {
    var pjson = require('../../package.json');

    var featureStatus = await(await fetch('https://api.valtracker.gg/status/features/pages', {
      headers: {
        "auth": 'v' + pjson.version,
        "bearer": "test"
      }
    })).json();

    setIsInvShown(featureStatus.data.inventory_manager.enabled);
    setInvHiddenDesc(featureStatus.data.inventory_manager.desc);

    setIsFavsShown(featureStatus.data.favorite_matches.enabled);
    setFavsHiddenDesc(featureStatus.data.favorite_matches.desc);

    setIsShopShown(featureStatus.data.player_store.enabled);
    setShopHiddenDesc(featureStatus.data.player_store.desc);

    setIsSearchShown(featureStatus.data.player_search.enabled);
    setSearchHiddenDesc(featureStatus.data.player_search.desc);

    setIsSettingsShown(featureStatus.data.settings.enabled);
    setSettingsHiddenDesc(featureStatus.data.settings.desc);

    setIsWishlistShown(featureStatus.data.wishlist.enabled);
    setWishlistHiddenDesc(featureStatus.data.wishlist.desc);
  }, []);

  const children = [];

  const addAccount = (usertier, username, usertag, userregion, user_puuid, active_account) => {
    if(active_account) {
      // Insert element at first position
      children.unshift(
        <AccountTile key={user_puuid} currenttier={usertier} username={username} usertag={usertag} userregion={userregion} puuid={user_puuid} active_account={active_account} />
      );
    } else {
      children.push(
        <AccountTile key={user_puuid} currenttier={usertier} username={username} usertag={usertag} userregion={userregion} puuid={user_puuid} active_account={active_account} />
      )
    }
  }

  async function fetchUserAccounts() {
    var accounts = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts');
  
    accounts.forEach(accountFile => {
      var account_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + accountFile);
      var account_data = JSON.parse(account_data_raw);

      var active_account = false;
      if(data.playerUUID == account_data.playerUUID) {
        active_account = true;
      }

      addAccount(account_data.playerRank, account_data.playerName, account_data.playerTag, account_data.playerRegion, accountFile.split('.')[0], active_account);
    });
  }

  fetchUserAccounts();

  const toggleSwitcherMenu = () => {
    setOpen(!open);
  };

  // Show menu if open is true
  var showMenu = open ? 'block' : '';
  var switcherActive = open ? 'bg-maincolor-light border-maincolor-lightest' : '';

  var activeClasses = 'bg-button-color hover:bg-button-color-hover';
  var inactiveClasses = 'bg-maincolor-light hover:bg-maincolor-lightest cursor-pointer';
  var disabledClasses = 'bg-black bg-opacity-80 cursor-default flex flex-row mb-2 h-10 items-center pl-2 rounded transition-all duration-100 ease-linear';
  var searchDisabledClasses = 'bg-black bg-opacity-80 text-sm font-light pl-9 h-8 w-full flex items-center px-2 py-1 rounded cursor-default transition-all ease-in duration-100 outline-none';
  var navbarTileBaseClasses = ' h-10 flex items-center px-2 py-1 transition-all ease-in duration-100 mb-2 ml-px relative overflow-x-hidden ' + (isNavbarMinimized ? 'nav-min rounded-full' : 'w-5/6 rounded');
  var navbarTileTextClasses = 'text-sm font-light relative top-px ml-2 nav-txt transition-all ease-in duration-75 ml-8 ' + (isNavbarMinimized ? 'opacity-0' : 'opacity-100');

  if(page == "home") var isHome = true;
  if(page == "shop") var isShop = true;
  if(page == "inventory") var isInv = true;
  if(page == "favorites") var isFav = true;
  if(page == "wishlist") var isWish = true;

  const handlePlayerSearch = (event) => {
    if(event.key === 'Enter') {
      var name = event.target.value.split('#')[0];
      var tag = event.target.value.split('#')[1];
      var name_encoded = encodeURIComponent(name + '#' + tag);

      var search_history = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json'));

      var data = {
        "name": name,
        "tag": tag,
        "encoded_user": name_encoded
      }
      
      var user_found = false;
      for(var i = 0; i < search_history.arr.length; i++) {
        if(search_history.arr[i].encoded_user === name_encoded) {
          user_found = true;
        }
      }

      console.log(user_found);

      if(user_found === false) {
        if(search_history.arr.length >= 5) {
          delete search_history.arr[search_history.arr.length-1];
          var newArray = search_history.arr.filter(value => Object.keys(value).length !== 0);
          newArray.unshift(data);
      
          search_history.arr = newArray;
        } else {
          search_history.arr.unshift(data);
        }
      
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json', JSON.stringify(search_history));
        setHistoryNotifSwitch(!historyNotifSwitch);
      }

      router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
    }
  }

  React.useEffect(() => {
    if(isNavbarMinimized === true) {
      setOpen(false);
    }
  }, [isNavbarMinimized]);

  return (
    <motion.nav 
      id='navbar' 
      className={'z-40 fixed top-7 left-0 bg-maincolor overflow-hidden transition-all duration-100 ease-linear ' + (isNavbarMinimized === true ? 'w-16': 'w-64')}
      variants={navbarVariants.main}
      initial="initial"
      animate={isNavbarMinimized ? "minimize" : "maximize"}
    >
      <motion.div 
        id='logo' 
        className='flex flex-col justify-center items-center transition-all duration-100 ease-linear transform w-36 mx-auto'
      >
        <motion.img 
          src='/icons/VALTracker_Logo_default.png' 
          className={'w-36 h-26 mx-auto transition-all duration-100 ease-linear ' + (isNavbarMinimized ? 'opacity-0' : 'opacity-100')}
          variants={navbarVariants.logo}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0 : 0.92, ease: "easeOut", duration: isNavbarMinimized ? 0.01 : 0.4 }}
        />
        <motion.h1 
          className={'text-2xl relative bottom-2 transition-all duration-75 ease-linear ' + (isNavbarMinimized ? 'opacity-0' : 'opacity-100')}
          variants={navbarVariants.logo}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0 : 0.86, ease: "easeOut", duration: isNavbarMinimized ? 0.01 : 0.4 }}
        >
          VALTracker
          </motion.h1>
        <motion.span 
          className={'relative text-sm text-gray-500 transition-all duration-75 ease-linear bottom-3 ' + (isNavbarMinimized ? 'opacity-0' : 'opacity-100')}
          variants={navbarVariants.logo}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0 : 0.8, ease: "easeOut", duration: isNavbarMinimized ? 0.01 : 0.4 }}
        >
          v{pjson.version}
        </motion.span>
      </motion.div>
      {
        isNavbarMinimized === true ? 
        <motion.div
          variants={navbarVariants.tiles}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: 0.15, duration: 0.2, ease: "easeOut" }}
        >
          <ExpandArrow 
            cls={'w-7 hover:bg-maincolor-lightest cursor-pointer transition-all duration-100 ease-linear p-1 rounded relative mx-auto bottom-3'} 
            click={() => { setIsNavbarMinimized(false) }}
          />
        </motion.div>
        :
        <motion.div
          variants={navbarVariants.tiles}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: 0.55, duration: 0.2, ease: "easeIn" }}
        >
          <RetractArrow 
            cls={'w-7 hover:bg-maincolor-lightest cursor-pointer transition-all duration-100 ease-linear p-1 rounded relative mx-auto bottom-3'} 
            click={() => { setIsNavbarMinimized(true) }}
          />
        </motion.div>
      }
      <div id='nav-items' className='flex flex-col justify-center items-center'>
        <PlayerSearch 
          isNavbarMinimized={isNavbarMinimized}
          isSearchShown={isSearchShown} 
          searchDisabledClasses={searchDisabledClasses} 
          handlePlayerSearch={handlePlayerSearch}
          playerSearchRef={playerSearchRef} 
          searchHiddenDesc={searchHiddenDesc}
          placeholderText={LocalText(L, 'search_placeholder')}
          closeLocale={LocalText(L, 'history_close')}
          variants={navbarVariants.tiles}
          historyNotifSwitch={historyNotifSwitch}
        />

    	  <Link href={"/home"}>
          <motion.div 
            id='home-nav' 
            className={(isHome ? activeClasses : inactiveClasses) + navbarTileBaseClasses}
            data-isactive={isHome}
            variants={navbarVariants.tiles}
            initial="initial"
            animate={isNavbarMinimized ? "minimize" : "maximize"}
            transition={{ delay: isNavbarMinimized ? 0.25 : 0.35, duration: 0.2, ease: "easeOut" }}
          >
            <Home cls='ml-0.5 w-5 absolute' />
            <span className={navbarTileTextClasses}>{LocalText(L, 'home')}</span>
          </motion.div>
        </Link>

        <motion.div 
          id='shop-nav' 
          className={isShopShown ? ((isShop ? activeClasses : inactiveClasses) + navbarTileBaseClasses) : disabledClasses}
          data-isactive={isShop}
          onClick={() => { isShopShown ? router.push("/shop?lang=" + router.query.lang) : ipcRenderer.send('relayTextbox', shopHiddenDesc) }}
          variants={navbarVariants.tiles}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0.3 : 0.3, duration: 0.2, ease: "easeOut" }}
        >
          <Store cls='ml-0.5 w-5 absolute' />
          <span className={navbarTileTextClasses}>{LocalText(L, 'shop')}</span>
        </motion.div>

        <motion.div 
          id='inv-nav' 
          className={isInvShown ? ((isInv ? activeClasses : inactiveClasses) + navbarTileBaseClasses) : disabledClasses}
          data-isactive={isInv}
          onClick={() => { isInvShown ? router.push("/inventory?lang=" + router.query.lang) : ipcRenderer.send('relayTextbox', invHiddenDesc) }}
          variants={navbarVariants.tiles}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0.35 : 0.25, duration: 0.2, ease: "easeOut" }}
        >
          <User cls='ml-0.5 w-5 absolute' />
          <span className={navbarTileTextClasses}>{LocalText(L, 'inventory')}</span>
        </motion.div>

        <motion.div 
          id='fav-nav' 
          className={isFavsShown ? ((isFav ? activeClasses : inactiveClasses) + navbarTileBaseClasses) : disabledClasses}
          data-isactive={isFav}
          onClick={() => { isFavsShown ? router.push("/favorites?lang=" + router.query.lang) : ipcRenderer.send('relayTextbox', favsHiddenDesc) }}
          variants={navbarVariants.tiles}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0.4 : 0.2, duration: 0.2, ease: "easeOut" }}
        >
          <Star cls='ml-0.5 w-5 absolute' />
          <span className={navbarTileTextClasses}>{LocalText(L, 'fav_matches')}</span>
        </motion.div>

        <motion.div 
          id='wish-nav' 
          className={isWishlistShown ? ((isWish ? activeClasses : inactiveClasses) + navbarTileBaseClasses) : disabledClasses}
          data-isactive={isWish}
          onClick={() => { isWishlistShown ? router.push("/wishlist?lang=" + router.query.lang) : ipcRenderer.send('relayTextbox', wishlistHiddenDesc) }}
          variants={navbarVariants.tiles}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0.45 : 0.15, duration: 0.2, ease: "easeOut" }}
        >
          <Clipboard cls='ml-0.5 w-5 absolute' />
          <span className={navbarTileTextClasses}>{LocalText(L, 'wishlist')}</span>
        </motion.div>
      </div>
      <div className={'absolute bottom-16 w-full flex justify-around transform transition-all duration-100 ease-linear ' + (isNavbarMinimized ? '-translate-x-40 opacity-0' : 'translate-x-0 opacity-100')}>
        <SocialsIcon icon={'/images/coffee.svg'} tooltip={'Ko-Fi'} href={'https://ko-fi.com/valtrackergg'} />
        <SocialsIcon icon={'/images/discord.svg'} tooltip={'Discord'} href={'https://discord.gg/aJfQ4yHysG'} />
        <SocialsIcon icon={'/images/twitter.svg'} tooltip={'Twitter'} href={'https://twitter.com/valtracker_gg'} />
        <SocialsIcon icon={'/images/github.svg'} tooltip={'GitHub'} href={'https://github.com/orgs/valtracker'} />
      </div>
      <div id="nav-bottom" className='absolute bottom-0 left-0 w-full h-16 p-2 flex flex-row'>
        <motion.div 
          id='acc-switcher-popup' 
          className={'h-auto max-h-64 w-60 absolute left-0 bottom-16 ml-2 rounded bg-maincolor-light overflow-auto shadow-lg ' + showMenu}
          variants={account_switcher_variants}
          initial='closed'
          animate={open ? 'open' : 'closed'}
          transition={{ duration: 0.2 }}
        >
          <motion.ul 
            className='h-auto w-full p-2 pb-0'
            variants={slide_left}
            initial='closed'
            animate={open ? 'enter' : 'hidden'}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            { children }
          </motion.ul>
        </motion.div>
        <div 
          id="acc-switcher-tile" 
          className={'relative bg-maincolor hover:bg-maincolor-light w-3/4 h-full cursor-pointer transition-all ease-in duration-100 rounded overflow-hidden text-ellipsis transform ' + switcherActive + (isNavbarMinimized ? ' -translate-x-40 opacity-0' : '  translate-x-0 opacity-100')}
          onClick={toggleSwitcherMenu}
        >
          <div className='flex flex-row items-center content-center h-full justify-start'>
            <img 
              src={playerRank != '' ? playerRank : '/images/empty_rank.png'}
              width={40}
              height={20}
              className='h-5/6 p-1 mr-2 ml-1 rounded-full border border-gray-500'
              id='navbar-account-rank shadow-img'
            /> 
            <div className='flex flex-col justify-center absolute left-12 pl-px'>
              <span id="navbar-player-name" className='m-0 leading-none mb-px'>{playerName}</span>
              <span id="navbar-player-tag" className='text-gray-500 font-light leading-none'>#{playerTag}</span>
            </div>
          </div>
        </div>
        <div id="settings-icon" className={'h-full w-1/4 justify-center flex items-center ' + (isSettingsShown ? '' : 'hidden')}>
          <Link href={'/settings'}>
            <div 
              className={
                'group transform transition-all ease-in duration-100 rounded-full p-1.5 hover:bg-maincolor-light '
                +
                (page == 'settings' ? 'border-2 border-gradient-left bg-maincolor-light hover:rotate-0 cursor-default' : 'cursor-pointer hover:rotate-90')
                +
                (isNavbarMinimized ? ' -translate-x-4 mr-1' : '  translate-x-0 mr-0')
              }
            > 
              <Settings cls='w-6' />
            </div>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
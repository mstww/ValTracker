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
import PlayerSearch from './navbar/PlayerSearch';

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

export default function Navbar({ page }) {
  const router = useRouter();

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
  
  const playerSearchRef = React.useRef(null);

  // Make a toggle menu using react
  var data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json')
  var data = JSON.parse(data_raw);

  React.useEffect(() => {
    if(sessionStorage.getItem('navbar-rank') && sessionStorage.getItem('navbar-name') && sessionStorage.getItem('navbar-tag')) {
      setPlayerRank(sessionStorage.getItem('navbar-rank'));
      setPlayerName(sessionStorage.getItem('navbar-name'));
      setPlayerTag(sessionStorage.getItem('navbar-tag'));
    } else {
      setPlayerRank(data.playerRank);
      setPlayerName(data.playerName);
      setPlayerTag(data.playerTag);
      sessionStorage.setItem('navbar-rank', data.playerRank);
      sessionStorage.setItem('navbar-name', data.playerName);
      sessionStorage.setItem('navbar-tag', data.playerTag);
    }
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
  var disabledClasses = 'bg-black bg-opacity-80 cursor-default flex flex-row mb-2 h-10 items-center pl-2 rounded-sm transition-all duration-100 ease-linear';
  var searchDisabledClasses = 'bg-black bg-opacity-80 text-sm font-light pl-9 placeholder:text-white h-8 w-full flex items-center px-2 py-1 rounded-sm cursor-default transition-all ease-in duration-100 outline-none';

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
      }

      router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}`);
    }
  }

  return (
    <nav id='navbar' className='z-40 relative top-7 left-0 w-64 bg-maincolor'>
      <div id='logo' className='flex flex-col justify-center items-center'>
        <img src='/icons/VALTracker_Logo_default.png' className='h-36'/>
        <h1 className='text-2xl relative bottom-2'>VALTracker</h1>
        <span className='relative text-sm bottom-3 text-gray-500'>v{pjson.version}</span>
      </div>
      <div id='nav-items' className='flex flex-col justify-center items-center'>
        <PlayerSearch 
          isSearchShown={isSearchShown} 
          searchDisabledClasses={searchDisabledClasses} 
          handlePlayerSearch={handlePlayerSearch}
          playerSearchRef={playerSearchRef} 
          searchHiddenDesc={searchHiddenDesc} 
        />

    	  <Link href={"/home"}>
          <div id='home-nav' 
            className={(isHome ? activeClasses : inactiveClasses) + ' h-10 w-5/6 flex items-center px-2 py-1 rounded-sm transition-all ease-in duration-100 mb-2 ml-px'}
            data-isactive={isHome}
          >
            <img src='/images/home.svg' className='ml-0.5 w-5' />
            <span className='text-sm font-light relative top-px ml-2'> Home</span>
          </div>
        </Link>

        <div id='shop-nav' 
          className={isShopShown ? ((isShop ? activeClasses : inactiveClasses) + ' h-10 w-5/6 flex items-center px-2 py-1 rounded-sm transition-all ease-in duration-100 mb-2 ml-px') : disabledClasses}
          data-isactive={isShop}
          onClick={() => { isShopShown ? router.push("/shop") : ipcRenderer.send('relayTextbox', shopHiddenDesc) }}
        >
          <img src='/images/store.svg' className='ml-0.5 w-5' />
          <span className='text-sm font-light relative top-px ml-2'> Shop</span>
        </div>

        <div id='inv-nav' 
          className={isInvShown ? ((isInv ? activeClasses : inactiveClasses) + ' h-10 w-5/6 flex items-center px-2 py-1 rounded-sm transition-all ease-in duration-100 mb-2 ml-px ') : disabledClasses}
          data-isactive={isInv}
          onClick={() => { isInvShown ? router.push("/inventory") : ipcRenderer.send('relayTextbox', invHiddenDesc) }}
        >
          <img src='/images/user.svg' className='ml-0.5 w-5' />
          <span className='text-sm font-light relative top-px ml-2'> Inventory</span>
        </div>

        <div id='fav-nav' 
          className={isFavsShown ? ((isFav ? activeClasses : inactiveClasses) + ' h-10 w-5/6 flex items-center px-2 py-1 rounded-sm transition-all ease-in duration-100 mb-2 ml-px ') : disabledClasses}
          data-isactive={isFav}
          onClick={() => { isFavsShown ? router.push("/favorites") : ipcRenderer.send('relayTextbox', favsHiddenDesc) }}
        >
          <img src='/images/star_white.svg' className='ml-0.5 w-5' />
          <span className='text-sm font-light relative top-px ml-2'> Favorite Matches</span>
        </div>

        <div id='fav-nav' 
          className={isWishlistShown ? ((isWish ? activeClasses : inactiveClasses) + ' h-10 w-5/6 flex items-center px-2 py-1 rounded-sm transition-all ease-in duration-100 mb-2 ml-px ') : disabledClasses}
          data-isactive={isWish}
          onClick={() => { isWishlistShown ? router.push("/wishlist") : ipcRenderer.send('relayTextbox', wishlistHiddenDesc) }}
        >
          <img src='/images/clipboard.svg' className='ml-0.5 w-5' />
          <span className='text-sm font-light relative top-px ml-2'> Your Wishlist</span>
        </div>
      </div>
      <div className='absolute bottom-16 w-full flex justify-around'>
        <SocialsIcon icon={'/images/coffee.svg'} tooltip={'Ko-Fi'} href={'https://ko-fi.com/valtrackergg'} />
        <SocialsIcon icon={'/images/discord.svg'} tooltip={'Discord'} href={'https://discord.gg/aJfQ4yHysG'} />
        <SocialsIcon icon={'/images/twitter.svg'} tooltip={'Twitter'} href={'https://twitter.com/valtracker_gg'} />
        <SocialsIcon icon={'/images/github.svg'} tooltip={'GitHub'} href={'https://github.com/orgs/valtracker'} />
      </div>
      <div id="nav-bottom" className='absolute bottom-0 left-0 w-full h-16 p-2 flex flex-row'>
        <motion.div 
          id='acc-switcher-popup' 
          className={'h-auto max-h-64 w-60 absolute left-0 bottom-16 ml-2 rounded-sm bg-maincolor-light overflow-auto shadow-lg ' + showMenu}
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
          className={'relative bg-maincolor hover:bg-maincolor-light w-3/4 h-full cursor-pointer transition-all ease-in duration-100 rounded-sm overflow-hidden text-ellipsis ' + switcherActive}
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
              }
            > 
              <img src='/images/settings.svg' className='w-6' />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  )
}
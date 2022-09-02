import React from 'react';
import Layout from '../components/Layout';
import { ipcRenderer } from 'electron';
import { motion } from "framer-motion"
import StoreItem from '../components/StoreItem';
import moment from 'moment';
import fetch from 'node-fetch';
import fetchShop from '../js/fetchShop';
import { useRouter } from 'next/router';
import { Collapse } from '@nextui-org/react';
import fs from 'fs';

const slide_right = {
  hidden: { opacity: 0, x: 100, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0 },
}

const pop_in = {
  hidden: { opacity: 0, x: 0, y: -100, scale: 0.8 },
  enter: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 0 },
}

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

async function getWallet(region, puuid, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch('https://pd.' + region + '.a.pvp.net/store/v1/wallet/' + puuid, {
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

function bundleTimeToHMS(n) {
  n = Number(n);
  var d = Math.floor(n / 86400);
  var h = Math.floor((n - d * 86400) / 3600);
  var m = Math.floor(n % 3600 / 60);
  var s = Math.floor(n % 3600 % 60);

  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  var str = dDisplay + hDisplay + mDisplay + sDisplay;

  if(str.split(",").pop() === ' ') {
    str = str.substring(0, str.lastIndexOf(','));
  }

  return str;
}

function singleSkinsToHMS(n) {
  n = Number(n);
  var h = Math.floor(n / 3600);
  var m = Math.floor(n % 3600 / 60);
  var s = Math.floor(n % 3600 % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  var str = hDisplay + mDisplay + sDisplay;

  if(str.split(",").pop() === ' ') {
    str = str.substring(0, str.lastIndexOf(','));
  }

  return str;
}

function Shop() {
  const router = useRouter();
  var timerInterval;

  const [ playerStore, setPlayerStore ] = React.useState();

  const [ nightMarketShown, setNightMarketShown ] = React.useState(false);
  const [ nightMarketTimer, setNightMarketTimer ] = React.useState('');
  const [ nightMarketEnd, setNightMarketEnd ] = React.useState('');

  const [ bundleHeader, setBundleHeader ] = React.useState('Featured Bundle');
  const [ bundleImage, setBundleImage ] = React.useState('');
  const [ bundlePrice, setBundlePrice ] = React.useState('----');
  const [ bundleTimer, setBundleTimer ] = React.useState('Fetching data...');

  const [ dailyTimer, setDailyTimer ] = React.useState('Fetching data...');
  
  const [ itemInfo1, setItemInfo1 ] = React.useState('');
  const [ itemInfo2, setItemInfo2 ] = React.useState('');
  const [ itemInfo3, setItemInfo3 ] = React.useState('');
  const [ itemInfo4, setItemInfo4 ] = React.useState('');

  const [ walletVP, setWalletVP ] = React.useState('');
  const [ walletRP, setWalletRP ] = React.useState('');

  const [ showBackground, setShowBackground ] = React.useState(false);
  const [ showCard, setShowCard ] = React.useState(false);

  const [ cardSkinUUID, setCardSkinUUID ] = React.useState('');
  const [ cardSkinName, setCardSkinName ] = React.useState('');
  const [ cardSkinImage, setCardSkinImage ] = React.useState('');
  const [ cardSkinPrice, setCardSkinPrice ] = React.useState('');
  const [ cardSkinTier, setCardSkinTier ] = React.useState('');
  const [ cardSkinChromas, setCardSkinChromas ] = React.useState([]);
  const [ cardSkinLevels, setCardSkinLevels ] = React.useState([]);

  const [ activeCardSkinChroma, setActiveCardSkinChroma ] = React.useState(0);
  const [ activeCardSkinLevel, setActiveCardSkinLevel ] = React.useState(0);

  const [ shopSkins, setShopSkins ] = React.useState({'0': {}, '1': {}, '2': {}, '3': {}});
  const [ skinList, setSkinList ] = React.useState([]);

  const [ wishlistedItems, setWishlistedItems ] = React.useState([]);
  const [ userData, setUserData ] = React.useState({});

  React.useEffect(() => {
    var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));
    var user_wishlist = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + user_data.playerUUID + '.json'));

    setUserData(user_data);
    setWishlistedItems(user_wishlist.skins);
  }, []);

  React.useEffect(async () => {
    // Set Discord Activity
    ipcRenderer.send('changeDiscordRP', "shop_activity");

    // Fetch shop
    const raw_skins = await fetch('https://valorant-api.com/v1/weapons/skins');
    const skins = await raw_skins.json();
    setSkinList(skins.data);

    const raw = await fetchShop();
    const data = raw[0];
    setPlayerStore(data);

    if(data.nightMarket) {
      setNightMarketShown(true);
    }

    // Set Shop data
    data.singleSkins.forEach((skin, index) => {
      const skinObj = {
        name: skin.skinName,
        image: skin.skinIcon,
        price: skin.skinPrice,
        uuid: skin.skinUUID,
        skinTierImage: skin.skinTierImage,
      }

      if(index == 0) {
        setItemInfo1(skinObj);
      } else if(index == 1) {
        setItemInfo2(skinObj);
      } else if(index == 2) {
        setItemInfo3(skinObj);
      } else if(index == 3) {
        setItemInfo4(skinObj);
      }
    });

    setBundleHeader("Featured Bundle - " + data.featuredBundle.bundleName);
    setBundleImage(data.featuredBundle.bundleIcon);
    setBundlePrice(data.featuredBundle.bundlePrice);

    var user_creds = raw[1];
    var tokenData = raw[2];

    // Start Timer
    var bundleTimer = Math.abs(moment().diff(data.featuredBundle.expiresIn, 'seconds'));
    var singleSkinTimer = Math.abs(moment().diff(data.singleSkins[0].expiresIn, 'seconds'));

    var initialBundle = bundleTimeToHMS(bundleTimer) + " remaining";
    var initialSkins = singleSkinsToHMS(singleSkinTimer) + " remaining";

    setBundleTimer(initialBundle);
    setDailyTimer(initialSkins);

    if(data.nightMarket) {
      var nmTimer = Math.abs(moment().diff(data.nightMarket.nightMarketExpiresIn, 'seconds'));
      nmTimer = nmTimer-1;
      var initialNM = bundleTimeToHMS(nmTimer) + " remaining";

      setNightMarketTimer(initialNM);
      setNightMarketEnd(data.nightMarket.nightMarketExpiresIn);
    }

    timerInterval = setInterval(function() {
      bundleTimer--;
      singleSkinTimer--;

      if(data.nightMarket) {
        nmTimer--;
      }

      if(bundleTimer <= 0 || singleSkinTimer <= 0) {
        router.reload();
      }

      if(data.nightMarket && nmTimer <= 0) {
        router.reload();
      }

      var bundleText = bundleTimeToHMS(bundleTimer) + " remaining";
      var singleSkinText = singleSkinsToHMS(singleSkinTimer) + " remaining";

      setBundleTimer(bundleText);
      setDailyTimer(singleSkinText);

      if(data.nightMarket) {
        var nmText = bundleTimeToHMS(nmTimer) + " remaining";
        setNightMarketTimer(nmText);
      }
    }, 1000);

    // Fetch Wallet
    var region = user_creds.playerRegion;
    var puuid = user_creds.playerUUID;
    var bearer = tokenData.accessToken;

    try {
      var entitlement_token = await getEntitlement(bearer);
      var wallet = await getWallet(region, puuid, entitlement_token, bearer);
  
      var VP = wallet.Balances['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'];
      var RP = wallet.Balances['e59aa87c-4cbf-517a-5983-6e81511be9b7'];
  
      setWalletRP(RP);
      setWalletVP(VP);
    } catch(err) {
      console.log(err)
    }
    return () => {
      clearInterval(timerInterval);
    }
  }, []);

  React.useEffect(() => {
    const exitingFunction = () => {
      clearInterval(timerInterval);
    };

    router.events.on('routeChangeStart', exitingFunction);

    return () => {
      router.events.off('routeChangeStart', exitingFunction);
    };
  }, []);
  
  const switchToNM = () => {
    var raw = JSON.stringify(playerStore);
    router.push('/nightmarket?store=' + raw + '&nm_end=' + nightMarketEnd);
  }

  const showShopSkin = (uuid, name, price, image, tierimage, index) => {
    setActiveCardSkinChroma(0);
    setActiveCardSkinLevel(0);
    
    setCardSkinUUID(uuid);
    setCardSkinName(name);
    setCardSkinImage(image);
    setCardSkinPrice(price);
    setCardSkinTier(tierimage);

    for(var i = 0; i < skinList.length; i++) {
      if(skinList[i].levels[0].uuid == uuid) {
        var skin = skinList[i];
        setShopSkins({...shopSkins, [index]: skin});
      }
    }

    if(skin) {
      setCardSkinChromas(skin.chromas);
      setCardSkinLevels(skin.levels.reverse());
  
      setShowBackground(true);
      setShowCard(true);
    } if(!skin) {
      if(shopSkins[index]) {
        setCardSkinChromas(shopSkins[index].chromas);
        setCardSkinLevels(shopSkins[index].levels);
  
        setShowBackground(true);
        setShowCard(true);
      }
    }
  }

  const switchCardChroma = (image, number) => {
    if(number == 0) setActiveCardSkinLevel(0);
    setActiveCardSkinChroma(number);
    setCardSkinImage(image);
  }

  const switchCardLevel = (image, number) => {
    setActiveCardSkinChroma(0);
    setActiveCardSkinLevel(number);
    setCardSkinImage(image);
  }

  return (
    <Layout classNames={'overflow-y-hidden'}>
      <motion.div 
        className='absolute bottom-0 left-0 w-full h-full flex items-center justify-center z-30 bg-black bg-opacity-80 pointer-events-none'
        variants={backdrop_variants}
        initial="hidden"
        animate={showBackground ? 'enter' : 'exit'}
        transition={{ type: 'ease-in', duration: 0.2 }}
      >
        <motion.div 
          className='2xl:w-4/6 2xl:h-4/6 w-4/5 h-4/5 rounded-sm bg-maincolor mb-8 flex flex-col justify-between p-4 pointer-events-auto shadow-lg relative'
          variants={card_variants}
          initial="hidden"
          animate={showCard ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.2 }}
        > 
          <div 
            className='z-20 absolute top-4 right-4 hover:bg-maincolor-lightest rounded-sm cursor-pointer transition-all duration-100 ease-linear'
            onClick={() => {
              setShowBackground(false);
              setShowCard(false);

              setCardSkinUUID('');
              setCardSkinName('');
              setCardSkinImage('');
              setCardSkinPrice('');
              setCardSkinTier('');

              setCardSkinChromas([]);
              setCardSkinLevels([]);

              setActiveCardSkinChroma(0);
              setActiveCardSkinLevel(0);
            }}
          >
            <img src='/images/close.svg' className='w-8 p-1' />
          </div>
          <div 
            className='text-2xl text-gray-300 flex flex-row items-center absolute bottom-4 right-4 bg-opacity-60 bg-black rounded-sm px-4 py-2'
          >
            <span className='relative top-px'>{cardSkinPrice}</span>
            <img src="/images/vp_icon.png" className='w-8 ml-2 transition-opacity duration-100 ease-in' />
          </div>
          <h1 className='z-20 text-2xl flex flex-row items-center'><img src={cardSkinTier} className='w-9 mr-2 shadow-img' /> { cardSkinName }</h1>
          <div id='skin-image' className='z-10 bottom-0 left-0 absolute w-full h-full flex justify-center items-center'>
            <img src={ cardSkinImage } className='shadow-img' />
          </div>
          <div id='levels-chromas' className='absolute bottom-16 left-4 w-64 text-white z-20'>
            <div id='chromas' className='flex flex-row justify-between mb-4'>
              { 
              cardSkinChromas.length > 1 ? 
              cardSkinChromas.map((chroma, index) => {
                return (
                  <img 
                    key={index}
                    className={
                      'w-1/5 chroma-swatch border-2 shadow-lg cursor-pointer relative rounded-sm '
                      + (activeCardSkinChroma == index ? 'border-button-color' : 'border-maincolor')
                    }
                    src={chroma.swatch}
                    onClick={() => { 
                      switchCardChroma(chroma.displayIcon ? chroma.displayIcon : chroma.fullRender, index);
                    }}
                  />
                )
              }) : '' }
            </div>
            { cardSkinLevels.length > 1 ?
              <Collapse id='levels-collapse' title={'Levels'}>
                <div id='levels'>
                  { cardSkinLevels.map((level, index) => {
                    return(
                      <div 
                        id='level' 
                        className={
                          "relative chroma-swatch w-full h-14 border-2 bg-maincolor-lightest shadow-lg mb-2 flex flex-col p-px cursor-pointer hover:bg-opacity-70 rounded-sm pl-1 transition-all duration-100 ease-linear "
                          + (activeCardSkinLevel == index ? 'border-button-color' : 'border-maincolor')
                        }
                        key={index}
                        onClick={() => {
                          var icon = level.displayIcon;
                          if(icon == null) {
                            var icon = cardSkinLevels[cardSkinLevels.length-1].displayIcon;
                          } 
                          switchCardLevel(icon, index);
                        }}
                      >
                        <span className="text-lg">Level { cardSkinLevels.length - index }</span>
                        <span className="text-base font-thin">
                          {
                            level.levelItem ?
                              level.levelItem.split('::').pop()
                            :
                              ''
                          }
                        </span>
                      </div>
                    )
                  }) }
                </div>
              </Collapse>
              : ''
            }
          </div>
        </motion.div>
      </motion.div>
      <div 
        id='shop-wrapper' 
        className='p-4 h-full'
      >
        <div className='flex flex-row'>
          <div id='featured-bundle' className='w-3/4'>
            <h1 className='text-2xl' id='bundle-header'>{bundleHeader}</h1>
            <span id='bundle-timer' className='text-gray-500'>{bundleTimer}</span>
            <motion.div 
              id='bundle-img-wrapper' 
              className='w-full relative rounded-sm'
              variants={pop_in}
              initial='hidden'
              animate='enter'
              exit='exit'
              transition={{ type: 'ease-in', duration: 0.3 }}
            >
              <img 
                id='bundle-img' 
                src={bundleImage != '' ? bundleImage : '/images/bundle_invisible.png'}
                className='rounded shadow-2xl' 
                alt='Cover Image of the Current Bundle' 
              />
              <div 
                id='bundle-price'
                className='text-2xl text-gray-300 flex flex-row items-center absolute bottom-4 right-4 bg-opacity-60 bg-black rounded-sm px-4 py-2'
              >
                <span className='relative top-px'>{bundlePrice}</span>
                <img src="/images/vp_icon.png" className='w-8 ml-2 transition-opacity duration-100 ease-in' />
              </div>
            </motion.div>
          </div>
          <motion.div 
            id='right-bar' 
            className='mt-14 w-1/4 ml-4 p-4 pt-px'
            variants={slide_right}
            initial="hidden"
            animate="enter"
            exit="exit"
            transition={{ type: 'ease-in', duration: 0.3 }}
          >
            <div 
              id='wallet'
              className='bg-opacity-60 bg-black p-4 flex flex-col rounded-sm shadow-lg mb-4'
            >
              <h1 className='text-2xl mb-2'>Your Wallet</h1>
              <span className='flex flex-row text-center items-center mb-2'>
                <img src="/images/vp_icon.png" className='w-8 mr-2' /> 
                <span id="wallet-vp">{walletVP}</span>
              </span>
              <span className='flex flex-row text-center items-center'>
                <img src="/images/radianite_icon.png" className='w-8 mr-2' />
                <span id="wallet-rp">{walletRP}</span>
              </span>
            </div>
            <div
              onClick={() => { switchToNM() }}
              id='night-market'
              className={
                'bg-opacity-60 bg-black p-4 py-8 flex-col rounded-sm shadow-lg justify-center items-center hover:shadow-2xl hover:bg-opacity-40 transition-all duration-100 ease-in cursor-pointer ' 
                + 
                (nightMarketShown ? 'flex' : 'hidden')
              }
            >
              <h1 className='text-2xl mb-2'>Night Market</h1>
              <span id='nm-timer' className='flex flex-row text-center items-center mb-2 text-gray-500'>{nightMarketTimer}</span>
            </div>
          </motion.div>
        </div>
        <div id='daily-shop' className='mt-4'>
          <h1 className='text-2xl'>Daily Store</h1>
          <span id='single-skin-timer' className='text-gray-500'>{dailyTimer}</span>
          <div 
            id='single-items-wrapper' 
            className='max-w-7xl h-52 mr-4 mt-2 flex flex-row'
          >
            <StoreItem 
              delay={0} 
              item={itemInfo1} 
              clickHandler={showShopSkin} 
              index={0} 
              shownOverlayUUID={cardSkinUUID} 
              setWishlistedItems={setWishlistedItems} 
              wishlistedItems={wishlistedItems} 
              userData={userData} 
            />
            <StoreItem 
              delay={0.05} 
              item={itemInfo2} 
              clickHandler={showShopSkin} 
              index={1} 
              shownOverlayUUID={cardSkinUUID} 
              setWishlistedItems={setWishlistedItems} 
              wishlistedItems={wishlistedItems} 
              userData={userData} 
            />
            <StoreItem 
              delay={0.1} 
              item={itemInfo3} 
              clickHandler={showShopSkin} 
              index={2} 
              shownOverlayUUID={cardSkinUUID} 
              setWishlistedItems={setWishlistedItems} 
              wishlistedItems={wishlistedItems} 
              userData={userData} 
            />
            <StoreItem 
              delay={0.15} 
              item={itemInfo4} 
              clickHandler={showShopSkin} 
              index={3} 
              shownOverlayUUID={cardSkinUUID} 
              setWishlistedItems={setWishlistedItems} 
              wishlistedItems={wishlistedItems} 
              userData={userData} 
            />
          </div>
        </div>
      </div> 
    </Layout>
  );
}

export default Shop;
import fetch from 'node-fetch';
import fs from 'fs';
import APIi18n from '../components/translation/ValApiFormatter';

async function getStoreOffers(region, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch('https://pd.' + region + '.a.pvp.net/store/v1/offers/', {
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

async function getShopData(region, puuid, entitlement_token, bearer) {
  if(region === 'latam' || region === 'br') region = 'na';
  return (await (await fetch('https://pd.' + region + '.a.pvp.net/store/v2/storefront/' + puuid, {
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

Date.prototype.addSeconds = function (seconds) {
  var copiedDate = new Date(this.getTime());
  return new Date(copiedDate.getTime() + seconds * 1000);
}

export async function calculateDailyStore(puuid, shopData) {
  try {
    var on_load = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));
    var user_creds = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));
    var entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;
    var token_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json'));
    var bearer = token_data.accessToken;
  
    var bundleUUID = shopData.FeaturedBundle.Bundle.DataAssetID;
  
    var data = {};
    data.singleSkins = [];
  
    var singleSkinsTime = shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds + 10;
    var now = new Date();
    var singleSkinsExpirationDate = now.setSeconds(now.getSeconds() + singleSkinsTime);
  
    var bundleTime = shopData.FeaturedBundle.Bundle.DurationRemainingInSeconds + 10;
    var now = new Date();
    var bundleExpirationDate = now.setSeconds(now.getSeconds() + bundleTime);
  
    if(shopData.BonusStore !== undefined) {
      var nightMarketTime = shopData.BonusStore.BonusStoreRemainingDurationInSeconds + 10;
      var now = new Date();
      var nightMarketExpirationDate = now.setSeconds(now.getSeconds() + nightMarketTime);
  
      shopData.nightMarketExpiresIn = nightMarketExpirationDate;
    }
  
    var singleSkinsExpireIn = singleSkinsExpirationDate;
    var bundleExpiresIn = bundleExpirationDate;
  
    if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid)) {
      fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid);
    }
  
    // Calculate Bundle Price
    var bundlePrice = 0;
    for(var i = 0; i < shopData.FeaturedBundle.Bundles[0].Items.length; i++) {
      bundlePrice = bundlePrice + parseInt(shopData.FeaturedBundle.Bundles[0].Items[i].DiscountedPrice);
    }
  
    var skinPriceData = await getStoreOffers(user_creds.playerRegion, entitlement_token, bearer);
    var skinTiers = await (await fetch(`https://valorant-api.com/v1/contenttiers`)).json();
  
    var allSkins = await (await fetch(`https://valorant-api.com/v1/weapons/skins?language=${APIi18n(on_load.appLang)}`)).json();
  
    for(var i = 0; i < shopData.SkinsPanelLayout.SingleItemOffers.length; i++) {
      var skinUUID = shopData.SkinsPanelLayout.SingleItemOffers[i];
  
      for(var j = 0; j < allSkins.data.length; j++) {
        if(skinUUID === allSkins.data[j].levels[0].uuid) {
          var skinName = allSkins.data[j].displayName;
  
          if(allSkins.data[j].displayIcon !== null) var skinIcon = allSkins.data[j].displayIcon;
          else var skinIcon = allSkins.data[j].levels[0].displayIcon;
          
          var tierUUID = allSkins.data[j].contentTierUuid;
          var isMelee = (allSkins.data[j].assetPath.split("/")[3] === 'Melee')
        }
      }
  
      for(var n = 0; n < skinPriceData.Offers.length; n++) {
        if(skinPriceData.Offers[n].Rewards[0].ItemID == skinUUID) {
          var skinPrice = skinPriceData.Offers[n].Cost[Object.keys(skinPriceData.Offers[n].Cost)[0]];
        }
      }
      
      for(var j = 0; j < skinTiers.data.length; j++) {
        if(tierUUID === skinTiers.data[j].uuid && skinTiers.data[j].displayIcon !== null) {
          var skinTierImage = skinTiers.data[j].displayIcon;
        }
      }
  
      var obj = {
        skinUUID,
        skinName,
        skinIcon,
        skinPrice,
        skinTierImage,
        isMelee,
        expiresIn: singleSkinsExpireIn
      }
      data.singleSkins.push(obj);
    }
    
    try {
      var bundleData = await (await fetch(`https://api.valtracker.gg/featured-bundle?language=${APIi18n(on_load.appLang)}`)).json();
      
      data.featuredBundle = {
        bundleUUID,
        bundleName: bundleData.data.name,
        bundleIcon: bundleData.data.displayIcon,
        bundlePrice: bundleData.data.price,
        expiresIn: bundleExpiresIn
      }
  
      data.expiriresAt = singleSkinsExpireIn;
    } catch(unused) {
      console.log(unused);
      data.featuredBundle = false;
    }
  
    data.expiriresAt = singleSkinsExpireIn;
  
    if(shopData.BonusStore !== undefined) {
      data.nightMarket = {
        offers: shopData.BonusStore.BonusStoreOffers,
      }
  
      var nightMarketTime = shopData.BonusStore.BonusStoreRemainingDurationInSeconds + 10
      var now = new Date();
      var nightMarketExpirationDate = now.setSeconds(now.getSeconds() + nightMarketTime);
  
      data.nightMarket.nightMarketExpiresIn = nightMarketExpirationDate;
    }
  
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/daily_shop.json', JSON.stringify(data));
  
    return data;
  } catch(e) {
    console.log(e);
  }
}

async function fetchShop() {
  const rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
  const tokenData = JSON.parse(rawTokenData);

  var bearer = tokenData.accessToken;

  var user_creds_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
  var user_creds = JSON.parse(user_creds_raw);

  var puuid = user_creds.playerUUID;
  var region = user_creds.playerRegion;

  var daily = false;

  if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/daily_shop.json')) {
    var data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/daily_shop.json');
    var data = JSON.parse(data_raw);
    if(Date.now() < data.expiriresAt && Date.now() < data.featuredBundle.expiresIn && data.featuredBundle !== false) {
      var daily = data;
    }
  }

  if(daily !== false) {
    // FETCHING FROM CURRENT FILE
    return [daily, user_creds, tokenData];
  } else {
    // REFETCHING SHOP
    var entitlement_token = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/entitlement.json')).entitlement_token;

    var shopData = await getShopData(region, puuid, entitlement_token, bearer);

    const data = await calculateDailyStore(puuid, shopData);
    return [data, user_creds, tokenData];
  }
}

export default fetchShop;
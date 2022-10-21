import fetch from 'node-fetch';
import APIi18n from '../components/translation/ValApiFormatter';
import { executeQuery, getCurrentUserData, getUserAccessToken, getUserEntitlement, updateThing } from './dbFunctions';
import { v5 as uuidv5 } from 'uuid';

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
    var uuid = uuidv5("appLang", process.env.SETTINGS_UUID);
    var langObj = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
    var appLang = langObj[0] ? langObj[0].value : 'en-US';

    var user_creds = await getCurrentUserData();
    var entitlement_token = await getUserEntitlement();
    var bearer = await getUserAccessToken();
  
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
  
    // Calculate Bundle Price
    var bundlePrice = 0;
    for(var i = 0; i < shopData.FeaturedBundle.Bundles[0].Items.length; i++) {
      bundlePrice = bundlePrice + parseInt(shopData.FeaturedBundle.Bundles[0].Items[i].DiscountedPrice);
    }
  
    var skinPriceData = await getStoreOffers(user_creds.region, entitlement_token, bearer);
    var skinTiers = await (await fetch(`https://valorant-api.com/v1/contenttiers`)).json();
  
    var allSkins = await (await fetch(`https://valorant-api.com/v1/weapons/skins?language=${APIi18n(appLang)}`)).json();
  
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
      var bundleData = await (await fetch(`https://api.valtracker.gg/featured-bundle?language=${APIi18n(appLang)}`)).json();
      
      data.featuredBundle = {
        bundleUUID,
        bundleName: bundleData.data.name,
        bundleIcon: bundleData.data.displayIcon,
        bundlePrice: bundleData.data.price,
        expiresIn: bundleExpiresIn
      }
  
      data.expiresAt = singleSkinsExpireIn;
    } catch(e) {
      console.log(e);
      data.featuredBundle = false;
    }
  
    data.expiresAt = singleSkinsExpireIn;
  
    if(shopData.BonusStore !== undefined) {
      data.nightMarket = {
        offers: shopData.BonusStore.BonusStoreOffers,
      }
  
      var nightMarketTime = shopData.BonusStore.BonusStoreRemainingDurationInSeconds + 10
      var now = new Date();
      var nightMarketExpirationDate = now.setSeconds(now.getSeconds() + nightMarketTime);
  
      data.nightMarket.nightMarketExpiresIn = nightMarketExpirationDate;
    }

    var data = await updateThing(`playerStore:⟨${puuid}⟩`, data);
  
    return data;
  } catch(e) {
    console.log(e);
  }
}

async function fetchShop() {
  var bearer = await getUserAccessToken();

  var user_creds = await getCurrentUserData();

  var puuid = user_creds.uuid;
  var region = user_creds.region;

  var daily = false;

  var data = await executeQuery(`SELECT * FROM playerStore:⟨${puuid}⟩`);
  if(Date.now() < data[0].expiresAt && Date.now() < data[0].featuredBundle.expiresIn && data[0].featuredBundle !== false) {
    var daily = data[0];
  }
  
  if(daily !== false) {
    // FETCHING FROM CURRENT FILE
    return [daily, user_creds];
  } else {
    // REFETCHING SHOP
    var entitlement_token = await getUserEntitlement();

    var shopData = await getShopData(region, puuid, entitlement_token, bearer);

    const data = await calculateDailyStore(puuid, shopData);
    return [data, user_creds];
  }
}

export default fetchShop;
import fetch from 'node-fetch';
import fs from 'fs';

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

async function getStoreOffers(region, entitlement_token) {
  return (await (await fetch('https://pd.' + region + '.a.pvp.net/store/v1/offers/', {
    method: 'GET',
    headers: {
      'X-Riot-Entitlements-JWT': entitlement_token,
      'Content-Type': 'application/json',
      'User-Agent': ''
    },
    keepalive: true
  })).json());
}

async function getShopData(region, puuid, entitlement_token, bearer) {
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
    var lastShop = false;
  
    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/current_shop.json')) {
      var rawLastShop = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/current_shop.json');
      lastShop = JSON.parse(rawLastShop);
    }
  
    var data = {};
    data.singleSkins = [];

    var entitlement_token = await getEntitlement(bearer);
  
    if(lastShop !== false && Date.now() < lastShop.singleSkinsExpireIn && Date.now() < lastShop.bundleExpiresIn) {
      var rawShopData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/current_shop.json');
      var shopData = JSON.parse(rawShopData);
      
      var skinPriceData = await getStoreOffers(user_creds.playerRegion, entitlement_token);
  
      for(var i = 0; i < shopData.SkinsPanelLayout.SingleItemOffers.length; i++) {
        var skinUUID = shopData.SkinsPanelLayout.SingleItemOffers[i]
  
        var skinData = await (await fetch(`https://valorant-api.com/v1/weapons/skinlevels/${skinUUID}`)).json();
  
        var skinName = skinData.data.displayName;
        var skinIcon = skinData.data.displayIcon;
  
        for(var n = 0; n < skinPriceData.Offers.length; n++) {
          if(skinPriceData.Offers[n].Rewards[0].ItemID == skinUUID) {
            var skinPrice = skinPriceData.Offers[n].Cost[Object.keys(skinPriceData.Offers[n].Cost)[0]];
          }
        }
  
        var obj = {
          skinUUID,
          skinName,
          skinIcon,
          skinPrice,
          expiresIn: shopData.singleSkinsExpireIn
        }
        data.singleSkins.push(obj)
      }
  
      var bundleUUID = shopData.FeaturedBundle.Bundle.DataAssetID;
      
      try {
        var bundleData = await (await fetch(`https://api.valtracker.gg/featured-bundle`)).json();
        
        data.featuredBundle = {
          bundleUUID,
          bundleName: bundleData.data.name,
          bundleIcon: bundleData.data.displayIcon,
          bundlePrice: bundleData.data.price,
          expiresIn: shopData.bundleExpiresIn
        }
  
        data.expiriresAt = shopData.singleSkinsExpireIn;
      } catch(unused) {
        data.featuredBundle = false;
      }

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
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/daily_shop.json', JSON.stringify(data));
      return [data, user_creds, tokenData];
    } else {
      // REFETCHING SHOP
      var entitlement_token = await getEntitlement(bearer);

      var shopData = await getShopData(region, puuid, entitlement_token, bearer);

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

      shopData.singleSkinsExpireIn = singleSkinsExpirationDate;
      shopData.bundleExpiresIn = bundleExpirationDate;

      if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid)) {
        fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid);
      }

      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData));
      fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/' + puuid + '/current_shop.json', JSON.stringify(shopData));

      var bundleID = shopData.FeaturedBundle.Bundle.DataAssetID

      // Calculate Bundle Price
      var bundlePrice = 0;
      for(var i = 0; i < shopData.FeaturedBundle.Bundles[0].Items.length; i++) {
        bundlePrice = bundlePrice + parseInt(shopData.FeaturedBundle.Bundles[0].Items[i].DiscountedPrice);
      }

      var nightMarketSecondsRemaining = false;
      if(shopData.BonusStore !== undefined) {
        nightMarketSecondsRemaining = shopData.BonusStore.BonusStoreRemainingDurationInSeconds;
        var nightmarket = shopData.BonusStore.BonusStoreOffers;
        // nightmarket[i].Offer.OfferID
      }

      var skinPriceData = await getStoreOffers(user_creds.playerRegion, entitlement_token);
  
      for(var i = 0; i < shopData.SkinsPanelLayout.SingleItemOffers.length; i++) {
        var skinUUID = shopData.SkinsPanelLayout.SingleItemOffers[i];
  
        var skinData = await (await fetch(`https://valorant-api.com/v1/weapons/skinlevels/${skinUUID}`)).json();
  
        var skinName = skinData.data.displayName;
        var skinIcon = skinData.data.displayIcon;
  
        for(var n = 0; n < skinPriceData.Offers.length; n++) {
          if(skinPriceData.Offers[n].Rewards[0].ItemID == skinUUID) {
            var skinPrice = skinPriceData.Offers[n].Cost[Object.keys(skinPriceData.Offers[n].Cost)[0]];
          }
        }
  
        var obj = {
          skinUUID,
          skinName,
          skinIcon,
          skinPrice,
          expiresIn: shopData.singleSkinsExpireIn
        }
        data.singleSkins.push(obj);
      }
      
      try {
        var bundleData = await (await fetch(`https://api.valtracker.gg/featured-bundle`)).json();
        
        data.featuredBundle = {
          bundleUUID,
          bundleName: bundleData.data.name,
          bundleIcon: bundleData.data.displayIcon,
          bundlePrice: bundleData.data.price,
          expiresIn: shopData.bundleExpiresIn
        }
  
        data.expiriresAt = shopData.singleSkinsExpireIn;
      } catch(unused) {
        data.featuredBundle = false;
      }
  
      data.expiriresAt = shopData.singleSkinsExpireIn;

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
      return [data, user_creds, tokenData];
    }
  }
}

export default fetchShop;
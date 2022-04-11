var fs= require('fs');
const riotIPC = require('electron').ipcRenderer

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
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

function singleSkinsToHMS(n) {
    n = Number(n);
    var h = Math.floor(n / 3600);
    var m = Math.floor(n % 3600 / 60);
    var s = Math.floor(n % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
}

function nightMarketTimeToDHMS(n) {
    n = Number(n);
    var d = Math.floor(n / 86400);
    var h = Math.floor((n - d * 86400) / 3600);
    var m = Math.floor(n % 3600 / 60);
    var s = Math.floor(n % 3600 % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

var bearer;
var requiredCookie;
var entitlement_token;
var id_token;

async function getPlayerUUID() {
    return (await (await this.fetch('https://auth.riotgames.com/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + bearer,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json())['sub'];
}

async function getEntitlement() {
    return (await (await this.fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + bearer,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json())['entitlements_token'];
}

async function getXMPPRegion() {
    return (await (await this.fetch("https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant", {
        "method": "PUT",
        "headers": {
            "cookie": requiredCookie,
            "Content-Type": "application/json",
            "Authorization": "Bearer " + bearer
        },
        "body": `{\"id_token\":\"${id_token}\"}`
    })).json());
}

async function getShopData() {
    return (
        await (
            await this.fetch('https://pd.' + region + '.a.pvp.net/store/v2/storefront/' + puuid, {
                method: 'GET',
                headers: {
                    'X-Riot-Entitlements-JWT': entitlement_token,
                    'Authorization': 'Bearer ' + bearer,
                    'Content-Type': 'application/json',
                    'User-Agent': ''
                },
            })
        ).json()
    );
}

async function getWallet() {
    return (await (await this.fetch('https://pd.' + region + '.a.pvp.net/store/v1/wallet/' + puuid, {
        method: 'GET',
        headers: {
            'X-Riot-Entitlements-JWT': entitlement_token,
            'Authorization': 'Bearer ' + bearer,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json());
}

async function getInventory() {
    return (await (await this.fetch('https://pd.' + region + '.a.pvp.net/store/v1/entitlements/' + puuid, {
        method: 'GET',
        headers: {
            'X-Riot-Entitlements-JWT': entitlement_token,
            'Authorization': 'Bearer ' + bearer,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json());
}

async function checkForBoughtSkins() {
    const inventoryData = await getInventory()
    return inventoryData
}

function getTokenDataFromURL(url) {
    try {
        const searchParams = new URLSearchParams((new URL(url)).hash.slice(1));
        return {
            accessToken: searchParams.get('access_token'),
            expiresIn: searchParams.get('expires_in'),
            id_token: searchParams.get('id_token'),
        };
    } catch (err) {
        throw new Error(`Bad url: "${url}"`);
    }
}

$(document).ready(() => {
    riotIPC.send('changeDiscordRP', `shop_activity`)
    async function getShop() {
        const rawTokenData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json')
        const tokenData = JSON.parse(rawTokenData)

        bearer = tokenData.accessToken;
        id_token = tokenData.id_token;

        puuid = await getPlayerUUID();

        entitlement_token = await getEntitlement();
        if(typeof entitlement_token === "string") {

            region = await getXMPPRegion();

            region = region.affinities.live

            var shopData = await getShopData();
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))

            var walletData = await getWallet();
            var VP = walletData.Balances['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'];
            var RP = walletData.Balances['e59aa87c-4cbf-517a-5983-6e81511be9b7'];

            $('.wallet-vp').append(VP)
            $('.wallet-rp').append(RP)

            var bundleID = shopData.FeaturedBundle.Bundle.DataAssetID
            var dailyShop = shopData.SkinsPanelLayout.SingleItemOffers

            // Calculate Bundle Price
            var bundlePrice = 0;
            for(var i = 0; i < shopData.FeaturedBundle.Bundles[0].Items.length; i++) {
                bundlePrice = bundlePrice + parseInt(shopData.FeaturedBundle.Bundles[0].Items[i].DiscountedPrice)
            }
            $('.insert-bundle-price').append(bundlePrice)

            var nightMarketSecondsRemaining = false;
            if(shopData.BonusStore !== undefined) {
                nightMarketSecondsRemaining = shopData.BonusStore.BonusStoreRemainingDurationInSeconds
                var nightmarket = shopData.BonusStore.BonusStoreOffers
                $.ajax({
                    dataType: "json",
                    url: `https://valorant-api.com/v1/weapons`,
                    type: 'get',
                    success: function (data2, xhr) {
                        for (var i = 0; i < nightmarket.length; i++) { //Array
                            $(`.night-market-offer.${i+1}`).attr('id', nightmarket[i].Offer.OfferID)
                            for (var i2 = 0; i2 < data2.data.length; i2++) { //Weapon Type
                                for (var i3 = 0; i3 < data2.data[i2].skins.length; i3++) { //Weapon Skins
                                    if(data2.data[i2].skins[i3].levels[0].uuid == nightmarket[i].Offer.OfferID) {

                                        if(i2 == 17) {
                                            $(`.night-market-offer.${i+1} .nm-weapon`).addClass('melee')
                                        } else {
                                            $(`.night-market-offer.${i+1} .nm-weapon`).addClass('gun')
                                        }

                                        if(nightmarket[i].IsSeen !== true) {
                                            $(`.night-market-offer.${i+1}`).addClass('notSeenYet');
                                        }

                                        if(data2.data[i2].skins[i3].displayName.length < 23) {
                                            $(`.night-market-offer.${i+1} .nm-item-name`).append(data2.data[i2].skins[i3].displayName)
                                        } else {
                                            $(`.night-market-offer.${i+1} .nm-item-name`).append(data2.data[i2].skins[i3].displayName.slice(0, 23) + '...')
                                        }

                                        $(`.night-market-offer.${i+1} .nm-weapon`).attr('src', data2.data[i2].skins[i3].levels[0].displayIcon)

                                        $(`.night-market-offer.${i+1} .nm-price`).append(nightmarket[i].DiscountCosts[Object.keys(nightmarket[i].DiscountCosts)[0]])
                                    }
                                }
                            }
                        }
                    }
                })
            } else {
                $('.night-market-wrapper').css("display", "none");
            }

            $.ajax({
                dataType: "json",
                url: `https://valorant-api.com/v1/bundles`,
                type: 'get',
                success: function (data, xhr) {
                    for (var i = 0; i < data.data.length; i++) {
                        if(data.data[i].uuid == bundleID) {
                            $('.featured-bundle-header').append(data.data[i].displayName)
                            $('.store-bundle-image').attr('src', data.data[i].displayIcon)
                        }
                    }
                    $.ajax({
                        dataType: "json",
                        url: `https://valorant-api.com/v1/weapons`,
                        type: 'get',
                        success: function (data2, xhr) {
                            for (var i = 0; i < dailyShop.length; i++) { //Array
                                $(`.single-item.${i+1}`).attr('id', dailyShop[i])
                                for (var i2 = 0; i2 < data2.data.length; i2++) { //Weapon Type
                                    for (var i3 = 0; i3 < data2.data[i2].skins.length; i3++) { //Weapon Skins
                                        if(data2.data[i2].skins[i3].levels[0].uuid == dailyShop[i]) {
                                            $(`.single-item.${i+1} .single-item-name`).append(data2.data[i2].skins[i3].displayName)
                                            $(`.single-item.${i+1} .single-item-weapon`).attr('src', data2.data[i2].skins[i3].levels[0].displayIcon)
                                        }
                                    }
                                }
                            }
                            $.ajax({
                                dataType: "json",
                                url: `https://api.henrikdev.xyz/valorant/v1/store-offers`,
                                type: 'get',
                                success: function (data3, xhr) {
                                    for (var i = 0; i < dailyShop.length; i++) {
                                        for (var i2 = 0; i2 < data3.data.Offers.length; i2++) {
                                            if(data3.data.Offers[i2].Rewards[0].ItemID == dailyShop[i]) {
                                                $(`.single-item.${i+1} .single-item-price`).append(data3.data.Offers[i2].Cost[Object.keys(data3.data.Offers[i2].Cost)[0]])
                                            }
                                        }
                                    }
                                }
                            })
                        }
                    })
                }
            })

            var bundleSecondsRemaining = shopData.FeaturedBundle.BundleRemainingDurationInSeconds
            var singleOfferSecondsRemaining = shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds

            Date.prototype.addSeconds = function (seconds) {
                var copiedDate = new Date(this.getTime());
                return new Date(copiedDate.getTime() + seconds * 1000);
            }
            var dateData = {
                lastCkeckedDate: new Date().getTime(),
                willLastFor: new Date().addSeconds(singleOfferSecondsRemaining)
            }
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))

            bundleSecondsRemaining--;
            singleOfferSecondsRemaining--;

            if(nightMarketSecondsRemaining !== false) {
                nightMarketSecondsRemaining--;

                $('.nightmarket-time-left').empty()
                $('.nightmarket-time-left').append(nightMarketTimeToDHMS(nightMarketSecondsRemaining));
            }

            $('.featured-bundle-time-left').empty();
            $('.featured-bundle-time-left').append(bundleTimeToHMS(bundleSecondsRemaining) + " remaining");

            $('.single-skins-time-left').empty()
            $('.single-skins-time-left').append(singleSkinsToHMS(singleOfferSecondsRemaining) + " remaining");
            setInterval(function () {
                bundleSecondsRemaining--;
                singleOfferSecondsRemaining--;
                $('.featured-bundle-time-left').empty()
                $('.featured-bundle-time-left').append(bundleTimeToHMS(bundleSecondsRemaining) + " remaining");
                $('.single-skins-time-left').empty()
                $('.single-skins-time-left').append(singleSkinsToHMS(singleOfferSecondsRemaining) + " remaining");

                if(nightMarketSecondsRemaining !== false) {
                    nightMarketSecondsRemaining--;

                    $('.nightmarket-time-left').empty()
                    $('.nightmarket-time-left').append(nightMarketTimeToDHMS(nightMarketSecondsRemaining));
                }
                if(singleOfferSecondsRemaining <= 0 || bundleSecondsRemaining <= 0) {
                    window.location.href = "";
                }
            }, 1000)
        } else {
            function reauth() {
                riotIPC.send('startReauthCycle', 'now');
            }

            reauth();

            ipcRenderer.on('reauthSuccess', async function (event, arg) {

                var user_creds_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/user_creds.json");
                var user_creds = JSON.parse(user_creds_raw);
        
                puuid = user_creds.playerUUID;
                
                const tokenData = getTokenDataFromURL(arg)
                //fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(tokenData))

                bearer = tokenData.accessToken;
                id_token = tokenData.id_token;

                riotIPC.send('setCookies', 'please')
                riotIPC.on('tdid', async function (event, arg) {
                    requiredCookie = "tdid=" + arg

                    puuid = await getPlayerUUID();

                    entitlement_token = await getEntitlement();

                    var reagiondata = await getXMPPRegion();
                    region = reagiondata.affinities.live

                    var shopData = await getShopData();
                    //fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))

                    var walletData = await getWallet();
                    var VP = walletData.Balances['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'];
                    var RP = walletData.Balances['e59aa87c-4cbf-517a-5983-6e81511be9b7'];

                    $('.wallet-vp').append(VP)
                    $('.wallet-rp').append(RP)

                    var bundleID = shopData.FeaturedBundle.Bundle.DataAssetID
                    var dailyShop = shopData.SkinsPanelLayout.SingleItemOffers

                    var nightMarketSecondsRemaining = false;
                    if(shopData.BonusStore !== undefined) {
                        nightMarketSecondsRemaining = shopData.BonusStore.BonusStoreRemainingDurationInSeconds
                        var nightmarket = shopData.BonusStore.BonusStoreOffers
                        $.ajax({
                            dataType: "json",
                            url: `https://valorant-api.com/v1/weapons`,
                            type: 'get',
                            success: function (data2, xhr) {
                                for (var i = 0; i < nightmarket.length; i++) { //Array
                                    $(`.night-market-offer.${i+1}`).attr('id', nightmarket[i].Offer.OfferID)
                                    for (var i2 = 0; i2 < data2.data.length; i2++) { //Weapon Type
                                        for (var i3 = 0; i3 < data2.data[i2].skins.length; i3++) { //Weapon Skins
                                            if(data2.data[i2].skins[i3].levels[0].uuid == nightmarket[i].Offer.OfferID) {

                                                if(i2 == 17) {
                                                    $(`.night-market-offer.${i+1} .nm-weapon`).addClass('melee')
                                                } else {
                                                    $(`.night-market-offer.${i+1} .nm-weapon`).addClass('gun')
                                                }

                                                if(nightmarket[i].IsSeen !== true) {
                                                    $(`.night-market-offer.${i+1}`).addClass('notSeenYet');
                                                }

                                                $(`.night-market-offer.${i+1} .single-item-name`).append(data2.data[i2].skins[i3].displayName)

                                                $(`.night-market-offer.${i+1} .nm-weapon`).attr('src', data2.data[i2].skins[i3].levels[0].displayIcon)

                                                $(`.night-market-offer.${i+1} .nm-price`).append(nightmarket[i].DiscountCosts[Object.keys(nightmarket[i].DiscountCosts)[0]])
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    } else {
                        $('.night-market-wrapper').css("display", "none");
                    }

                    $.ajax({
                        dataType: "json",
                        url: `https://valorant-api.com/v1/bundles`,
                        type: 'get',
                        success: function (data, xhr) {
                            for (var i = 0; i < data.data.length; i++) {
                                if(data.data[i].uuid == bundleID) {
                                    $('.featured-bundle-header').append(data.data[i].displayName)
                                    $('.store-bundle-image').attr('src', data.data[i].displayIcon)
                                }
                            }
                            $.ajax({
                                dataType: "json",
                                url: `https://valorant-api.com/v1/weapons`,
                                type: 'get',
                                success: function (data2, xhr) {
                                    for (var i = 0; i < dailyShop.length; i++) { //Array
                                        $(`.single-item.${i+1}`).attr('id', dailyShop[i])
                                        for (var i2 = 0; i2 < data2.data.length; i2++) { //Weapon Type
                                            for (var i3 = 0; i3 < data2.data[i2].skins.length; i3++) { //Weapon Skins
                                                if(data2.data[i2].skins[i3].levels[0].uuid == dailyShop[i]) {
                                                    $(`.single-item.${i+1} .single-item-name`).append(data2.data[i2].skins[i3].displayName)
                                                    $(`.single-item.${i+1} .single-item-weapon`).attr('src', data2.data[i2].skins[i3].levels[0].displayIcon)
                                                }
                                            }
                                        }
                                    }
                                    $.ajax({
                                        dataType: "json",
                                        url: `https://api.henrikdev.xyz/valorant/v1/store-offers`,
                                        type: 'get',
                                        success: function (data3, xhr) {
                                            for (var i = 0; i < dailyShop.length; i++) {
                                                for (var i2 = 0; i2 < data3.data.Offers.length; i2++) {
                                                    if(data3.data.Offers[i2].Rewards[0].ItemID == dailyShop[i]) {
                                                        $(`.single-item.${i+1} .single-item-price`).append(data3.data.Offers[i2].Cost[Object.keys(data3.data.Offers[i2].Cost)[0]])
                                                    }
                                                }
                                            }
                                        }
                                    })
                                }
                            })
                        }
                    })

                    var bundleSecondsRemaining = shopData.FeaturedBundle.BundleRemainingDurationInSeconds
                    var singleOfferSecondsRemaining = shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds

                    Date.prototype.addSeconds = function (seconds) {
                        var copiedDate = new Date(this.getTime());
                        return new Date(copiedDate.getTime() + seconds * 1000);
                    }
                    var dateData = {
                        lastCkeckedDate: new Date().getTime(),
                        willLastFor: new Date().addSeconds(singleOfferSecondsRemaining)
                    }
                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))

                    bundleSecondsRemaining--;
                    singleOfferSecondsRemaining--;

                    if(nightMarketSecondsRemaining !== false) {
                        nightMarketSecondsRemaining--;

                        $('.nightmarket-time-left').empty()
                        $('.nightmarket-time-left').append(nightMarketTimeToDHMS(nightMarketSecondsRemaining));
                    }

                    $('.featured-bundle-time-left').empty();
                    $('.featured-bundle-time-left').append(bundleTimeToHMS(bundleSecondsRemaining) + " remaining");

                    $('.single-skins-time-left').empty()
                    $('.single-skins-time-left').append(singleSkinsToHMS(singleOfferSecondsRemaining) + " remaining");
                    setInterval(function () {
                        bundleSecondsRemaining--;
                        singleOfferSecondsRemaining--;
                        $('.featured-bundle-time-left').empty()
                        $('.featured-bundle-time-left').append(bundleTimeToHMS(bundleSecondsRemaining) + " remaining");
                        $('.single-skins-time-left').empty()
                        $('.single-skins-time-left').append(singleSkinsToHMS(singleOfferSecondsRemaining) + " remaining");

                        if(nightMarketSecondsRemaining !== false) {
                            nightMarketSecondsRemaining--;

                            $('.nightmarket-time-left').empty()
                            $('.nightmarket-time-left').append(nightMarketTimeToDHMS(nightMarketSecondsRemaining));
                        }
                        if(singleOfferSecondsRemaining <= 0 || bundleSecondsRemaining <= 0) {
                            window.location.href = "";
                        }
                    }, 1000)
                });
            })
        }
        const inventoryData = await checkForBoughtSkins();
        var storeIDs = [];
        var nightmarketIDs = [];
        var storeOffers = document.getElementsByClassName("single-item");
        var nightmarketOffers = document.getElementsByClassName("night-market-offer");

        for (let item of storeOffers) {
            storeIDs.push(item.id);
        }

        for (let item of nightmarketOffers) {
            nightmarketIDs.push(item.id);
        }

        for (var i = 0; i < inventoryData.EntitlementsByTypes.length; i++) {
            if(inventoryData.EntitlementsByTypes[i].ItemTypeID == "e7c63390-eda7-46e0-bb7a-a6abdacd2433") {
                for (var i2 = 0; i2 < inventoryData.EntitlementsByTypes[i].Entitlements.length; i2++) {
                    if(storeIDs.includes(inventoryData.EntitlementsByTypes[i].Entitlements[i2].ItemID)) {
                        for (let item of storeOffers) {
                            if(item.id == inventoryData.EntitlementsByTypes[i].Entitlements[i2].ItemID) {
                                item.classList.add('sold');
                            }
                        }
                    }
                    if(nightmarketIDs.includes(inventoryData.EntitlementsByTypes[i].Entitlements[i2].ItemID)) {
                        for (let item of nightmarketOffers) {
                            if(item.id == inventoryData.EntitlementsByTypes[i].Entitlements[i2].ItemID) {
                                item.classList.add('sold');
                            }
                        }
                    }
                }
            }
        }
    }
    getShop();
})
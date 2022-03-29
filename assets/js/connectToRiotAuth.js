const electron = require('electron')
var authfs = require('fs')
const riotIPC = require('electron').ipcRenderer

const signInUrl = 'https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid';

var bearer;
var puuid;
var entitlement_token;
var id_token;
var requiredCookie;
var region;

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

async function showSignIn() {
    return new Promise((resolve, reject) => {
        const loginWindow = new electron.remote.BrowserWindow({
            show: false,
            width: 470,
            height: 880,
            autoHideMenuBar: true,
        });
        let foundToken = false;
        loginWindow.webContents.on('will-redirect', (event, url) => {
            console.log('Login window redirecting...');
            if (!foundToken && url.startsWith('https://playvalorant.com/opt_in')) {
                console.log('Redirecting to url with tokens');
                const tokenData = getTokenDataFromURL(url);
                foundToken = true;

                loginWindow.webContents.session.cookies.get({
                    domain: 'auth.riotgames.com'
                }).then(async riotcookies => {
                    await Promise.all(riotcookies.map(cookie => loginWindow.webContents.session.cookies.remove(`https://${cookie.domain}${cookie.path}`, cookie.name)));
                    loginWindow.destroy();
                    resolve({
                        tokenData,
                        riotcookies,
                    });
                    riotcookies.forEach(riotcookie => {
                        if (riotcookie.name == "ssid") {
                            cookieString = riotcookie.value
                        }
                    })
                    authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify(riotcookies))
                    authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(tokenData))
                });
            }
        });
        loginWindow.once('ready-to-show', () => {
            loginWindow.show();
        });
        loginWindow.on('close', () => {
            console.log('Login window was closed');
            reject('window closed');
        });
        window.loginWindow = loginWindow;
        loginWindow.loadURL(signInUrl);
    });
}

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
    return (await (await this.fetch('https://pd.' + region + '.a.pvp.net/store/v2/storefront/' + puuid, {
        method: 'GET',
        headers: {
            'X-Riot-Entitlements-JWT': entitlement_token,
            'Authorization': 'Bearer ' + bearer,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json());
}

$(document).ready(() => {
    const loginCheck = authfs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json')
    const check = JSON.parse(loginCheck);
    if (check.usesRiotAccount == true || check.usesRiotAccount == undefined) {
        var tryagain = setInterval(function () {
            clearInterval(tryagain)
            if (sessionStorage.getItem('afterReload')) {
                if (!authfs.existsSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json')) {
                    var emptyShopFile = {
                        "empty": true
                    }
                    authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(emptyShopFile));
                }

                async function checkData() {
                    var rawOldTokenData = authfs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
                    oldTokenData = JSON.parse(rawOldTokenData)

                    bearer = oldTokenData.accessToken;
                    id_token = oldTokenData.id_token;

                    puuid = await getPlayerUUID();
                    entitlement_token = await getEntitlement();
                    if (typeof entitlement_token === "string") {
                        var reagiondata = await getXMPPRegion();
                        region = reagiondata.affinities.live

                        var shopData = await getShopData();
                        authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))

                        var pathvar = document.location.pathname;
                        var page = pathvar.split("/").pop();

                        if (page == "index.html" || page == "decoyIndex.html") {
                            $(".featured-bundle-time-left").append(shopData.FeaturedBundle.BundleRemainingDurationInSeconds)
                            $('.featured-bundle-time-left').css("opacity", "0");
                        }

                        Date.prototype.addSeconds = function (seconds) {
                            var copiedDate = new Date(this.getTime());
                            return new Date(copiedDate.getTime() + seconds * 1000);
                        }

                        var dateData = {
                            lastCkeckedDate: new Date().getTime(),
                            willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
                        }

                        authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))
                    } else {
                        function reauth() {
                            riotIPC.send('startReauthCycle', 'now');
                        }

                        reauth();

                        riotIPC.on('reauthFail', async function () {
                            const data = await showSignIn();
                            bearer = data.tokenData.accessToken;
                            id_token = data.tokenData.id_token;

                            riotIPC.send('setCookies', 'please')
                            riotIPC.on('tdid', async function (event, arg) {
                                requiredCookie = "tdid=" + arg

                                puuid = await getPlayerUUID();

                                entitlement_token = await getEntitlement();

                                var reagiondata = await getXMPPRegion();
                                region = reagiondata.affinities.live

                                var shopData = await getShopData();
                                authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))

                                var pathvar = document.location.pathname;
                                var page = pathvar.split("/").pop();

                                if (page == "index.html" || page == "decoyIndex.html") {
                                    $(".featured-bundle-time-left").append(shopData.FeaturedBundle.BundleRemainingDurationInSeconds)
                                    $('.featured-bundle-time-left').css("opacity", "0");
                                }

                                Date.prototype.addSeconds = function (seconds) {
                                    var copiedDate = new Date(this.getTime());
                                    return new Date(copiedDate.getTime() + seconds * 1000);
                                }

                                var dateData = {
                                    lastCkeckedDate: new Date().getTime(),
                                    willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
                                }

                                authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))
                            });
                        });

                        riotIPC.on('reauthSuccess', async function (event, arg) {
                            const tokenData = getTokenDataFromURL(arg)
                            authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(tokenData))

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
                                authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))

                                var pathvar = document.location.pathname;
                                var page = pathvar.split("/").pop();

                                if (page == "index.html" || page == "decoyIndex.html") {
                                    $(".featured-bundle-time-left").append(shopData.FeaturedBundle.BundleRemainingDurationInSeconds)
                                    $('.featured-bundle-time-left').css("opacity", "0");
                                }

                                Date.prototype.addSeconds = function (seconds) {
                                    var copiedDate = new Date(this.getTime());
                                    return new Date(copiedDate.getTime() + seconds * 1000);
                                }

                                var dateData = {
                                    lastCkeckedDate: new Date().getTime(),
                                    willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
                                }

                                authfs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))
                            });
                        })
                    }
                }
                checkData();
            }
        }, 1000)
    } else {
        $('#store').css("display", "none")
        $('#collects-sub-bp').css("display", "none")
    }
})
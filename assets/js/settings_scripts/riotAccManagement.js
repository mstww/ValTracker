const electron = require('electron')
const riotIPC = require('electron').ipcRenderer

const replaceText6 = (text) => {
    const element2 = document.getElementById("replace-textspan-6");
    if (element2) element2.innerText = text;
}

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
                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify(riotcookies))
                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(tokenData))
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
    //Check if user is logged in, if yes, show log out button, also reverse
    const rawcookies = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json');
    const bakedCookies = JSON.parse(rawcookies);
    if (bakedCookies[0] !== undefined) {
        $('#log-in-button').css('display', 'none');
    } else {
        $('#log-out-button').css('display', 'none');
    }

    $('#log-out-button').on("click", function () {
        const rawUserConfig = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
        const userConfig = JSON.parse(rawUserConfig);
        userConfig.usesRiotAccount = false;
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', JSON.stringify(userConfig));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify([]));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify({}));
        window.location.href = "";
    });

    $('#log-out-button').on("click", function () {
        const rawUserConfig = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
        const userConfig = JSON.parse(rawUserConfig);
        userConfig.usesRiotAccount = false;
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', JSON.stringify(userConfig));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify([]));
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify({}));
        window.location.href = "";
    });
    $('#log-in-button').on('click', async function () {
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
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))

            Date.prototype.addSeconds = function (seconds) {
                var copiedDate = new Date(this.getTime());
                return new Date(copiedDate.getTime() + seconds * 1000);
            }

            var dateData = {
                lastCkeckedDate: new Date().getTime(),
                willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
            }
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))

            riotIPC.send('startReauthCycle', 'again')
            $.ajax({
                url: `https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${region}/${puuid}`,
                type: 'get',
                success: function (data, xhr) {
                    var searchedPlayerName = data.data.name
                    var searchedPlayerTag = data.data.tag
                    var searchedRegion = region;

                    let userData = {
                        playerName: searchedPlayerName,
                        playerTag: searchedPlayerTag,
                        playerRegion: searchedRegion,
                        playerUUID: puuid,
                        usesRiotAccount: true
                    };

                    let data2 = JSON.stringify(userData);
                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', data2);
                    window.location.href = ""
                },
                error: function (xhr) {
                    if (xhr.status == 400) {
                        replaceText6('400, Bad Request');
                    }
                    if (xhr.status == 401) {
                        replaceText6('401, Unauthorized');
                    }
                    if (xhr.status == 403) {
                        replaceText6('403, Name/Tag Missing!');
                    }
                    if (xhr.status == 404) {
                        replaceText6('404, No player found!');
                    }
                    if (xhr.status == 405) {
                        replaceText6('405, Not allowed!');
                    }
                    if (xhr.status == 415) {
                        replaceText6('415, unsupported Media Type');
                    }
                    if (xhr.status == 429) {
                        replaceText6('429, Rate limit exceeded, try again later');
                    }
                    if (xhr.status == 500) {
                        replaceText6('500, Internal Server Error');
                    }
                    if (xhr.status == 502) {
                        replaceText6('502, Bad Gateway');
                    }
                    if (xhr.status == 503) {
                        replaceText6('503, Service unavailable');
                    }
                    if (xhr.status == 504) {
                        replaceText6('504, Gateway timeout');
                    }
                },
            });
        });
    })
})
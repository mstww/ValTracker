const fs = require('fs')
const { BrowserWindow } = require('@electron/remote')
const riotIPC = require('electron').ipcRenderer

function loadFade() {
    $('.setup-wrapper').fadeTo(950, 1);
}

function leaveFade() {
    $('.setup-wrapper').fadeTo(950, 0);
    setTimeout(function () {
        $('.setup-wrapper').css("display", "none");
    }, 1000)
}

function leaveFade2() {
    $('.setup-wrapper-2').fadeTo(950, 0);
    setTimeout(function () {
        $('.setup-wrapper-2').css("display", "none");
        $('.setup-wrapper-3').css("display", "block");
        $('.setup-wrapper-3').fadeTo(950, 1);
    }, 1000)
}

function leaveFade3() {
    $('.setup-wrapper-3').fadeTo(950, 0);
    setTimeout(function () {
        window.location.href = "../pages/decoyIndex.html"
    }, 1000)
}

function leaveFade4() {
    $('.setup-wrapper').fadeTo(950, 0);
    setTimeout(function () {
        $('.setup-wrapper').css("display", "none");
        $('.setup-skip-wrapper').css("display", "block");
        $('.setup-skip-wrapper').fadeTo(950, 1);
    }, 1000)
}

function leaveFade5() {
    $('.setup-skip-wrapper').fadeTo(950, 0);
    setTimeout(function () {
        $('.setup-skip-wrapper').css("display", "none");
        $('.setup-skip-wrapper-2').css("display", "block");
        $('.setup-skip-wrapper-2').fadeTo(950, 1);
    }, 1000)
}

function leaveFade6() {
    $('.setup-skip-wrapper-2').fadeTo(950, 0);
    setTimeout(function () {
        $('.setup-skip-wrapper-2').css("display", "none");
        $('.setup-wrapper-3').css("display", "block");
        $('.setup-wrapper-3').fadeTo(950, 1);
    }, 1000)
}

function backFade1() {
    $('.setup-skip-wrapper').fadeTo(950, 0);
    setTimeout(function () {
        $('.setup-skip-wrapper').css("display", "none");
        $('.setup-wrapper').css("display", "block");
        $('.setup-wrapper').fadeTo(950, 1);
    }, 1000)
}

function backFade2() {
    $('.setup-skip-wrapper-2').fadeTo(950, 0);
    setTimeout(function () {
        $('.setup-skip-wrapper-2').css("display", "none");
        $('.setup-skip-wrapper').css("display", "block");
        $('.setup-skip-wrapper').fadeTo(950, 1);
    }, 1000)
}

const replaceText = (text) => {
    const element = document.getElementById("search-output");
    if (element) element.innerText = text
}

const replaceText2 = (text) => {
    const element = document.getElementById("search-output-2");
    if (element) element.innerText = text
}

//////////////////////////////////////////////

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
        const loginWindow = new BrowserWindow({
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
    riotIPC.send('isInSetup');
    loadFade();
    $('#openRiotLogin').on("click", async function () {
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

                    let finishedData = {
                        hasFinishedSetupSequence: true
                    };

                    let data3 = JSON.stringify(finishedData);
                    var testVar = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
                    fs.writeFileSync(testVar, data3);

                    let userData = {
                        playerName: searchedPlayerName,
                        playerTag: searchedPlayerTag,
                        playerRegion: searchedRegion,
                        playerUUID: puuid,
                        usesRiotAccount: true
                    };

                    let data2 = JSON.stringify(userData);
                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', data2);
                    leaveFade();
                    leaveFade2();
                },
                error: function (xhr) {
                    if (xhr.status == 400) {
                        replaceText('400, Bad Request');
                    }
                    if (xhr.status == 401) {
                        replaceText('401, Unauthorized');
                    }
                    if (xhr.status == 403) {
                        replaceText('403, Name/Tag Missing!');
                    }
                    if (xhr.status == 404) {
                        replaceText('404, No player found!');
                    }
                    if (xhr.status == 405) {
                        replaceText('405, Not allowed!');
                    }
                    if (xhr.status == 415) {
                        replaceText('415, unsupported Media Type');
                    }
                    if (xhr.status == 429) {
                        replaceText('429, Rate limit exceeded, try again later');
                    }
                    if (xhr.status == 500) {
                        replaceText('500, Internal Server Error');
                    }
                    if (xhr.status == 502) {
                        replaceText('502, Bad Gateway');
                    }
                    if (xhr.status == 503) {
                        replaceText('503, Service unavailable');
                    }
                    if (xhr.status == 504) {
                        replaceText('504, Gateway timeout');
                    }
                },
            });
        });
    })
    $('#skip-span').on('click', function () {
        leaveFade4();
    })
    $('#back-span').on("click", function () {
        backFade1();
    })
    $('.setup-button-finish').on("click", function () {
        leaveFade3();
    });
    $("#playerNameSearch").keyup(function (event) {
        var inputValue = document.getElementById("playerNameSearch").value;
        if (event.keyCode === 13) {
            if (inputValue.indexOf('#') > -1) {
                $("#playerNameSearchButton").click();
            } else {
                replaceText("ERROR!\nRiot ID's require a #:\nRiot#NA1")
                document.getElementById("playerNameSearch").focus();
                document.getElementById("playerNameSearch").select();
            }
        }
    });
    document.getElementById("playerNameSearchButton").onclick = function (event) {
        $('#playersearch-loading-circle').css("display", "block")
        var inputValue = document.getElementById("playerNameSearch").value;
        var searchedPlayerName = inputValue.substring(0, inputValue.indexOf("#"));
        var searchedPlayerTag = inputValue.substring(inputValue.indexOf("#") + 1);

        if (inputValue == "") {
            replaceText2("Search Field empty.")
            $('#playersearch-loading-circle').css("display", "none")
        } else {
            if (inputValue.indexOf('#') > -1) {
                replaceText2("")
                event.preventDefault();
                var searchedPlayerName = inputValue.substring(0, inputValue.indexOf("#"));
                var searchedPlayerTag = inputValue.substring(inputValue.indexOf("#") + 1);
                var searchedRegion = document.getElementById('selected-region').value;
                $.ajax({
                    url: `https://api.henrikdev.xyz/valorant/v1/account/${searchedPlayerName}/${searchedPlayerTag}`,
                    type: 'get',
                    success: function (data, xhr) {
                        leaveFade5();

                        var playerRegion = searchedRegion;

                        $('.player-pageheader').empty();
                        $('.player-pageheader').append(data.data.name + "#" + data.data.tag);
                        $('.player-card-img-setup').attr("src", data.data.card.small);
                        $('.last-updated').empty();
                        $('.last-updated').append("Last updated: " + data.data.last_update);
                        $('.player-account-level').empty();
                        $('.player-account-level').append("Account Level: " + data.data.account_level);
                        $('#player-region-span').empty();
                        $('#player-region-span').append("Region: " + playerRegion.toUpperCase());

                        $('.setup-button-back').on("click", function () {
                            $('#playerNameSearch').val('');
                            $('#playersearch-loading-circle').css("display", "none");
                            backFade2();
                        })

                        $('.setup-button-next').on("click", function () {
                            leaveFade6();

                            var searchedPlayerName = data.data.name
                            var searchedPlayerTag = data.data.tag
                            var puuid = data.data.puuid
                            var searchedRegion = playerRegion;

                            let finishedData = {
                                hasFinishedSetupSequence: true
                            };

                            let data3 = JSON.stringify(finishedData);
                            var testVar = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
                            fs.writeFileSync(testVar, data3);

                            let userData = {
                                playerName: searchedPlayerName,
                                playerTag: searchedPlayerTag,
                                playerRegion: searchedRegion,
                                playerUUID: puuid,
                                usesRiotAccount: false
                            };

                            let data2 = JSON.stringify(userData);
                            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', data2);
                        });
                    },
                    error: function (xhr) {
                        //get the status code
                        if (xhr.status == 400) {
                            replaceText2('400, Bad Request');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 401) {
                            replaceText2('401, Unauthorized');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 403) {
                            replaceText2('403, Name/Tag Missing!');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 404) {
                            replaceText2('404, No player found!');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 405) {
                            replaceText2('405, Not allowed!');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 415) {
                            replaceText2('415, unsupported Media Type');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 429) {
                            replaceText2('429, Rate limit exceeded, try again later');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 500) {
                            replaceText2('500, Internal Server Error');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 502) {
                            replaceText2('502, Bad Gateway');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 503) {
                            replaceText2('503, Service unavailable');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if (xhr.status == 504) {
                            replaceText2('504, Gateway timeout');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                    },
                });
            } else {
                replaceText2("ERROR!\nRiot ID's require a #:\nRiot#NA1")
                $('#playersearch-loading-circle').css("display", "none")
                document.getElementById("playerNameSearch").focus();
                document.getElementById("playerNameSearch").select();
            }
        }
    };
});
var fs = require('fs')
const { default: axios } = require('axios');
var ipcRenderer = require('electron').ipcRenderer

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
    if(element) element.innerText = text
}

const replaceText2 = (text) => {
    const element = document.getElementById("search-output-2");
    if(element) element.innerText = text
}

//////////////////////////////////////////////

var bearer;
var puuid;
var entitlement_token;
var id_token;
var requiredCookie;
var region;

async function showSignIn() {
    return await ipcRenderer.invoke('loginWindow', true);
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
    ipcRenderer.send('isInSetup');
    loadFade();
    $('#openRiotLogin').on("click", async function () {
        const data = await showSignIn();

        // Save this data to user_file

        bearer = data.tokenData.accessToken;
        id_token = data.tokenData.id_token;

        ipcRenderer.send('setCookies', 'please')
        ipcRenderer.on('tdid', async function (event, arg) {
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
    
            if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid)) {
                fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid);
            }
    
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/token_data.json', JSON.stringify(data.tokenData));
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/cookies.json', JSON.stringify(data.riotcookies));

            ipcRenderer.send('startReauthCycle', 'again')
            
            $.ajax({
                "async": true,
                "crossDomain": true,
                "url": "https://pd." + region + ".a.pvp.net/name-service/v2/players",
                "method": "PUT",
                "headers": {
                  "Content-Type": "application/json"
                },
                "processData": false,
                "data": "[\"" + puuid + "\"]",
                success: async function (data, xhr) {
                    // data[0].GameName
                    var data = JSON.parse(data)
                    var searchedPlayerName = data[0].GameName
                    var searchedPlayerTag = data[0].TagLine
                    var searchedRegion = region;

                    let finishedData = {
                        hasFinishedSetupSequence: true
                    };

                    let data3 = JSON.stringify(finishedData);
                    var testVar = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
                    fs.writeFileSync(testVar, data3);

                    var mmr_data = await axios.get(`https://api.henrikdev.xyz/valorant/v1/mmr/eu/${searchedPlayerName}/${searchedPlayerTag}`)
                    if(mmr_data.data.data.currenttier) {
                        var currenttier = mmr_data.data.data.currenttier
                    } else {
                        var currenttier = 0
                    }

                    let userData = {
                        playerName: searchedPlayerName,
                        playerTag: searchedPlayerTag,
                        playerRegion: searchedRegion,
                        playerUUID: puuid,
                        playerRank: `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${currenttier}/largeicon.png`,
                        usesRiotAccount: true
                    };

                    let data2 = JSON.stringify(userData);

                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', data2);

                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + puuid + '.json', data2);

                    leaveFade();
                    leaveFade2();
                    ipcRenderer.send('finishedSetup');
                },
                error: function (xhr) {
                    if(xhr.status == 400) {
                        replaceText('400, Bad Request');
                    }
                    if(xhr.status == 401) {
                        replaceText('401, Unauthorized');
                    }
                    if(xhr.status == 403) {
                        replaceText('403, Name/Tag Missing!');
                    }
                    if(xhr.status == 404) {
                        replaceText('404, No player found!');
                    }
                    if(xhr.status == 405) {
                        replaceText('405, Not allowed!');
                    }
                    if(xhr.status == 415) {
                        replaceText('415, unsupported Media Type');
                    }
                    if(xhr.status == 429) {
                        replaceText('429, Rate limit exceeded, try again later');
                    }
                    if(xhr.status == 500) {
                        replaceText('500, Internal Server Error');
                    }
                    if(xhr.status == 502) {
                        replaceText('502, Bad Gateway');
                    }
                    if(xhr.status == 503) {
                        replaceText('503, Service unavailable');
                    }
                    if(xhr.status == 504) {
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
        if(event.keyCode === 13) {
            if(inputValue.indexOf('#') > -1) {
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

        if(inputValue == "") {
            replaceText2("Search Field empty.")
            $('#playersearch-loading-circle').css("display", "none")
        } else {
            if(inputValue.indexOf('#') > -1) {
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
                            ipcRenderer.send('finishedSetup');

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
                        if(xhr.status == 400) {
                            replaceText2('400, Bad Request');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 401) {
                            replaceText2('401, Unauthorized');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 403) {
                            replaceText2('403, Name/Tag Missing!');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 404) {
                            replaceText2('404, No player found!');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 405) {
                            replaceText2('405, Not allowed!');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 415) {
                            replaceText2('415, unsupported Media Type');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 429) {
                            replaceText2('429, Rate limit exceeded, try again later');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 500) {
                            replaceText2('500, Internal Server Error');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 502) {
                            replaceText2('502, Bad Gateway');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 503) {
                            replaceText2('503, Service unavailable');
                            $('#playersearch-loading-circle').css("display", "none")
                        }
                        if(xhr.status == 504) {
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
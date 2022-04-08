var accIpc = require('electron').ipcRenderer;
var accFs = require('fs');
var { BrowserWindow } = require('@electron/remote');

var signInUrl = 'https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid';

var bearer;
var id_token;
var requiredCookie;
var entitlement_token;

var acc_axios = require('axios')

function openSwitcherLoginWindow() {
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
                    });
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

async function switcher_getPlayerUUID() {
    return (await (await this.fetch('https://auth.riotgames.com/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + bearer,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json())['sub'];
}

async function switcher_getEntitlement() {
    return (await (await this.fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + bearer,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json())['entitlements_token'];
}

async function switcher_getXMPPRegion() {
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

async function switcher_getShopData() {
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
    $('#acc-switcher').on("click", function () {
        toggle();
        $('.switch-acc-wrapper').css("opacity", "0");
        $('.switch-acc-wrapper').css("display", "flex");
        $('.switch-acc-wrapper').fadeTo(300, 1);
        $('.switch-acc-card').css("display", "block");
        setTimeout(function () {
            $('.switch-acc-card').fadeTo(150, 1)
            $('.switch-acc-card').css("transform", "scale(1)");
        }, 1)
    });
    $('#closeAccountsWindow').on("click", function () {
        $('.switch-acc-card').fadeTo(100, 0)
        $('.switch-acc-card').css("transform", "scale(0.8)");
        $('.switch-acc-wrapper').fadeTo(150, 0)
        setTimeout(function () {
            $('.switch-acc-wrapper').css("display", "none");
        }, 150)
    });
    var user_creds_raw = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
    var user_creds = JSON.parse(user_creds_raw);

    var accounts = accFs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts');

    var acc_array = [];

    var i = 0;
    accounts.forEach(accountFile => {
        var account_data_raw = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + accountFile);
        var account_data = JSON.parse(account_data_raw);

        var accountTile = document.createElement('div');
        accountTile.className = 'switch-acc-account-tile';

        if(accountFile.split('.')[0] == user_creds.playerUUID) {
            accountTile.classList.add('active-acc');
        }

        var accRankWrapper = document.createElement('div');
        accRankWrapper.className = 'add-account-account-rank';
        accRankWrapper.style.width = "14%";

        var accRankImg = document.createElement('img');
        console.log(account_data)
        accRankImg.src = account_data.playerRank;
        accRankImg.className = "user-rank-img";
        accRankImg.style.width = "85%";

        accRankWrapper.appendChild(accRankImg);

        var accountName = document.createElement('span');
        accountName.className = 'account-tile-name';
        accountName.textContent = account_data.playerName + "#" + account_data.playerTag;

        var accountRegion = document.createElement('span');
        accountRegion.className = 'account-tile-region';
        accountRegion.textContent = account_data.playerRegion.toUpperCase();

        var accountRemove = document.createElement('i');
        accountRemove.className = 'fas fa-minus-circle';
        accountRemove.style.fontSize = "1.8em";
        accountRemove.style.marginRight = "1rem";
        accountRemove.style.marginLeft = "auto";
        accountRemove.style.display = "none";

        var accountCheckmark = document.createElement('i');
        accountCheckmark.className = 'fas fa-check-circle';

        accountCheckmark.style.marginLeft = "auto";
        accountCheckmark.style.marginRight = "1rem";
        accountCheckmark.style.fontSize = "1.8em";

        var hiddenPUUID = document.createElement('span');
        hiddenPUUID.style.display = "none";
        hiddenPUUID.textContent = account_data.playerUUID;

        accountTile.appendChild(accRankWrapper);
        accountTile.appendChild(accountName);
        accountTile.appendChild(accountRegion);
        accountTile.appendChild(accountRemove);
        accountTile.appendChild(accountCheckmark);
        accountTile.appendChild(hiddenPUUID);
        
        if(accountFile.split('.')[0] == user_creds.playerUUID) {
            acc_array.unshift(accountTile);
        } else {
            acc_array.push(accountTile);
        }
        i++;
    });

    if(i >= 5) {
        $('.add-acc-button').remove();
    }

    if(i <= 1) {
        $('#remove-acc-button').remove()
    }

    for(var i = 0; i < acc_array.length; i++) {
        var wrapper = document.getElementById('switch-acc-accounts-wrapper');
        var lastElement = document.getElementById('lastAccountElement');
        wrapper.insertBefore(acc_array[i], lastElement);
    }

    $('.add-acc-button').on("click", async function () {
        var accounts = accFs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts');
        var id = this.id
        if(accounts.length <= 5) {
            const data = await openSwitcherLoginWindow();
            console.log(data)
            bearer = data.tokenData.accessToken;
            id_token = data.tokenData.id_token;
    
            accIpc.send('setCookies', 'addedNewAccount')
    
            accIpc.on('newAccountTdid', async function (event, arg) {
                requiredCookie = "tdid=" + arg
        
                puuid = await switcher_getPlayerUUID();
        
                entitlement_token = await switcher_getEntitlement();
        
                var reagiondata = await switcher_getXMPPRegion();
                var region = reagiondata.affinities.live
        
                var new_account_data = await acc_axios.put("https://pd." + region + ".a.pvp.net/name-service/v2/players", "[\"" + puuid + "\"]");

                var account_rank_data = await acc_axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${region}/${puuid}`)

                console.log(account_rank_data)

                var currenttier = 0;
                if(account_rank_data.data.data.currenttier != undefined) {
                    var currenttier = account_rank_data.data.data.currenttier
                }
        
                var accObj = {
                    playerName: new_account_data.data[0].GameName,
                    playerTag: new_account_data.data[0].TagLine,
                    playerRegion: region,
                    playerUUID: puuid,
                    playerRank: `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${currenttier}/largeicon.png`,
                }
        
                console.log(accObj)

                accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', JSON.stringify(accObj));
        
                accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + puuid + '.json', JSON.stringify(accObj));
        
                if(!accFs.existsSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid)) {
                    accFs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid);
                }
        
                accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/token_data.json', JSON.stringify(data.tokenData));
                accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuid + '/cookies.json', JSON.stringify(data.riotcookies));

                if(id == "reload-page") {
                    window.location.href = "./settings.html?tab=riot";
                }
        
                var accountTile = document.createElement('div');
                accountTile.className = 'switch-acc-account-tile';
        
                var accRankWrapper = document.createElement('div');
                accRankWrapper.className = 'add-account-account-rank';
                accRankWrapper.style.width = "14%";
        
                var accRankImg = document.createElement('img');
                accRankImg.src = `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${currenttier}/largeicon.png`;
                accRankImg.className = "user-rank-img";
                if(currenttier == 0) {
                    accRankImg.classList.add('unranked');
                }
                accRankImg.style.width = "85%";
        
                accRankWrapper.appendChild(accRankImg);
        
                var accountName = document.createElement('span');
                accountName.className = 'account-tile-name';
                accountName.textContent = new_account_data.data[0].GameName + "#" + new_account_data.data[0].TagLine;
        
                var accountRegion = document.createElement('span');
                accountRegion.className = 'account-tile-region';
                accountRegion.textContent = region.toUpperCase();

                var accountRemove = document.createElement('i');
                accountRemove.className = 'fas fa-minus-circle';
                accountRemove.style.fontSize = "1.8em";
                accountRemove.style.marginRight = "1rem";
                accountRemove.style.marginLeft = "auto";
                accountRemove.style.display = "none";
        
                var accountCheckmark = document.createElement('i');
                accountCheckmark.className = 'fas fa-check-circle';
        
                accountCheckmark.style.marginLeft = "auto";
                accountCheckmark.style.marginRight = "1rem";
                accountCheckmark.style.fontSize = "1.8em";
    
                var hiddenPUUID = document.createElement('span');
                hiddenPUUID.style.display = "none";
                hiddenPUUID.textContent = puuid;
        
                accountTile.appendChild(accRankWrapper);
                accountTile.appendChild(accountName);
                accountTile.appendChild(accountRegion);
                accountTile.appendChild(accountRemove);
                accountTile.appendChild(accountCheckmark);
                accountTile.appendChild(hiddenPUUID);
        
                var wrapper = document.getElementById('switch-acc-accounts-wrapper');
                var lastElement = document.getElementById('lastAccountElement');
                wrapper.insertBefore(accountTile, lastElement);
            });
        }
    });

    $('.switch-acc-account-tile:not(.active-acc)').on("click", function(e) {
        // Get event target element type
        var targetType = e.target.tagName.toLowerCase();

        if(targetType != "i") {
            var currentPuuid = $('.switch-acc-account-tile.active-acc')[0].lastChild.textContent
            var currentUserCreds = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
            accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + currentPuuid + '.json', currentUserCreds)
    
            var currentUserTokens = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
            accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + currentPuuid + '/token_data.json', currentUserTokens)
    
            var currentUserCookies = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json');
            accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + currentPuuid + '/cookies.json', currentUserCookies)
    
            var puuidToBeSwitchedTo = this.lastChild.textContent;
            console.log(puuidToBeSwitchedTo)
            var newUserCreds = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + puuidToBeSwitchedTo + '.json');
            accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', newUserCreds);
    
            var newTokenData_raw = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuidToBeSwitchedTo + '/token_data.json');
            var newTokenData = JSON.parse(newTokenData_raw);
            accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', newTokenData_raw);
    
            var newCookieData_raw = accFs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuidToBeSwitchedTo + '/cookies.json');
            accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', newCookieData_raw);
    
            bearer = newTokenData.accessToken;
            id_token = newTokenData.id_token;
    
            accIpc.send('setCookies', 'reauth')
            accIpc.on('reauthTdid', async function (event, arg) {
                try {
                    requiredCookie = "tdid=" + arg
        
                    puuid = await switcher_getPlayerUUID();
        
                    entitlement_token = await switcher_getEntitlement();
        
                    var reagiondata = await switcher_getXMPPRegion();
                    region = reagiondata.affinities.live
        
                    var shopData = await switcher_getShopData();
                    accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/current_shop.json', JSON.stringify(shopData))
        
                    Date.prototype.addSeconds = function (seconds) {
                        var copiedDate = new Date(this.getTime());
                        return new Date(copiedDate.getTime() + seconds * 1000);
                    }
        
                    var dateData = {
                        lastCkeckedDate: new Date().getTime(),
                        willLastFor: new Date().addSeconds(shopData.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds)
                    }
        
                    accFs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/shop_data/last_checked_date.json', JSON.stringify(dateData))
                    window.location.href = ""
                } catch(err) {
                    window.location.href = ""
                }
            });
        } else {
            var puuidToBeDeleted = this.lastChild.textContent;
            accFs.unlinkSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/' + puuidToBeDeleted + '.json');
            accFs.unlinkSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuidToBeDeleted + '/token_data.json');
            accFs.unlinkSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuidToBeDeleted + '/cookies.json');
            accFs.rmdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/' + puuidToBeDeleted);
            this.remove();

            $('.switch-acc-account-tile.delete-active').removeClass('delete-active');
            $('.switch-acc-account-tile i.fas.fa-minus-circle').css('display', 'none');

            $('.switch-acc-account-tile.active-acc').css("display", "flex");
    
            $('#delete-acc-button').removeClass('cancel-active');
            $('#delete-acc-button').empty();
            $('#delete-acc-button').append('Remove an Account');
        }
    });

    var currentActiveAccount;

    $('#delete-acc-button').on("click", function() {
        if(this.textContent == "Remove an Account") {
            currentActiveAccount = $('.switch-acc-account-tile.active-acc');

            $('.switch-acc-account-tile.active-acc').css("display", "none");
    
            $('.switch-acc-account-tile:not(.active-acc)').addClass('delete-active');
            $('.switch-acc-account-tile.delete-active i.fas.fa-minus-circle').css('display', 'block');
    
            $('#delete-acc-button').addClass('cancel-active');
            $('#delete-acc-button').empty();
            $('#delete-acc-button').append('Cancel');
        } else if(this.textContent == "Cancel") {
            $('.switch-acc-account-tile.delete-active').removeClass('delete-active');
            $('.switch-acc-account-tile i.fas.fa-minus-circle').css('display', 'none');

            $('.switch-acc-account-tile.active-acc').css("display", "flex");
    
            $('#delete-acc-button').removeClass('cancel-active');
            $('#delete-acc-button').empty();
            $('#delete-acc-button').append('Remove an Account');
        }
    });
})
var fs = require('fs');

var token_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json');
var token_data = JSON.parse(token_data_raw);

var user_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
var user_data = JSON.parse(user_data_raw);

async function getEntitlement() {
    return (await (await this.fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
        method: 'POST',
        headers: {
            'authorization': 'Bearer ' + token_data.accessToken,
            'Content-Type': 'application/json',
            'User-Agent': ''
        },
    })).json())['entitlements_token'];
}

async function getPlayerLoadout() {
    return (await (await this.fetch(`https://pd.${user_data.playerRegion}.a.pvp.net/personalization/v2/players/${user_data.playerUUID}/playerloadout`, {
        method: 'GET',
        headers: {
            "X-Riot-Entitlements-JWT": entitlement_token,
            'authorization': "Bearer " + token_data.accessToken,
        },
    })).json());
}

$(document).ready(async () => {
    entitlement_token = await getEntitlement();
    try {
        var player_loadout = await getPlayerLoadout();
    } catch(e) {
        entitlement_token = await getEntitlement();
        var player_loadout = await getPlayerLoadout();
    }
    console.log(player_loadout.Guns);
    player_loadout.Guns.forEach(gun => {
        $(`.weapon-img[weapon-id="${gun.ID}"`).attr("src", `https://media.valorant-api.com/weaponskinchromas/${gun.ChromaID}/fullrender.png`);
    });
});
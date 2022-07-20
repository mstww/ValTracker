$(document).ready(() => {
    var accounts = fs.readdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts');

    var i = 0;
    accounts.forEach(file => {
        i++;
    });

    if(i >= 5) {
        $('#riot-acc-req + hr').remove();
        $('#riot-acc-req').remove();
    }

    if(i < 1) {
        $('#no-riot-acc-req + div').remove();
        $('#no-riot-acc-req').remove();
    }

    $('#remove-all-riot-accs').on('click', function () {
        fs.rmdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/', { recursive: true, force: true });

        fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/');

        var clean_token_data = {};
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/token_data.json', JSON.stringify(clean_token_data));

        var clean_cookies_data = [];
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/riot_games_data/cookies.json', JSON.stringify(clean_cookies_data));
        
        var user_accounts_dir = process.env.APPDATA + '/VALTracker/user_data/user_accounts/';
        var folders = fs.readdirSync(user_accounts_dir);
        
        for (var i in folders) {
            var folderPath = path.join(user_accounts_dir, folders[i]);
            if(fs.statSync(folderPath).isDirectory()) {
                fs.rmdirSync(folderPath);
            }
        }

        fs.rmdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/', { recursive: true, force: true });
        fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/user_accounts/');

        var user_data_raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
        var user_data = JSON.parse(user_data_raw);
        user_data.usesRiotAccount = false;

        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', JSON.stringify(user_data));
        window.location.href = "./settings.html?tab=riot";
    });
});
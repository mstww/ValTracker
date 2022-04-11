$(document).ready(() => {
    ipc.send('changeDiscordRP', `settings_activity`)
    var usernameSettingsFile = process.env.APPDATA + '/VALTracker/user_data/home_settings/settings.json'
    if(!fs.existsSync(usernameSettingsFile)) {
        let newUserName = {
            displayedUserName: ""
        };

        let dataToWrite = JSON.stringify(newUserName);
        fs.writeFileSync(usernameSettingsFile, dataToWrite); //Create File
    }

    let rawdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/settings.json');
    let dataToRead = JSON.parse(rawdata);
    $('#username-input').val(dataToRead.displayedUserName);
    $('#change-home-username-button').on("click", function () {
        var newNameVal = document.getElementById('username-input').value;
        dataToRead.displayedUserName = newNameVal;

        let dataToWrite = JSON.stringify(dataToRead);
        fs.writeFileSync(usernameSettingsFile, dataToWrite);

        $('#username-input').val(dataToRead.displayedUserName);
    })
    $('#reset-home-username-button').on("click", function () {
        dataToRead.displayedUserName = "";

        let dataToWrite = JSON.stringify(dataToRead);
        fs.writeFileSync(usernameSettingsFile, dataToWrite);

        $('#username-input').val("");
    })
})
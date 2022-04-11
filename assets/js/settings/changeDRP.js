var ipc = require('electron').ipcRenderer
$(document).ready(() => {
    var loadFile = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
    let rawdata = fs.readFileSync(loadFile);
    let dataToRead = JSON.parse(rawdata);

    if(dataToRead.hasDiscordRPenabled == true || dataToRead.hasDiscordRPenabled == undefined ) {
        $('#app-rp-switch input[type="checkbox"]').prop('checked', true);

        ipc.send('changeDiscordRP', `settings_activity`)
    } else {
        $('#app-rp-switch input[type="checkbox"]').prop('checked', false);

        ipc.send('changeDiscordRP', `clear`)
    }

    $('#app-rp-switch').on('change', function () {
        if($(`#app-rp-switch input[type="checkbox"]`).is( ":checked" )) {
            dataToRead.hasDiscordRPenabled = true;

            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);

            ipc.send('changeDiscordRP', `settings_activity`)
        } else {
            dataToRead.hasDiscordRPenabled = false;

            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);

            ipc.send('changeDiscordRP', "clear")
        }
    });
});
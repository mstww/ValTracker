var ipc = require('electron').ipcRenderer
$(document).ready(() => {
    var loadFile = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
    let rawdata = fs.readFileSync(loadFile);
    let dataToRead = JSON.parse(rawdata);

    if(dataToRead.hasDiscordRPenabled == true || dataToRead.hasDiscordRPenabled == undefined ) {
        $('#app-rp-switch input[type="checkbox"]').prop('checked', true);
    } else {
        $('#app-rp-switch input[type="checkbox"]').prop('checked', false);
    }

    $('#app-rp-switch').on('change', function () {
        console.log($(`#app-rp-switch input[type="checkbox"]`).is( ":checked" ))
        if($(`#app-rp-switch input[type="checkbox"]`).is( ":checked" )) {
            dataToRead.hasDiscordRPenabled = true;

            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);

            ipc.send('changeDiscordRP', `settings_activity`)
        } else {
            dataToRead.hasDiscordRPenabled = false;

            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);

            ipc.send('changeDiscordRP', `clear`)
        }
    });
});
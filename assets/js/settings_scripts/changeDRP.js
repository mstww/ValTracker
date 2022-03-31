var ipc = require('electron').ipcRenderer
const replaceText5 = (text) => {
    const element5 = document.getElementById("replace-textspan-5");
    if (element5) element5.innerText = text
}
$(document).ready(() => {
    var loadFile = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
    let rawdata = fs.readFileSync(loadFile);
    let dataToRead = JSON.parse(rawdata);
    if (typeof dataToRead.hasDiscordRPenabled === 'string') {
        $('#discord-rp-option').val(dataToRead.hasDiscordRPenabled);
    } else {
        $('#discord-rp-option').val(JSON.stringify(dataToRead.hasDiscordRPenabled));
    }
    document.getElementById('discord-rp-option').addEventListener('change', function () {
        var newSettingVal = document.getElementById('discord-rp-option').value;
        if (newSettingVal == "anonymous") {
            dataToRead.hasDiscordRPenabled = newSettingVal;

            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);
            replaceText5("Settings changed!")
            ipc.send('changeDiscordRP', `anonymous_activity`)
        } else {
            dataToRead.hasDiscordRPenabled = JSON.parse(newSettingVal);

            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);
            if (JSON.parse(newSettingVal) == false) {
                replaceText5("Settings changed!")
                ipc.send('changeDiscordRP', `clear`)
            } else {
                replaceText5("Settings changed!")
                ipc.send('changeDiscordRP', `settings_activity`)
            }
        }
    })
})
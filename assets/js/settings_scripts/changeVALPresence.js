var ipc = require('electron').ipcRenderer
const replaceText7 = (text) => {
    const element7 = document.getElementById("replace-textspan-7");
    if (element7) element7.innerText = text
}
$(document).ready(() => {
    var loadFile = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
    let rawdata = fs.readFileSync(loadFile);
    let dataToRead = JSON.parse(rawdata);
    if(dataToRead.hasValorantRPenabled == "true" || dataToRead.hasValorantRPenabled == undefined) {
        $('#valorant-rp-option').val('true');
    } else {
        $('#valorant-rp-option').val('false');
    }
    document.getElementById('valorant-rp-option').addEventListener('change', function () {
        var newSettingVal = document.getElementById('valorant-rp-option').value;
        console.log(newSettingVal)

        dataToRead.hasValorantRPenabled = newSettingVal;

        let dataToWrite = JSON.stringify(dataToRead);
        fs.writeFileSync(loadFile, dataToWrite);
        replaceText7("Settings changed! Changes will apply on restart.")
    })
})
var fs = require('fs');
var { ipcRenderer } = require('electron');

$(document).ready(() => {
    $('#reset-valtracker-button').on("click", function() {
        fs.rmdirSync(process.env.APPDATA + '/VALTracker/user_data', { recursive: true, force: true });
        ipcRenderer.send('relaunchApp');
    })
})
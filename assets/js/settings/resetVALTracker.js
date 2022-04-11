var fs = require('fs');
var app = require('@electron/remote').app;

$(document).ready(() => {
    $('#reset-valtracker-button').on("click", function() {
        fs.rmdirSync(process.env.APPDATA + '/VALTracker/user_data', { recursive: true, force: true });
        app.relaunch();
        app.exit(0);
    })
})
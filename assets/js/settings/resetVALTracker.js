var fs = require('fs');
var { ipcRenderer } = require('electron');

$(document).ready(() => {
    $('#reset-valtracker-button').on("click", function() {
        $('#reset-app-confirm-wrapper').css("opacity", "0");
        $('#reset-app-confirm-wrapper').css("display", "flex");
        $('#reset-app-confirm-wrapper').fadeTo(300, 1);
        $('#reset-app-confirm-card').css("display", "block");
        setTimeout(function () {
            $('#reset-app-confirm-card').fadeTo(150, 1)
            $('#reset-app-confirm-card').css("transform", "scale(1)");
        }, 1);
    });
    $('#reset-app-confirm-yes').on("click", function() {
        $('#reset-app-confirm-card').fadeTo(100, 0)
        $('#reset-app-confirm-card').css("transform", "scale(0.8)");
        $('#reset-app-confirm-wrapper').fadeTo(150, 0)
        setTimeout(function () {
            $('#reset-app-confirm-wrapper').css("display", "none");
            fs.rmdirSync(process.env.APPDATA + '/VALTracker/user_data', { recursive: true, force: true });
            ipcRenderer.send('relaunchApp');
        }, 150);
    });
    $('#reset-app-cancel').on("click", function() {
        $('#reset-app-confirm-card').fadeTo(100, 0)
        $('#reset-app-confirm-card').css("transform", "scale(0.8)");
        $('#reset-app-confirm-wrapper').fadeTo(150, 0)
        setTimeout(function () {
            $('#reset-app-confirm-wrapper').css("display", "none");
        }, 150);
    });
});
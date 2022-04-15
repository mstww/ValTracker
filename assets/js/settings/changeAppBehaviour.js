var { ipcRenderer } = require('electron');
var fs = require('fs');

$(document).ready(async () => {
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(data.startOnBoot == true) {
        $('#valtracker-startup-behavior-switch input[type="checkbox"]').prop('checked', true);

        ipcRenderer.send('openAppOnLogin', true)
    } else {
        ipcRenderer.send('openAppOnLogin', false)
    }
    
    if(data.minimizeOnClose == true) {
        $('#valtracker-closing-behavior-switch input[type="checkbox"]').prop('checked', true);
    }

    if(data.enableHardwareAcceleration == true || data.enableHardwareAcceleration == undefined) {
        $('#valtracker-ha-behavior-switch input[type="checkbox"]').prop('checked', true);
    } else {
        $('#valtracker-ha-behavior-switch input[type="checkbox"]').prop('checked', false);
    }

    $('#valtracker-startup-behavior-switch').on('change', function () {
        if($(`#valtracker-startup-behavior-switch input[type="checkbox"]`).is( ":checked" )) {
            ipcRenderer.send('openAppOnLogin', true)

            var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
            var data = JSON.parse(raw);
            data.startOnBoot = true;
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));
        } else {
            ipcRenderer.send('openAppOnLogin', false)

            var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
            var data = JSON.parse(raw);
            data.startOnBoot = false;
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));
        }
    });

    $('#valtracker-closing-behavior-switch').on('change', function () {
        if($(`#valtracker-closing-behavior-switch input[type="checkbox"]`).is( ":checked" )) {
            // Minimize app on close
            var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
            var data = JSON.parse(raw);
            data.minimizeOnClose = true;
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));
        } else {
            // Close app on close
            var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
            var data = JSON.parse(raw);
            data.minimizeOnClose = false;
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));
        }
    });

    $('#valtracker-ha-behavior-switch').on('change', function () {
        if($(`#valtracker-ha-behavior-switch input[type="checkbox"]`).is( ":checked" )) {
            var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
            var data = JSON.parse(raw);
            data.enableHardwareAcceleration = true;
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));
        } else {
            var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
            var data = JSON.parse(raw);
            data.enableHardwareAcceleration = false;
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));
        }
    });
});
var app = require('@electron/remote').app
var ipc = require('electron').ipcRenderer

const appFolder = path.dirname(process.execPath)
const exeName = path.basename(process.execPath)

$(document).ready(async () => {
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var data = JSON.parse(raw);

    if(data.startOnBoot == true) {
        $('#valtracker-startup-behavior-switch input[type="checkbox"]').prop('checked', true);

        ipc.invoke('is-dev').then((isDev) => {
            if(!isDev) {
                app.setLoginItemSettings({
                  openAtLogin: true
                })
            }
        });
    } else {
        ipc.invoke('is-dev').then((isDev) => {
            if(!isDev) { 
                app.setLoginItemSettings({
                  openAtLogin: false
                })
            }
        });
    }
    
    if(data.minimizeOnClose == true) {
        $('#valtracker-closing-behavior-switch input[type="checkbox"]').prop('checked', true);
    }

    $('#valtracker-startup-behavior-switch').on('change', function () {
        if($(`#valtracker-startup-behavior-switch input[type="checkbox"]`).is( ":checked" )) {
            ipc.invoke('is-dev').then((isDev) => {
                if(!isDev) {
                    app.setLoginItemSettings({
                      openAtLogin: true
                    })
                }
            });

            var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
            var data = JSON.parse(raw);
            data.startOnBoot = true;
            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(data));
        } else {
            ipc.invoke('is-dev').then((isDev) => {
                if(!isDev) {
                    app.setLoginItemSettings({
                      openAtLogin: false
                    })
                }
            });

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
});
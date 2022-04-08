const ipcRenderer = require('electron').ipcRenderer
const fs = require('fs')

ipcRenderer.on('restartDiscordRP', async function() {
    console.log("GOT A MESSAGE")
    var path = window.location.href;
    var page = path.split('/').pop();
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    var parsed = JSON.parse(raw);
    console.log(page)
    if(parsed.hasDiscordRPenabled == true) {
        switch(page) {
            case 'index.html':
                ipcRenderer.send('changeDiscordRP', `hub_activity`);
                break;
            case 'decoyIndex.html':
                ipcRenderer.send('changeDiscordRP', `hub_activity`);
                break;
            case 'weaponskins.html':
                ipcRenderer.send('changeDiscordRP', `skins_activity`);
                break;
            case 'bundles.html':
                ipcRenderer.send('changeDiscordRP', `bundles_activity`);
                break;
            case 'playerProfile.html':
                ipcRenderer.send('changeDiscordRP', `pprofile_acitivity`);
                break;
            case 'favMatches.html':
                ipcRenderer.send('changeDiscordRP', `favmatches_acitivity`);
                break;
            case 'playersearch.html':
                ipcRenderer.send('changeDiscordRP', `playersearch_acitivity`);
                break;
            case 'settings.html':
                ipcRenderer.send('changeDiscordRP', `settings_acitivity`);
                break;
            case 'patchnotes.html':
                ipcRenderer.send('changeDiscordRP', `patchnotes_acitivity`);
                break;
            case 'matchView.html':
                ipcRenderer.send('changeDiscordRP', `matchview_activity`);
                break;
            case 'playerStore.html':
                ipcRenderer.send('changeDiscordRP', `shop_activity`);
                break;
        }
    }
})

document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};
 
async function handleWindowControls() {

    var windowState = await ipcRenderer.invoke('checkWindowState')

    toggleMaxRestoreButtons(windowState);

    document.getElementById('min-button').addEventListener("click", event => {
        ipcRenderer.send('min-window');
    });

    document.getElementById('max-button').addEventListener("click", event => {
        ipcRenderer.send('max-window');
    });

    document.getElementById('restore-button').addEventListener("click", event => {
        ipcRenderer.send('restore-window');
    });

    document.getElementById('close-button').addEventListener("click", event => {
        ipcRenderer.send('close-window');
    });

    ipcRenderer.on('togglerestore', function(event, args) {
        toggleMaxRestoreButtons(args);
    })

    function toggleMaxRestoreButtons(isMaximized) {
        if (isMaximized == true) {
            document.body.classList.add('maximized');
        } else {
            document.body.classList.remove('maximized');
        }
    }
}
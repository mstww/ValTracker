const ipcRenderer = require('electron').ipcRenderer

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
import electron from 'electron';
import React from 'react';

const ipcRenderer = electron.ipcRenderer || false;

export default function WindowControls({ setup, migrate }) {
  function toggleMaxRestoreButtons(isMaximized) {
    if(isMaximized == true) {
      document.body.classList.add('maximized');
    } else {
      document.body.classList.remove('maximized');
    }
  }
  
  const handleMin = async () => {
    var args = await ipcRenderer.invoke("min-window");
    toggleMaxRestoreButtons(args);
  }
  
  const handleMax = async () => {
    var args = await ipcRenderer.invoke("max-window");
    document.body.classList.add("maximized");
    toggleMaxRestoreButtons(args);
  }
  
  const handleRestore = async () => {
    var args = await ipcRenderer.invoke("restore-window");
    document.body.classList.remove("maximized");
    toggleMaxRestoreButtons(args);
  }
  
  const handleClose = () => {
    ipcRenderer.send("close-window");
  }
  
  React.useEffect(() => {
    let eventTargetRef = ipcRenderer.on("togglerestore", (event, args) => {
      toggleMaxRestoreButtons(args);
    });
    return () => {
      eventTargetRef.removeAllListeners('togglerestore');
    }
  });

  React.useEffect(async () => {
    var windowState = await ipcRenderer.invoke('checkWindowState');
    toggleMaxRestoreButtons(windowState);
  }, []);

  return(
    <header id="titlebar" className='bg-maincolor-dark fixed top-0 left-0'>
      <div id="drag-region">
        <div id="window-title">
          <img className="titlebar-img" id="valtracker-logo" src="/icons/VALTracker_Logo_default.ico" />
          <span id="WindowName">VALTracker</span>
        </div>

        <div id="window-controls">

          <div className={"button " + (setup || migrate ? 'hidden' : 'flex')} id="min-button" onClick={ handleMin }>
            <img 
              className="icon"
              src='/icons/min-w-10.png'
              draggable="false" 
            />
          </div>
          <div className={"button " + (setup || migrate ? 'hidden' : 'flex')} id="max-button" onClick={ handleMax }>
            <img 
              className="icon"
              src='/icons/max-w-10.png'
              draggable="false" 
            />
          </div>
          <div className="button flex" id="restore-button" onClick={ handleRestore }>
            <img 
              className="icon"
              src='/icons/restore-w-10.png'
              draggable="false" 
            />
          </div>
          <div className={"button " + (migrate ? 'hidden' : 'flex')} id="close-button" onClick={ handleClose }>
            <img 
              className="icon"
              src='/icons/close-w-10.png'
              draggable="false" 
            />
          </div>
  
        </div>
      </div>
    </header>
  )
}
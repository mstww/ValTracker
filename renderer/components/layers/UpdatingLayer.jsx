import React from 'react';
import pjson from '../../../package.json';
import compareVersions from 'compare-versions';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { motion } from 'framer-motion';
import { Progress } from '@nextui-org/react';
import fetch from 'node-fetch';

const update_card_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const slider_card_variants = {
  hidden: { opacity: 0, x: 200, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'block' },
  exit: { opacity: 0, x: 200, y: 0, transitionEnd: { display: 'none' } },
}

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}

const fetchPatchnotes = async () => {
  var updateDenied = false;

  if(!updateDenied) {
    try {
      const response = await fetch(`https://api.valtracker.gg/patchnotes-beta`);
      const json = await response.json();

      var newest_version = json.data.version;
      var current_version = pjson.version;
    
      var newest_date = json.data.date;
      var newest_desc = json.data.desc;
    
      var version_compare = compareVersions(current_version, newest_version);
    
      if(version_compare == -1) {
        var formatted_date = moment(newest_date).format('D. MMMM, YYYY');
    
        var info = `${newest_version} (${formatted_date})`;

        var obj = {
          update_info: info,
          desc: newest_desc,
          unix_date: newest_date
        }
  
        return { errored: false, items: obj };
      }
      
      return { errored: true, items: false };
    } catch(err) {
      return { errored: true, items: err };
    }
  }
  return { errored: true, items: 'denied' };
}

function UpdateWindow() {
  const [ info, setInfo ] = React.useState('');
  const [ desc, setDesc ] = React.useState('');

  const [ downloadCardShown, setDownloadCardShown ] = React.useState(false);
  const [ updateCardShown, setUpdateCardShown ] = React.useState(false);
  const [ finishedCardShown, setFinishedCardShown ] = React.useState(false);
  const [ backgroundShown, setBackgroundShown ] = React.useState(false);

  const [ downloadBarProgress, setDownloadBarProgress ] = React.useState(0);

  const fetchUpdate = () => {
    ipcRenderer.send('fetch-update');
    
    setUpdateCardShown(false);
    setBackgroundShown(false);

    sessionStorage.setItem('update-denied', false);
  }

  const declineUpdate = () => {
    setUpdateCardShown(false);
    setBackgroundShown(false);

    sessionStorage.setItem('update-denied', true);
  }

  const finishUpdate = () => {
    localStorage.setItem('show-whats-new', true);
    ipcRenderer.send('quit-app-and-install');
  } 

  const restartLater = () => {
    setFinishedCardShown(false);
  }

  React.useEffect(() => {
    const fetchApi = async () => {
      const { errored, items } = await fetchPatchnotes();

      if(!errored) {
        setInfo(items.update_info);
        setDesc(items.desc);
        
        setUpdateCardShown(true);
        setBackgroundShown(true);
      } else {
        setUpdateCardShown(false);
        setBackgroundShown(false);
      }
    }
    if(!sessionStorage.getItem('update-denied')) {
      fetchApi();
    }
  }, []);

  React.useEffect(() => {
    ipcRenderer.on('update-found', () => {
      setDownloadCardShown(true);
    });
    ipcRenderer.on('update-download-percent', (event, arg) => {
      setDownloadBarProgress(arg);
    });
    ipcRenderer.on('update-download-finished', () => {
      setDownloadCardShown(false);
      setFinishedCardShown(true);
    });
    
    return () => {
      ipcRenderer.removeAllListeners('update-found');
      ipcRenderer.removeAllListeners('update-download-percent');
      ipcRenderer.removeAllListeners('update-download-finished');
    }
  })

  return (
    <>
      <motion.div 
        className='absolute bottom-0 left-0 w-screen h-screen flex items-center justify-center z-40 bg-black bg-opacity-80 pointer-events-none'
        key={"UpdateBackground"}
        variants={backdrop_variants}
        initial="hidden"
        animate={backgroundShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <motion.div 
          className="w-96 rounded-sm bg-maincolor mb-8 flex flex-col justify-between p-4 pb-2 pointer-events-auto shadow-lg"
          key={"UpdateCard"}
          variants={update_card_variants}
          initial="hidden"
          animate={updateCardShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <div className="mb-0">
            <h2 className="mb-0">AN UPDATE IS AVAILABLE</h2>
            <p id="update-info" className='text-gray-500 m-0'>{ info }</p>
            <p className='mb-4 mt-2' id="update-desc">{ desc }</p>
          </div>
          <div id="update-buttons" className=''>
            <button onClick={() => { fetchUpdate() }}>Download update</button>
            <button className="text-button" onClick={() => { declineUpdate() }}>Not now</button>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="w-96 absolute z-20 bottom-6 right-6 rounded-sm bg-maincolor border-2 border-maincolor-lightest flex-col justify-between p-4 pb-2 pointer-events-auto shadow-lg"
        key={"FinishedCard"}
        variants={slider_card_variants}
        initial="hidden"
        animate={finishedCardShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <div>
          <span className='mb-4 font-bold text-lg'>UPDATE DOWNLOADED</span>
          <p className='text-gray-500'>Click to quit, install and then restart.</p>
        </div>
        <div className="progress-bar-wrapper">
          <button onClick={() => { finishUpdate() }}>Restart App</button>
          <button className="text-button" onClick={() => { restartLater() }}>Not now</button>
        </div>
      </motion.div>

      <motion.div 
        className="w-96 absolute z-20 bottom-6 right-6 rounded-sm bg-maincolor border-2 border-maincolor-lightest flex-col justify-between p-4 pb-2 pointer-events-auto shadow-lg"
        key={"DownloadCard"}
        variants={slider_card_variants}
        initial="hidden"
        animate={downloadCardShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <div>
          <span className='mb-4 font-bold text-lg'>UPDATE DOWNLOADING</span>
          <Progress value={downloadBarProgress} color="gradient" size={'sm'} className={'my-4 bg-maincolor-lightest rounded-sm'} />
        </div>
      </motion.div>
    </>
  );
}

export default function UpdateLayer() {
  return(
    <div className="absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-center items-center pointer-events-none z-50">
      <UpdateWindow />
    </div>
  )  
}
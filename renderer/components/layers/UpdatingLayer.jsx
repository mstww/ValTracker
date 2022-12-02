import React from 'react';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { motion } from 'framer-motion';
import { Progress } from '@nextui-org/react';
import L from '../../locales/translations/updates.json';
import LocalText from '../translation/LocalText';
import { useRouter } from 'next/router';

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

function UpdateWindow({ isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();

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
    setIsOverlayShown(false);
  }

  const declineUpdate = () => {
    setUpdateCardShown(false);
    setBackgroundShown(false);
    setIsOverlayShown(false);
  }

  const finishUpdate = () => {
    ipcRenderer.send('quit-app-and-install');
  }

  const restartLater = () => {
    setFinishedCardShown(false);
  }

  React.useEffect(() => {
    var e = ipcRenderer.on('newUpdate', (event, args) => {
      moment.locale(router.query.lang);

      var formatted_date = moment(args.date).format('D. MMMM, YYYY');
  
      var info = `${args.version} (${formatted_date})`;

      setInfo(info);
      setDesc(args.desc);
      
      setUpdateCardShown(true);
      setBackgroundShown(true);
      setIsOverlayShown(true);
    });
    console.log(e);
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
      localStorage.setItem('show-whats-new', true);
    });
    
    return () => {
      ipcRenderer.removeAllListeners('update-found');
      ipcRenderer.removeAllListeners('update-download-percent');
      ipcRenderer.removeAllListeners('update-download-finished');
    }
  }, []);

  return (
    <>
      <motion.div 
        className='modal-backdrop priority'
        key={"UpdateBackground"}
        variants={backdrop_variants}
        initial="hidden"
        animate={backgroundShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <motion.div 
          className="modal fixed"
          key={"UpdateCard"}
          variants={update_card_variants}
          initial="hidden"
          animate={updateCardShown ? "enter" : "exit"}
          transition={{ type: 'ease-in', duration: 0.3 }}
        >
          <div className="mb-0">
            <h2 className="mb-0 font-bold">{LocalText(L, "info_card.header")}</h2>
            <p id="update-info" className='text-gray-500 m-0'>{ info }</p>
            <p className='mb-4 mt-2' id="update-desc">{ desc }</p>
          </div>
          <div id="update-buttons" className=''>
            <button className='button default' onClick={() => { fetchUpdate() }}>{LocalText(L, "info_card.button_1")}</button>
            <button className="button text" onClick={() => { declineUpdate() }}>{LocalText(L, "info_card.button_2")}</button>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="w-96 absolute z-20 bottom-6 right-6 card pb-2 pointer-events-auto"
        key={"FinishedCard"}
        variants={slider_card_variants}
        initial="hidden"
        animate={finishedCardShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <div>
          <span className='mb-4 font-bold text-lg'>{LocalText(L, "finished_card.header")}</span>
          <p className='text-gray-500'>{LocalText(L, "finished_card.desc")}</p>
        </div>
        <div className="progress-bar-wrapper">
          <button className='button default' onClick={() => { finishUpdate() }}>{LocalText(L, "finished_card.button_1")}</button>
          <button className="button text" onClick={() => { restartLater() }}>{LocalText(L, "finished_card.button_2")}</button>
        </div>
      </motion.div>

      <motion.div 
        className="w-96 absolute z-20 bottom-6 right-6 card pb-2 pointer-events-auto"
        key={"DownloadCard"}
        variants={slider_card_variants}
        initial="hidden"
        animate={downloadCardShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <div>
          <span className='mb-4 font-bold text-lg'>{LocalText(L, "download_card.header")}</span>
          <Progress value={downloadBarProgress} color="gradient" size={'xs'} className={'my-4 bg-maincolor-lightest rounded'} />
        </div>
      </motion.div>
    </>
  );
}

export default function UpdatingLayer({ isOverlayShown, setIsOverlayShown }) {
  return(
    <div className="absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-center items-center pointer-events-none z-50">
      <UpdateWindow setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown} />
    </div>
  )  
}
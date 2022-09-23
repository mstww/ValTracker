import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ipcRenderer } from 'electron';
import L from '../../locales/translations/navbar.json';
import LocalText from '../translation/LocalText';
import { Close } from '../SVGs';

const card_base_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}

export default function PlayerSearchModal() {
  const router = useRouter();
  
  const [ searchShown, setReauthShown ] = React.useState(false);

  React.useEffect(() => {
    ipcRenderer.on("openPlayerSearchModal", function(event, args) {
      console.log(args);
      setReauthShown(true);
    });
  }, []);

  return(
    <motion.div 
      className='absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-center items-center pointer-events-none z-50 bg-black bg-opacity-80'
      key={"ModalBackdrop"}
      variants={backdrop_variants}
      initial="hidden"
      animate={searchShown ? "enter" : "exit"}
      transition={{ type: 'ease-in', duration: 0.3 }}
    >
      <motion.div 
        className='flex flex-col justify-center items-center w-96 bg-maincolor rounded p-4 pointer-events-auto relative'
        key={"ModalCard"}
        variants={card_base_variants}
        initial="hidden"
        animate={searchShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <div 
          className='absolute z-30 top-4 right-4 ml-auto hover:bg-maincolor-lightest rounded cursor-pointer transition-all duration-100 ease-linear w-7 h-7 flex items-center justify-center'
          onClick={() => {
            setReauthShown(false);
          }}
        >
          <Close cls='w-8 p-1' />
        </div>
        <h2 className='mb-2'>{LocalText(L, "search_modal.header")}</h2>
        <br/> INPUT HERE <br/>
        <br/> SEARCH HISTORY HERE <br/>
        <div className='mt-4'>
          <button className='' onClick={() => { console.log("E") }}>{LocalText(L, "search_modal.button_1")}</button>
          <button className='text-button' onClick={() => { console.log("A") }}>{LocalText(L, "search_modal.button_2")}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
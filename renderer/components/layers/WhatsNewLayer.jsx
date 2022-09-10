import React from 'react';
import { motion } from 'framer-motion';
import fetch from 'node-fetch';
import parser from 'showdown';
import { useRouter } from 'next/router';
import L from '../../locales/translations/whats_new.json';
import LocalText from '../translation/LocalText';
import { Close } from '../SVGs';

const md_conv = new parser.Converter();

const card_variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0.8, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 0, scale: 0.8, transitionEnd: { display: 'none' } },
}

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}

export default function WhatsNewLayer() {
  const router = useRouter();
  
  const [ isWhatsNewShown, setIsWhatsNewShown ] = React.useState(false);
  const [ newVALTrackerVersion, setNewVALTrackerVersion ] = React.useState('');
  const [ whatsNewAdditions, setWhatsNewAdditions ] = React.useState('');
  const [ isAdditionsShown, setIsAdditionsShown ] = React.useState(true);
  const [ whatsNewFixes, setWhatsNewFixes ] = React.useState('');
  const [ isFixesShown, setIsFixesShown ] = React.useState(true);

  React.useEffect(async () => {
    if(localStorage.getItem('show-whats-new')) {
      var whats_new_data = await(await fetch('http://api.valtracker.gg/whats-new')).json();
      
      setNewVALTrackerVersion(whats_new_data.data.version.version);
      
      var newAdditions = md_conv.makeHtml(whats_new_data.data.whats_new.additions);
      setIsAdditionsShown(!(whats_new_data.data.whats_new.additions === "- "));
      var newFixes = md_conv.makeHtml(whats_new_data.data.whats_new.fixes);
      setIsFixesShown(!(whats_new_data.data.whats_new.fixes === "- "));

      setWhatsNewAdditions(newAdditions);
      setWhatsNewFixes(newFixes);

      setIsWhatsNewShown(true);

      localStorage.removeItem('show-whats-new');
    }
  }, []);

  return(
    <motion.div 
      className='absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-center items-center pointer-events-none z-50 bg-black bg-opacity-80'
      key={"WhatsNewBackdrop"}
      variants={backdrop_variants}
      initial="hidden"
      animate={isWhatsNewShown ? "enter" : "exit"}
      transition={{ type: 'ease-in', duration: 0.3 }}
      id={'whats-new-backdrop'}
    >
      <motion.div 
        className='relative flex flex-col justify-center items-center w-1/2 bg-maincolor rounded p-4 pointer-events-auto'
        key={"WhatsNewCard"}
        variants={card_variants}
        initial="hidden"
        animate={isWhatsNewShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
        id={'whats-new-card'}
      >
        <div 
          className='absolute z-30 top-4 right-4 ml-auto hover:bg-maincolor-lightest rounded cursor-pointer transition-all duration-100 ease-linear w-7 h-7 flex items-center justify-center'
          onClick={() => {
            setIsWhatsNewShown(false);
          }}
        >
          <Close cls='w-8 p-1' />
        </div>
        <h2 className='mb-0 pb-0'>{LocalText(L, "header")}</h2>
        <p className='relative bottom-2 mt-0 pt-0 text-gray-500'>{LocalText(L, "desc", newVALTrackerVersion)}</p>
        <span>{LocalText(L, "additions_header")}</span>
        <hr id='whats-new-hr' />
        <div className={'ml-4 mb-2 ' + (isAdditionsShown ? '' : 'hidden')} dangerouslySetInnerHTML={{ __html: whatsNewAdditions }}></div>
        <span>{LocalText(L, "fixes_header")}</span>
        <hr id='whats-new-hr' />
        <div className={'ml-4 mb-2 ' + (isFixesShown ? '' : 'hidden')} dangerouslySetInnerHTML={{ __html: whatsNewFixes }}></div>
        <span className='text-sm text-gray-500'>
          {LocalText(L, "bottom_text.text_1")}
          <span 
            className='cursor-pointer text-button-color hover:text-button-color-hover transition-all duration-100 ease-linear'
            onClick={() => { router.push('/settings?tab=patchnotes&lang=' + router.query.lang) }}
          > {LocalText(L, "bottom_text.link_text")} </span>
          {LocalText(L, "bottom_text.text_2")}
        </span>
      </motion.div>
    </motion.div>
  )
}
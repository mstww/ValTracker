import React from 'react';
import { motion } from 'framer-motion';
import fetch from 'node-fetch';
import parser from 'showdown';
import Link from 'next/link';

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
  const [ isWhatsNewShown, setIsWhatsNewShown ] = React.useState(false);
  const [ newVALTrackerVersion, setNewVALTrackerVersion ] = React.useState('');
  const [ whatsNewAdditions, setWhatsNewAdditions ] = React.useState('');
  const [ whatsNewFixes, setWhatsNewFixes ] = React.useState('');

  React.useEffect(async () => {
    if(localStorage.getItem('show-whats-new')) {
      var whats_new_data = await(await fetch('http://api.valtracker.gg/whats-new')).json();
      
      setNewVALTrackerVersion(whats_new_data.data.version.version);
      
      var newAdditions = md_conv.makeHtml(whats_new_data.data.whats_new.additions);
      var newFixes = md_conv.makeHtml(whats_new_data.data.whats_new.fixes);

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
        className='relative flex flex-col justify-center items-center w-96 bg-maincolor rounded-sm p-4 pointer-events-auto'
        key={"WhatsNewCard"}
        variants={card_variants}
        initial="hidden"
        animate={isWhatsNewShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
        id={'whats-new-card'}
      >
        <div 
          className='absolute z-30 top-4 right-4 ml-auto hover:bg-maincolor-lightest rounded-sm cursor-pointer transition-all duration-100 ease-linear w-7 h-7 flex items-center justify-center'
          onClick={() => {
            setIsWhatsNewShown(false);
          }}
        >
          <img src='/images/close.svg' className='w-8 p-1 shadow-img' />
        </div>
        <h2 className='mb-0 pb-0'>VALTracker has been updated!</h2>
        <p className='relative bottom-2 mt-0 pt-0 text-gray-500'>New Version: v{newVALTrackerVersion}</p>
        <span>What's new</span>
        <hr id='whats-new-hr' />
        <div className='ml-4 mb-2' dangerouslySetInnerHTML={{ __html: whatsNewAdditions }}></div>
        <span>New Fixes</span>
        <hr id='whats-new-hr' />
        <div className='ml-4 mb-2' dangerouslySetInnerHTML={{ __html: whatsNewFixes }}></div>
        <span className='text-sm text-gray-500'>
          Click 
          <span className='cursor-pointer text-button-color hover:text-button-color-hover transition-all duration-100 ease-linear'>
            <Link href={'/settings?tab=patchnotes'}> here </Link>
          </span>
          to see all Patchnotes 
        </span>
      </motion.div>
    </motion.div>
  )
}
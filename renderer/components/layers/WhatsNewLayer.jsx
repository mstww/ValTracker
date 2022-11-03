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

export default function WhatsNewLayer({ isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();
  
  const [ isWhatsNewShown, setIsWhatsNewShown ] = React.useState(false);
  const [ newVALTrackerVersion, setNewVALTrackerVersion ] = React.useState('');
  const [ whatsNewAdditions, setWhatsNewAdditions ] = React.useState('');
  const [ isAdditionsShown, setIsAdditionsShown ] = React.useState(true);
  const [ whatsNewFixes, setWhatsNewFixes ] = React.useState('');
  const [ isFixesShown, setIsFixesShown ] = React.useState(true);

  React.useEffect(async () => {
    if(localStorage.getItem('show-whats-new')) {
      var data = await(await fetch('http://localhost:4000/v1/changelog/summary')).json();
      
      setNewVALTrackerVersion(data.data.version);
      
      var newAdditions = md_conv.makeHtml(data.data.additions);
      setIsAdditionsShown(!(data.data.additions === "- " || data.data.additions === null));
      var newFixes = md_conv.makeHtml(data.data.fixes);
      setIsFixesShown(!(data.data.fixes === "- " || data.data.fixes === null));

      setWhatsNewAdditions(newAdditions);
      setWhatsNewFixes(newFixes);

      setIsWhatsNewShown(true);
      setIsOverlayShown(false);

      localStorage.removeItem('show-whats-new');
    }
  }, []);

  return(
    <motion.div 
      className='modal-backdrop priority'
      key={"WhatsNewBackdrop"}
      variants={backdrop_variants}
      initial="hidden"
      animate={isWhatsNewShown ? "enter" : "exit"}
      transition={{ type: 'ease-in', duration: 0.3 }}
      id={'whats-new-backdrop'}
    >
      <motion.div 
        className='modal summary'
        key={"WhatsNewCard"}
        variants={card_variants}
        initial="hidden"
        animate={isWhatsNewShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
        id={'whats-new-card'}
      >
        <div 
          className='close-icon-wrapper'
          onClick={() => {
            setIsWhatsNewShown(false);
            setIsOverlayShown(false);
          }}
        >
          <Close className='w-8 p-1' />
        </div>
        <h2 className='mb-0 pb-0'>{LocalText(L, "header")}</h2>
        <p className='relative bottom-2 mt-0 pt-0 text-gray-500'>{LocalText(L, "desc", newVALTrackerVersion)}</p>
        {
          isAdditionsShown ? 
          <>
            <span>{LocalText(L, "additions_header")}</span>
            <hr id='whats-new-hr' />
            <div className='ml-4 mb-2' dangerouslySetInnerHTML={{ __html: whatsNewAdditions }}></div>
          </>
          :
          null
        }
        {
          isFixesShown ? 
          <>
            <span>{LocalText(L, "fixes_header")}</span>
            <hr id='whats-new-hr' />
            <div className='ml-4 mb-2' dangerouslySetInnerHTML={{ __html: whatsNewFixes }}></div>
          </>
          :
          null
        }
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
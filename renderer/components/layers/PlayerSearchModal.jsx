import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ipcRenderer } from 'electron';
import L from '../../locales/translations/navbar.json';
import LocalText from '../translation/LocalText';
import { Close, Search } from '../SVGs';
import { executeQuery } from '../../js/dbFunctions.mjs';
import { useFirstRender } from '../useFirstRender';

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

export default function PlayerSearchModal({ isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();
  const firstRender = useFirstRender();
  
  const [ searchShown, setSearchShown ] = React.useState(false);
  const [ searchHistory, setSearchHistory ] = React.useState([]);
  const [ toggle, setToggle ] = React.useState(false);

  const inputRef = React.useRef();

  React.useEffect(() => {
    if(router.query.searchvalue) {
      // Decode the search value
      var decoded = decodeURIComponent(router.query.searchvalue);
      inputRef.current.value = decoded;
    }
  }, []);

  const handleHistoryClick = (name, tag, name_encoded) => {
    setSearchShown(false);
    setIsOverlayShown(false);
    router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
  }

  const removeItemFromHistory = async (name_encoded) => {
    await executeQuery(`DELETE FROM searchHistoryResult WHERE encoded_user = "${name_encoded}"`);
    setSearchHistory(current => current.filter((x) => x.encoded_user !== name_encoded));
  }

  React.useEffect(() => {
    ipcRenderer.on("openPlayerSearchModal", function(event, args) {
      if(args.length > 0) {
        setSearchHistory(args);
      }
      setSearchShown(true);
      setIsOverlayShown(true);
    });
  }, []);

  React.useEffect(async () => {
    if(!firstRender) {
      var search_history = await executeQuery(`SELECT name, tag, encoded_user, unix FROM searchHistoryResult ORDER BY unix LIMIT 5`);
      setSearchHistory(search_history);
    }
  }, []);

  const handlePlayerSearch = async (event) => {
    if(event.key === 'Enter') {
      setSearchShown(false);
      setIsOverlayShown(false);
      var name = event.target.value.split('#')[0];
      var tag = event.target.value.split('#')[1];
      var name_encoded = encodeURIComponent(name + '#' + tag);

      var search_history = await executeQuery(`SELECT name, tag, encoded_user, unix FROM searchHistoryResult ORDER BY unix LIMIT 5`);
      
      var user_found = false;
      for(var i = 0; i < search_history.length; i++) {
        if(search_history[i].encoded_user === name_encoded) {
          user_found = true;
        }
      }

      if(user_found === false) {
        await executeQuery(`CREATE searchHistoryResult SET name = "${name}", tag = "${tag}", encoded_user = "${name_encoded}", unix = ${Date.now()}`);
      }
      router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
      setToggle(!toggle);
    }
  }

  return(
    <motion.div 
      className='absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-center items-center pointer-events-none z-50 bg-black bg-opacity-60'
      key={"ModalBackdrop"}
      variants={backdrop_variants}
      initial="hidden"
      animate={searchShown ? "enter" : "exit"}
      transition={{ type: 'ease-in', duration: 0.3 }}
    >
      <motion.div 
        className='flex flex-col justify-center items-center modal fixed'
        key={"ModalCard"}
        variants={card_base_variants}
        initial="hidden"
        animate={searchShown ? "enter" : "exit"}
        transition={{ type: 'ease-in', duration: 0.3 }}
      >
        <div 
          className='close-icon-wrapper'
          onClick={() => {
            setSearchShown(false);
            setIsOverlayShown(false);
          }}
        >
          <Close className='w-8 p-1' />
        </div>
        <h2 className='mb-2 font-bold'>{LocalText(L, "search_modal.header")}</h2>
        <div 
          className={'group bg-button-color focus:outline-none text-sm z-20 pl-2.5 hover:bg-button-color-hover flex items-center py-1 rounded cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none mx-auto overflow-hidden'}
          onClick={() => { inputRef.current ? inputRef.current.focus() : null }}
        >
          <Search className={'transition-all duration-75 ease-linear cursor-pointer z-30 w-5 h-5 player-search-mgnfy relative'} />
          <input 
            id="skin-search"
            type='text'
            placeholder={LocalText(L, "search_modal.placeholder")}
            className={'bg-button-color focus:outline-none text-sm z-20 ml-1 font-light group-hover:bg-button-color-hover hover:bg-button-color-hover flex items-center py-1 rounded cursor-pointer outline-none mx-auto transition-all ease-in duration-100'}
            onKeyDown={handlePlayerSearch} 
            autoCorrect='off'
            spellCheck='false'
            ref={inputRef}
          />
        </div>
        <div className={(searchHistory.length > 0 ? 'block' : 'hidden' )}>
          <span className='text-lg block mt-4 font-bold'>{LocalText(L, "search_modal.history_header")}</span>
          <hr className='h-0.5 bg-black' />
          <ul className='w-full mt-1'>
            {searchHistory.map((searchValue, index) => {
              return(
                <li 
                  className='w-full flex items-center !mb-1 font-light p-2 border border-tile-color bg-tile-color bg-opacity-20 rounded hover:bg-opacity-50 active:bg-opacity-0 transition-all duration-100 ease-linear'
                  onClick={(e) => {
                    if(e.target.id !== "remove-el" && e.target.tagName !== "G" && e.target.tagName !== "SVG" && e.target.tagName !== "LINE" && e.target.tagName !== "g" && e.target.tagName !== "svg" && e.target.tagName !== "line" && e.target.tagName !== "path") {
                      handleHistoryClick(searchValue.name, searchValue.tag, searchValue.encoded_user);
                    }
                  }}
                  key={index}
                >
                  {searchValue.name}#{searchValue.tag}
                  <div 
                    id='remove-el'
                    className='ml-auto hover:bg-tile-color rounded cursor-pointer transition-all duration-100 ease-linear w-7 h-7 flex items-center justify-center'
                    onClick={() => {
                      removeItemFromHistory(searchValue.encoded_user);
                    }}
                  >
                    <Close className='w-8 p-1' />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className='mt-4'>
          <button className='button default' onClick={() => { setSearchShown(false); setIsOverlayShown(false); handlePlayerSearch({key: "Enter", target: inputRef.current}); }}>{LocalText(L, "search_modal.button_1")}</button>
          <button className='button text' onClick={() => { setSearchShown(false); setIsOverlayShown(false); }}>{LocalText(L, "search_modal.button_2")}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ipcRenderer } from 'electron';
import L from '../../locales/translations/navbar.json';
import LocalText from '../translation/LocalText';
import { Close, Search } from '../SVGs';
import fs from 'fs';

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
  
  const [ searchShown, setSearchShown ] = React.useState(false);
  const [ searchHistory, setSearchHistory ] = React.useState([]);

  const inputRef = React.useRef();

  React.useEffect(() => {
    if(router.query.searchvalue) {
      // Decode the search value
      var decoded = decodeURIComponent(router.query.searchvalue);
      inputRef.current.value = decoded;
    }
  }, []);

  const handleHistoryClick = (name, tag, name_encoded) => {
    router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
  }

  const removeItemFromHistory = (e, name_encoded) => {
    for(var i = 0; i < searchHistory.length; i++) {
      if(searchHistory[i].encoded_user === name_encoded) {
        delete searchHistory[i];
        var newArray = searchHistory.filter(value => Object.keys(value).length !== 0);
        searchHistory = newArray;
        setSearchHistory(searchHistory);

        var data = { "arr": newArray }

        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json', JSON.stringify(data));
      }
    }
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

  React.useEffect(() => {
    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json')) {
      var search_history = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json'));
      setSearchHistory(search_history.arr);
    }
  }, []);

  const handlePlayerSearch = (event) => {
    if(event.key === 'Enter') {
      setSearchShown(false);
      setIsOverlayShown(false);
      var name = event.target.value.split('#')[0];
      var tag = event.target.value.split('#')[1];
      var name_encoded = encodeURIComponent(name + '#' + tag);

      var search_history = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json'));

      var data = {
        "name": name,
        "tag": tag,
        "encoded_user": name_encoded
      }
      
      var user_found = false;
      for(var i = 0; i < search_history.arr.length; i++) {
        if(search_history.arr[i].encoded_user === name_encoded) {
          user_found = true;
        }
      }
      if(user_found === false) {
        if(search_history.arr.length >= 5) {
          delete search_history.arr[search_history.arr.length-1];
          var newArray = search_history.arr.filter(value => Object.keys(value).length !== 0);
          newArray.unshift(data);
      
          search_history.arr = newArray;
        } else {
          search_history.arr.unshift(data);
        }
      
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json', JSON.stringify(search_history));
      }

      router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
    }
  }

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
          className='absolute z-30 top-4 right-4 ml-auto hover:bg-black rounded cursor-pointer transition-all duration-100 ease-linear w-7 h-7 flex items-center justify-center'
          onClick={() => {
            setSearchShown(false);
            setIsOverlayShown(false);
          }}
        >
          <Close cls='w-8 p-1' />
        </div>
        <h2 className='mb-2'>{LocalText(L, "search_modal.header")}</h2>
        <div 
          className={'group bg-button-color focus:outline-none text-sm z-20 pl-2.5 hover:bg-button-color-hover hover:shadow-2xl flex items-center py-1 rounded cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none mx-auto overflow-hidden'}
          onClick={() => { inputRef.current ? inputRef.current.focus() : null }}
        >
          <Search cls={'transition-all duration-75 ease-linear cursor-pointer z-30 w-5 h-5 player-search-mgnfy relative'} />
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
          <span className='text-lg block mt-4'>{LocalText(L, "search_modal.history_header")}</span>
          <hr className='h-0.5 bg-black' />
          <ul className='w-full mt-1'>
            {searchHistory.map((searchValue, index) => {
              return(
                <li 
                  className='w-full flex items-center p-2 border-2 border-tile-color bg-tile-color bg-opacity-60 rounded hover:bg-opacity-100 transition-all duration-100 ease-linear'
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
                    className='ml-auto hover:bg-black rounded cursor-pointer transition-all duration-100 ease-linear w-7 h-7 flex items-center justify-center'
                    onClick={() => {
                      removeItemFromHistory(e, searchValue.encoded_user);
                    }}
                  >
                    <Close cls='w-8 p-1' />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className='mt-4'>
          <button className='' onClick={() => { setSearchShown(false); setIsOverlayShown(false); handlePlayerSearch({key: "Enter", target: inputRef.current}); }}>{LocalText(L, "search_modal.button_1")}</button>
          <button className='text-button' onClick={() => { setSearchShown(false); setIsOverlayShown(false); }}>{LocalText(L, "search_modal.button_2")}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
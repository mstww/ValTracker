import React from "react";
import fs from 'fs';
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Close, Search } from "../SVGs";

const account_switcher_variants = {
  open: { opacity: 1, y: 0, x: 0, scale: 1, transition: {
      duration: 0.2,
      ease: [0.6, 0.05, -0.01, 0.9]
    },
    display: "block",
  },
  closed: { opacity: 0, y: -20, x: 0, scale: 1, transition: {
      duration: 0.2,
      ease: [0.6, 0.05, -0.01, 0.9]
    },
    transitionEnd: {
      display: "none",
    },
  }
}

export default function PlayerSearch({ isSearchShown, searchDisabledClasses, handlePlayerSearch, playerSearchRef, searchHiddenDesc, placeholderText, closeLocale }) {
  const router = useRouter();

  const [ isHistoryDropdownShown, setIsHistoryDropdownShown ] = React.useState(false);
  const [ searchHistory, setSearchHistory ] = React.useState([]);
  const [ isHistoryLocked, setIsHistoryLocked ] = React.useState(false);

  React.useEffect(() => {
    if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json')) {
      var search_history = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json'));
      setSearchHistory(search_history.arr);
    }
  }, []);

  const handleHistoryClick = (name, tag, name_encoded) => {
    router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
  }

  const removeItemFromHistory = (name_encoded) => {
    for(var i = 0; i < searchHistory.length; i++) {
      if(searchHistory[i].encoded_user === name_encoded) {
        delete searchHistory[i];
        var newArray = searchHistory.filter(value => Object.keys(value).length !== 0);
        searchHistory = newArray;

        var data = { "arr": newArray }

        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/search_history/history.json', JSON.stringify(data));
      }
    }
    setIsHistoryLocked(false);
  }

  return (
    <>
      <div className='relative mb-6 mt-4 w-full mr-px search-container'>
        <input 
          id='skin-search'
          type='text'
          className={(isSearchShown ? 'bg-button-color focus:outline-none text-sm z-40 font-light pl-9 hover:bg-button-color-hover hover:shadow-2xl h-8 ml-px w-full flex items-center px-2 py-1 rounded cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none' : searchDisabledClasses)}
          placeholder={placeholderText}
          onKeyDown={handlePlayerSearch}
          autoCorrect='off'
          spellCheck='false'
          disabled={!isSearchShown}
          ref={playerSearchRef}
          onFocus={() => { 
            setIsHistoryLocked(false);
            setIsHistoryDropdownShown(true);
          }}
          onBlur={() => {
            setIsHistoryLocked(false);
          }}
          onClick={() => { 
            isSearchShown ? 
            (searchHistory.length > 0 ? setIsHistoryDropdownShown(true) : null)
            : 
            ipcRenderer.send('relayTextbox', searchHiddenDesc) 
          }}
        />
        <Search cls='absolute top-2 left-2 ml-0.5 w-4' />

        <motion.div 
          className={"absolute top-8 mt-2 ml-px bg-button-color z-30 w-full rounded search-dropdown shadow-xl"}
          variants={account_switcher_variants}
          initial='closed'
          animate={isHistoryDropdownShown || isHistoryLocked ? 'open' : 'closed'}
          transition={{ type: 'ease-in', duration: 0.3, delay: 0.35 }}
        >
          {searchHistory.map((item, index) => {
            return (
              <div 
                className={"h-8 w-full items-center flex pl-9 hover:bg-button-color-hover relative transition-all ease-in duration-100 border-b border-maincolor-lightest"}
                onClick={(e) => {
                  if(e.target.id !== "remove-el" && e.target.tagName !== "SVG" && e.target.tagName !== "SVG") {
                    setIsHistoryLocked(false);
                    setIsHistoryDropdownShown(false);
                    handleHistoryClick(item.name, item.tag, item.encoded_user);
                  }
                }}
              >
                <span className="text-sm font-light">{item.name + '#' + item.tag}</span>
                <div
                  id='remove-el'
                  className="absolute top-1 left-1 cursor-pointer hover:bg-maincolor-lightest hover:bg-opacity-90 rounded p-1 transition-all ease-in duration-100"
                  onClick={() => {
                    playerSearchRef.current.focus();
                    removeItemFromHistory(item.encoded_user);
                  }}
                  onMouseEnter={() => {
                    setIsHistoryLocked(true);
                  }}
                  onMouseLeave={() => {
                    setIsHistoryLocked(true);
                  }}
                >
                  <Close cls='w-4' />
                </div>
              </div>
            )
          })}
          <span 
            className="text-sm text-global-text hover:underline ml-2 cursor-pointer" 
            onClick={() => { 
              setIsHistoryLocked(false);
              setIsHistoryDropdownShown(false);
            }}
          >
            {closeLocale}
          </span>
        </motion.div>
      </div>
    </>
  )
}
import React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Close, Search } from "../SVGs";
import { ipcRenderer } from "electron";
import { executeQuery } from "../../js/dbFunctions";
import { useFirstRender } from "../useFirstRender";

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

export default function PlayerSearch({ isSearchShown, historyNotifSwitch, handlePlayerSearch, playerSearchRef, searchHiddenDesc, placeholderText, closeLocale, isNavbarMinimized, variants }) {
  const router = useRouter();
  const firstRender = useFirstRender();

  const [ isHistoryDropdownShown, setIsHistoryDropdownShown ] = React.useState(false);
  const [ searchHistory, setSearchHistory ] = React.useState([]);
  const [ isHistoryLocked, setIsHistoryLocked ] = React.useState(false);

  React.useEffect(async () => {
    if(!firstRender) {
      var search_history = await executeQuery(`SELECT name, tag, encoded_user, unix FROM searchHistoryResult ORDER BY unix DESC LIMIT 5`);
      setSearchHistory(search_history);
    }
  }, []);

  React.useEffect(async () => {
    var search_history = await executeQuery(`SELECT name, tag, encoded_user, unix FROM searchHistoryResult ORDER BY unix DESC LIMIT 5`);
    setSearchHistory(search_history);
  }, [historyNotifSwitch]);

  React.useEffect(() => {
    if(searchHistory.length === 0) {
      setIsHistoryDropdownShown(false);
      setIsHistoryLocked(false);
    }
  }, [searchHistory]);

  const handleHistoryClick = (name, tag, name_encoded) => {
    router.push(`/player?name=${name}&tag=${tag}&searchvalue=${name_encoded}&lang=${router.query.lang}`);
  }

  const removeItemFromHistory = async (name_encoded) => {
    await executeQuery(`DELETE FROM searchHistoryResult WHERE encoded_user = "${name_encoded}"`);
    setIsHistoryLocked(false);
    setSearchHistory(current => current.filter((x) => x.encoded_user !== name_encoded));
  }

  return (
    <>
      <div 
        className={'relative mb-6 mt-4 w-full transition-all duration-100 ease-linear search-container ' + (isNavbarMinimized ? 'minimized' : '')}
      >
        <motion.div 
          className={'group bg-button-color focus:outline-none text-sm z-20 pl-2.5 hover:bg-button-color-hover hover:shadow-2xl flex items-center py-1 rounded cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none mx-auto overflow-hidden ' + (isNavbarMinimized ? 'rounded-full w-10 h-10 px-0' : 'w-full h-8 px-2')}
          onClick={() => { isNavbarMinimized === true ? ipcRenderer.send("relayOpenPlayerSearchModal", searchHistory) : (playerSearchRef.current ? playerSearchRef.current.focus() : null) }}
          variants={variants}
          initial="initial"
          animate={isNavbarMinimized ? "minimize" : "maximize"}
          transition={{ delay: isNavbarMinimized ? 0.2 : 0.4, duration: 0.2, ease: "easeOut" }}
        >
          <Search className={'transition-all duration-75 ease-linear cursor-pointer z-30 w-5 h-5 player-search-mgnfy ' + (isNavbarMinimized ? 'absolute' : 'relative')} />
          <input 
            id="skin-search"
            type='text'
            placeholder={placeholderText}
            className={'bg-button-color focus:outline-none text-sm z-20 ml-1 font-light group-hover:bg-button-color-hover hover:bg-button-color-hover flex items-center py-1 rounded cursor-pointer outline-none mx-auto transition-all ease-in duration-100 ' + (isNavbarMinimized ? 'opacity-0' : 'w-full h-8 px-2')}
            onKeyDown={handlePlayerSearch} 
            autoCorrect='off'
            spellCheck='false'
            disabled={isNavbarMinimized ? true : !isSearchShown}
            ref={playerSearchRef}
            onFocus={() => {
              if(searchHistory.length !== 0) {
                setIsHistoryLocked(false);
                setIsHistoryDropdownShown(true);
              }
            }}
            onBlur={() => {
              setIsHistoryLocked(false);
            }}
            onClick={() => { 
              isSearchShown && searchHistory.length !== 0 ? 
              (searchHistory.length > 0 ? setIsHistoryDropdownShown(true) : null)
              : 
              (isSearchShown === false ? ipcRenderer.send('relayTextbox', searchHiddenDesc) : null)
            }}
          />
        </motion.div>

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
                className={"h-8 w-full items-center flex pl-9 hover:bg-button-color-hover relative transition-all ease-in duration-100 border-b border-tile-color hover:!rounded"}
                id="search-history-tile"
                onClick={(e) => {
                  if(e.target.id !== "remove-el" && e.target.tagName !== "G" && e.target.tagName !== "SVG" && e.target.tagName !== "LINE" && e.target.tagName !== "g" && e.target.tagName !== "svg" && e.target.tagName !== "line" && e.target.tagName !== "path") {
                    setIsHistoryLocked(false);
                    setIsHistoryDropdownShown(false);
                    handleHistoryClick(item.name, item.tag, item.encoded_user);
                  }
                }}
                key={index}
              >
                <span className="text-sm font-light">{item.name + '#' + item.tag}</span>
                <div
                  id='remove-el'
                  className="absolute top-1 left-1 cursor-pointer hover:bg-black rounded p-1 transition-all ease-in duration-100"
                  onClick={() => {
                    removeItemFromHistory(item.encoded_user);
                    playerSearchRef.current.focus();
                  }}
                >
                  <Close className='w-4' />
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
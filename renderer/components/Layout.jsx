import { motion } from "framer-motion"
import { useRouter } from "next/router";
import React from "react";
import MessageLayer from "./layers/MessageLayer";
import UpdatingLayer from "./layers/UpdatingLayer";
import ReauthLayer from "./layers/ReauthLayer"; 
import TextboxLayer from "./layers/TextboxLayer"
import WhatsNewLayer from "./layers/WhatsNewLayer";
import IpcLayer from "./layers/ipcLayer";
import PlayerSearchModal from "./layers/PlayerSearchModal";

const contentVariants = {
  hidden: { opacity: 0, x: 0, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: 0 },
}

export default function Layout({ children, classNames, setup, isNavbarMinimized }) {
  const router = useRouter();

  var theme = false;

  var path = router.pathname.split("/").pop()
  if(path == "") {
    path = "home"
  }
  
  React.useEffect(() => {
    document.body.classList.add(router.query.usedTheme);
  }, [ router.query ]);

  if(router.query.usedTheme) {
    theme = router.query.usedTheme;
  }

  var variants = {
    initial: {
      opacity: 0,
      marginLeft: "16rem"
    },
    minimize: {
      opacity: 1,
      marginLeft: "4rem",
      transition: { 
        type: 'ease-in', 
        duration: 0.1,
        delay: 0
      }
    },
    maximize: {
      opacity: 1,
      marginLeft: "16rem",
      transition: { 
        type: 'ease-out', 
        duration: 0.1, 
        delay: 0
      }
    }
  }
  
  return( 
    <motion.div 
      className={"flex flex-row bg-maincolor-light transition-all duration-100 ease-linear " + theme}
      variants={setup ? {} : variants}
      initial="initial"
      animate={isNavbarMinimized ? "minimize" : "maximize"}
    >
      <UpdatingLayer />
      {setup ? '' : <MessageLayer />}
      {setup ? '' : <ReauthLayer />}
      {setup ? '' : <TextboxLayer />}
      {setup ? '' : <WhatsNewLayer />}
      {setup ? '' : <IpcLayer />}
      {setup ? '' : <PlayerSearchModal />}
      <div className={"bg-maincolor-light relative left-0 z-40 overflow-auto " + (isNavbarMinimized ? ' strech' : ' no-strech')} id={setup ? 'layout-setup' : "Layout"}>
        <motion.main
          key={"E"}
          variants={contentVariants}
          initial="hidden"
          animate="enter"
          exit="exit"
          transition={{ type: 'ease', duration: 0.3 }}
          className={"bg-maincolor-light overflow-x-hidden h-full w-full overflow-auto absolute top-0 left-0 transition-all duration-100 ease-linear " + (classNames ? classNames : '')}
        >
          {children}
        </motion.main>
      </div>
    </motion.div>
  )
}
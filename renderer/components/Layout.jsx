import { motion } from "framer-motion"
import { useRouter } from "next/router";
import WindowControls from "./WindowControls";
import Navbar from "./Navbar";
import React from "react";
import fs from "fs";
import MessageLayer from "./layers/MessageLayer";
import UpdatingLayer from "./layers/UpdatingLayer";
import ReauthLayer from "./layers/ReauthLayer"; 
import TextboxLayer from "./layers/TextboxLayer"
import WhatsNewLayer from "./layers/WhatsNewLayer";
import IpcLayer from "./layers/ipcLayer";
import { ipcRenderer } from 'electron';

const variants = {
  hidden: { opacity: 0, x: 0, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: 0 },
}

export default function Layout({ children, classNames, setup }) {
  const router = useRouter();

  var legacy = false;

  var path = router.pathname.split("/").pop()
  if(path == "") {
    path = "home"
  }
  
  React.useEffect(() => {
    if(router.query.isLegacyTheme === true) {
      document.body.classList.add('legacy');
    } else {
      var theme_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json");
      var theme = JSON.parse(theme_raw);
      var theme_name = theme.themeName;
      if(theme_name == "legacy") {
        document.body.classList.add('legacy');
      }
    }
  }, []);

  if(router.query.isLegacyTheme === true) {
    legacy = true;
  }
  
  return( 
    <div className={"flex flex-row bg-maincolor-light " + (legacy ? 'legacy' : '')}>
      <WindowControls />
      <UpdatingLayer />
      {setup ? '' : <MessageLayer />}
      {setup ? '' : <ReauthLayer />}
      {setup ? '' : <TextboxLayer />}
      {setup ? '' : <WhatsNewLayer />}
      {setup ? '' : <IpcLayer />}
      {setup ? '' : <Navbar page={path} />}
      <div className="bg-maincolor-light relative left-0 top-7 z-40">
        <motion.main
          key={"E"}
          variants={variants}
          initial="hidden"
          animate="enter"
          exit="exit"
          transition={{ type: 'ease', duration: 0.3 }}
          id={setup ? 'layout-setup' : 'Layout'}
          className={"bg-maincolor-light overflow-x-hidden " + (classNames ? classNames : '') + (setup ? ' mt-px' : ' ')}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { NextUIProvider, createTheme } from '@nextui-org/react';
import { v5 as uuidv5 } from 'uuid';
import Navbar from '../components/Navbar';
import WindowControls from '../components/WindowControls';
import Head from 'next/head'

import '../styles/globals.css';
import { executeQuery } from '../js/dbFunctions';
import { useFirstRender } from '../components/useFirstRender';

const normal = createTheme({
  type: "dark",
  theme: {
    colors: {
      background: '#1b222b',
      gradient: 'linear-gradient(to right, #c80043, #6f00ff)',
      text: '#ffffff',
    },
  }
});

const legacy = createTheme({
  type: "dark",
  theme: {
    colors: {
      background: '#222222',
      gradient: 'linear-gradient(to right, #c80043, #6f00ff)',
      text: '#ffffff',
    },
  }
});

const light = createTheme({
  type: "light",
  theme: {
    colors: {
      background: '#d1d1d1',
      gradient: 'linear-gradient(to right, #2761FF, #BB1CFF)',
      text: '#141414',
      error: '#0072F5'
    },
  }
});

const dark = createTheme({
  type: "dark",
  theme: {
    colors: {
      background: '#363636',
      gradient: 'linear-gradient(to right, #FF047E, #832CFF)',
      text: '#ffffff',
    },
  }
});

const themes = {
  normal,
  legacy,
  light,
  dark
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const firstRender = useFirstRender();
  
  const [ theme, setTheme ] = React.useState('normal');
  pageProps.setTheme = setTheme;
  
  const [ isOverlayShown, setIsOverlayShown ] = React.useState(false);
  pageProps.setIsOverlayShown = setIsOverlayShown;
  pageProps.isOverlayShown = isOverlayShown;

  const [ isNavbarMinimized, setIsNavbarMinimized ] = React.useState(false);
  pageProps.isNavbarMinimized = isNavbarMinimized;

  var setup = router.pathname.split("/").pop() === "setup";
  var migrate = router.pathname.split("/").pop() === "migration";

  React.useEffect(async () => {
    if(!firstRender) {
      try {
        var uuid = uuidv5("appColorTheme", process.env.SETTINGS_UUID);
        var themeName = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
        setTheme(themeName[0].value);
      } catch(e) {
        console.log(e);
      }
    }
  }, []);

  React.useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <Head>
        <title>VALTracker</title>
      </Head>
      <NextUIProvider theme={theme ? themes[theme] : themes['normal']}>
        <WindowControls setup={setup} migrate={migrate} />
        {setup || migrate ? '' : <Navbar isNavbarMinimized={isNavbarMinimized} setIsNavbarMinimized={setIsNavbarMinimized} />}
        <AnimatePresence
          exitBeforeEnter={true}
          onExitComplete={() => window.scrollTo(0, 0)}
        >
          <Component key={router.asPath} {...pageProps} />
        </AnimatePresence>
      </NextUIProvider>
    </>
  );
}

export default MyApp;

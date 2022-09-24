import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { NextUIProvider, createTheme } from '@nextui-org/react';
import fs from 'fs';
import Navbar from '../components/Navbar';

import '../styles/globals.css';

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

const themes = {
  normal,
  legacy,
  light
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  const [ theme, setTheme ] = React.useState('normal');
  pageProps.setTheme = setTheme;

  const [ isNavbarMinimized, setIsNavbarMinimized ] = React.useState(false);
  pageProps.isNavbarMinimized = isNavbarMinimized;

  var setup = router.pathname.split("/").pop() === "setup";

  React.useEffect(() => {
    if(fs.existsSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json")) {
      var data = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
      if(data.themeName === "light") setLightTheme(true);
    }
  }, []);

  React.useEffect(() => {
    console.log(theme);
  }, [theme]);

  return (
    <>
      <NextUIProvider theme={theme ? themes[theme] : themes['normal']}>
        <WindowControls setup={setup} />
        {setup ? '' : <Navbar isNavbarMinimized={isNavbarMinimized} setIsNavbarMinimized={setIsNavbarMinimized} />}
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

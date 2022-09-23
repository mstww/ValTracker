import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { NextUIProvider, createTheme } from '@nextui-org/react';
import fs from 'fs';
import Navbar from '../components/Navbar';

import '../styles/globals.css';
import Layout from '../components/Layout';

const valtracker_theme = createTheme({
  type: "dark",
  theme: {
    colors: {
      gradient: 'linear-gradient(to right, #c80043, #6f00ff)',
      text: '#ffffff',
    },
  }
});

const light_theme = createTheme({
  type: "light",
  theme: {
    colors: {
      gradient: 'linear-gradient(to right, #2761FF, #BB1CFF)',
      text: '#141414',
      error: '#0072F5'
    },
  }
});

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [ lightTheme, setLightTheme ] = React.useState(false);

  const [ isNavbarMinimized, setIsNavbarMinimized ] = React.useState(false);

  var setup = router.pathname.split("/").pop() === "setup";

  var extraCls;
  switch(router.pathname.split("/").pop()) {
    case("setup"): {
      extraCls = "overflow-hidden"
      break;
    }
    case("shop"): {
      extraCls = "overflow-y-hidden"
    }
    default: {}
  }

  React.useEffect(() => {
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
    if(data.themeName === "light") setLightTheme(true);
  }, []);

  fs.watchFile(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json", () => {
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
    if(data.themeName === "light") setLightTheme(true);
    else setLightTheme(false);
  });

  return (
    <>
      <NextUIProvider theme={lightTheme ? light_theme : valtracker_theme}>
        {setup ? '' : <Navbar isNavbarMinimized={isNavbarMinimized} setIsNavbarMinimized={setIsNavbarMinimized} />}
        <AnimatePresence
          exitBeforeEnter={true}
          onExitComplete={() => window.scrollTo(0, 0)}
        >
          <Layout isNavbarMinimized={isNavbarMinimized} setup={setup} classNames={extraCls}>
            <Component key={router.asPath} {...pageProps} />
          </Layout>
        </AnimatePresence>
      </NextUIProvider>
    </>
  );
}

export default MyApp;

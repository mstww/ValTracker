import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { NextUIProvider, createTheme } from '@nextui-org/react';
import fs from 'fs';

import '../styles/globals.css';

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

  React.useEffect(() => {
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
    if(data.themeName === "light") setLightTheme(true);
  }, []);

  fs.watchFile(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json", () => {
    console.log("File changed!");
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
    if(data.themeName === "light") setLightTheme(true);
    else setLightTheme(false);
  });

  return (
    <>
      <NextUIProvider theme={lightTheme ? light_theme : valtracker_theme}>
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

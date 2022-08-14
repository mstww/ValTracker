import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { NextUIProvider, createTheme } from '@nextui-org/react';

import '../styles/globals.css';

const theme = createTheme({
  type: "dark",
  theme: {
    colors: {
      gradient: 'linear-gradient(to right, #c80043, #6f00ff)',
      text: '#ffffff',
    },
  }
})


function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return (
    <>
      <NextUIProvider theme={theme}>
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

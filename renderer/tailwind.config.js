var themeSwapper = require('tailwindcss-theme-swapper');

var legacyBeta = { 
  colors: {
    "maincolor": "#12171d", 
    "maincolor-light": "#1b222b", 
    "maincolor-lightest": "#242e3a", 
    "tile-color": "#242e3a",
    "gradient-left": "#c80043", 
    "gradient-right": "#6f00ff", 
    "button-color": "#c80043", 
    "button-color-hover": "#ff0055", 
    "button-text": "#ffffff", 
    "global-text": "#ffffff",
    "val-yellow": "#eaefb3",
    "scrollbar-bg": "#535353",
    "scrollbar-thumb-bg": "#c2c2c2",
    "scrollbar-thumb-hover": "#8a8a8a"
  }
};

var legacyAlpha = {
  colors: {
    "maincolor": "#2d2d2d",
    "maincolor-light": "#222222",
    "maincolor-lightest": "#101010",
    "tile-color": "#101010",
    "gradient-left": "#d61044",
    "gradient-right": "#6f00ff",
    "button-color": "#bc0233",
    "button-color-hover": "#d61044",
    "button-text": "#ffffff",
    "global-text": "#ffffff",
    "val-yellow": "#eaefb3",
    "scrollbar-bg": "#535353",
    "scrollbar-thumb-bg": "#c2c2c2",
    "scrollbar-thumb-hover": "#8a8a8a"
  },
}

var light = {
  colors: {
    "maincolor": "#b3b3b3",
    "maincolor-light": "#d1d1d1",
    "maincolor-lightest": "#ededed",
    "tile-color": "#ededed",
    "gradient-left": "#2761FF",
    "gradient-right": "#BB1CFF",
    "button-color": "#2C5AD6",
    "button-color-hover": "#3C70FF",
    "button-text": "#000000",
    "global-text": "#000000",
    "val-yellow": "#5e5e5d",
    "scrollbar-bg": "#c2c2c2",
    "scrollbar-thumb-bg": "#8a8a8a",
    "scrollbar-thumb-hover": "#535353"
  }
}

var normal = {
  colors: {
    "maincolor": "#090909",
    "maincolor-light": "#141414",
    "maincolor-lightest": "#1E1E1E",
    "tile-color": "#292929",
    "gradient-left": "#d61044",
    "gradient-right": "#832CFF",
    "button-color": "#bc0233",
    "button-color-hover": "#d61044",
    "button-text": "#ffffff",
    "global-text": "#ffffff",
    "val-yellow": "#eaefb3",
    "scrollbar-bg": "#535353",
    "scrollbar-thumb-bg": "#c2c2c2",
    "scrollbar-thumb-hover": "#8a8a8a"
  }
}

module.exports = {
  plugins: [
    themeSwapper({
      themes: [
        {
          name: 'base',
          selectors: [':root'],
          theme: normal,
        },
        {
          name: 'light',
          selectors: ['.light'],
          theme: light,
        },
        {
          name: 'legacyBeta',
          selectors: ['.legacyBeta'],
          theme: legacyBeta,
        },
        {
          name: 'legacyAlpha',
          selectors: ['.legacyAlpha'],
          theme: legacyAlpha,
        }
      ]
    })
  ],
  theme: {
    extend: {
      colors: {
        'val-blue': '#67c2a8',
        'val-red': '#f15c56'
      }
    }
  },
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
  ],
}
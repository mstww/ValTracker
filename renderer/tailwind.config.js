var themeSwapper = require('tailwindcss-theme-swapper');

var legacyBeta = { 
  colors: {
    "maincolor-dark": "#12171d", 
    "maincolor": "#1b222b", 
    "maincolor-less-opacity": "rgba(27, 34, 43, 0.8)",
    "maincolor-dim": "#1b222b", 
    "maincolor-light": "#1e2630", 
    "tile-color": "#242e3a",
    "gradient-left": "#c80043", 
    "gradient-right": "#6f00ff", 
    "button-color": "#c80043", 
    "button-color-hover": "#ff0055", 
    "button-text": "#ffffff", 
    "global-text": "#ffffff",
    'val-blue': '#6bf1e6',
    "val-yellow": "#f0cb74",
    "scrollbar-bg": "#535353",
    "scrollbar-thumb-bg": "#c2c2c2",
    "scrollbar-thumb-hover": "#8a8a8a"
  }
};

var legacyAlpha = {
  colors: {
    "maincolor-dark": "#2d2d2d",
    "maincolor": "#222222",
    "maincolor-less-opacity": "rgba(34, 34, 34, 0.8)",
    "maincolor-dim": "#161616",
    "maincolor-light": "#101010",
    "tile-color": "#101010",
    "gradient-left": "#d61044",
    "gradient-right": "#6f00ff",
    "button-color": "#bc0233",
    "button-color-hover": "#d61044",
    "button-text": "#ffffff",
    "global-text": "#ffffff",
    'val-blue': '#6bf1e6',
    "val-yellow": "#f0cb74",
    "scrollbar-bg": "#535353",
    "scrollbar-thumb-bg": "#c2c2c2",
    "scrollbar-thumb-hover": "#8a8a8a"
  },
}

var light = {
  colors: {
    "maincolor-dark": "#b3b3b3",
    "maincolor": "#c9c9c9",
    "maincolor-less-opacity": "rgba(201, 201, 201, 0.8)",
    "maincolor-dim": "#e0e0e0",
    "maincolor-light": "#ededed",
    "tile-color": "#ffffff",
    "gradient-left": "#2761FF",
    "gradient-right": "#BB1CFF",
    "button-color": "#2C5AD6",
    "button-color-hover": "#3C70FF",
    "button-text": "#000000",
    "global-text": "#000000",
    'val-blue': '#4bccc0',
    "val-yellow": "#5e5e5d",
    "scrollbar-bg": "#c2c2c2",
    "scrollbar-thumb-bg": "#8a8a8a",
    "scrollbar-thumb-hover": "#535353"
  }
}

var normal = {
  colors: {
    "maincolor-dark": "#090909",
    "maincolor": "#121212",
    "maincolor-less-opacity": "rgba(18, 18, 18, 0.8)",
    "maincolor-dim": "#1E1E1E",
    "maincolor-light": "#3a3d42",
    "tile-color": "#292929",
    "gradient-left": "#d61044",
    "gradient-right": "#832CFF",
    "button-color": "#bc0233",
    "button-color-hover": "#d61044",
    "button-text": "#ffffff",
    "global-text": "#ffffff",
    'val-blue': '#6bf1e6',
    "val-yellow": "#f0cb74",
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
        'val-red': '#fb4d50'
      }
    }
  },
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
  ],
}
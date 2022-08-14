var themeSwapper = require('tailwindcss-theme-swapper');

var mainTheme = { 
  colors: {
    "maincolor": "#12171d", 
    "maincolor-light": "#1b222b", 
    "maincolor-lightest": "#242e3a", 
    "gradient-left": "#c80043", 
    "gradient-right": "#6f00ff", 
    "button-color": "#c80043", 
    "button-color-hover": "#ff0055", 
    "button-text": "#ffffff", 
    "global-text": "#ffffff", 
    "logo-style": "default", 
  }
};

var legacy_theme = {
  colors: {
    "maincolor": "#2d2d2d",
    "maincolor-light": "#222222",
    "maincolor-lightest": "#101010",
    "gradient-left": "#d61044",
    "gradient-right": "#d6107d",
    "button-color": "#bc0233",
    "button-color-hover": "#d61044",
    "button-text": "#ffffff",
    "global-text": "#ffffff",
    "logo-style": "normal"
  },
}

module.exports = {
  plugins: [
    themeSwapper({
      themes: [
        {
          name: 'base',
          selectors: [':root'],
          theme: mainTheme,
        },
        {
          name: 'legacy',
          selectors: ['.legacy'],
          theme: legacy_theme,
        },
      ]
    })
  ],
  theme: {
    extend: {
      colors: {
        'val-blue': '#67c2a8',
        'val-red': '#f15c56',
        'val-yellow': '#eaefb3',
      }
    }
  },
  content: [
    "./pages/**/*.jsx",
    "./components/**/*.jsx",
    "./js/**/*.js",
  ],
}
const Dotenv = require('dotenv-webpack');

module.exports = {
  webpack: (defaultConfig, env) => Object.assign(defaultConfig, {
    plugins: [
      new Dotenv()
    ],
    experiments: {
      topLevelAwait: true
    }
  }),
};
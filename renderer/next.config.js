module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
      config.node = {
        __dirname: true,
      };
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  env: {
    "DB_PORT": process.env.DB_PORT,
    "DB_URL": process.env.DB_URL,
    "SETTINGS_UUID": process.env.SETTINGS_UUID,
    "CACHE_UUID": process.env.CACHE_UUID,
    "RIOT_UUID": process.env.RIOT_UUID,
    "SERVICE_UUID": process.env.SERVICE_UUID,
    "APPCONFIG_UUID": process.env.APPCONFIG_UUID,
    "DB_USER": process.env.DB_USER,
    "DB_PASS": process.env.DB_PASS
  }
};
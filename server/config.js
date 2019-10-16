require("dotenv").config();

const LogService = require("./util/LogService");

const lastUpdated = require("../last-updated.json");
const packageJson = require("../package.json");

const config = {
  logger: new LogService().logger,
  httpPort: process.env.HTTP_PORT,
  appUsername: process.env.APP_USERNAME,
  appPassword: process.env.APP_PASSWORD,
  appDisplayName: process.env.APP_DISPLAY_NAME,
  sessionSecret: process.env.SESSION_SECRET,
  appUrl: process.env.APP_URL,
  lastUpdated: lastUpdated.lastUpdated,
  env: process.env.NODE_ENV || "production", // run in production by default
  version: packageJson.version
};

module.exports = {
  init: () => {
    const allKeysPresent = Object.values(config).filter(e => Boolean(e)).length === Object.keys(config).length;

    if (!allKeysPresent) {
      return Promise.reject("Not all data initialized");
    }

    return Promise.resolve(config);
  }
};

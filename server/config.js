require("dotenv").config();

const LogService = require("./services/LogService");
const lastUpdated = require("../last-updated.json");
const packageJson = require("../package.json");

const config = {
  logger: new LogService().logger,
  httpPort: process.env.HTTP_PORT,
  lastUpdated: lastUpdated.lastUpdated,
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

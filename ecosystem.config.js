module.exports = {
  apps: [
    {
      name: "shorty",
      script: "server/shorty.js",
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};

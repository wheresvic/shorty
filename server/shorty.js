const env = process.env.NODE_ENV || "development";

const configuration = require("./config");
const ShortyHttpServer = require("./ShortyHttpServer");

function main() {
  configuration
    .init()
    .then(ic => {
      const server = new ShortyHttpServer(ic);
      server.listen(ic.httpPort);
      ic.logger.info("ShortyHttpServer listening on " + ic.httpPort);
      return ic;
    })
    .catch(err => {
      console.error(err);
    });
}

Promise.resolve(main());

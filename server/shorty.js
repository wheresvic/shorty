const configuration = require("./config");

const ShortyHttpServer = require("./routes/ShortyHttpServer");
const DbNeDB = require("./db/DbNeDB");

function main() {
  configuration
    .init()
    .then(async ic => {
      const db = new DbNeDB(ic);
      await db.init();

      const server = new ShortyHttpServer(ic, db);
      server.listen(ic.httpPort);
      ic.logger.info("ShortyHttpServer listening on " + ic.httpPort);
      
    })
    .catch(err => {
      console.error(err);
    });
}

Promise.resolve(main());

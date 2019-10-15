const express = require("express");
const helmet = require("helmet");
const mustacheExpress = require("mustache-express");
const moment = require("moment");

const wrap = fn => {
  return async function(req, res, next) {
    let e = null;
    try {
      await fn(req, res, next);
    } catch (err) {
      e = err;
      next(err);
    }

    if (!e) {
      next();
    }
  };
};

class ShortyHttpServer {
  constructor(ic) {
    const lastUpdated = moment.unix(ic.lastUpdated).fromNow();
    const logger = ic.logger;
    const server = express();
    server.engine("mst", mustacheExpress());
    server.set("view engine", "mst");
    server.set("views", __dirname + "/views");

    /*
     * Helmet is actually just a collection of nine smaller middleware functions that set security-related HTTP headers:
     * - `csp` sets the Content-Security-Policy header to help prevent cross-site scripting attacks and other cross-site injections.
     * - `hidePoweredBy` removes the X-Powered-By header.
     * - `hpkp` Adds Public Key Pinning headers to prevent man-in-the-middle attacks with forged certificates.
     * - `hsts` sets Strict-Transport-Security header that enforces secure (HTTP over SSL/TLS) connections to the server.
     * - `ieNoOpen` sets X-Download-Options for IE8+.
     * - `noCache` sets Cache-Control and Pragma headers to disable client-side caching.
     * - `noSniff` sets X-Content-Type-Options to prevent browsers from MIME-sniffing a response away from the declared content-type.
     * - `frameguard` sets the X-Frame-Options header to provide clickjacking protection.
     * - `xssFilter` sets X-XSS-Protection to enable the Cross-site scripting (XSS) filter in most recent web browsers.
     */
    server.use(helmet());

    server.get("/", function(req, res) {
      
      res.render("main", { lastUpdated });
    });

    server.use(express.static("public"));

    server.use((req, res) => {
      res.status(404).send();
    });

    this.server = server;
  }

  listen(port) {
    return this.server.listen(port);
  }
}

module.exports = ShortyHttpServer;

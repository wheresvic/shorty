const express = require("express");
const helmet = require("helmet");
const mustacheExpress = require("mustache-express");
const moment = require("moment");
const session = require("express-session");
const SessionFileStore = require("session-file-store")(session);
const bodyParser = require("body-parser");
const passport = require("passport");
const flash = require("connect-flash");
const path = require("path");
const os = require("os");

const { wrap, middlewareSetMimeTypeTextHtml } = require("./middleware");
const auth = require("./auth");
const linkSchema = require("../schemas/link");
const { generateShortLinkObj, createShortLink } = require("../util/link-util");
const routesEncryptDecryptText = require("./routes-encrypt-decrypt-text");

// TODO: cache?

class ShortyHttpServer {
  constructor(ic, db) {
    ic.logger.info("Shorty server running in " + ic.env);

    const globalRenderData = {
      version: ic.version,
    };

    const sessionOptions = {
      secret: ic.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3 * 3600 * 1000 },
    };

    if (ic.env === "development") {
      ic.logger.info("sticky sessions for development");
      sessionOptions.store = new SessionFileStore({});
    }

    const server = express();

    server.engine("mst", mustacheExpress());
    server.set("view engine", "mst");
    server.set("views", path.join(__dirname, "..", "views"));

    server.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );

    server.use(session(sessionOptions));
    server.use(bodyParser.urlencoded({ extended: true }));

    server.use(passport.initialize());
    server.use(passport.session());
    server.use(flash());

    auth(ic);

    server.use(function (req, res, next) {
      const lastUpdated = moment.unix(ic.lastUpdated).fromNow();
      req.renderData = { ...globalRenderData, lastUpdated, username: null };

      if (req.user) {
        req.renderData.username = req.user.username;
      }

      next();
    });

    const middlewareStats = function (req, res, next) {
      try {
        getStats(db)
          .then((stats) => {
            req.renderData = { ...req.renderData, ...stats };
            next();
          })
          .catch((err) => {
            next(err);
          });
      } catch (err) {
        next(err);
      }
    };

    //
    // index
    //

    //
    // get the main page
    // in case there was a login attempt, display a notification (due to redirection)
    //
    server.get("/", middlewareSetMimeTypeTextHtml, middlewareStats, function (req, res) {
      const errorMessage = req.flash("error")[0];
      if (errorMessage) {
        req.renderData.notification = { message: errorMessage, type: "error" };
      } else {
        req.flash("error", "");
      }

      // console.log(req.renderData);
      res.render("index", { ...req.renderData });
    });

    //
    // submit a link for shortening (this is where the main action takes place)
    // - check if user logged in
    // - check link validity
    //
    server.post(
      "/",
      middlewareSetMimeTypeTextHtml,
      middlewareStats,
      wrap(async function (req, res) {
        let linkObj = {
          link: req.body.link ? req.body.link.trim() : "",
          userId: req.renderData.username,
          when: moment().unix(),
        };

        if (req.body.shortLinkId !== undefined) {
          req.body.shortLinkId = req.body.shortLinkId.trim();
          if (req.body.shortLinkId) {
            linkObj.shortLinkId = req.body.shortLinkId;
          }
        }

        if (linkObj.userId) {
          const { error } = linkSchema.validate(linkObj);
          if (error) {
            req.renderData.notification = { message: error.message, type: "error" };
          } else {
            try {
              linkObj = await shortenLink(ic, db, linkObj);
              req.renderData.notification = {
                message: "Successfully shortened link: " + linkObj.link,
                type: "success",
              };
            } catch (e) {
              req.renderData.notification = { message: e.message, type: "error" };
            }
          }
        } else {
          req.renderData.notification = { message: "Need to be logged in to perform this action!", type: "error" };
        }

        /*
        if (!req.renderData.notification) {
          
        }
        */

        req.renderData = Object.assign(req.renderData, linkObj);

        // console.log(req.renderData);
        res.render("index", { ...req.renderData });
      })
    );

    //
    // profile
    //

    server.get(
      "/links",
      middlewareSetMimeTypeTextHtml,
      wrap(async function (req, res) {
        if (!req.renderData.username) {
          res.redirect("/");
          return;
        }

        const userLinks = await getUserLinkDetails(db, req.renderData.username);
        res.render("links", { links: userLinks, ...req.renderData });
      })
    );

    //
    // delete a link
    //

    server.post(
      "/links",
      middlewareSetMimeTypeTextHtml,
      wrap(async function (req, res) {
        if (!req.renderData.username) {
          res.redirect("/");
          return;
        }

        await db.linkRemoveById(req.body.linkId);
        await db.clickRemoveByShortLinkId(req.body.shortLinkId);
        req.renderData.notification = { message: "Successfully deleted link " + req.body.link, type: "success" };

        const userLinks = await getUserLinkDetails(db, req.renderData.username);
        res.render("links", { links: userLinks, ...req.renderData });
      })
    );

    //
    // profile
    //

    server.get(
      "/to/:shortLinkId",
      wrap(async function (req, res) {
        const linkObj = await db.linkGetByShortLinkId(req.params.shortLinkId);

        if (linkObj) {
          const clickObj = {
            ...linkObj,
            when: new Date().getTime(),
          };

          delete clickObj._id;

          await db.clickAdd(clickObj);

          res.redirect(linkObj.link);
          return;
        }
        res.sendStatus(404);
      })
    );

    //
    // encrypt text
    //

    server.get("/encrypt-decrypt-text", middlewareSetMimeTypeTextHtml, routesEncryptDecryptText.encryptTextGet);
    server.post("/do-encrypt-text", middlewareSetMimeTypeTextHtml, routesEncryptDecryptText.doEncryptTextPost);
    server.post("/do-decrypt-text", middlewareSetMimeTypeTextHtml, routesEncryptDecryptText.doDecryptTextPost);

    //
    // auth
    //

    server.post(
      "/login",
      passport.authenticate("local", { successRedirect: "/", failureRedirect: "/", failureFlash: true })
    );

    server.get("/logout", function (req, res) {
      req.logout();
      res.redirect("/");
    });

    //
    // public
    //

    server.use(express.static("public"));

    //
    // 404
    //

    server.use(function (req, res) {
      res.status(404).send();
    });

    if (ic.env === "production") {
      // no stack traces in production
      server.use(function (err, req, res, next) {
        console.error(err.stack);
        res.status(500).send("Something broke!");
      });
    }

    this.server = server;
  }

  listen(port) {
    return this.server.listen(port);
  }

  getServer() {
    return this.server;
  }
}

const shortenLink = async function (ic, db, linkObj) {
  if (linkObj.shortLinkId) {
    const found = await db.linkGetByShortLinkId(linkObj.shortLinkId);
    if (found) {
      throw new Error("Provided shortLinkId is already in use.");
    }

    linkObj.shortLink = createShortLink(ic.appUrl, linkObj.shortLinkId);
  } else {
    const shortLinkObj = await generateShortLinkObj(ic.appUrl, db);
    linkObj.shortLink = shortLinkObj.shortLink;
    linkObj.shortLinkId = shortLinkObj.shortLinkId;
  }

  const doc = await db.linkAdd(linkObj);
  return doc;
};

const getStats = async function (db) {
  const duration = moment.duration(os.uptime() * 1000);

  return {
    numLinks: await db.linkCount(),
    numClicks: await db.clickCount(),
    uptime: duration.humanize(),
  };
};

const getUserLinkDetails = async function (db, userId, sort = "DESC") {
  const userLinks = await db.linkGetByUserId(userId);
  const userClicks = await db.clickGetByUserId(userId);

  const linkMap = {};

  for (const link of userLinks) {
    link.clickCount = 0;
    linkMap[link.shortLinkId] = link;
    linkMap[link.shortLinkId];
  }

  for (const click of userClicks) {
    linkMap[click.shortLinkId].clickCount++;
  }

  userLinks.sort((a, b) => {
    if (sort === "DESC") {
      return b.when - a.when;
    }

    return a.when - b.when;
  });

  // note that references are the same so can reuse existing array :)
  return userLinks;
};

/*
function format(seconds) {
  function pad(s) {
    return (s < 10 ? "0" : "") + s;
  }
  var hours = Math.floor(seconds / (60 * 60));
  var minutes = Math.floor((seconds % (60 * 60)) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}
*/

module.exports = ShortyHttpServer;

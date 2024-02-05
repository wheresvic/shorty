const express = require("express");
const helmet = require("helmet");
const mustacheExpress = require("mustache-express");
const session = require("express-session");
const SessionFileStore = require("session-file-store")(session);
const bodyParser = require("body-parser");
const passport = require("passport");
const flash = require("connect-flash");
const path = require("path");
const os = require("os");
const { DateTime, Duration } = require("luxon");
const humanizeDuration = require("humanize-duration");

const { middlewareSetMimeTypeTextHtml } = require("./middleware");
const auth = require("./auth");
const linkSchema = require("../schemas/link");
const { generateShortLinkObj, createShortLink } = require("../util/link-util");
const routesEncryptDecryptText = require("./routes-encrypt-decrypt-text");
const { filter } = require("domutils");

// TODO: cache?

// these need to have a solid fontawesome icon associated with them: `fas fa-download`
const Category = Object.freeze({
  download: { name: "download", icon: "download" },
  bookmark: { name: "bookmark", icon: "bookmark" },
});

const categoryOptions = Object.values(Category).map((v) => {
  return { category: v.name, icon: v.icon };
});

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
      const lastUpdated = DateTime.fromSeconds(parseInt(ic.lastUpdated, 10)).toISO();
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
        req.renderData.notification = { message: errorMessage, type: "is-danger" };
      } else {
        req.flash("error", "");
      }

      // console.log(req.renderData);
      res.render("index", { ...req.renderData, categoryOptions, firstCategoryIcon: categoryOptions[0].icon });
    });

    //
    // submit a link for shortening (this is where the main action takes place)
    // - check if user logged in
    // - check link validity
    //
    server.post("/", middlewareSetMimeTypeTextHtml, middlewareStats, async function (req, res) {
      let linkObj = {
        link: req.body.link ? req.body.link.trim() : "",
        userId: req.renderData.username,
        when: DateTime.now().toSeconds(),
        category: req.body.category || Category.download.name,
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
          req.renderData.notification = { message: error.message, type: "is-danger" };
        } else {
          try {
            linkObj = await shortenLink(ic, db, linkObj);
            req.renderData.notification = {
              message: "Successfully shortened link: " + linkObj.link,
              type: "is-success",
            };
          } catch (e) {
            req.renderData.notification = { message: e.message, type: "is-danger" };
          }
        }
      } else {
        req.renderData.notification = { message: "Need to be logged in to perform this action!", type: "is-danger" };
      }

      /*
        if (!req.renderData.notification) {
          
        }
        */

      req.renderData = Object.assign(req.renderData, linkObj);

      // console.log(req.renderData);
      res.render("index", { ...req.renderData, categoryOptions, firstCategoryIcon: categoryOptions[0].icon });
    });

    //
    // links
    //

    server.get("/links", middlewareSetMimeTypeTextHtml, async function (req, res) {
      if (!req.renderData.username) {
        res.redirect("/");
        return;
      }

      await viewLinks(req, res, db);
    });

    //
    // delete a link
    //

    server.post("/links", middlewareSetMimeTypeTextHtml, async function (req, res) {
      if (!req.renderData.username) {
        res.redirect("/");
        return;
      }

      await db.linkRemoveById(req.body.linkId);
      await db.clickRemoveByShortLinkId(req.body.shortLinkId);
      req.renderData.notification = { message: "Successfully deleted link " + req.body.link, type: "is-success" };

      await viewLinks(req, res, db);
    });

    //
    // profile
    //

    server.get("/to/:shortLinkId", async function (req, res) {
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
    });

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
  // const duration = moment.duration(os.uptime() * 1000);
  // const duration = Duration.fromMillis(os.uptime() * 1000);
  const uptime = humanizeDuration(os.uptime() * 1000, { largest: 2, round: true });

  return {
    numLinks: await db.linkCount(),
    numClicks: await db.clickCount(),
    uptime,
  };
};

const getUserLinkDetails = async function (db, userId, filterCategory, sort = "DESC") {
  const userLinks = await db.linkGetByUserId(userId);
  const userClicks = await db.clickGetByUserId(userId);

  const filteredLinks =
    filterCategory !== "all" ? userLinks.filter((link) => link.category === filterCategory) : userLinks;

  const linkMap = {};

  for (const link of filteredLinks) {
    link.clickCount = 0;
    linkMap[link.shortLinkId] = link;
    linkMap[link.shortLinkId];
  }

  for (const click of userClicks) {
    if (linkMap[click.shortLinkId]) {
      linkMap[click.shortLinkId].clickCount++;
    }
  }

  filteredLinks.sort((a, b) => {
    if (sort === "DESC") {
      return b.when - a.when;
    }

    return a.when - b.when;
  });

  // note that references are the same so can reuse existing array :)
  return filteredLinks;
};

const viewLinks = async function (req, res, db) {
  const reqCategory = req.query.category || "all";

  const userLinks = await getUserLinkDetails(db, req.renderData.username, reqCategory);
  const userLinksRender = getRenderLinks(userLinks);

  res.render("links", {
    links: userLinksRender,
    selectCategoryId: "links-select-category",
    categoryOptions: getLinksCategoryOptions(reqCategory),
    firstCategoryIcon: Category[reqCategory] ? Category[reqCategory].icon : "globe",
    ...req.renderData,
  });
};

const getRenderLinks = function (userLinks) {
  for (const link of userLinks) {
    link.when = DateTime.fromSeconds(link.when).toRelative();
  }
  return userLinks;
};

const getLinksCategoryOptions = function (reqCategory) {
  const linksCategoryOptions = [{ category: "all", icon: "globe" }, ...categoryOptions];
  linksCategoryOptions.forEach((categoryOption) => {
    categoryOption.selected = categoryOption.category === reqCategory;
  });

  return linksCategoryOptions;
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

module.exports = { ShortyHttpServer, Category };

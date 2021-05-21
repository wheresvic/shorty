const supertest = require("supertest");
const Chance = require("chance");

const configuration = require("../config");
const ShortyHttpServer = require("../routes/ShortyHttpServer");
const DbNeDB = require("../db/DbNeDB");
const { DateTime } = require("luxon");

const chance = new Chance();

const dbTestSetup = function() {
  return configuration.init().then(ic => {
    return ic;
  });
};

const routeTestSetup = async function() {
  const ic = await configuration.init();
  const db = new DbNeDB(ic);
  await db.init();
  const httpServer = new ShortyHttpServer(ic, db);
  const server = httpServer.listen(9001);
  const url = "http://localhost:9001";
  const request = supertest(url);
  return { ic, server, request, url, db };
};

const routeTestTeardown = async function(server, db) {
  return cleanUpDb(db).then(() => {
    return server.close();
  });
};

const login = function(ic, request) {
  return request
    .post("/login")
    .type("form")
    .send({ username: ic.appUsername, password: ic.appPassword });
};

const getRandomLinkObj = function({ link, shortLinkId, userId }) {
  const shortLinkIdRnd = chance.hash({});

  return {
    link: link || chance.url({}),
    shortLink: shortLinkId || shortLinkIdRnd,
    shortLinkId: shortLinkId || shortLinkIdRnd,
    userId: userId || chance.guid({}),
    when: DateTime.now().toSeconds(),
    test: true
  };
};

const getRandomClickObj = function({ link, shortLink, userId }) {
  return {
    ...getRandomLinkObj({ link, shortLink, userId }),
    when: new Date().getTime()
  };
};

const cleanUpDb = async function(db) {
  const numLinksRemoved = await db.linkRemoveTestLinks();
  // console.log("numLinksRemoved", numLinksRemoved);
  const numClicksRemoved = await db.clickRemoveTestClicks();
};

module.exports = {
  chance,
  dbTestSetup,
  routeTestSetup,
  routeTestTeardown,
  login,
  getRandomLinkObj,
  getRandomClickObj,
  cleanUpDb
};

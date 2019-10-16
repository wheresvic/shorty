const { expect } = require("chai");
const supertest = require("supertest");
const cheerio = require("cheerio");
const moment = require("moment");

const testUtil = require("../util/test-util");

describe("Index routes", function() {
  let server = null;
  let request = null;
  let ic = null;
  let url = null;
  let db = null;

  before(async function() {
    const result = await testUtil.routeTestSetup();
    server = result.server;
    request = result.request;
    ic = result.ic;
    url = result.url;
    db = result.db;
  });

  after(async function() {
    await testUtil.routeTestTeardown(server, db);
  });

  describe(`GET /`, function() {
    it("should get the index page with login enabled", async function() {
      // when
      const response = await request.get("/");
      // console.log(response.text);

      // then
      const $ = cheerio.load(response.text);
      const loginButtonText = $("#login")
        .text()
        .trim();

      expect(loginButtonText).to.equal("Login");
    });
  });

  describe(`POST /`, function() {
    it("should get an error when trying to shorten a link when not logged in", async function() {
      // when
      const response = await request.post("/").send({ link: "bloo" });

      // then
      expect(response.text.includes("Need to be logged in to perform this action!")).to.be.true;
    });

    it("should get an error when trying to shorten an empty link", async function() {
      // given
      const authRequest = supertest.agent(url);
      await testUtil.login(ic, authRequest);

      // when
      const response = await authRequest
        .post("/")
        .type("form")
        .send({ link: "" });

      // then
      // console.log(response.text);

      expect(response.text.includes("&quot;link&quot; is not allowed to be empty")).to.be.true;
    });

    it("should get an error when trying to shorten a link greater than 4096 characters", async function() {
      // given
      const now = moment().unix();

      const authRequest = supertest.agent(url);
      const r1 = await testUtil.login(ic, authRequest);
      // console.log(r1.text); // Found. Redirecting to /

      const r2 = await authRequest.get("/");
      // console.log(r2.text); // actual content

      // when
      const response = await authRequest
        .post("/")
        .type("form")
        .send({ link: testUtil.chance.string({ length: 4097 }) });

      // then

      // check response
      expect(response.text.includes("&quot;link&quot; length must be less than or equal to 4096 characters long")).to.be
        .true;

      const $ = cheerio.load(response.text);
      const $shortLink = $("#short-link");
      const shortLink = $shortLink.attr("href");
      expect(shortLink).to.be.undefined;
    });

    it("should shorten a link", async function() {
      // given
      const now = moment().unix();

      const authRequest = supertest.agent(url);
      const r1 = await testUtil.login(ic, authRequest);
      // console.log(r1.text); // Found. Redirecting to /

      const r2 = await authRequest.get("/");
      // console.log(r2.text); // actual content

      // when
      const response = await authRequest
        .post("/")
        .type("form")
        .send({ link: "test" });

      // then

      // check response
      expect(response.text.includes("Successfully shortened link: test")).to.be.true;

      const $ = cheerio.load(response.text);
      const $shortLink = $("#short-link");
      const shortLink = $shortLink.attr("href");

      // console.log(shortLink);
      expect(shortLink.startsWith(ic.appUrl + "/to/")).to.be.true;

      const shortLinkId = shortLink.substring(ic.appUrl.length + 4);

      // check db
      const linkDoc = await db.linkGetByShortLinkId(shortLinkId);
      expect(linkDoc.when).to.be.within(now, now + 1);

      delete linkDoc.when;
      delete linkDoc._id;
      expect(linkDoc).to.deep.equal({
        link: "test",
        userId: ic.appUsername,
        shortLink,
        shortLinkId
      });
    });
  });
});

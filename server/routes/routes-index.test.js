const { expect } = require("chai");
const supertest = require("supertest");
const cheerio = require("cheerio");

const testUtil = require("../util/test-util");
const { DateTime } = require("luxon");

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
      expect(getShortLinkHref(response.text)).to.be.undefined;
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
      expect(getShortLinkHref(response.text)).to.be.undefined;
    });

    it("should get an error when trying to shorten a link greater than 4096 characters", async function() {
      // given
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

      expect(getShortLinkHref(response.text)).to.be.undefined;
    });

    it("should shorten a link", async function() {
      // given
      const now = DateTime.now().toSeconds();

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

      const shortLink = getShortLinkHref(response.text);
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

    it("should shorten a link when a shortLinkId is provided", async function() {
      // given
      const now = DateTime.now().toSeconds();
      const shortLinkId = "abc";

      const authRequest = supertest.agent(url);
      const r1 = await testUtil.login(ic, authRequest);
      // console.log(r1.text); // Found. Redirecting to /

      const r2 = await authRequest.get("/");
      // console.log(r2.text); // actual content

      // when
      const response = await authRequest
        .post("/")
        .type("form")
        .send({ link: "test", shortLinkId });

      // then

      // check response
      expect(response.text.includes("Successfully shortened link: test")).to.be.true;

      const shortLink = getShortLinkHref(response.text);
      // console.log(shortLink);
      expect(shortLink).to.equal(ic.appUrl + "/to/abc");

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

    it("should shorten a link with a random id when a blank shortLinkId is provided", async function() {
      // given
      const now = DateTime.now().toSeconds();
      const shortLinkId = " ";

      const authRequest = supertest.agent(url);
      const r1 = await testUtil.login(ic, authRequest);
      // console.log(r1.text); // Found. Redirecting to /

      const r2 = await authRequest.get("/");
      // console.log(r2.text); // actual content

      // when
      const response = await authRequest
        .post("/")
        .type("form")
        .send({ link: "test7", shortLinkId });

      // then

      // check response
      expect(response.text.includes("Successfully shortened link: test7")).to.be.true;

      const shortLink = getShortLinkHref(response.text);
      // console.log(shortLink);
      expect(shortLink.startsWith(ic.appUrl + "/to/")).to.be.true;

      const rShortLinkId = shortLink.substring(ic.appUrl.length + 4);

      // check db
      const linkDoc = await db.linkGetByShortLinkId(rShortLinkId);
      expect(linkDoc.when).to.be.within(now, now + 1);

      delete linkDoc.when;
      delete linkDoc._id;
      expect(linkDoc).to.deep.equal({
        link: "test7",
        userId: ic.appUsername,
        shortLink,
        shortLinkId: rShortLinkId
      });
    });

    it("should throw an error when trying to shorten a link with a duplicate shortLinkId", async function() {
      // given
      const link = testUtil.getRandomLinkObj({});
      await db.linkAdd(link);

      const authRequest = supertest.agent(url);
      const r1 = await testUtil.login(ic, authRequest);
      // console.log(r1.text); // Found. Redirecting to /

      const r2 = await authRequest.get("/");
      // console.log(r2.text); // actual content

      // when
      const response = await authRequest
        .post("/")
        .type("form")
        .send({ link: "test2", shortLinkId: link.shortLinkId });

      // then

      // check response
      expect(response.text.includes("Provided shortLinkId is already in use.")).to.be.true;
      expect(getShortLinkHref(response.text)).to.be.undefined;
    });
  });
});

function getShortLinkHref(responseText) {
  const $ = cheerio.load(responseText);
  const $shortLink = $("#short-link");
  const shortLink = $shortLink.attr("href");
  return shortLink;
}

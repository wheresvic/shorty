const { expect } = require("chai");
const supertest = require("supertest");
const cheerio = require("cheerio");

const testUtil = require("../util/test-util");

describe("Redirect routes", function() {
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

  describe(`GET /to/:shortLinkId`, function() {
    it("should return a 404 for a missing shortLinkId", async function() {
      // given
      const shortLinkId = testUtil.chance.string({ length: 6 });

      // when
      const response = await request.get("/to/" + shortLinkId);

      // then
      expect(response.status).to.equal(404);
    });

    it("should 302 redirect and log a click for an existing shortLinkId", async function() {
      // given
      const linkObj = testUtil.getRandomLinkObj({});
      await db.linkAdd(linkObj);

      // when
      const response = await request.get("/to/" + linkObj.shortLinkId);

      // then
      expect(response.status).to.equal(302);
      expect(response.text).to.equal("Found. Redirecting to " + linkObj.link);

      const clicks = await db.clickGetByLink(linkObj.link);
      expect(clicks.length).to.equal(1);
      expect(clicks[0].shortLinkId).to.equal(linkObj.shortLinkId);
    });
  });
});

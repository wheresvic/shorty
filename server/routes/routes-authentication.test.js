const { expect } = require("chai");
const supertest = require("supertest");

const testUtil = require("../util/test-util");

describe("Authentication routes", function() {
  let server = null;
  let request = null;
  let ic = null;
  let db = null;

  before(async function() {
    const result = await testUtil.routeTestSetup();
    server = result.server;
    request = result.request;
    ic = result.ic;
    db = result.db;
  });

  after(async function() {
    await testUtil.routeTestTeardown(server, db);
  });

  describe(`POST /login`, function() {
    it("should redirect to / when username and password are correct", async function() {
      // when
      const response = await testUtil.login(ic, request);

      // then
      expect(response.status).to.equal(302);
    });

    it("should redirect to / when username and password are incorrect", async function() {
      // when
      const response = await testUtil.login({ ...ic, username: testUtil.chance.name() }, request);

      // then
      expect(response.status).to.equal(302);
    });
  });
});

const { expect } = require("chai");

const DbNeDB = require("../db/DbNeDB");
const testUtil = require("./test-util");
const linkUtil = require("./link-util");

describe("link-util", () => {
  let ic = null;
  let db = null;

  before(async function() {
    ic = await testUtil.dbTestSetup();
    db = DbNeDB(ic);
    await db.init();
  });

  after(async function() {
    await testUtil.cleanUpDb(db);
  });

  it("should check the db before generating a shortlink", async function() {
    // when
    const shortLinkObj = await linkUtil.generateShortLinkObj(ic.appUrl, db);

    // then
    // console.log(shortLinkObj);
    expect(shortLinkObj.shortLink.startsWith(ic.appUrl + "/to/")).to.be.true;
  });
});

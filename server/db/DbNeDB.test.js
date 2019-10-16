const { expect } = require("chai");

const DbNeDB = require("./DbNeDB");
const testUtil = require("../util/test-util");

describe("db-nedb", () => {
  let db = null;

  before(async function() {
    const ic = await testUtil.dbTestSetup();
    db = DbNeDB(ic);
    await db.init();
  });

  after(async function() {
    await testUtil.cleanUpDb(db);
  });

  describe("dbLinks", function() {
    it("should insert a link document and retrieve it via its shortLink", async function() {
      // given
      const link = testUtil.getRandomLinkObj({});

      // when
      await db.linkAdd(link);

      // then
      const retrieved = await db.linkGetByShortLinkId(link.shortLinkId);
      delete retrieved._id;
      expect(retrieved).to.deep.equal(link);
    });

    it("should fail inserting a link document with a duplicate short link", async function() {
      // given
      const link = testUtil.getRandomLinkObj({});
      await db.linkAdd(link);

      // when
      const duplicate = testUtil.getRandomLinkObj({ shortLinkId: link.shortLinkId });

      try {
        await db.linkAdd(duplicate);
      } catch (err) {
        // then
        expect(err.errorType).to.not.be.undefined;
        expect(err.errorType).to.equal("uniqueViolated");
        return;
      }

      fail("Should not have inserted duplicate shortLink");
    });
  });

  describe("dbClicks", function() {
    it("should insert a click document and return the correct count", async function() {
      // given
      const click1 = testUtil.getRandomClickObj({});
      const click2 = testUtil.getRandomClickObj({});

      // when
      await db.clickAdd(click1);
      await db.clickAdd(click2);

      // then
      const numClicks = await db.clickCount();
      expect(numClicks).to.be.above(1);
    });
  });
});

const { expect } = require("chai");
const cheerio = require("cheerio");

const testUtil = require("../util/test-util");

describe("Encrypt/Decrypt text routes", function() {
  let server = null;
  let request = null;
  // let ic = null;
  // let url = null;
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

  describe(`GET /encrypt-decrypt-text`, function() {
    it("should get the page", async function() {
      // when
      const response = await request.get("/encrypt-decrypt-text");
      // console.log(response.text);

      // then
      const $ = cheerio.load(response.text);
      const encryptButtonText = $("#btn-encrypt")
        .text()
        .trim();

      expect(encryptButtonText).to.equal("Encrypt");
    });
  });

  describe(`POST /do-encrypt-text`, function() {
    it("should get an error when trying to encrypt text with no key", async function() {
      // when
      const response = await request
        .post("/do-encrypt-text")
        .type("form")
        .send({ text: "xxx", key: "" });

      // then
      expect(response.text.includes("Error Invalid key, must be min 8 characters")).to.be.true;

      expect(getResult(response.text)).to.equal("");
    });

    it("should encrypt text", async function() {
      // given

      // when
      const response = await request
        .post("/do-encrypt-text")
        .type("form")
        .send({ text: "xxx", key: "12345678" });

      // then
      expect(response.text.includes("Successfully encrypted text.")).to.be.true;
      const resultText = getResult(response.text);
      const components = resultText.split(":");
      expect(components.length).to.equal(2);
    });
  });

  describe(`POST /do-decrypt-text`, function() {
    it("should get an error when trying to decrypt text with the wrong key", async function() {
      // given
      const r1 = await request
        .post("/do-encrypt-text")
        .type("form")
        .send({ text: "yoyo ma", key: "12345678" });

      const encryptedText = getResult(r1.text);

      // when
      const response = await request
        .post("/do-decrypt-text")
        .type("form")
        .send({ text: encryptedText, key: "abcdefghijklmnop" });

      // then
      expect(response.text.includes("Error")).to.be.true;

      expect(getResult(response.text)).to.equal("");
    });

    it("should decrypt text", async function() {
      // given
      const r1 = await request
        .post("/do-encrypt-text")
        .type("form")
        .send({ text: "yoyo ma", key: "12345678" });

      const encryptedText = getResult(r1.text);

      // when
      const response = await request
        .post("/do-decrypt-text")
        .type("form")
        .send({ text: encryptedText, key: "12345678" });

      // then
      expect(response.text.includes("Successfully decrypted text.")).to.be.true;
      const resultText = getResult(response.text);
      expect(resultText).to.equal("yoyo ma");
    });
  });
});

function getResult(responseText) {
  const $ = cheerio.load(responseText);
  const $result = $("#result-encrypt-decrypt");
  return $result.text();
}

const { expect } = require("chai");
const { Category } = require("../routes/ShortyHttpServer");

const testUtil = require("../util/test-util");
const linkSchema = require("./link");

describe("link schema", function () {
  it("should throw an validation error when no link property provided", function () {
    // when
    const { error, value } = linkSchema.validate({});

    // then
    expect(error.message).to.equal('"link" is required');
    expect(error.name).to.equal("ValidationError");
  });

  it("should validate link when no shortLink provided", function () {
    // given
    const linkObj = testUtil.getRandomLinkObj({ category: Category.download });
    delete linkObj.shortLink;

    // when
    const { error, value } = linkSchema.validate(linkObj);

    // then
    expect(error).to.be.undefined;
    expect(value).to.deep.equal(linkObj);
  });

  it("should validate link when all properties provided", function () {
    // given
    const linkObj = testUtil.getRandomLinkObj({});

    // when
    const { error, value } = linkSchema.validate(linkObj);

    // then
    expect(error).to.be.undefined;
    expect(value).to.deep.equal(linkObj);
  });
});

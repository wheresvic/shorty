const { expect } = require("chai");

const testUtil = require("../util/test-util");
const clickSchema = require("./click");

describe("click schema", function() {
  it("should throw a validation error when no link property provided", function() {
    // when
    const { error, value } = clickSchema.validate({});

    // then
    expect(error.message).to.equal('"link" is required');
    expect(error.name).to.equal("ValidationError");
  });

  it("should throw a validation error when no shortLink provided", function() {
    // given
    const clickObj = testUtil.getRandomClickObj({});
    delete clickObj.shortLink;

    // when
    const { error, value } = clickSchema.validate(clickObj);

    // then
    expect(error.message).to.equal('"shortLink" is required');
    expect(error.name).to.equal("ValidationError");
  });

  it("should validate click when all properties provided", function() {
    // given
    const clickObj = testUtil.getRandomClickObj({});

    // when
    const { error, value } = clickSchema.validate(clickObj);

    // then
    expect(error).to.be.undefined;
    expect(value).to.deep.equal(clickObj);
  });
});

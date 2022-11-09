const Joi = require("joi");

module.exports = Joi.object({
  link: Joi.string().max(4096, "utf8").required(),
  shortLink: Joi.string().max(4096, "utf-8"),
  shortLinkId: Joi.string(),
  userId: Joi.string().max(190, "utf-8").required(),
  when: Joi.number().required(),
  category: Joi.string().max(20, "utf-8").required(), // column will likely break if you put in stuff that is too big
  test: Joi.boolean(),
});

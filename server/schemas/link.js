const Joi = require("joi");

module.exports = Joi.object({
  link: Joi.string()
    .max(4096, "utf8")
    .required(),
  shortLink: Joi.string().max(4096, "utf-8"),
  shortLinkId: Joi.string(),
  userId: Joi.string()
    .max(190, "utf-8")
    .required(),
  when: Joi.number().required(),
  test: Joi.boolean()
});

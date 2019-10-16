const Joi = require("@hapi/joi");

const linkSchema = require("./link");

module.exports = linkSchema.append({
  shortLink: Joi.string()
    .required()
    .max(4096, "utf-8"),
  shortLinkId: Joi.string()
    .required()
    .max(4096, "utf-8"),
  when: Joi.number().required()
});

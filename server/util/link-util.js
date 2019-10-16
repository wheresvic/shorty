const generate = require("nanoid/generate");

const createShortLink = function(appUrl, id) {
  return appUrl + "/to/" + id;
};

const getShortLinkObj = function(appUrl) {
  const id = generate("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6);

  return {
    shortLink: createShortLink(appUrl, id),
    shortLinkId: id
  };
};

const generateShortLinkObj = async function(appUrl, db) {
  let shortLinkObj = getShortLinkObj(appUrl);
  let linkObj = await db.linkGetByShortLinkId(shortLinkObj.shortLinkId);

  while (linkObj) {
    shortLinkObj = getShortLinkObj(appUrl);
    linkObj = await db.linkGetByShortLinkId(shortLinkObj.shortLinkId);
  }

  return shortLinkObj;
};

module.exports = {
  createShortLink,
  generateShortLinkObj
};

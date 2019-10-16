const {
  createDatastore,
  ensureIndexAsync,
  insertAsync,
  findOneAsync,
  findAsync,
  removeAsync,
  countAsync
} = require("./nedb-util");

module.exports = function(ic) {
  let dbLinks = null;
  let dbClicks = null;

  return {
    init: function() {
      dbLinks = createDatastore("links");

      dbClicks = createDatastore("clicks");

      return ensureIndexAsync(dbLinks, { fieldName: "shortLink", unique: true })
        .then(() => {
          return ensureIndexAsync(dbLinks, { fieldName: "shortLinkId", unique: true });
        })
        .then(() => {
          return ensureIndexAsync(dbClicks, { fieldName: "link" });
        });
    },

    linkAdd: function(objLink) {
      return insertAsync(dbLinks, objLink);
    },

    linkGetByShortLinkId: function(shortLinkId) {
      return findOneAsync(dbLinks, { shortLinkId });
    },

    linkGetByUserId: function(userId) {
      return findAsync(dbLinks, { userId });
    },

    linkRemoveById: function(id) {
      return removeAsync(dbLinks, { _id: id });
    },

    linkRemoveTestLinks: function() {
      return removeAsync(dbLinks, { test: { $exists: "true" } }).then(num1 => {
        return removeAsync(dbLinks, { link: "test" }).then(num2 => {
          return num1 + num2;
        });
      });
    },

    linkCount: function() {
      return countAsync(dbLinks, {});
    },

    clickAdd: function(objClick) {
      return insertAsync(dbClicks, objClick);
    },

    clickCount: function() {
      return countAsync(dbClicks, {});
    },

    clickGetByLink: function(link) {
      return findAsync(dbClicks, { link });
    },

    clickGetByUserId: function(userId) {
      return findAsync(dbClicks, { userId });
    },

    clickRemoveTestClicks: function() {
      return removeAsync(dbClicks, { test: { $exists: "true" } });
    },

    clickRemoveByShortLinkId: function(shortLinkId) {
      return removeAsync(dbClicks, { shortLinkId });
    }
  };
};

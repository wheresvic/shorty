const moment = require("moment");

const cryptoUtil = require("../util/crypto-util");

const encryptTextGet = function(req, res) {
  res.render("encrypt-decrypt-text", { ...req.renderData });
};

const doEncryptTextPost = function(req, res) {
  const { key, text } = req.body;

  let result = "";

  try {
    result = cryptoUtil.encrypt(text, cryptoUtil.getCipherKey(key), cryptoUtil.defaultSaltGenerator);
  } catch (err) {
    req.renderData.notification = { message: "Error " + err.message, type: "error" };
  }

  res.render("encrypt-decrypt-text", { result, when: moment().format("YYYY-MM-DD HH:mm:ss"), ...req.renderData });
};

const doDecryptTextPost = function(req, res) {
  const { key, text } = req.body;

  let result = "";

  try {
    result = cryptoUtil.decrypt(text, cryptoUtil.getCipherKey(key));
  } catch (err) {
    req.renderData.notification = { message: "Error " + err.message, type: "error" };
  }

  res.render("encrypt-decrypt-text", { result, when: moment().format("YYYY-MM-DD HH:mm:ss"), ...req.renderData });
};

module.exports = {
  encryptTextGet,
  doEncryptTextPost,
  doDecryptTextPost
};

const { DateTime } = require("luxon");

const cryptoUtil = require("../util/crypto-util");

const encryptTextGet = function(req, res) {
  res.render("encrypt-decrypt-text", { ...req.renderData });
};

const doEncryptTextPost = function(req, res) {
  if (!req.renderData.username) {
    res.redirect("/");
    return;
  }
  
  const { key, text } = req.body;

  let result = "";

  try {
    result = cryptoUtil.encrypt(text, cryptoUtil.getCipherKey(key), cryptoUtil.defaultSaltGenerator);
    req.renderData.notification = { message: "Successfully encrypted text.", type: "success" };
  } catch (err) {
    req.renderData.notification = { message: "Error " + err.message, type: "error" };
  }

  res.render("encrypt-decrypt-text", { result, when: DateTime.now().toISO(), ...req.renderData });
};

const doDecryptTextPost = function(req, res) {
  if (!req.renderData.username) {
    res.redirect("/");
    return;
  }
  
  const { key, text } = req.body;

  let result = "";

  try {
    result = cryptoUtil.decrypt(text, cryptoUtil.getCipherKey(key));
    req.renderData.notification = { message: "Successfully decrypted text.", type: "success" };
  } catch (err) {
    req.renderData.notification = { message: "Error " + err.message, type: "error" };
  }

  res.render("encrypt-decrypt-text", { result, when: DateTime.now().toISO(), ...req.renderData });
};

module.exports = {
  encryptTextGet,
  doEncryptTextPost,
  doDecryptTextPost
};

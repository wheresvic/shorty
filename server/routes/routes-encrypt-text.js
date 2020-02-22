const moment = require("moment");

const encryptTextGet = function(req, res) {
  res.render("encrypt-text", { ...req.renderData });
};

const doEncryptTextPost = function(req, res) {
  console.log("encrypt plz");
  console.log(req.body);
  res.render("encrypt-text", { result: "blah", when: moment().format("YYYY-MM-DD HH:mm:ss"), ...req.renderData });
};

const doDecryptTextPost = function(req, res) {
  console.log("decrypt plz");
  console.log(req.body);
  res.render("encrypt-text", { result: "blah", when: moment().format("YYYY-MM-DD HH:mm:ss"), ...req.renderData });
};

module.exports = {
  encryptTextGet,
  doEncryptTextPost,
  doDecryptTextPost
};

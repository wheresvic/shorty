const { DateTime } = require("luxon");
const { formatISO } = require("date-fns");

const cryptoUtil = require("../util/crypto-util");

const notesGet = async function (ic, db, req, res) {
  // console.log(ic);
  res.render("notes", { ...req.renderData });
};

const notesAddGet = async function (ic, db, req, res) {
  // console.log(ic);
  res.render("notes-note", { ...req.renderData });
};

const doNotesAddPost = async function (ic, db, req, res) {
  if (!req.renderData.username) {
    res.redirect("/");
    return;
  }

  console.log(req.body);
  const { notesAddTitle, notesAddText } = req.body;

  try {
    req.renderData.notification = { message: "Great success.", type: "is-success" };
    
  } catch (err) {
    req.renderData.notification = { message: "Error " + err.message, type: "is-danger" };
  }

  res.render("notes", { when: formatISO(new Date()), ...req.renderData });
};



module.exports = {
  notesGet,
  notesAddGet,
  doNotesAddPost,
};

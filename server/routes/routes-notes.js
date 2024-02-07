const { DateTime } = require("luxon");
const { formatISO } = require("date-fns");

const showdown = require("showdown");

const converter = new showdown.Converter();

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
  const notes = [];
  const { notesAddTitle, notesAddText } = req.body;

  try {
    const contentHtml = converter.makeHtml(notesAddText);
    notes.push({ title: notesAddTitle, contentHtml, contentMd: notesAddText });
    req.renderData.notification = { message: "Great success.", type: "is-success" };
    req.renderData.notes = notes;
  } catch (err) {
    req.renderData.notification = { message: "Error " + err.message, type: "is-danger" };
    req.render("notes-note", { ...req.renderData });
    return;
  }
  res.render("notes", { when: formatISO(new Date()), ...req.renderData });
};

module.exports = {
  notesGet,
  notesAddGet,
  doNotesAddPost,
};

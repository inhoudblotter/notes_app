const { Router } = require("express");
const auth = require("../../utils/express/auth");
const markdownpdf = require('markdown-pdf');
const { createNote, getNotes, getNote, deleteNote, deleteAllArchived, updateNote } = require("../../db");
const router = Router();
router.use(auth);

// getNotes
router.get("/", async (req, res) => {
  const { age, search, page } = req.query;
  const data = await getNotes(req.db, req.user.id, { age, search, page });
  if (data.error) return res.status(500).send(data.error.message);
  res.json(data);
});

// createNote
router.post("/note", async (req, res) => {
  if (!req.body.text) {
    return res.status(400).send("Для создания заметки введите текст");
  }

  const note = await createNote(req.db, req.user.id, req.body.title, req.body.text);
  if (note.error) return res.status(500).send(note.error.message);
  res.status(201).json(note);
});
// getNote
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const {pdf} = req.query;
  const note = await getNote(req.db, req.user.id, id);
  if (note.error) {
    return res.status(note.error.code === 404 ? note.error.code : 500).send(note.error.message);
  }
  if (!pdf) return res.json(note);
   markdownpdf().from.string(note.text).to.buffer((error, pdf) => {
    res.contentType('application/pdf').send(pdf);
   });
});

// deleteNote
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const note = await deleteNote(req.db, req.user.id, id);
  if (note.error) {
    return res.status(note.error.code === 404 ? note.error.code : 500).send(note.error.message);
  }
  res.json(note);
});
// deleteAllArchived
router.delete("/", async (req, res) => {
  const data = await deleteAllArchived(req.db, req.user.id);
  if (data.error) return res.status(data.error.code === 404 ? data.error.code : 500).send(data.error.message);
  res.json(data);
});
// archiveNote
// unarchiveNote
// editNote
router.patch("/:id", auth, async (req, res) => {
  const payload = {};
  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] !== "undefined" && ['title', 'text', 'isArchived'].includes(key)) payload[key] = req.body[key];
  })
  if (Object.keys(payload).includes('text') && !payload.text) {
    return res.status(400).send("Для обновления заметки введите текст");
  }
  if (Object.keys(payload).length === 0) return res.status(204).send("Передайте данные для обновления заметки");
  const data = await updateNote(req.db, req.user.id, req.params.id, payload);
  if (data.error) return res.status(data.error.code === 404 ? data.error.code : 500).send(data.error.message);
  res.json(data);
});

module.exports = {
  notesRouter: router,
};

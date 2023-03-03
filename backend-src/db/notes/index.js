require("dotenv").config();
const { ObjectId } = require("mongodb");
const markdown = require("markdown").markdown;

async function createNote(db, user, title, text) {
  if (typeof user !== "string" || typeof title !== "string" || typeof text !== "string")
    return { error: { message: "Wrong data type in note creation function" } };
  try {
    const response = await db.collection("notes").insertOne({
      user: user,
      title: title,
      text: text,
      html: markdown.toHTML(text),
      created: new Date(),
      isArchived: false,
    });

    return { id: response.insertedId.toString() };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

function createBlankNote(db, user) {
  const link = process.env.HOST;
  const imgLink = `${process.env.HOST}img/blank-img.png`;
  return createNote(
    db,
    user,
    "Новая заметка",
    `# Заголовок 1\n## Заголовок 2\n### Заголовок 3\n#### Заголовок 4\n\nТекст\n\n**Жирный текст**\n\n*Курсив*\n\n> Цитата\n\nМаркированный список\n\n* Пункт\n* Пункт\n\n\nНумерованный список\n\n1. Пункт\n2. Пункт\n\n[Сcылка](${link})\n\n![Картинка ](${imgLink})`
  );
}

async function deleteNote(db, noteId) {
  if (typeof noteId !== "string") return { error: { message: "Wrong data type in delete note function" } };
  try {
    const response = await db.collection("notes").deleteOne({ _id: new ObjectId(noteId) });
    if (response.deletedCount === 0) {
      return { error: { code: 404, message: "Note is not found" } };
    } else return {};
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function getNotes(db, user, params) {
  if (typeof user !== "string" && (typeof params === "undefined" || typeof params === "object"))
    return { error: { message: "Wrong data type in get notes function" } };
  let page = 0;
  const nPerPage = 20;
  // Create query
  const query = { user: user, isArchived: false };
  const sortFunc = { created: -1 };
  if (typeof params !== "undefined") {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        switch (key) {
          case "age":
            switch (value) {
              case "1month":
                query.created = { $gt: new Date(Date.now() - 2678400000) };
                break;
              case "3months":
                query.created = { $gt: new Date(Date.now() - 8035200000) };
                break;
              case "archive":
                query.isArchived = true;
                break;
              default:
                break;
            }
            break;
          case "search":
            // eslint-disable-next-line no-useless-escape
            query.$text = { $search: `\"${decodeURI(value)}\"` };
            sortFunc.score = { $meta: "textScore" };
            break;
          default:
            break;
        }
      }
    }
    if (params.page) page = params.page > 0 ? params.page - 1 : 0;
  }
  try {
    // Get data
    const data = [];
    const count = await db.collection("notes").countDocuments(query);
    const notes = await db
      .collection("notes")
      .find(query)
      .sort(sortFunc)
      .skip(page * nPerPage)
      .limit(nPerPage)
      .toArray();

    notes.forEach((note) => {
      const formatNote = {
        id: note._id.toString(),
        title: note.title,
        text: note.text,
        html: note.html,
        created: note.created.getTime(),
        isArchived: note.isArchived,
      };
      if (typeof params !== "undefined" && params.search) {
        // Add highlights
        const exp = new RegExp(params.search, "ig");
        const relevant = note.title.matchAll(exp);
        let highlights = note.title;
        const formated = [];
        for (const str of relevant) {
          if (!formated.includes(str[0])) {
            highlights = highlights.replace(str[0], `<mark>${str[0]}</mark>`);
          }
        }
        formatNote.highlights = highlights;
      }
      data.push(formatNote);
    });
    return { hasMore: count > (page + 1) * nPerPage, data };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function getNote(db, user, id) {
  if (typeof user !== "string" || typeof id !== "string")
    return { error: { message: "Wrong data type in get note function" } };
  try {
    const response = await db.collection("notes").findOne({ _id: new ObjectId(id) });
    if (response.deletedCount === 0) {
      return { error: { code: 404, message: "Note is not found" } };
    } else
      return {
        id: response._id.toString(),
        title: response.title,
        text: response.text,
        html: response.html,
        created: response.created.getTime(),
        isArchived: response.isArchived,
      };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function deleteAllArchived(db, user) {
  if (typeof user !== "string") return { error: { message: "Wrong data type in deleteAllArchived function" } };
  try {
    const response = await db.collection("notes").deleteMany({ user: user, isArchived: true });
    if (response.deletedCount === 0) {
      return { error: { code: 404, message: "Archive notes not found" } };
    } else return { deleted: response.deletedCount };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function updateNote(db, user, id, payload) {
  if (typeof user !== "string" || typeof id !== "string" || typeof payload !== "object")
    return { error: { message: "Wrong data type in updateNote function" } };

  if (payload.text) payload.html = markdown.toHTML(payload.text);

  try {
    const response = await db.collection("notes").findOneAndUpdate(
      { _id: new ObjectId(id), user },
      {
        $set: payload,
      },
      { returnNewDocument: true }
    );
    if (!response.value) return { error: { code: 404, message: "Note not found" } };
    return {
      id: response.value._id.toString(),
      title: response.value.title,
      text: response.value.text,
      html: response.value.html,
      created: response.value.created.getTime(),
      isArchived: response.value.isArchived,
    };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

module.exports = {
  createNote,
  deleteNote,
  getNotes,
  getNote,
  deleteAllArchived,
  updateNote,
  createBlankNote,
};

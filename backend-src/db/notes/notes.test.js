const createNotes = require("../../utils/mocha/createNotes");
const dbConnection = require("../../utils/mocha/dbConnection");
const { createNote, deleteNote, getNotes, getNote, updateNote } = require("./");
const markdown = require("markdown").markdown;

describe("createNote", () => {
  let db, client, noteId;
  before(async () => {
    [client, db] = await dbConnection();
  });
  it("note created", async () => {
    const response = await createNote(db, "localUser", "Some note", "Some text");
    if (typeof response.id !== "string")
      throw new Error(`Expected { id: string }, but got ${JSON.stringify(response)}`);
    noteId = response.id;
  });
  after(async () => {
    await deleteNote(db, noteId);
    client.close();
  });
});

describe("deleteNote", () => {
  let db, client, noteId;
  before(async () => {
    [client, db] = await dbConnection();
    const response = await createNote(db, "localUser", "Some note", "Some text");
    noteId = response.id;
  });
  it("Note deleted", async () => {
    const response = await deleteNote(db, noteId);
    if (response.error) throw new Error(`Expected {}, but got ${JSON.stringify(response)}`);
  });
  it("Error when deleting an unknown note", async () => {
    const response = await deleteNote(db, noteId);
    if (response.error.code !== 404)
      throw new Error(`Expected {error: {code: 404, message:...}}, but got ${JSON.stringify(response)}`);
  });
  after(async () => {
    client.close();
  });
});

describe("findNotes", () => {
  let db, client;
  const ids = [];
  const user = "localUser";
  before(async () => {
    [client, db] = await dbConnection();
    const notes = await createNotes(db, createNote, user);
    ids.push(...notes);
  });
  it("Found all on first page", async () => {
    const response = await getNotes(db, user);
    if (response.error)
      throw new Error(
        `Expected [{id: string, title: string,text: string, created: number}, ...], but got Erorr: ${JSON.stringify(
          response
        )}`
      );
    if (response.data.length !== 20)
      throw new Error(
        `Expected [{id: string, title: string,text: string, created: number}, ...] of length 20, but got ${response.length}`
      );
    for (const note of response.data) {
      if (note.title === "Archived note") throw new Error("Archive entry found");
      if (note.title === "Some note on page 2 45 days ago") throw new Error("Found entry on second page");
    }
  });
  it("Found all on second page", async () => {
    const response = await getNotes(db, user, { page: 2 });
    if (!response.data.some((note) => note.title === "Some note on page 2 45 days ago"))
      throw new Error(
        `Expected [{id: string, title: 'Some note on page 2 45 days ago', text: string, created: number}, ...] lenght 1 on second page, but got ${JSON.stringify(
          response.data
        )}`
      );
    if (!response.data.length > 1)
      throw new Error(
        `Expected [{id: string, title: 'Some note on page 2 45 days ago', text: string, created: number}, ...] lenght 1 on second page, but got ${JSON.stringify(
          response.data.length
        )}`
      );
    if (response.hasMore) throw new Error(`Expected end of data, but got ${JSON.stringify(response)}`);
  });
  it("Found records for 1 month", async () => {
    const response = await getNotes(db, user, { age: "1month" });
    if (response.error || response.data.some((note) => note.created < Date.now() - 2678400000))
      throw new Error(`Expected no later than a month, but got ${JSON.stringify(response)}`);
  });
  it("Found records for 3 month", async () => {
    const response = await getNotes(db, user, { age: "3months", page: 2 });
    if (response.error || !response.data.some((note) => note.created < Date.now() - 2678400000))
      throw new Error(`Expected later than a month, but got ${JSON.stringify(response)}`);
  });
  it("Found all records archive", async () => {
    const response = await getNotes(db, user, { age: "archive" });
    if (response.error || !response.data.some((note) => note.title === "Archived note"))
      throw new Error(`Expected archive, but got ${JSON.stringify(response)}`);
  });
  it("Notes found for search query", async () => {
    const searchString = "Other note";
    const response = await getNotes(db, user, { search: searchString });
    if (response.error || !response.data.every((note) => note.title.toLowerCase().includes(searchString.toLowerCase())))
      throw new Error(`Expected notes with title containing: ${searchString}, but got ${JSON.stringify(response)}`);
  });
  after(async () => {
    const reqs = [];
    for (const note of ids) {
      reqs.push(deleteNote(db, note));
    }
    await Promise.all(reqs);
    client.close();
  });
});

describe("getNote", () => {
  let noteId, db, client;
  const user = "localUser";
  const title = "Some note";
  const text = "Some text";
  before(async () => {
    [client, db] = await dbConnection();
    let response = await createNote(db, user, title, text);
    noteId = response.id;
  });
  it("Note received", async () => {
    const note = await getNote(db, user, noteId);
    if (note.error)
      throw new Error(
        `Expected {id: ${noteId}, title: ${title}, text: ${text} html: ${markdown.toHTML(
          text
        )}, created: number}, but got ${JSON.stringify(note)}`
      );
  });
  after(async () => {
    deleteNote(db, noteId);
    client.close();
  });
});

describe("updateNote", () => {
  let noteId, db, client;
  const user = "localUser";
  let title = "Some note";
  const text = "Some text";
  before(async () => {
    [client, db] = await dbConnection();
    let response = await createNote(db, user, title, text);
    noteId = response.id;
  });
  it("note edited", async () => {
    title = "Other title";
    const note = await updateNote(db, user, noteId, { title });
    if (note.error)
      throw new Error(
        `Expected {id: number, title: string, text: string, created: number}, but got ${JSON.stringify(note)}`
      );
  });
  it("returned 404", async () => {
    title = "Other title";
    const note = await updateNote(db, user, "63f90c8d327365c563f59367", { title });
    if (!note.error.code === 404) throw new Error(`Expected error 404, but got ${JSON.stringify(note)}`);
  });
  after(async () => {
    deleteNote(db, noteId);
    client.close();
  });
});

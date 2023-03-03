const markdown = require("markdown").markdown;

async function createNotes(db, createNote, user) {
  const ids = [];
  const text = "Some text";
  let response = await createNote(db, user, "Some note", text);
  ids.push(response.id);
  response = await db.collection("notes").insertOne({
    user: user,
    title: "Archived note",
    text: text,
    html: markdown.toHTML(text),
    created: new Date(),
    isArchived: true,
  });
  ids.push(response.insertedId.toString());
  response = await db.collection("notes").insertOne({
    user: user,
    title: "Note 15 days ago",
    text: text,
    html: markdown.toHTML(text),
    created: new Date(Date.now() - 1296000000),
    isArchived: false,
  });
  ids.push(response.insertedId.toString());
  response = await db.collection("notes").insertOne({
    user: user,
    title: "Some note on page 2 45 days ago",
    text: text,
    html: markdown.toHTML(text),
    created: new Date(Date.now() - 3888000000),
    isArchived: false,
  });
  ids.push(response.insertedId.toString());
  for (let i = 0; i < 18; i++) {
    response = await createNote(db, user, "Some other note", text);
    ids.push(response.id);
  }
  ids.push(response.id);
  return ids;
}

module.exports = createNotes;

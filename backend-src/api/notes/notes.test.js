const chai = require("chai");
const chaiHttp = require("chai-http");
const { createSession, deleteSession, createUser } = require("../../db");
const { deleteNote, createNote } = require("../../db/notes");
const dbConnection = require("../../utils/mocha/dbConnection");
const { deleteUser } = require("../../db/users");
const createNotes = require("../../utils/mocha/createNotes");
const expect = chai.expect;
chai.use(chaiHttp);

describe("notesRoutes", () => {
  const ids = [];
  let token, db, client, server, userId;

  before(async () => {
    server = require("../../../index");
    [client, db] = await dbConnection();
    const user = await createUser(db, "login", "name", "password");
    const session = await createSession(db, user.id);
    userId = user.id;
    token = session.id;
    ids.push(...(await createNotes(db, createNote, userId)));
  });

  it("Create note", async () => {
    const res = await chai
      .request(server)
      .post("/api/notes/note")
      .set("Content-Type", "application/json")
      .set("Cookie", `token=${token}`)
      .send({ title: "Some title", text: "Some text" });
    expect(res).to.have.status(201);
    expect(res.body).to.have.property("id").that.to.be.a("string");
    ids.push(res.body.id);
  });

  describe("getNotes", () => {
    it("get notes for 1 month", async () => {
      const query = "/api/notes/?" + new URLSearchParams({ age: "1month" });
      const res = await chai
        .request(server)
        .get("/api/notes/?" + new URLSearchParams({ age: "1month" }))
        .set("Cookie", `token=${token}`)
        .send();
      expect(res).to.have.status(200);
      expect(res.body.data).to.be.a("array");
      if (res.body.data.some((note) => note.created < Date.now() - 2678400000))
        throw new Error(`Expected no later than a month, but got ${JSON.stringify(response)}`);
    });
    it("get notes for 3 month", async () => {
      const query = "/api/notes/?" + new URLSearchParams({ age: "3month" });
      const res = await chai
        .request(server)
        .get("/api/notes/?" + new URLSearchParams({ age: "1month" }))
        .set("Cookie", `token=${token}`)
        .send();
      expect(res).to.have.status(200);
      expect(res.body.data).to.be.a("array");
      if (res.body.data.some((note) => note.created < Date.now() - 2678400000))
        throw new Error(`Expected no later than a month, but got ${JSON.stringify(response)}`);
    });
  });

  it("Note patched", async () => {
    const title = "New title";
    const res = await chai
      .request(server)
      .patch(`/api/notes/${ids[0]}`)
      .set("Content-Type", "application/json")
      .set("Cookie", `token=${token}`)
      .send({ title });
    expect(res).to.have.status(200);
    console.log(res.data);
  });

  after(async () => {
    await deleteSession(db, token);
    await deleteUser(db, userId);
    const requests = [];
    for (const note of ids) {
      requests.push(deleteNote(db, note));
    }
    await Promise.all(requests);
    client.close();
    server.close();
  });
});

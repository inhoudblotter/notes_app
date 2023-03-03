const { createSession, deleteSession, findSession } = require("./");
const dbConnection = require('../../utils/mocha/dbConnection');

describe("createSession", () => {
  let db, client, sessionId;
  before(async () => {
    [client, db] = await dbConnection();
  });
  it("Session created", async () => {
    const session = await createSession(db, "1235");
    if (typeof session.id !== "string") throw new Error(`Expected { id: string }, but got ${JSON.stringify(response)}`);
    sessionId = session.id;
  });

  after(async () => {
    await deleteSession(db, sessionId);
    client.close();
  });
});

describe("deleteSession", () => {
  let db, client, sessionId;
  before(async () => {
    [client, db] = await dbConnection();
    const session = await createSession(db, "1235");
    sessionId = session.id;
  });
  it("Session deleted", async () => {
    const response = await deleteSession(db, sessionId);
    if (response.error) throw new Error(`Expected {}, but got ${JSON.stringify(response)}`);
  });
  it("Error when deleting an unknown session", async () => {
    const response = await deleteSession(db, sessionId);
    if (response.error.code !== 404) throw new Error(`Expected {error: {code: ..., message:...}}, but got ${JSON.stringify(response)}`);
  });
  after(() => {
    client.close();
  });
});


describe("findSession", () => {
  let db, client, sessionId;
  before(async () => {
    [client, db] = await dbConnection();
    const session = await createSession(db, "1235");
    sessionId = session.id;
  });
  it("Session found", async () => {
    const response = await findSession(db, sessionId);
    if (response.error) throw new Error(`Expected {id: string, user: string}, but got ${JSON.stringify(response)}`);
  });
  it("Error when find an unknown session", async () => {
    const response = await findSession(db, '63f90c8d327365c563f59367');
    if (response.error.code !== 404) throw new Error(`Expected {error: {code: ..., message:...}}, but got ${JSON.stringify(response)}`);
  });
  after(() => {
    client.close();
  });
});

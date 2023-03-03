const dbConnection = require('../../utils/mocha/dbConnection');
const { createUser, deleteUser, findUserByName, findUserBySession, findUserByLogin } = require("./");
const { createSession, deleteSession } = require("../sessions");

describe("createUser", () => {
  let db, userId, client;
  const name = 'randomName';
  before(async () => {
    [client, db] = await dbConnection();
  });

  it("User created", async () => {
    const user = await createUser(db, name, "password");
    if (typeof user.id !== "string" && user.name !== name) {
      throw new Error(`Expected {id: string, name: user123}, but got ${JSON.stringify(user)}`);
    }
    userId = user.id;
  });
  it("A user with the same name already exists", async () => {
    const response = await createUser(db, name, "password");
    if (response.error.code !== 11000) {
      throw new Error(`Expected {error: { code: 11000 } }, but got ${JSON.stringify(response)}`);
    }
  });
  it("User not created with invalid password and username types", async () => {
    let response = await createUser(db);
    if (!response.error.message) throw new Error(`Expected { error: {message: ...}}, but got ${JSON.stringify(response)}`);
    response = await createUser(db, {}, "password");
    if (!response.error.message) throw new Error(`Expected { error: {message: ...}}, but got ${JSON.stringify(response)}`);
  });
  after(async () => {
    await deleteUser(db, userId);
    client.close();
  });
});

describe("deleteUser", () => {
  let db, userId, client;

  before(async () => {
    [client, db] = await dbConnection();
    const user = await createUser(db, "randomName", "password");
    userId = user.id;
  });

  it("User deleted", async () => {
    const response = await deleteUser(db, userId);
    if (response.error) throw new Error(`Expected {}, but got ${JSON.stringify(response)}`);
  });

  it("Error when deleting an unknown user", async () => {
    const response = await deleteUser(db, userId);
    if (response.error.code !== 404)
      throw new Error(`Expected {error: {code: 404, message: ...}}, but got ${JSON.stringify(response)}`);
  });

  after(async () => {
    client.close();
  });
});

describe("findUserByName", () => {
  let db, userId, client;
  const login = "login";
  const name = 'name';
  const password = 'password';
  before(async () => {
    [client, db] = await dbConnection();
      const user = await createUser(db, login, name, password);
      userId = user.id;
  });

  it("user is found", async () => {
    const response = await findUserByLogin(db, login);
    if (response.id !== userId || response.login !== login  || response.name !== name || typeof response.password !== "string")
      throw new Error(`Expected { id: ${userId}, login: ${login}, name: ${name}, password: string }, but got ${JSON.stringify(response)}`);
  });

  it("error when searching for an unknown user", async () => {
    const response = await findUserByLogin(db, "unknown user");
    if (response.error.code !== 404) throw new Error(`Expected { error: {code: 404, message: ...} }, but got ${JSON.stringify(response)}`);
  });

  after(async () => {
    await deleteUser(db, userId);
    client.close();
  });
});


describe("findUserBySession", () => {
  let db, sessionId, client, user;

  before(async () => {
    [client, db] = await dbConnection();
      user = await createUser(db, "user124", "password");
      const session = await createSession(db, user.id);
      sessionId = session.id;
  });

  it("user is found", async () => {
    const response = await findUserBySession(db, sessionId);
    if (response.id !== user.id || response.name !== user.name)
      throw new Error(`Expected { id: ${user.id}, name: ${user.name} }, but got ${JSON.stringify(response)}`);
  });

  it("error when searching for an unknown session", async () => {
    const response = await findUserByName(db, '63f90c8d327365c563f59367');
    if (response.error.code !== 404) throw new Error(`Expected { error: {code: 404, message: ...} }, but got ${JSON.stringify(response)}`);
  });

  after(async () => {
    await deleteUser(db, user.id);
    await deleteSession(db, sessionId);
    client.close();
  });
});

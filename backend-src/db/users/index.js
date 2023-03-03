const passwordEncoding = require("../../utils/passwordEncoding");
const { createBlankNote } = require("../notes");
const { findSession } = require("../sessions");
const { ObjectId } = require("mongodb");

async function createUser(db, login, username, password) {
  if (typeof login !== 'string' || typeof username !== "string" || (typeof password !== "string" && typeof password !== 'undefined')) {
    return { error: { message: "Wrong data type in user creation function" } };
  }
  try {
    const payload = { login: login, name: username};
    if (password) payload.password = passwordEncoding(password)
    const response = await db.collection("users").insertOne(payload);
    await createBlankNote(db, response.insertedId.toString());
    return { id: response.insertedId.toString(), name: username };
  } catch (error) {
    if (error.code === 11000) {
      return { error: { code: error.code, message: "this username already exists", value: username } };
    }
    return { error: { code: error.code, message: error.message } };
  }
}

async function deleteUser(db, userId) {
  if (typeof userId !== "string") {
    return { error: { message: "Wrong data type in delete user function" } };
  }
  try {
    const response = await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
    if (response.deletedCount === 0) {
      return { error: { code: 404, message: "User is not found" } };
    } else return {};
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function findUserByName(db, username) {
  if (typeof username !== "string") {
    return { error: { message: "Wrong data type in find user function" } };
  }
  try {
    const user = await db.collection("users").findOne({ name: username });
    if (user) {
      return { id: user._id.toString(), name: user.name, password: user.password };
    } else return { error: { code: 404, message: "User is not found" } };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function findUserByLogin(db, login) {
  if (typeof login !== "string") {
    return { error: { message: "Wrong data type in find user function" } };
  }
  try {
    const user = await db.collection("users").findOne({ login: login });
    if (user) {
      return { id: user._id.toString(), login: user.login, name: user.name, password: user.password };
    } else return { error: { code: 404, message: "User is not found" } };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function findUserById(db, userId) {
  if (typeof userId !== "string") {
    return { error: { message: "Wrong data type in find user function" } };
  }
  try {
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (user) {
      return { id: user._id.toString(), name: user.name, password: user.password };
    } else return { error: { code: 404, message: "User is not found" } };
  } catch (error) {
    return { error: { code: error.code, message: error.message } };
  }
}

async function checkPassword(db, login, password) {
  if (typeof login !== "string" || typeof password !== "string") {
    return { error: { message: "Wrong data type in check password function" } };
  }
  const user = await findUserByLogin(db, login);
  if (user.error) return user;
  if (user.password === passwordEncoding(password)) {
    return { user: { id: user.id, name: user.name }, passed: true };
  } else return { passed: false };
}

async function findUserBySession(db, sessionId) {
  if (typeof sessionId !== "string") {
    return { error: { message: "Wrong data type in findUserBySession function" } };
  }
  const session = await findSession(db, sessionId);
  if (session.error) return { error: session.error };
  const user = await findUserById(db, session.user);
  if (user.error) return { error: user.error };
  return {id: user.id, name: user.name};
}

module.exports = {
  createUser,
  deleteUser,
  findUserByName,
  checkPassword,
  findUserBySession,
  findUserByLogin,
};

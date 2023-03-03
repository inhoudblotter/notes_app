const {ObjectId} = require('mongodb');
async function createSession(db, userId) {
  if (typeof userId !== 'string') return {error: {message: 'Wrong data type in session creation function'}};
  try {
    const response = await db.collection('sessions').insertOne({user: userId});
    return {id: response.insertedId.toString()}
  } catch (error) {
    return {error: {code: error.code, message: error.message}}
  }
}

async function deleteSession(db, sessionId) {
  if (typeof sessionId !== 'string') return {error: {message: 'Wrong data type in delete session function'}};
  try {
    const response = await db.collection('sessions').deleteOne({_id: new ObjectId(sessionId)});
    if (response.deletedCount === 0) {
      return {error: {code: 404, message: 'Session is not found'}}
    } else return {};
  } catch (error) {
    return {error: {code: error.code, message: error.message}}
  }
}

async function findSession(db, sessionId) {
  if (typeof sessionId !== 'string') return {error: {message: 'Wrong data type in find session function'}};
  try {
    const session = await db.collection('sessions').findOne({_id: new ObjectId(sessionId)});
    if (session) {
      return {id: session._id.toString(), user: session.user}
    } else {
      return {error: {code: 404, message: 'Session is not found'}}}
  } catch (error) {
    return {error: {code: error.code, message: error.message}}
  }
}
module.exports = {
  createSession,
  deleteSession,
  findSession,
}

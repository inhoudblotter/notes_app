const {findUserBySession} = require('../../db');

async function auth (req, res, next) {

  if (!req.cookies["token"]) return res.status(401).redirect("/");
  const user = await findUserBySession(req.db, req.cookies["token"]);
  if (user.error) return res.clearCookie("sessionId").status(401).redirect("/");
  req.sessionId = req.cookies["sessionId"];
  req.user = user;
  next();
}

module.exports = auth;

const {findUserBySession} = require('../../db');

async function checkToken (req, res, next) {

  if (!req.cookies["token"]) return next();
  const user = await findUserBySession(req.db, req.cookies["token"]);
  if (user.error) return res.clearCookie("sessionId").status(401).redirect("/");
  req.sessionId = req.cookies["sessionId"];
  req.user = user;
  res.redirect('/dashboard');
}

module.exports = checkToken;

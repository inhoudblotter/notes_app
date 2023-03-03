const { Router } = require("express");
const bodyParser = require("body-parser");
const auth = require("../../utils/express/auth");
const { googleAuthURI, getGoogleUser, githubAuthURI, getGithubUser } = require("../../utils/express/passport");
const { createUser, createSession, checkPassword, deleteSession, findUserByLogin } = require("../../db");
const router = Router();

router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(204).redirect(`/?authError=Введите имя пользователя`);
  if (!password) return res.status(204).redirect(`/?authError=Введите пароль`);
  const { user, passed, error } = await checkPassword(req.db, username, password);
  if (error) {
    if (error.code === 404) return res.status(404).redirect(`/?authError=Пользователь не найден`);
    return res.status(500).json({ error: error.message });
  }
  if (passed) {
    const session = await createSession(req.db, user.id);
    if (session.error) return res.status(500).redirect(`/?authError=${session.error.message}`);
    res.cookie("token", session.id).redirect("/dashboard");
  } else {
    res.status(400).redirect(`/?authError=Неверный пароль`);
  }
});

router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(204).redirect(`/?authError=Введите имя пользователя`);
  if (!password) return res.status(204).redirect(`/?authError=Введите пароль`);
  const user = await createUser(req.db, username, username, password);
  if (user.error) {
    let status, message;
    switch (user.error.code) {
      case 11000:
        status = 204;
        message = "Такой пользователь уже существует, придумайте новое имя";
        break;
      default:
        status = 500;
        message = user.error.message;
    }
    return res.status(status).redirect(`/?authError=${message}`);
  }

  const session = await createSession(req.db, user.id);
  if (session.error) return res.status(500).redirect(`/?authError=${session.error.message}`);

  res.cookie("token", session.id).redirect("/dashboard");
});

router.get("/logout", auth, async (req, res) => {
  await deleteSession(req.db, req.sessionId);
  res.clearCookie("token").redirect("/");
});

router.get("/oauth/:provider", (req, res) => {
  if (req.params.provider === "google") return res.redirect(googleAuthURI);
  if (req.params.provider === "github") return res.redirect(githubAuthURI);
  res.status(400).redirect(`/?authError=Неизвестный сервис аутентификации`)
});

router.get("/oauth", async (req, res) => {
  let user;
  try {
    if (req.query.provider === "google") {
      user = await getGoogleUser(req.query);
    } else if (req.query.provider === "github") {
      user = await getGithubUser(req.query);
    } else return res.status(400).redirect(`/?authError=Неизвестный сервис аутентификации`);
  } catch (error) {
    return res.status(500).redirect(`/?authError=${error.message}`);
  }

  if (!user.login || !user.name) return res.status(500).redirect(`/?authError=Что-то пошло не так`);

  let ourUser = await findUserByLogin(req.db, user.login);

  if (ourUser.error) {
    if (ourUser.error.code !== 404) {
      return res.status(500).redirect(`/?authError=${ourUser.error.message}`);
    } else {
      ourUser = await createUser(req.db, user.login, user.name);
      if (ourUser.error) return res.status(500).redirect(`/?authError=${ourUser.error.message}`);
    }
  }

  const session = await createSession(req.db, ourUser.id);
  if (session.error) return res.status(500).redirect(`/?authError=${session.error.message}`);

  res.cookie("token", session.id).redirect("/dashboard");
});

module.exports = {
  authRouter: router,
};

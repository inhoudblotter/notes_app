const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require('cookie-parser');
const { MongoClient } = require("mongodb");
const auth = require('./backend-src/utils/express/auth');
const checkToken = require('./backend-src/utils/express/checkToken');
const dbConnection = require('./backend-src/utils/express/dbConnection');
const {authRouter, notesRouter} = require('./backend-src/api');
const path = require('path');
const http = require('http');
const app = express();

nunjucks.configure(path.join(__dirname, "views"), {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());



const dbClient = MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  maxPoolSize: 10,
  minPoolSize: 5,
});
app.use(dbConnection(dbClient));

// API
app.use('/', authRouter);
app.use('/api/notes', notesRouter);

// Pages
app.get('/', checkToken, (req, res) => {
  res.render('index', {
    authError: req.query.authError
  });
});

app.get('/dashboard', auth, (req, res) => {
  res.render('dashboard', {
    username: req.user.name,
  });
});

app.get('*', (req, res) => {
  res.render('notFound');
});

const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

module.exports = server;

require("dotenv").config();
const { MongoClient } = require("mongodb");

async function dbConnection () {
  const client = await MongoClient.connect(process.env.DB_URI);
  const db = client.db(process.env.DB_NAME);
  return [client, db]
}

module.exports = dbConnection;

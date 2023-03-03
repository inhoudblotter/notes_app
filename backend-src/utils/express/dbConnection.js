function dbConnection(dbClient) {
  return async (req, _, next) => {
    try {
      const client = await dbClient;
      req.db = client.db(process.env.DB_NAME);
      next();
    } catch (err) {
      next(err);
    }
  };
}
module.exports = dbConnection;

module.exports = {
  async up(db, client) {
    await db.createCollection('sessions', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          title: "Sessions Object Validation",
          required: ["user"],
          properties: {
            user: {
              bsonType: "string",
              description: "'name' must be a string and is required"
            },
          },
        }
      }
    })
  },

  async down(db, client) {
    await db.collection('sessions').drop();
  }
};

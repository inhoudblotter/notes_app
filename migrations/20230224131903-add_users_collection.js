module.exports = {
  async up(db, _) {
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          title: "Users Object Validation",
          required: ["login", "name"],
          properties: {
            login: {
              bsonType: "string",
              description: "'login' must be a string and is required"
            },
            name: {
              bsonType: "string",
              description: "'name' must be a string and is required"
            },
            password: {
              bsonType: "string",
              description: "'password' must be a string"
            }
          },
        }
      }
    })
    await db.collection('users').createIndex({login: 1}, {unique: true})
  },

  async down(db, _) {
    await db.collection('users').drop();
  }
};

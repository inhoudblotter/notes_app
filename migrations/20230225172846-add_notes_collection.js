module.exports = {
  async up(db, client) {
    await db.createCollection("notes", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          title: "Notes Object Validation",
          required: ["title", "text", "html", "created", "user", "isArchived"],
          properties: {
            user: {
              bsonType: "string",
              description: "'user' must be a string and is required",
            },
            title: {
              bsonType: "string",
              description: "'title' must be a string and is required",
            },
            text: {
              bsonType: "string",
              description: "'text' must be a string and is required",
            },
            html: {
              bsonType: "string",
              description: "'html' must be a string and is required",
            },
            createdAt: {
              bsonType: "date",
              description: "'createdAt' must be a timestamp and is required",
            },
            isArchived: {
              bsonType: "bool",
              description: "'isArchived' must be a bool and is required",
            },
          },
        },
      },
    });
    await db.collection('notes').createIndex( { title: "text" } );
  },

  async down(db, client) {
    await db.collection('notes').drop();
  },
};

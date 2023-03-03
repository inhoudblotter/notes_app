require('dotenv').config();
const crypto = require('crypto');

function passwordEncoding(password) {
  function getHash(string) {
    return crypto.createHash("sha256").update(string, 'utf-8').digest('hex');
  }
  let hash = getHash(password);
  for (let i = 0; i < 3; i++) {
    hash = getHash(hash);
  }
  if (process.env.SALT) {
    hash = crypto.createHash("sha256").update(hash, 'utf-8').update(getHash(process.env.SALT), 'utf-8').digest('hex');
  }
  return hash;
}

module.exports = passwordEncoding;

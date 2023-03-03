const {authURI: googleAuthURI, getUser: getGoogleUser } = require('./google');
const {authURI: githubAuthURI, getUser: getGithubUser } = require('./github');
module.exports = {
  googleAuthURI,
  getGoogleUser,
  githubAuthURI,
  getGithubUser,
}

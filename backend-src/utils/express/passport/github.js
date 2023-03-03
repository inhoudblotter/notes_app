require('dotenv').config();
const axios = require('axios');

const authURI = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT}&redirect_uri=${process.env.HOST}/oauth?provider=github`;

async function getUser({code}) {
  const payload = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT,
    client_secret: process.env.GITHUB_SECRET,
    code: code,
    redirect_uri: `${process.env.HOST}/oauth?provider=github`
  })

  const token = await axios.post(`https://github.com/login/oauth/access_token?${payload}`)
    .then((res) => {
    if (res.error) return {error: {code: res.status}};
    return res.data.split('&')[0].slice(13);

  }).catch(error => {
    throw new Error(error.message);
  });
  console.log(token);
  const user = await axios.get('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then((res) => {
    if (res.error) return {error: {code: res.status}};
    return res.data;
  }).catch(error => {
    throw new Error(error.message);
  });
  return {login: user.login, name: user.login }
}

module.exports = {
  authURI,
  getUser
}

require('dotenv').config();
const {google} = require('googleapis');
const axios = require('axios');

const client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT,
  process.env.GOOGLE_SECRET,
  process.env.HOST + '/oauth?provider=google',
);

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

const authURI = client.generateAuthUrl({
  access_type: 'offline',
  include_granted_scopes: true,
  scope: scopes, // If you only need one scope you can pass it as string
});

async function getUser({ code }) {
  const { tokens } = await client.getToken(code);
    // Fetch the user's profile with the access token and bearer
    const user = await axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.id_token}`,
          },
        },
      )
      .then(res => {
        return {login: res.data.email, name: res.data.name};
      })
      .catch(error => {
        throw new Error(error.message);
      });

    return user;
}

module.exports = {
  authURI,
  getUser,
}

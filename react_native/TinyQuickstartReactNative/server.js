/*
server.js – Configures the Plaid client and uses Express to defines routes that call Plaid endpoints in the Sandbox environment. Utilizes the official Plaid node.js client library to make calls to the Plaid API.
*/

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const {Configuration, PlaidApi, PlaidEnvironments} = require('plaid');

const app = express();
const port = 8080;

app.use(
  // FOR DEMO PURPOSES ONLY
  // Use an actual secret key in production
  session({secret: 'bosco', saveUninitialized: true, resave: true}),
);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Configuration for the Plaid client
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

//Instantiate the Plaid client with the configuration
const client = new PlaidApi(config);

//Creates a Link token and return it
app.post('/api/create_link_token', async (req, res, next) => {
console.log(req,res,"Res-----geting")
  let payload = {};
  //Payload if running iOS
  if (req.body.address === 'localhost') {
    payload = {
      user: {client_user_id: req.sessionID},
      client_name: 'Plaid Tiny Quickstart - React Native',
      language: 'en',
      products: ['auth'],
      country_codes: ['US'],
      redirect_uri: process.env.PLAID_SANDBOX_REDIRECT_URI,
    };
  } else {
    //Payload if running Android
    payload = {
      user: {client_user_id: req.sessionID},
      client_name: 'Plaid Tiny Quickstart - React Native',
      language: 'en',
      products: ['auth'],
      country_codes: ['US'],
      android_package_name: process.env.PLAID_ANDROID_PACKAGE_NAME,
    };
  }
  const tokenResponse = await client.linkTokenCreate(payload);
  res.json(tokenResponse.data);
});

// Exchanges the public token from Plaid Link for an access token
app.post('/api/exchange_public_token', async (req, res, next) => {
  const exchangeResponse = await client.itemPublicTokenExchange({
    public_token: req.body.public_token,
  });

  // FOR DEMO PURPOSES ONLY
  // Store access_token in DB instead of session storage
  req.session.access_token = exchangeResponse.data.access_token;
  res.json(true);
});

// Fetches balance data using the Node client library for Plaid
app.post('/api/balance', async (req, res, next) => {
  const access_token = req.session.access_token;
  const balanceResponse = await client.accountsBalanceGet({access_token});
  res.json({
    Balance: balanceResponse.data,
  });
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}...`);
});

/*
server.js – Configures the Plaid client and uses Express to defines routes that call Plaid endpoints in the Sandbox environment.
Utilizes the official Plaid node.js client library to make calls to the Plaid API.
*/

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const path = require("path");
const app = express();

app.use(
  // FOR DEMO PURPOSES ONLY
  // Use an actual secret key in production
  session({ secret: "bosco", saveUninitialized: true, resave: true })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/oauth", async (req, res) => {
  res.sendFile(path.join(__dirname, "oauth.html"));
});

// Configuration for the Plaid client
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

//Instantiate the Plaid client with the configuration
const client = new PlaidApi(config);

//Creates a Link token and return it
app.get("/api/create_link_token", async (req, res, next) => {
  const tokenResponse = await client.linkTokenCreate({
    user: { client_user_id: req.sessionID },
    client_name: "Plaid's Tiny Quickstart",
    language: "en",
    products: ["identity"],
    country_codes: ["US"],
    redirect_uri: process.env.PLAID_SANDBOX_REDIRECT_URI,
  });
  res.json(tokenResponse.data);
});

// Exchanges the public token from Plaid Link for an access token
app.post("/api/exchange_public_token", async (req, res, next) => {
  console.log(req.body.public_token)
  const exchangeResponse = await client.itemPublicTokenExchange({
    public_token: req.body.public_token,
  });

  // FOR DEMO PURPOSES ONLY
  // Store access_token in DB instead of session storage
  req.session.access_token = exchangeResponse.data.access_token;
  res.json(true);
});

// Fetches balance data using the Node client library for Plaid
app.get("/api/data", async (req, res, next) => {
  const access_token = req.session.access_token;
  console.log(access_token);
  const user = {
    name: 'jane',
    phone: '857-488-7937',
    email: 'jane.doe@gmail.com',
    address: {
      city: 'new haven',
      region: 'ct',
      street: '183 bishop st',
      country: 'us',
      zip: '06511'
    }
  }
  console.log(user);
  const identityMatchResponse = await client.identityMatch({
        access_token: access_token,
        user: {
            legal_name: user.name,
            phone_number: user.phone,
            email_address: user.email,
            address: {
                city: user.address.city,
                region: user.address.state,
                street: user.address.street,
                postal_code: user.address.zip,
                country: user.address.country
            }
        }
    });
    console.log(identityMatchResponse.data);
    const account = identityMatchResponse.data.accounts[0];
    const scores = {
        'name': account.legal_name.score,
        'phone': account.phone_number.score,
        'email': account.email_address.score,
        'address': account.address.score
      };
  console.log(scores)
  //const balanceResponse = await client.accountsBalanceGet({ access_token });
  res.json({
    Balance: identityMatchResponse.data,
    //Balance: balanceResponse.data,
  });
});

// Checks whether the user's account is connected, called
// in index.html when redirected from oauth.html
app.get("/api/is_account_connected", async (req, res, next) => {
  return (req.session.access_token ? res.json({ status: true }) : res.json({ status: false}));
});

app.listen(process.env.PORT || 8080);

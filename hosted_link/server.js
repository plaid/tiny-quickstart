/*
server.js – Configures the Plaid client and uses Express to define routes that drive
a Hosted Link flow. Unlike embedded Link, the Plaid Link UI is hosted at a Plaid URL,
so the user is redirected away to complete linking and redirected back to /complete.
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

const PORT = process.env.PORT || 8080;
const COMPLETION_REDIRECT_URI = `http://localhost:${PORT}/complete`;

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

// Instantiate the Plaid client with the configuration
const client = new PlaidApi(config);

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Creates a Link token configured for Hosted Link and returns the
// Plaid-hosted URL the user should visit. The link_token is stashed
// in the session so we can retrieve the public_token via
// /link/token/get when the user returns from the hosted flow.
app.get("/api/create_hosted_link", async (req, res, next) => {
  const tokenResponse = await client.linkTokenCreate({
    user: { client_user_id: req.sessionID },
    client_name: "Plaid's Tiny Quickstart (Hosted Link)",
    language: "en",
    products: ["auth"],
    country_codes: ["US"],
    hosted_link: {
      completion_redirect_uri: COMPLETION_REDIRECT_URI,
    },
  });
  req.session.link_token = tokenResponse.data.link_token;
  res.json({ hosted_link_url: tokenResponse.data.hosted_link_url });
});

// Plaid redirects the user here after the Hosted Link flow finishes.
// We pull the public_token off the link session, exchange it for an
// access_token, and store it on the session.
app.get("/complete", async (req, res, next) => {
  const link_token = req.session.link_token;
  if (!link_token) {
    return res.redirect("/");
  }

  const tokenGet = await client.linkTokenGet({ link_token });
  const itemAddResult =
    tokenGet.data.link_sessions?.[0]?.results?.item_add_results?.[0];

  if (itemAddResult?.public_token) {
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token: itemAddResult.public_token,
    });
    // FOR DEMO PURPOSES ONLY
    // Store access_token in DB instead of session storage
    req.session.access_token = exchangeResponse.data.access_token;
  }
  res.redirect("/");
});

// Fetches balance data using the Node client library for Plaid
app.get("/api/data", async (req, res, next) => {
  const access_token = req.session.access_token;
  const balanceResponse = await client.accountsBalanceGet({ access_token });
  res.json({
    Balance: balanceResponse.data,
  });
});

// Checks whether the user's account is connected, called
// in index.html on initial page load
app.get("/api/is_account_connected", async (req, res, next) => {
  return req.session.access_token
    ? res.json({ status: true })
    : res.json({ status: false });
});

app.listen(PORT);

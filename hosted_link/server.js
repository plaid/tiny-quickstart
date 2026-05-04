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
const WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL || null;

// In-memory store of access tokens delivered via the SESSION_FINISHED
// webhook, keyed by link_token. Replace with a real database in production.
// Only used when PLAID_WEBHOOK_URL is configured.
const webhookAccessTokens = new Map();

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
    // When PLAID_WEBHOOK_URL is configured, Plaid will POST a
    // SESSION_FINISHED event to it once the Hosted Link flow ends.
    // The /webhook handler below uses that event to retrieve the
    // public_token; otherwise /complete falls back to /link/token/get.
    ...(WEBHOOK_URL ? { webhook: WEBHOOK_URL } : {}),
    hosted_link: {
      completion_redirect_uri: COMPLETION_REDIRECT_URI,
    },
  });
  req.session.link_token = tokenResponse.data.link_token;
  res.json({ hosted_link_url: tokenResponse.data.hosted_link_url });
});

// Receives Plaid webhooks. We only care about LINK / SESSION_FINISHED for
// this demo: when a Hosted Link session ends successfully, Plaid sends us
// the public_tokens for any Items that were added. We exchange the first
// one and stash the resulting access_token in webhookAccessTokens, keyed
// by link_token, so /complete can pick it up when the user is redirected
// back. The browser-driven /complete redirect and this server-to-server
// webhook can arrive in either order, hence the polling in /complete.
app.post("/webhook", async (req, res) => {
  const { webhook_type, webhook_code, link_token, public_tokens } =
    req.body || {};
  if (
    webhook_type === "LINK" &&
    webhook_code === "SESSION_FINISHED" &&
    public_tokens?.length
  ) {
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token: public_tokens[0],
    });
    webhookAccessTokens.set(link_token, exchangeResponse.data.access_token);
  }
  res.sendStatus(200);
});

// Plaid redirects the user here after the Hosted Link flow finishes.
// There are two ways to recover the access_token at this point:
//
//   1. Webhook path (PLAID_WEBHOOK_URL is configured): the SESSION_FINISHED
//      webhook handler above has already exchanged the public_token and
//      written the access_token into webhookAccessTokens. We just read it
//      out. The webhook can arrive slightly after this redirect, so we
//      poll the map briefly.
//
//   2. linkTokenGet path (no webhook configured): we call /link/token/get
//      to retrieve the public_token from the link session, then exchange
//      it for an access_token here.
app.get("/complete", async (req, res, next) => {
  const link_token = req.session.link_token;
  if (!link_token) {
    return res.redirect("/");
  }

  let access_token;

  if (WEBHOOK_URL) {
    // Webhook may race the redirect; poll briefly (up to ~3s).
    for (let i = 0; i < 10 && !access_token; i++) {
      access_token = webhookAccessTokens.get(link_token);
      if (!access_token) await new Promise((r) => setTimeout(r, 300));
    }
    webhookAccessTokens.delete(link_token);
  } else {
    const tokenGet = await client.linkTokenGet({ link_token });
    const itemAddResult =
      tokenGet.data.link_sessions?.[0]?.results?.item_add_results?.[0];
    if (itemAddResult?.public_token) {
      const exchangeResponse = await client.itemPublicTokenExchange({
        public_token: itemAddResult.public_token,
      });
      access_token = exchangeResponse.data.access_token;
    }
  }

  if (access_token) {
    // FOR DEMO PURPOSES ONLY
    // Store access_token in DB instead of session storage
    req.session.access_token = access_token;
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

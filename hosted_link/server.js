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

// Setting `hosted_link` on /link/token/create opts the session into the
// Hosted Link flow; the response then includes a `hosted_link_url` that
// the user must visit to complete linking. `completion_redirect_uri`
// is where Plaid will send the user once the flow ends.
app.get("/api/create_hosted_link", async (req, res, next) => {
  const tokenResponse = await client.linkTokenCreate({
    user: { client_user_id: req.sessionID },
    client_name: "Plaid's Tiny Quickstart (Hosted Link)",
    language: "en",
    products: ["auth"],
    country_codes: ["US"],
    // If `webhook` is set, Plaid POSTs lifecycle events for this link
    // session to that URL. For Hosted Link, the relevant event is
    // SESSION_FINISHED, which carries the public_tokens for any Items
    // the user linked.
    ...(WEBHOOK_URL ? { webhook: WEBHOOK_URL } : {}),
    hosted_link: {
      completion_redirect_uri: COMPLETION_REDIRECT_URI,
    },
  });
  req.session.link_token = tokenResponse.data.link_token;
  res.json({ hosted_link_url: tokenResponse.data.hosted_link_url });
});

// Plaid POSTs all webhooks to a single URL; the body's `webhook_type` and
// `webhook_code` identify the event. SESSION_FINISHED (under webhook_type
// "LINK") fires when a Hosted Link session reaches a terminal state. On a
// successful session, `public_tokens` holds one public_token per linked
// Item — exchange them for access_tokens via /item/public_token/exchange,
// the same way you would for embedded Link.
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

// Plaid redirects the user here when the Hosted Link flow ends. If
// you're using the SESSION_FINISHED webhook to get the public_token,
// this redirect is just UX — e.g. a "thanks" page or a bounce back
// to the app. Many production apps don't render Plaid results on
// this page at all. Otherwise, /link/token/get is used here to
// retrieve the public_token synchronously from the link session.
app.get("/complete", async (req, res, next) => {
  const link_token = req.session.link_token;
  if (!link_token) {
    return res.redirect("/");
  }

  if (!WEBHOOK_URL) {
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

// Webhooks arrive server-to-server with no inherent session context, so
// the link_token is the correlation ID we use to associate a
// SESSION_FINISHED event back to the browser session that initiated the
// flow. We promote a webhook-delivered access_token into the session
// here, lazily, the next time the browser asks about its connection.
app.get("/api/is_account_connected", async (req, res, next) => {
  if (!req.session.access_token && req.session.link_token) {
    const promoted = webhookAccessTokens.get(req.session.link_token);
    if (promoted) {
      req.session.access_token = promoted;
      webhookAccessTokens.delete(req.session.link_token);
    }
  }
  return req.session.access_token
    ? res.json({ status: true })
    : res.json({ status: false });
});

app.listen(PORT);

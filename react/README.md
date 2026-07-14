# README: Tiny Quickstart (React)

### Overview

This is a minimal app that implements Plaid using a React frontend with an Express/Node backend. After linking a sample bank account, the app retrieves balance information associated with the account and renders it on the home page. For reference, frontend code is in **src/App.jsx**, while backend code is in **server.cjs**.

If you're looking for a more fully-featured quickstart, covering more API endpoints, available in more languages, and with explanations of the underlying flows, see the official [Plaid Quickstart](https://www.plaid.com/docs/quickstart). 

#### Set up your environment

This app requires Node.js 20 or later. You can use a tool such as [nvm](https://github.com/nvm-sh/nvm) to make sure the app uses the target version of Node. For information on installing Node, see [How to install Node.js](https://nodejs.org/en/download).

#### Install dependencies

Ensure you're in the **react/** folder, then install the necessary dependencies:

```bash
npm install
```

#### Equip the app with credentials

Copy the included **.env.example** to a file called **.env**.

```bash
cp .env.example .env
```

Fill out the contents of the **.env** file with the [client ID and Sandbox secret in your Plaid dashboard](https://dashboard.plaid.com/team/keys). Don't place quotes (`"`) around the credentials (i.e., `PLAID_CLIENT_ID=adn08a280hqdaj0ad`). Use the "Sandbox" secret when setting the `PLAID_SECRET` variable.

#### Configure OAuth (optional)

Many major US banks connect only via OAuth, which this sample already supports via a pop-up (no setup needed). Setting a redirect URI switches to the OAuth redirect flow instead — more robust, because pop-ups fail in in-app browsers (links opened from Mail, Facebook, etc.), which you can't predict, and aren't available when Link's web SDK runs inside a mobile app. To use it, allowlist a redirect URI in the [Plaid Dashboard](https://dashboard.plaid.com/team/api) and set `PLAID_SANDBOX_REDIRECT_URI` in **.env** (use `http://localhost:3000/`). See the [OAuth guide](https://plaid.com/docs/link/oauth/).

#### Start the server

```bash
npm start
```

The app will run on port 3000 and will hot-reload if you make edits.

### Using the app

The app allows you to link a sample bank account. Use the following sample credentials:

- Username: `user_good`
- Password: `pass_good`

If prompted to provide a multi-factor authentication code, use `1234`

### Troubleshooting

#### MISSING_FIELDS error

If you encounter a **MISSING_FIELDS** error, it's possible you did not properly fill out the **.env** file. Be sure to add your client ID and Sandbox secret to the corresponding variables in the file.
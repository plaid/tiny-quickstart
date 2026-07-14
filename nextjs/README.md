# Tiny Quickstart (Next.js)

### Overview

This is a minimial application that uses [Next.js](https://nextjs.org/) for a React frontend and a Node.js backend.

After linking a sample bank account, the app retrieves balance information associated with the account and renders it on the `/dash` page.

If you're looking for a more fully-featured quickstart, covering more API endpoints, available in more languages, and with explanations of the underlying flows, see the official [Plaid Quickstart](https://www.plaid.com/docs/quickstart).

#### Set up your environment

Install [Node.js v16+](https://nodejs.org/en/download).

[Install `pnpm`](https://pnpm.io/installation) to follow along with these instructions as written.

#### Install dependencies

Ensure you're in the **nextjs/** folder, then install the necessary dependencies:

```bash
pnpm install
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
pnpm dev
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


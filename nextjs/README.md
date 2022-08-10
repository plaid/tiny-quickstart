# Tiny Quickstart (Next.js)

### Overview

This is a minimial application that uses [Next.js](https://nextjs.org/) for a React frontend and a Node.js backend.

After linking a sample bank account, the app retrieves balance information associated with the account and renders it on the `/dash` page.

If you're looking for a more fully-featured quickstart, covering more API endpoints, available in more languages, and with explanations of the underlying flows, see the official [Plaid Quickstart](https://www.plaid.com/docs/quickstart).

#### Set up your environment

Install [Node.js v16+](https://nodejs.dev/learn/how-to-install-nodejs).

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

#### Start the server

```bash
pnpm dev
```

The app will run on port 3000 and will hot-reload if you make edits.

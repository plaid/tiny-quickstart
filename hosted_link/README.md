# README: Tiny Quickstart (Hosted Link)

### Overview

This is a minimal app that demonstrates [Plaid Hosted Link](https://plaid.com/docs/link/hosted-link/) with an Express/Node backend. Instead of embedding the Plaid Link SDK in the browser, the app sends the user to a Plaid-hosted URL to complete the linking flow, then handles the redirect back. After linking a sample bank account, the app retrieves balance information and renders it on the home page.

If you're looking for a more fully-featured quickstart, covering more API endpoints, available in more languages, and with explanations of the underlying flows, see the official [Plaid Quickstart](https://www.plaid.com/docs/quickstart).

### When to use Hosted Link

Hosted Link is the recommended Link mode when the standard embedded Plaid SDKs aren't a good fit. Per the [Hosted Link docs](https://plaid.com/docs/link/hosted-link/), reach for it when:

- **You're integrating from a webview-based mobile app** where the native Plaid SDKs can't be used. Hosted Link runs out-of-process (`ASWebAuthenticationSession` on iOS, Custom Tabs on Android), avoiding in-process webview restrictions.
- **You don't control the frontend** — embedded/nested integrations like iframes or PSP integrations where rendering responsibility lives elsewhere.
- **You don't have a customer-facing app or website.** For example, the end user accesses Link via a QR code shown in an in-person retail checkout, or via a link sent by email or SMS.

### Optional: webhook-driven completion

By default — when no webhook is configured — the server calls `/link/token/get` from the `/complete` redirect to retrieve the `public_token` and exchange it synchronously.

If you'd rather receive the `public_token` server-to-server, set `PLAID_WEBHOOK_URL` in your **.env** file. The app will register that URL with the Link session, and Plaid will POST a `SESSION_FINISHED` event to it when the flow ends. The handler exchanges the token and the `access_token` becomes available to the user's session on the next request.

In this mode, the `/complete` redirect is purely UX — many production apps don't render Plaid API results on it at all, since the webhook drives backend processing independently of where the user is in their browser.

The webhook URL must be publicly reachable, so during local development, expose port 8080 via a tunnel like [ngrok](https://ngrok.com/):

```bash
ngrok http 8080
```

Then set `PLAID_WEBHOOK_URL=https://<your-ngrok-subdomain>.ngrok-free.app/webhook` in **.env** and restart the server.

### Running the app

#### Set up your environment

This app uses the latest stable version of Node. For information on installing Node, see [How to install Node.js](https://nodejs.dev/learn/how-to-install-nodejs).

#### Install dependencies

Ensure you're in the **hosted_link/** folder, then install the necessary dependencies:

```bash
npm install
```

#### Equip the app with credentials

Copy the included **.env.example** to a file called **.env**.

```bash
cp .env.example .env
```

Fill out the contents of the **.env** file with the [client ID and Sandbox secret in your Plaid dashboard](https://dashboard.plaid.com/team/keys). Don't place quotes (`"`) around the credentials (i.e., `PLAID_CLIENT_ID=adn08a280hqdaj0ad`). Use the "Sandbox" secret when setting the `PLAID_SECRET` variable.

#### Start the server

```bash
npm start
```

The app will run on port 8080.

### Using the app

1. Navigate to `http://localhost:8080` and click **Link account**.
2. You'll be redirected to a Plaid-hosted page to complete the Link flow. Use the sandbox credentials below.
3. After linking, Plaid redirects you back to `http://localhost:8080/complete`, which exchanges the public token for an access token and sends you back to the home page where the account balance is rendered.

Sandbox credentials for non-OAuth banks:

- Username: `user_good`
- Password: `pass_good`

If prompted to provide a multi-factor authentication code, use `1234`.

### Troubleshooting

#### MISSING_FIELDS error

If you encounter a **MISSING_FIELDS** error, it's possible you did not properly fill out the **.env** file. Be sure to add your client ID and Sandbox secret to the corresponding variables in the file.

#### The page is blank after returning from Plaid

The home page only displays balance information once a `public_token` has been retrieved and exchanged — in `/complete` by default, or in `/webhook` when `PLAID_WEBHOOK_URL` is set. Check the relevant server log. Common causes: an expired link token, or a Sandbox session that exited without linking an account.

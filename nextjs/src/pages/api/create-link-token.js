import { plaidClient } from '../../lib/plaid';

export default async function handler(req, res) {
  const tokenResponse = await plaidClient.linkTokenCreate({
    user: { client_user_id: 'user-id' },
    client_name: "Plaid's Tiny Quickstart",
    language: 'en',
    products: ['auth'],
    country_codes: ['US'],
    redirect_uri: process.env.PLAID_SANDBOX_REDIRECT_URI,
  });

  return res.json(tokenResponse.data);
}

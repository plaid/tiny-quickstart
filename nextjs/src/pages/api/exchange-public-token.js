import { getIronSession } from 'iron-session';
import { plaidClient, sessionOptions } from '../../lib/plaid';

export default async function exchangePublicToken(req, res) {
  const session = await getIronSession(req, res, sessionOptions);

  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    public_token: req.body.public_token,
  });

  session.access_token = exchangeResponse.data.access_token;
  await session.save();
  res.send({ ok: true });
}

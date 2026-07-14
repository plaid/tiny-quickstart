import Router from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';

export default function PlaidLink() {
  const [token, setToken] = useState(null);
  const [isOauth, setIsOauth] = useState(false);

  useEffect(() => {
    // On the OAuth redirect, reuse the original link_token (stored before the
    // redirect) so Link can resume the session instead of starting a new one.
    if (window.location.href.includes('?oauth_state_id=')) {
      setToken(localStorage.getItem('link_token'));
      setIsOauth(true);
      return;
    }
    const createLinkToken = async () => {
      const response = await fetch('/api/create-link-token', {
        method: 'POST',
      });
      const { link_token } = await response.json();
      setToken(link_token);
      localStorage.setItem('link_token', link_token);
    };
    createLinkToken();
  }, []);

  const onSuccess = useCallback(async (publicToken) => {
    await fetch('/api/exchange-public-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token: publicToken }),
    });
    Router.push('/dash');
  }, []);

  const config = { token, onSuccess };
  // On the OAuth redirect, pass the received redirect URI (it carries the
  // oauth_state_id) so Link can pick the flow back up where it left off.
  if (isOauth && typeof window !== 'undefined') {
    config.receivedRedirectUri = window.location.href;
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    // After an OAuth redirect, automatically reopen Link once it's ready.
    if (isOauth && ready) {
      open();
    }
  }, [isOauth, ready, open]);

  return (
    <button onClick={() => open()} disabled={!ready}>
      <strong>Link account</strong>
    </button>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import { PlaidEmbeddedLink } from "react-plaid-link";
import "./App.scss";
import {
  forceFullScreen,
  removeInjectedStylesheet,
  interceptPlaidIframe,
} from "./plaidIframe";

const MODAL_HEIGHT = '608px';
const MODAL_WIDTH = '360px';

function App(props) {
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleViewport, setVisibleViewport] = useState({
    top: '0px',
    left: '0px',
    width: "100%",
    height: "100%",
  });

  const onSuccess = useCallback(async (publicToken) => {
    setLoading(true);
    await fetch("/api/exchange_public_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_token: publicToken }),
    });
    await getBalance();
  }, []);

  // Creates a Link token
  const createLinkToken = React.useCallback(async () => {
    // For OAuth, use previously generated Link token
    if (window.location.href.includes("?oauth_state_id=")) {
      const linkToken = localStorage.getItem("link_token");
      setToken(linkToken);
    } else {
      const response = await fetch("/api/create_link_token", {});
      const data = await response.json();
      setToken(data.link_token);
      localStorage.setItem("link_token", data.link_token);
    }
  }, [setToken]);

  // Fetch balance data
  const getBalance = React.useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/balance", {});
    const data = await response.json();
    setData(data);
    setLoading(false);
  }, [setData, setLoading]);

  let isOauth = false;

  const config = {
    token,
    onSuccess,
  };

  // For OAuth, configure the received redirect URI
  if (window.location.href.includes("?oauth_state_id=")) {
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }

  useEffect(() => {
    if (token == null) {
      createLinkToken();
    }
  }, [token, createLinkToken]);

  const positionPlaidIframe = useCallback(
    (plaidIframe) => {
      const { top, left, width, height } = visibleViewport;
        plaidIframe.style.position = "fixed";
      if (props.isMobile) {
        plaidIframe.style.top = top;
        plaidIframe.style.left = left;
        plaidIframe.style.setProperty("height", height, "important");
        plaidIframe.style.setProperty("width", width, "important");
      } else {
        plaidIframe.style.top = `calc(50% - ${top})`;
        plaidIframe.style.setProperty(
          "height",
          MODAL_HEIGHT,
          "important"
        );
        plaidIframe.style.setProperty("width", MODAL_WIDTH, "important");
        plaidIframe.style.left = `calc(50% - ${left})`;
        plaidIframe.style.transform = "translate(-50%, -50%)";
        plaidIframe.style.boxShadow = "0 8px 16px 0 rgba(0,0,0,.2)";
        plaidIframe.style.borderRadius = "8px";
        plaidIframe.style.border = 0;
        plaidIframe.style.background = "white";
      }
    },
    [props.isMobile, visibleViewport]
  );

  useEffect(() => {
    forceFullScreen();
  }, []);

  useEffect(() => {
    if (props.isMobile) {
      return;
    }
    return removeInjectedStylesheet();
  }, [props.isMobile]);

  useEffect(() => {
    return interceptPlaidIframe(positionPlaidIframe);
  }, [positionPlaidIframe]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    }}>
      {config.token && (
        <PlaidEmbeddedLink
          token={config.token}
          onSuccess={onSuccess}
          style={{
            width: '400px',
            height: '360px',
          }}
        />
      )}

      {!loading &&
        data != null &&
        Object.entries(data).map((entry, i) => (
          <pre key={i}>
            <code>{JSON.stringify(entry[1], null, 2)}</code>
          </pre>
        ))}
    </div>
  );
}

export default App;

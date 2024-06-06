// The Plaid link script is loaded asynchronously and we want to pass an extra argument to
// force Link to render in full screen.
// Use the mutation observer to detect when the Plaid script is loaded and then wrap the createEmbedded method.
// This should be called before createEmbedded is called.
export const forceFullScreen = () => {
  new MutationObserver((mutations, observer) => {
    let plaidScript = null;
    for (const mutation of mutations) {
      if (
        mutation.type !== "childList" ||
        !mutation.addedNodes ||
        !mutation.addedNodes.length
      )
        continue;
      for (const node of mutation.addedNodes) {
        if (node.tagName === "SCRIPT" && node.src.includes("cdn.plaid.com")) {
          plaidScript = node;
          break;
        }
      }
    }
    if (!plaidScript) return;
    plaidScript.addEventListener("load", () => {
      if (!window.Plaid) {
        return;
      }
      const createEmbedded = window.Plaid.createEmbedded;
      window.Plaid.createEmbedded = (config, node) => {
        // wrap the createEmbedded function to force mobile mode which forces Link to render full screen.
        return createEmbedded(config, node, { forceMobile: true });
      };
    });
    observer.disconnect();
  }).observe(document.body, { childList: true, subtree: true });
};

// When we are on mobile, the Plaid SDK injects a special stylesheet to override some styles of the parent document.
// Typically this is okay and neccessary to make sure Plaid link works on the mobile device when it is taking up the full screen.
// This should be invoked if we are not on mobile browsers.
export const removeInjectedStylesheet = () => {
  // Get rid of the injected stylesheet
  const styleObserver = new MutationObserver((mutationsList) => {
    const findPlaidStylesheet = () => {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          for (let node of mutation.addedNodes) {
            if (
              node.getAttribute("id").indexOf("plaid-link-stylesheet") !== -1
            ) {
              return node;
            }
          }
        }
      }
    };
    const plaidStylesheet = findPlaidStylesheet();
    if (!plaidStylesheet || !plaidStylesheet.parentNode) {
      return;
    }
    plaidStylesheet.parentNode.removeChild(plaidStylesheet);
  });
  styleObserver.observe(document.head, { childList: true, subtree: true });
  return styleObserver.disconnect;
};

// Find the plaid iframe when it gets inserted into the DOM and invoke the callback with the iframe as an argument
export const interceptPlaidIframe = (callback) => {
  const iframeObserver = new MutationObserver((mutationsList) => {
    const findPlaidIframe = () => {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          for (let node of mutation.addedNodes) {
            if (
              node.nodeName === "IFRAME" &&
              node.getAttribute("id").indexOf("plaid-link-iframe") !== -1
            ) {
              return node;
            }
          }
        }
      }
    };
    const iframe = findPlaidIframe();
    if (!iframe) {
      return;
    }
    callback(iframe);
  });
  iframeObserver.observe(document.body, { childList: true, subtree: true });
  return iframeObserver.disconnect;
};

import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import isMobile from "./isMobile";

const mobile = isMobile();

ReactDOM.render(
  <React.StrictMode>
    <App isMobile={mobile} />
  </React.StrictMode>,
  document.getElementById("root")
);

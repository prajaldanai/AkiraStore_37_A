import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

function ensurePopupRoot() {
  let el = document.getElementById("popup-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "popup-root";
    document.body.appendChild(el);
  }
}
ensurePopupRoot();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

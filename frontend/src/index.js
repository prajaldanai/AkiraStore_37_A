import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ IMPORT GLOBAL CSS (ONLY HERE)
import "./styles/global.css";

// ❌ REMOVE / DO NOT USE index.css anymore
// import "./index.css";

/* =====================================================
   Ensure popup root exists (SAFE – no CSS impact)
   ===================================================== */
function ensurePopupRoot() {
  let el = document.getElementById("popup-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "popup-root";
    document.body.appendChild(el);
  }
}
ensurePopupRoot();

/* =====================================================
   Render App
   ===================================================== */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

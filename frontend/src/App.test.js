import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ⭐ FIX: Ensure popup-root ALWAYS exists for portals
let popupRoot = document.getElementById("popup-root");
if (!popupRoot) {
  popupRoot = document.createElement("div");
  popupRoot.id = "popup-root";
  document.body.appendChild(popupRoot);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

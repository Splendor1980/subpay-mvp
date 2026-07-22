import React from "react";
import ReactDOM from "react-dom/client";
import { FrostProvider } from "@rialo/frost";
import { subpayConfig } from "@/config";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FrostProvider config={subpayConfig}>
      <App />
    </FrostProvider>
  </React.StrictMode>
);

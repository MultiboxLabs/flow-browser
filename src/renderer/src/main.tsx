import { Fragment, StrictMode as ReactStrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const STRICT_MODE_ENABLED = true;

const StrictMode = STRICT_MODE_ENABLED ? ReactStrictMode : Fragment;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

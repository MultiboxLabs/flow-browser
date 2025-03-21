import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "./page.tsx";
import { ThemeProvider } from "@/components/main/theme.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);

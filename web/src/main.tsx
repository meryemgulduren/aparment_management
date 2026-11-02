import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
// Marka yazı tipleri (ADR-001): pakete gömülü, dışarıdan indirilmez.
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

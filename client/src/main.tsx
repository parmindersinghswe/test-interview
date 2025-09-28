import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from "@shared/LanguageProvider";
import "./index.css";

const container = document.getElementById("root")!;

const app = (
  <HelmetProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </HelmetProvider>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

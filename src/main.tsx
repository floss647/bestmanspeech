import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "./lib/attribution";

captureAttribution();

const container = document.getElementById("root")!;

// Pages listed in scripts/prerender.mjs ship with their HTML already in #root
// (so search engines and link previews see real content). Hydrate those;
// render from scratch everywhere else.
if (container.hasChildNodes()) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}

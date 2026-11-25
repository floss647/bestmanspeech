import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "./lib/attribution";
import { knownCountry } from "./lib/geolocation";
import { startUsEnglish } from "./lib/usEnglish";
import { flushSync } from "react-dom";

captureAttribution();

const container = document.getElementById("root")!;

// Pages listed in scripts/prerender.mjs ship with their HTML already in #root
// (so search engines and link previews see real content). Hydrate those;
// render from scratch everywhere else.
// The prerendered HTML is the UK version (US visitors are usually served the US
// copy by the edge function). Hydrate only when the app will start in the UK
// version or doesn't know the country yet; otherwise render fresh, synchronously,
// with American spelling already switched on so the swap never shows.
const country = knownCountry();
if (country === "US" || country === "CA") startUsEnglish();
if (container.hasChildNodes() && (!country || country === "GB")) {
  hydrateRoot(container, <App />);
} else {
  const root = createRoot(container);
  flushSync(() => root.render(<App />));
}

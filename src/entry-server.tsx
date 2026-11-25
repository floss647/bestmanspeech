import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppShell } from "./App";
import { LANDING_PAGES } from "./lib/landingPageData";

/** Render one route to HTML at build time. Used only by scripts/prerender.mjs. */
export function render(url: string, country?: string): string {
  (globalThis as { __BMS_SSR_CC?: string }).__BMS_SSR_CC = country;
  return renderToString(
    <AppShell router={({ children }) => <StaticRouter location={url}>{children}</StaticRouter>} />,
  );
}

/** Per-page title/description so each prerendered file has its own meta tags. */
export const landingPages = LANDING_PAGES.map((p) => ({
  slug: p.slug,
  title: p.metaTitle,
  description: p.metaDescription,
}));

export { toAmerican } from "./lib/usEnglish";

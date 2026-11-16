// Build-time prerendering: after `vite build`, render the public marketing
// pages to static HTML so crawlers, ad landing-page checks and link previews
// get real content instead of an empty <div id="root">. The app then hydrates
// in the browser as before. App-only routes (/write, /checkout, …) stay
// client-rendered via the SPA fallback in netlify.toml.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const SITE = "https://www.bestmanspeech.com";

const { render, landingPages } = await import(
  pathToFileURL(path.join(dist, "server", "entry-server.js")).href
);
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const pages = [
  { url: "/" },
  { url: "/about", title: "About Adrian Simpson | bestmanspeech.com" },
  { url: "/contact", title: "Contact | bestmanspeech.com" },
  { url: "/privacy", title: "Privacy Policy | bestmanspeech.com" },
  { url: "/terms", title: "Terms & Conditions | bestmanspeech.com" },
  ...landingPages.map((p) => ({ url: `/${p.slug}`, title: p.title, description: p.description })),
];

function withMeta(html, { url, title, description }) {
  const canonical = SITE + (url === "/" ? "/" : url);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  if (title) {
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
      .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`);
  }
  if (description) {
    html = html
      .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(description)}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(description)}`)
      .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(description)}`);
  }
  return html.replace(/(<meta property="og:url" content=")[^"]*/, `$1${canonical}`);
}

// Keep an untouched shell for client-only routes (SPA fallback target).
fs.writeFileSync(path.join(dist, "app.html"), template);

const urls = [];
for (const page of pages) {
  const body = render(page.url);
  const html = withMeta(template, page).replace(
    '<div id="root"></div>',
    `<div id="root">${body}</div>`,
  );
  // /best-man-speech -> best-man-speech.html: Netlify serves it at the clean URL
  // with no trailing-slash redirect, matching the canonical and existing ad links.
  const out = page.url === "/" ? path.join(dist, "index.html") : path.join(dist, `${page.url.slice(1)}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  urls.push(SITE + (page.url === "/" ? "/" : page.url));
}

fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`,
);
fs.rmSync(path.join(dist, "server"), { recursive: true, force: true });
console.log(`Prerendered ${pages.length} pages + sitemap.xml`);

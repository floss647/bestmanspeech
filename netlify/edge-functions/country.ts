// Use Netlify's own geolocation so US visitors get the US version of the site from
// the first byte:
//  - every HTML response sets a bms_cc cookie the app reads at start-up;
//  - US visitors to the homepage or a speech landing page are served the US copy
//    (built into /us/ by scripts/prerender.mjs), which has US prices and spelling.
// ?mkt=uk|us on the URL overrides (handled by the app).
const APP_ROUTES = new Set(["/write", "/speech", "/rehearse", "/checkout", "/payment-success", "/resume", "/resume-form", "/admin", "/about", "/contact", "/privacy", "/terms"]);

type Ctx = { geo?: { country?: { code?: string } }; next: () => Promise<Response> };

const withCookie = (res: Response, code?: string) => {
  if (!code || !/^[A-Z]{2}$/.test(code)) return res;
  const out = new Response(res.body, res);
  out.headers.append("set-cookie", `bms_cc=${code}; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
  return out;
};

export default async (req: Request, context: Ctx) => {
  const code = context.geo?.country?.code;
  const url = new URL(req.url);
  const mkt = url.searchParams.get("mkt")?.toLowerCase();
  const wantUs = mkt ? mkt === "us" : code === "US";
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (wantUs && req.method === "GET" && !APP_ROUTES.has(path) && !path.slice(1).includes("/") && !path.includes(".")) {
    try {
      const us = await fetch(new URL(`/us${path === "/" ? "/" : path}`, url.origin));
      if (us.ok) {
        const html = await us.text();
        if (html.includes('name="bms-variant" content="us"')) {
          const headers = new Headers(us.headers);
          headers.set("content-type", "text/html; charset=utf-8");
          headers.set("cache-control", "public, max-age=0, must-revalidate");
          headers.set("vary", "cookie");
          return withCookie(new Response(html, { status: 200, headers }), code);
        }
      }
    } catch { /* fall through to the normal page */ }
  }

  const res = await context.next();
  return (res.headers.get("content-type") || "").includes("text/html") ? withCookie(res, code) : res;
};

export const config = {
  path: "/*",
  excludedPath: ["/us/*", "/assets/*", "/*.js", "/*.css", "/*.png", "/*.jpg", "/*.jpeg", "/*.webp", "/*.svg", "/*.ico", "/*.mp4", "/*.webm", "/*.woff2", "/*.txt", "/*.xml", "/*.json", "/*.pdf"],
};

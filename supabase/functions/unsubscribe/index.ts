import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// One-click unsubscribe from follow-up emails. The link is signed so nobody can
// unsubscribe someone else.

async function sign(email: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(sig)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const page = (msg: string) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>bestmanspeech.com</title>
  <div style="font-family:Georgia,serif;max-width:480px;margin:80px auto;padding:0 24px;font-size:18px;line-height:1.6;color:#222">
  <p>${msg}</p><p><a href="https://www.bestmanspeech.com" style="color:#b8860b">bestmanspeech.com</a></p></div>`,
  { headers: { "Content-Type": "text/html; charset=utf-8" } },
);

serve(async (req) => {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const token = url.searchParams.get("t") || "";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: sec } = await db.from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  const secret = sec?.value as string | undefined;
  if (!email || !secret || token !== await sign(email, secret)) {
    return page("Sorry, that unsubscribe link isn't valid. Reply to any of our emails and we'll remove you.");
  }
  await db.from("email_optouts").upsert({ email });
  return page("You're unsubscribed. You won't get any more reminder emails from us.");
});

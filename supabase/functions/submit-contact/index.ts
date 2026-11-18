import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Contact form: save the message, then email it to Adrian with Reply-To set to
// the sender, so he can answer straight from his inbox.

const NOTIFY_TO = "adrian@allspeechesgreatandsmall.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();
    const page = String(body.page ?? "").trim().slice(0, 200);

    if (!name || !email || !message) return json({ error: "Please fill in all fields" }, 400);
    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      return json({ error: "One or more fields exceed the maximum length" }, 400);
    }
    if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: dbError } = await supabase.from("contact_submissions").insert({ name, email, message });
    if (dbError) {
      console.error("[submit-contact] insert failed:", dbError.message);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }

    // The message is saved; an email failure shouldn't fail the visitor's submission.
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[submit-contact] RESEND_API_KEY not set; message saved but not emailed");
      return json({ success: true });
    }

    const country = req.headers.get("cf-ipcountry") || req.headers.get("x-country") || "";
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">
        <h2 style="margin:0 0 12px">New message from bestmanspeech.com</h2>
        <p style="margin:0 0 4px"><b>Name:</b> ${esc(name)}</p>
        <p style="margin:0 0 4px"><b>Email:</b> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
        ${page ? `<p style="margin:0 0 4px"><b>Sent from:</b> ${esc(page)}</p>` : ""}
        ${country ? `<p style="margin:0 0 4px"><b>Country:</b> ${esc(country)}</p>` : ""}
        <div style="margin:16px 0;padding:14px 16px;background:#f6f3ec;border-left:4px solid #d4a72c;white-space:pre-wrap">${esc(message)}</div>
        <p style="color:#666;font-size:13px">Just hit reply to answer ${esc(name)} directly.</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "bestmanspeech.com <noreply@bestmanspeech.com>",
        to: NOTIFY_TO,
        reply_to: email,
        subject: `New enquiry from ${name.slice(0, 60)}`,
        html,
        text: `New message from bestmanspeech.com\n\nName: ${name}\nEmail: ${email}\n${page ? `Sent from: ${page}\n` : ""}\n${message}\n\nReply to this email to answer ${name} directly.`,
      }),
    });
    if (!res.ok) {
      console.error("[submit-contact] Resend error:", res.status, await res.text());
    }

    return json({ success: true });
  } catch (error) {
    console.error("[submit-contact] error:", error instanceof Error ? error.message : String(error));
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});

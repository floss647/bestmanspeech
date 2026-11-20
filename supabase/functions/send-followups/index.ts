import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Follow-up emails, run every 15 minutes by pg_cron:
//  1. Preview seen, not paid  -> email after ~1 hour, reminder after ~24 hours
//  2. Email given, questions not finished -> one email after ~1 hour
// Requires header x-cron-secret matching app_secrets.cron_secret. Every email has an unsubscribe link.

const ORIGIN = "https://www.bestmanspeech.com";
const FROM = "Adrian Simpson <noreply@bestmanspeech.com>";
const REPLY_TO = "adrian@allspeechesgreatandsmall.com";
const HOUR = 60 * 60 * 1000;
const POSTAL = "All Speeches Great and Small, Judins, Heathfield Road, East Sussex, United Kingdom";

const TITLES: Record<string, string> = {
  "best-man": "best man speech", "groom": "groom's speech", "bride": "bride's speech",
  "father-of-bride": "father of the bride speech", "mother-of-bride": "mother of the bride speech",
  "brother-of-bride": "brother of the bride speech", "maid-of-honour": "maid of honour speech",
  "father-of-groom": "father of the groom speech", "mother-of-groom": "mother of the groom speech",
  "birthday": "birthday speech", "anniversary": "anniversary speech", "retirement": "retirement speech",
  "eulogy": "eulogy", "graduation": "graduation speech", "baby-shower": "baby shower speech",
  "engagement-party": "engagement party speech", "corporate-event": "speech", "awards-ceremony": "awards speech",
  "farewell": "farewell speech", "golf-club": "speech", "charity-gala": "speech", "keynote": "keynote speech",
  "wedding-vows": "wedding vows",
};
const AMERICAN = new Set(["US", "CA"]);

const titleFor = (type: string, country: string | null) => {
  const t = TITLES[type] || "speech";
  return country && AMERICAN.has(country) ? t.replace("honour", "honor") : t;
};
const isVows = (type: string) => type === "wedding-vows";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const firstNameOf = (answers: unknown) => {
  const n = answers && typeof answers === "object" ? String((answers as Record<string, unknown>).firstName ?? "") : "";
  return n.trim().split(/\s+/)[0]?.slice(0, 40) || "";
};

async function sign(email: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(sig)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function layout(paragraphs: string[], button: { href: string; label: string }, unsubscribe: string) {
  const ps = paragraphs.map((p) => `<p style="margin:0 0 16px">${p}</p>`).join("");
  return `<div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#222;max-width:560px;margin:0 auto;padding:24px">
  ${ps}
  <p style="margin:24px 0"><a href="${button.href}" style="display:inline-block;background:#d4a72c;color:#1a1a1a;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:16px;padding:14px 26px;border-radius:8px">${button.label}</a></p>
  <p style="margin:0 0 4px">Adrian Simpson</p>
  <p style="margin:0 0 24px;color:#666;font-size:15px">Speechwriter since 2012 · bestmanspeech.com</p>
  <p style="margin:0;color:#999;font-family:Arial,sans-serif;font-size:12px">You're getting this because you started a speech at bestmanspeech.com. <a href="${unsubscribe}" style="color:#999">Unsubscribe</a><br>${POSTAL}</p>
</div>`;
}

type Mail = { subject: string; paragraphs: string[]; button: { href: string; label: string } };

function previewEmail(step: 1 | 2, type: string, country: string | null, name: string, link: string): Mail {
  const title = titleFor(type, country);
  const hi = name ? `Hi ${esc(name)},` : "Hi,";
  if (type === "eulogy") {
    return step === 1
      ? {
          subject: "Your eulogy is saved, for whenever you're ready",
          paragraphs: [hi, "I'm sorry for your loss.",
            "The eulogy you started is written and saved. You've read the opening, and the rest is there whenever you feel ready to come back to it.",
            "Once it's yours you can change any line so it sounds like you, make it shorter or warmer, and print or download it for the day. And when you're ready, you can practise reading it aloud on my autocue, gently marked up with where to pause and breathe.",
            "If anything is holding you back, or you'd like a hand with it, just reply to this email. It comes straight to me."],
          button: { href: link, label: "Return to my eulogy" },
        }
      : {
          subject: "Your eulogy is still saved",
          paragraphs: [hi, "Just a gentle note that the eulogy you started is still saved, with your words and memories in it.",
            "There's no rush. When you're ready, you can finish it, change anything you like, and have it ready to read.",
            "If it would help to talk anything through, reply here and I'll get back to you personally."],
          button: { href: link, label: "Return to my eulogy" },
        };
  }
  const yourThing = isVows(type) ? "Your vows are" : `Your ${title} is`;
  return step === 1
    ? {
        subject: isVows(type) ? "Your wedding vows are ready to finish" : `Your ${title} is ready to finish`,
        paragraphs: [hi, `${yourThing} written and saved. You've seen the opening, and the rest is waiting for you.`,
          "Once it's yours, you can edit any line yourself and get as many new versions as you like (funnier, shorter, warmer, more emotional) until it sounds exactly like you. There's a money-back guarantee too.",
          "Then I'll help you deliver it. Your speech comes with my rehearsal coach: it's marked up with where to pause and exactly where to wait for the laugh, and you rehearse it out loud on an autocue. I listen back and tell you what to fix.",
          "Any questions at all, just reply to this email. It comes straight to me."],
        button: { href: link, label: isVows(type) ? "Finish my vows" : "Finish my speech" },
      }
    : {
        subject: isVows(type) ? "Still need your vows?" : `Still need your ${title}?`,
        paragraphs: [hi, `Just a quick reminder: ${yourThing.toLowerCase()} still saved and ready to finish.`,
          "Most people tell me the writing isn't the scary part. It's standing up and giving it. That's why every speech comes with my rehearsal coach: an autocue with your speech marked up, and honest coaching on your timing and delivery before the day.",
          "And if something didn't feel right in the opening, that's what the editing is for. Change any line, or ask for a new version that's funnier, warmer or shorter.",
          "And if anything's holding you back, reply and tell me. I read every one."],
        button: { href: link, label: isVows(type) ? "Finish my vows" : "Finish my speech" },
      };
}

function unfinishedEmail(type: string, country: string | null, name: string, link: string): Mail {
  const title = titleFor(type, country);
  const hi = name ? `Hi ${esc(name)},` : "Hi,";
  if (type === "eulogy") {
    return {
      subject: "Your answers are saved",
      paragraphs: [hi, "I'm sorry for your loss.",
        "You started answering the questions for a eulogy, and everything you wrote has been saved. You can pick up exactly where you stopped, whenever you're ready.",
        "When you've finished the questions you'll see the opening straight away, free.",
        "If you'd like a hand, just reply to this email. It comes straight to me."],
      button: { href: link, label: "Carry on where I left off" },
    };
  }
  return {
    subject: "Pick up where you left off",
    paragraphs: [hi, `You were partway through the questions for your ${title}, and your answers are saved.`,
      "Finish the last few and you'll see the opening of your speech straight away, free, before you decide anything.",
      "Any questions, just reply. It comes straight to me."],
    button: { href: link, label: "Carry on where I left off" },
  };
}

serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: sec } = await db.from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  const secret = sec?.value as string | undefined;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 });

  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const sent: string[] = [];
  const errors: string[] = [];

  const { data: optRows } = await db.from("email_optouts").select("email");
  const optedOut = new Set((optRows ?? []).map((r: { email: string }) => r.email.toLowerCase()));
  const { data: paidRows } = await db.from("speeches").select("email").eq("paid", true).gte("created_at", iso(now - 30 * 24 * HOUR));
  const buyers = new Set((paidRows ?? []).map((r: { email: string }) => (r.email || "").toLowerCase()));

  async function send(to: string, mail: Mail) {
    const unsub = `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe?e=${encodeURIComponent(to)}&t=${await sign(to, secret!)}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to, reply_to: REPLY_TO, subject: mail.subject,
        html: layout(mail.paragraphs, mail.button, unsub),
        text: `${mail.paragraphs.join("\n\n").replace(/<[^>]+>/g, "")}\n\n${mail.button.label}: ${mail.button.href}\n\nAdrian Simpson\nbestmanspeech.com\n\nUnsubscribe: ${unsub}\n${POSTAL}`,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }

  const skip = (email: string | null) => !email || optedOut.has(email.toLowerCase()) || buyers.has(email.toLowerCase());

  // 1. Previews not paid for (within the last 3 days)
  const { data: previews } = await db.from("speeches")
    .select("id, email, speech_type, answers, access_token, country, created_at, followup_1_sent_at, followup_2_sent_at")
    .eq("paid", false).gte("created_at", iso(now - 72 * HOUR)).lte("created_at", iso(now - HOUR))
    .or("followup_1_sent_at.is.null,followup_2_sent_at.is.null");
  for (const s of previews ?? []) {
    if (skip(s.email)) continue;
    const step: 1 | 2 | null = !s.followup_1_sent_at ? 1
      : (!s.followup_2_sent_at && new Date(s.created_at).getTime() <= now - 23 * HOUR) ? 2 : null;
    if (!step) continue;
    const link = `${ORIGIN}/resume?id=${s.id}&token=${s.access_token}`;
    try {
      await send(s.email, previewEmail(step, s.speech_type, s.country, firstNameOf(s.answers), link));
      await db.from("speeches").update(step === 1 ? { followup_1_sent_at: iso(now) } : { followup_2_sent_at: iso(now) }).eq("id", s.id);
      sent.push(`preview-${step}:${s.speech_type}`);
    } catch (e) { errors.push(String(e)); }
  }

  // 2. Started the questions (gave email) but never finished (within the last 2 days)
  const { data: leads } = await db.from("leads")
    .select("id, email, speech_type, partial_answers, access_token, country, created_at")
    .eq("converted", false).is("followup_sent_at", null)
    .gte("created_at", iso(now - 48 * HOUR)).lte("created_at", iso(now - HOUR));
  for (const l of leads ?? []) {
    if (skip(l.email)) continue;
    const { data: later } = await db.from("speeches").select("id").ilike("email", l.email).gte("created_at", l.created_at).limit(1).maybeSingle();
    if (later) {
      await db.from("leads").update({ converted: true }).eq("id", l.id);
      continue;
    }
    const link = `${ORIGIN}/resume-form?id=${l.id}&token=${l.access_token}`;
    try {
      await send(l.email, unfinishedEmail(l.speech_type, l.country, firstNameOf(l.partial_answers), link));
      await db.from("leads").update({ followup_sent_at: iso(now), abandonment_webhook_sent: true }).eq("id", l.id);
      sent.push(`unfinished:${l.speech_type}`);
    } catch (e) { errors.push(String(e)); }
  }

  console.log("[send-followups]", JSON.stringify({ sent, errors }));
  return new Response(JSON.stringify({ sent, errors }), { headers: { "Content-Type": "application/json" } });
});

// The email a buyer gets straight after paying: the link back to their speech
// suite (their only way back in) and an invitation to rehearse with the autocue.

const ORIGIN = "https://www.bestmanspeech.com";
const FROM = "Adrian Simpson <noreply@bestmanspeech.com>";
const REPLY_TO = "adrian@allspeechesgreatandsmall.com";
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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const button = (href: string, label: string, primary = true) =>
  `<p style="margin:20px 0"><a href="${href}" style="display:inline-block;background:${primary ? "#d4a72c" : "#262b36"};color:${primary ? "#1a1a1a" : "#ffffff"};text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:16px;padding:14px 26px;border-radius:8px">${label}</a></p>`;

export function purchaseEmail(opts: {
  speechId: string; accessToken: string; speechType: string; country: string | null; firstName: string;
}) {
  const american = ["US", "CA"].includes(String(opts.country || "").toUpperCase());
  let title = TITLES[opts.speechType] || "speech";
  if (american) title = title.replace("honour", "honor");
  const vows = opts.speechType === "wedding-vows";
  const eulogy = opts.speechType === "eulogy";
  const thing = vows ? "Your wedding vows are" : `Your ${title} is`;
  const suite = `${ORIGIN}/speech?id=${opts.speechId}&token=${opts.accessToken}`;
  const rehearse = `${ORIGIN}/rehearse?id=${opts.speechId}&token=${opts.accessToken}`;
  const hi = opts.firstName ? `Hi ${esc(opts.firstName)},` : "Hi,";

  const intro = eulogy
    ? [hi, "Thank you. Your eulogy is ready, in full, in your own speech suite.", "Change any line so it sounds like you, make it shorter or warmer, and print or download it for the day. Everything is saved."]
    : [hi, `Thank you. ${thing} ready, in full, in your own speech suite.`, "Change any line, ask for as many new versions as you like (funnier, shorter, warmer), and download it whenever you're ready. Everything is saved."];

  const rehearsal = eulogy
    ? ["<strong>When you feel ready, practise reading it aloud.</strong> Your speech suite includes my rehearsal coach: your eulogy on an autocue, gently marked up with where to pause and where to take a breath. Read it out loud and I'll listen back and help you find a pace that lets you get through it in your own voice."]
    : ["<strong>Then rehearse it.</strong> Writing it is the easy bit; standing up and giving it is what most people worry about. So your speech comes with my rehearsal coach.",
       "I've marked up your speech the way I would for a client: the words to hit, where to pause, and exactly where to stop and wait for the laugh. Read it out loud from the autocue, and I'll listen back and tell you what to fix: your timing, the bits you rushed, the laughs you talked over. You have 10 coached rehearsals."];

  const p = (t: string) => `<p style="margin:0 0 16px">${t}</p>`;
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#222;max-width:560px;margin:0 auto;padding:24px">
  ${intro.map(p).join("")}
  ${button(suite, vows ? "Open my vows" : eulogy ? "Open my eulogy" : "Open my speech")}
  ${rehearsal.map(p).join("")}
  ${button(rehearse, "Rehearse with my autocue", false)}
  ${p("Keep this email: the links above are your way back in, any time. If anything isn't right, just reply. It comes straight to me.")}
  <p style="margin:0 0 4px">Adrian Simpson</p>
  <p style="margin:0 0 24px;color:#666;font-size:15px">Speechwriter since 2012 · bestmanspeech.com</p>
  <p style="margin:0;color:#999;font-family:Arial,sans-serif;font-size:12px">${POSTAL}</p>
</div>`;
  const strip = (t: string) => t.replace(/<[^>]+>/g, "");
  const text = [...intro, `Open it: ${suite}`, ...rehearsal, `Rehearse with my autocue: ${rehearse}`,
    "Keep this email: the links above are your way back in, any time. If anything isn't right, just reply.", "Adrian Simpson\nbestmanspeech.com", POSTAL]
    .map(strip).join("\n\n");
  return {
    from: FROM, reply_to: REPLY_TO,
    subject: eulogy ? "Your eulogy is ready" : vows ? "Your wedding vows are ready" : `Your ${title} is ready (and how to rehearse it)`,
    html, text,
  };
}

# bestmanspeech.com — Codebase Analysis & Improvement Plan

*Analysis of the Lovable export (`bestmanspeech-export.zip`): React 18 + Vite + TypeScript frontend, shadcn/ui, Supabase (Postgres + 11 edge functions), Stripe payments, LLM speech generation.*

**Verdict:** the product idea and funnel are genuinely well built, but the app ships with **actively exploitable security holes**, a **paywall that can be bypassed entirely**, and Lovable-default tooling that hides errors instead of catching them. Everything below is ordered by how urgently it needs fixing. The 🔴 items are the ones that can hurt you (or your customers) today.

---

## ✅ Status — fixed in the rebuild branch

Done and pushed on `claude/lovabel-codebase-analysis-dr8qww` (needs a Supabase staging deploy + test before merge):

- **Repo:** real source now in git (was a zip); off Lovable; `.env` untracked; single package manager.
- **Tooling:** TypeScript strict mode + `typecheck` script; GitHub Actions CI; consent-gated analytics; Lovable social placeholders replaced; Stripe key moved to env.
- **🔴 1.1 Admin auth** — `get-admin-speeches` now requires a server-side `ADMIN_TOKEN`.
- **🔴 1.2 Paywall bypass** — the full speech is generated and stored server-side; the browser only ever receives a preview until `paid = true`.
- **🔴 1.3 Leads PII** — `USING (true)` policies removed; per-lead access token; reads/writes go through edge functions.
- **🔴 1.4 Cookie consent** — Google tags now gated behind Consent Mode v2.
- **🟠 2 (amount check)** — `verify-payment` now asserts the charged amount matches the tier price.

**Deploy checklist:** set the `ADMIN_TOKEN` Supabase secret; set `VITE_STRIPE_PUBLISHABLE_KEY` in the frontend host; apply the new migration; deploy the new/changed functions (`generate-speech`, `create-payment-intent`, `verify-payment`, `create-lead`, `update-lead-progress`, `get-lead`, `get-admin-speeches`, `send-remarketing-webhook`, `check-abandoned-leads`).

**Still open:** Stripe webhook as source of truth (2), durable rate limiting on `generate-speech` (2), and the 🟡 correctness bugs below.

---

## 0. The repo itself

The GitHub repository currently contains only `bestmanspeech-export.zip` — the actual source is not in version control, so nothing can be diffed, reviewed, or deployed from here. **Step zero:** extract the zip into the repo, delete the broken `.git` pointer file inside it (it points at a Lovable build path: `gitdir: /nix/store/…/worktrees/dev-server` and makes the folder a non-functional git repo), and commit the real tree. Everything in this document refers to files inside that export.

---

## 🔴 1. Critical — fix before doing anything else

### 1.1 The admin dashboard leaks every customer's data to anyone
`get-admin-speeches` has **no authentication of any kind** (`verify_jwt = false` in `config.toml`, no password check inside), yet it uses the **service-role key** to return every row of `speeches`, `contact_submissions`, and `leads`. Anyone who finds the function URL can `curl` it and download every customer email, every contact-form message, and every lead's half-finished personal answers. The "PIN" on the admin page (`Admin.tsx` → `const ADMIN_PIN = "artful2025"`) is pure theatre: it lives in the JS bundle, gates only React state, and is never sent to the server. This is a full personal-data breach waiting to happen. **Fix:** require a verified admin JWT/role on the server side; the client PIN is not a control.

### 1.2 The paid speech is given away for free
`generate-speech` streams the **complete** finished speech straight to the browser before any payment happens. The 100-word "preview" the paywall shows is cosmetic — the full product is already sitting in the user's browser. There is no server-side gate that withholds the full text until `paid = true`. **Fix:** generate server-side, persist the speech, and only release the full text through `get-speech` once payment is confirmed.

### 1.3 The `leads` table is world-readable and world-writable
Migration `20260318…sql` enables row-level security and then defeats it with `USING (true) WITH CHECK (true)` policies for `anon`. Anyone holding the public key (which ships in the frontend) can read **every lead's email and personal answers**, and can overwrite or corrupt any lead row. `get-lead` compounds this: it returns a lead's email + answers given only the lead's UUID, with no secret token — and those UUIDs are handed out in plain resume links (`/resume-form?id=<uuid>`). **Fix:** replace the `USING (true)` policies with owner-scoped ones, and require a per-lead access token like the `speeches` flow already does.

### 1.4 The cookie banner doesn't actually gate tracking
Google Ads + GA4 tags load unconditionally in `index.html` on every page load, before consent. `CookieBanner.tsx` writes `localStorage.cookie_consent` and **nothing ever reads it** — "Essential Only" changes nothing. Your own privacy policy promises "analytics and marketing cookies are only set with your consent." For a UK/EU-facing business this is a GDPR exposure and a direct contradiction of your stated policy. **Fix:** load gtag through Google Consent Mode, defaulting to denied until the banner grants it.

---

## 🟠 2. High — payment integrity & cost control

- **No Stripe webhook.** `paid = true` is only ever set by `verify-payment`, which the *browser* calls after redirect. If the customer pays but closes the tab first, the payment is never recorded — lost fulfilment and support headaches. Payment truth should come from a signed `payment_intent.succeeded` webhook, not a client callback.
- **`verify-payment` doesn't check the amount or tier** — only that a PaymentIntent with a matching `speech_id` succeeded. Today the amount is set server-side in `create-payment-intent` (good — that part is done right), so this is a latent hole rather than an open one, but the invariant "amount paid == price of the stored tier" is never asserted.
- **Unlimited free LLM generation.** `generate-speech` is anonymous, and its only guard is an in-memory rate limiter keyed on the client-suppliable `x-forwarded-for` header — trivially bypassed by rotating the header, and reset on every cold start. Combined with 1.2, an attacker can burn your LLM API budget at will. Needs durable, trust-signal-based rate limiting.

---

## 🟡 3. Medium — correctness bugs that bite real users

- **Stuck questionnaire path.** In `WriteSpeech.tsx`, yes/no questions hide both the Back button and the Generate footer and auto-advance using a `totalVisible` count captured *before* the answer applies. If a yes/no question ends up last in a visible list, the user can get stuck with no way forward or back.
- **Stale answers sent to the AI.** The full `answers` object is submitted even for questions that were later hidden (answer "Yes" → fill children's names → switch to "No" → the children's names still ship to the AI, invisible to the user).
- **Double Enter handling.** `onKeyDown` is bound on both the page wrapper and every input; a 500ms transition ref is the only thing stopping every Enter from advancing twice. A slow render skips two questions.
- **Purchase conversion re-fires.** `PaymentSuccess.tsx` re-runs verification and fires three Google Ads conversion events on every refresh; dedupe relies on a `transaction_id` that can be an empty string.
- **Landing-page titles never reset.** `LandingPage.tsx` mutates `document.title`; after visiting `/eulogy-writer` the homepage keeps the eulogy title until a hard reload.
- **Checkout state lost on refresh.** Everything rides on `location.state`; a mid-checkout refresh silently bounces home and orphans the created PaymentIntent (a new one is made per mount).
- **Fake "speech saved for HH:MM:SS" timer** counts to `00:00:00` and then just… stays there; nothing is saved or deleted, and it resets in every new tab. It reads as a dark pattern that doesn't even work.
- **Tier confusion.** The code still branches on `basic`/`deluxe`/`premium`/`vip` in different places (`create-payment-intent` vs `regenerate-speech` vs the dashboard's `max_regenerations || 9999`), while the funnel now sells one "All-Inclusive" package. The paywall promises "unlimited edits," checkout tells basic buyers "3 regenerations," and the regeneration limit check never matches a real tier.

---

## 🟢 4. Architecture — why change is currently painful

- **Speech-type taxonomy duplicated in ~5 places** (`WriteSpeech`, `SpeechTypes`, `speechTitles.ts`, `landingPageData.ts`, `SpeechPaywall`) that must be hand-synced. One config object keyed by id (title/slug/icon/nameField) would kill a whole class of drift bugs.
- **React Query is installed, providered, and never used** — every page hand-rolls `useEffect` + `useState` + manual loading/error flags, which is exactly the boilerplate it removes (plus you lose its caching/retry for free).
- **`WriteSpeech.tsx` is a 727-line god component** — type picker, questionnaire engine, lead capture, localStorage, and SSE stream parsing in one file. The SSE parser alone belongs in `src/lib/`.
- **Two toast systems mounted at once** (shadcn `Toaster` + Sonner); `Contact.tsx` uses one, everything else the other.
- **Duplicated markup** — the pricing card exists twice (`SpeechPaywall` and `Pricing`, features differing by one word), and the charcoal nav block is copy-pasted across 8+ files.
- **British→American localization runs 70 regexes on every render** (`GeolocationContext`), unmemoized and applied inconsistently.

---

## 🔵 5. Tooling — the toolchain hides problems instead of catching them

- **TypeScript strict mode is off** (`strict`, `noImplicitAny`, `strictNullChecks` all `false`) — the exact settings that catch "cannot read property of undefined" crashes, disabled. There's also **no type-check script**, so TS errors surface nowhere. Turn on at least `strictNullChecks` and add `typecheck: tsc -b`.
- **No real tests.** The only test is `expect(true).toBe(true)`. The harness (vitest + testing-library) is set up and unused. Highest-value targets: Checkout and the paywall flow.
- **No CI** — no lint/typecheck/test/build gate anywhere.
- **Three lockfiles** committed (`bun.lock`, `bun.lockb`, `package-lock.json`) — pick one package manager, delete the other two.
- **`.env` is committed** and not gitignored. The values in it are public-by-design (anon key, project URL), so not a live leak — but the pattern invites a service-role key being added next. Ship `.env.example`, gitignore `.env`.
- **Hardcoded `pk_live_…` Stripe key** in `Checkout.tsx` — safe to expose, but means dev runs hit live Stripe and rotation needs a code change. Move to an env var.
- **Lovable placeholders still live in your social tags** — `og:image` and `twitter:image` point at `lovable.dev/opengraph-image-…png` and `twitter:site` is `@Lovable`, so every share of your site renders Lovable's card. Weak SEO overall: per-page meta is client-only (crawlers see one title for all routes), no canonical tags, no sitemap, no structured data.
- **Unused heavy deps** back orphaned shadcn stubs (`recharts`, `embla-carousel`, `vaul`, `input-otp`, `react-day-picker`, `date-fns`, many `@radix-ui/*`). They won't ship in the tree-shaken build but bloat installs and the audit surface.

---

## 6. Dead code to delete

`Testimonials.tsx`, `AboutAdrian.tsx`, `NavLink.tsx` (never imported); `use-mobile.tsx` (only used by unused shadcn sidebar); `example.test.ts`; plus unused imports/state (`logo` in Navbar/Footer, `RotateCcw`/`loadingPurchase`/`onStartOver` in `SpeechPaywall`, `isGenerating` in `WriteSpeech`, `accessTokenParam` in `PaymentSuccess`).

---

## 7. Suggested order of work

1. **Lock the doors (🔴):** server-side admin auth (1.1); withhold full speech until paid (1.2); fix `leads` RLS + tokenize `get-lead` (1.3); gate gtag behind consent (1.4).
2. **Make payment server-authoritative (🟠):** add the Stripe webhook + amount/tier check; add durable rate limiting to `generate-speech`.
3. **Fix the user-facing bugs (🟡):** questionnaire dead-ends, stale answers, tier messaging, conversion double-fire.
4. **Pay down structure (🟢/🔵):** single speech-type config; adopt React Query; turn on TS strict + typecheck + CI + real tests on the payment path; clean lockfiles, `.env`, and Lovable placeholders.
5. **Then delete dead code and prune deps.**

Every 🔴 item is exploitable right now with nothing more than the public key and a browser. I'd treat section 1 as a same-week priority and everything else as normal backlog.

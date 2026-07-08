# bestmanspeech.com

AI-assisted speech writing — wedding, best man, corporate, eulogy and more —
by speechwriter Adrian Simpson.

**Stack:** React 18 + Vite + TypeScript, Tailwind + shadcn/ui, Supabase
(Postgres + edge functions), Stripe payments, and an LLM for speech generation.

## Local development

Requires Node.js 20+ and npm.

```sh
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env
#    then fill in the values (see below)

# 3. Start the dev server
npm run dev
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (safe to expose) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe to expose) |

All of these ship in the client bundle by design — do **not** put secret keys
(service role, Stripe secret, LLM keys) here. Those belong in Supabase edge
function secrets. `.env` is gitignored; never commit it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `npm run test` | Run the vitest suite |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test and build on every
push and pull request.

## Backend

Supabase edge functions live in `supabase/functions/`; the database schema is in
`supabase/migrations/`. Deploy with the [Supabase CLI](https://supabase.com/docs/guides/cli).

See `ANALYSIS.md` for the full code review and the improvement roadmap.

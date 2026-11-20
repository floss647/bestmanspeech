-- Live-audience rehearsals for paid speeches. Accessed only by edge functions
-- (service role), which check the speech's access token; RLS on, no policies.
create table if not exists public.rehearsals (
  id uuid primary key default gen_random_uuid(),
  speech_id uuid not null references public.speeches(id) on delete cascade,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  speech_text text,
  turns jsonb,
  duration_seconds integer,
  stats jsonb,
  feedback jsonb
);
create index if not exists rehearsals_speech_id_idx on public.rehearsals(speech_id);
alter table public.rehearsals enable row level security;

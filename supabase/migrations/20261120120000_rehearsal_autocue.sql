-- Autocue rehearsal: coached script cache, private audio bucket, transcript on rehearsals.

create table if not exists public.rehearsal_scripts (
  id uuid primary key default gen_random_uuid(),
  speech_id uuid not null references public.speeches(id) on delete cascade,
  text_hash text not null,
  markup jsonb not null,
  created_at timestamptz not null default now(),
  unique (speech_id, text_hash)
);
alter table public.rehearsal_scripts enable row level security;

alter table public.rehearsals add column if not exists transcript jsonb;
alter table public.rehearsals add column if not exists audio_path text;

-- Recordings are uploaded with a signed URL from rehearsal-start and deleted by
-- rehearsal-feedback once analysed. Private: no public access, no policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rehearsal-audio', 'rehearsal-audio', false, 31457280, array['audio/wav'])
on conflict (id) do nothing;

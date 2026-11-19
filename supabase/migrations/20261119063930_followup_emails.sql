-- Follow-up emails for people who start or preview a speech but don't buy.
alter table public.speeches add column if not exists country text;
alter table public.speeches add column if not exists followup_1_sent_at timestamptz;
alter table public.speeches add column if not exists followup_2_sent_at timestamptz;
alter table public.leads add column if not exists country text;
alter table public.leads add column if not exists followup_sent_at timestamptz;

create table if not exists public.email_optouts (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.email_optouts enable row level security;
-- No policies: only the service role (edge functions) can read or write.

-- Private secrets readable only by the service role (edge functions) and pg_cron.
create table if not exists public.app_secrets (
  name text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
insert into public.app_secrets (name, value)
values ('cron_secret', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;

-- Run the follow-up sender every 15 minutes.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('send-followups') where exists (select 1 from cron.job where jobname = 'send-followups');
select cron.schedule('send-followups', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://dooelzojlgrbatclrskz.supabase.co/functions/v1/send-followups',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$$);

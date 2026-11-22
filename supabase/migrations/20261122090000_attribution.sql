alter table public.speeches add column if not exists attribution jsonb;
alter table public.speeches add column if not exists purchase_tracked_at timestamptz;

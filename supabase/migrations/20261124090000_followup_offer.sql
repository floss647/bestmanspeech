alter table public.speeches
  add column if not exists offer_until timestamptz,
  add column if not exists followup_3_sent_at timestamptz;

-- Lock down the leads table.
--
-- The original policies allowed anon SELECT and UPDATE with USING (true), which
-- let anyone holding the public anon key read every lead's email + partial
-- answers (PII) and overwrite any lead row. We remove all anon access and route
-- reads/writes exclusively through edge functions that use the service-role key
-- and verify a per-lead access token.

-- Per-lead secret used to authorize reads and progress updates via edge functions.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS access_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Drop the permissive anon policies.
DROP POLICY IF EXISTS "Allow public inserts on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public updates on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public select on leads" ON public.leads;

-- RLS stays enabled with no anon/authenticated policies, so the anon key has no
-- access at all. The service role (used only by edge functions) bypasses RLS.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Speed up the lookups edge functions perform.
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);
CREATE INDEX IF NOT EXISTS speeches_email_idx ON public.speeches (email);

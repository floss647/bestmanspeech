
-- Drop the overly permissive SELECT policy on speeches
DROP POLICY IF EXISTS "Anyone can read their speech via access token" ON public.speeches;

-- No public SELECT policy needed — all reads go through edge functions using service role

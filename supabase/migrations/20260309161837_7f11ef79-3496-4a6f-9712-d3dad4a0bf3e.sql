-- Add default-deny policies to speeches table for defense-in-depth
-- All legitimate access uses service_role_key via edge functions, bypassing RLS

CREATE POLICY "Deny all selects"
ON public.speeches
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Deny all inserts"
ON public.speeches
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny all updates"
ON public.speeches
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all deletes"
ON public.speeches
FOR DELETE
TO anon, authenticated
USING (false);
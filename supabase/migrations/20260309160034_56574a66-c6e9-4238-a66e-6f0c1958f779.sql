
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow public inserts" ON public.contact_submissions;

-- Create a restrictive policy with basic validation
CREATE POLICY "Allow validated public inserts"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(name)) > 0 AND length(trim(name)) <= 200
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(trim(message)) > 0 AND length(trim(message)) <= 5000
);

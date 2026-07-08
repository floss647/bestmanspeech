
-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can read their speech via access token" ON public.speeches;

-- Create a new policy that allows reading by access_token (paid or unpaid)
CREATE POLICY "Anyone can read their speech via access token"
ON public.speeches
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone with a valid access_token to read their paid speech
CREATE POLICY "Anyone can read their speech via access token"
ON public.speeches
FOR SELECT
USING (paid = true);

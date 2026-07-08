
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  speech_type text NOT NULL,
  last_question_reached integer NOT NULL DEFAULT 0,
  converted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Allow anonymous inserts (no auth required)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on leads"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(email)) > 0 AND
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
    length(trim(speech_type)) > 0
  );

-- Allow updates to track progress (last_question_reached, converted)
CREATE POLICY "Allow public updates on leads"
  ON public.leads
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow select so we can check for existing leads by email
CREATE POLICY "Allow public select on leads"
  ON public.leads
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Auto-update the updated_at column
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

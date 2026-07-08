
-- Speeches table: stores generated speeches with payment + magic-link access
CREATE TABLE public.speeches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  speech_type TEXT NOT NULL DEFAULT 'best-man',
  answers JSONB NOT NULL DEFAULT '{}',
  generated_speech TEXT NOT NULL,
  tier TEXT,
  stripe_session_id TEXT,
  paid BOOLEAN NOT NULL DEFAULT false,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  regenerations_used INTEGER NOT NULL DEFAULT 0,
  max_regenerations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (all access goes through edge functions with service role)
ALTER TABLE public.speeches ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE policies for anon/authenticated — 
-- all access is through edge functions using service_role key
-- This ensures nobody can read speeches directly from the client

-- Index on access_token for fast magic-link lookups
CREATE UNIQUE INDEX idx_speeches_access_token ON public.speeches (access_token);

-- Index on stripe_session_id for payment verification
CREATE INDEX idx_speeches_stripe_session ON public.speeches (stripe_session_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_speeches_updated_at
BEFORE UPDATE ON public.speeches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

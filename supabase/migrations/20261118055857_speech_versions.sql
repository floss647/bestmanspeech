-- Keep every version of a paid speech (the original, AI alternatives and the
-- buyer's own edits) so the speech suite shows the same versions on every visit.
-- Each item: { "text": string, "label": string, "created_at": iso string, "edited_at": iso string | null }
alter table public.speeches
  add column if not exists versions jsonb not null default '[]'::jsonb;

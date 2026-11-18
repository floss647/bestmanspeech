// Helpers for the per-speech list of versions stored in speeches.versions.

export interface SpeechVersion {
  text: string;
  label: string;
  created_at: string;
  edited_at: string | null;
}

export const MAX_VERSION_CHARS = 40000;
export const MAX_VERSIONS = 50;

/**
 * Returns the stored versions, or a single "Original" version built from
 * generated_speech for speeches created before versions existed.
 */
export function readVersions(row: {
  versions?: unknown;
  generated_speech?: string | null;
  created_at?: string | null;
}): SpeechVersion[] {
  const stored = Array.isArray(row.versions) ? (row.versions as SpeechVersion[]) : [];
  const valid = stored.filter((v) => v && typeof v.text === "string");
  if (valid.length > 0) return valid;
  return [
    {
      text: row.generated_speech ?? "",
      label: "Original",
      created_at: row.created_at ?? new Date().toISOString(),
      edited_at: null,
    },
  ];
}

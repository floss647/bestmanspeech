// Shared helpers for the autocue rehearsal functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { readVersions } from "./versions.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const MAX_REHEARSALS = 10;
export const AUDIO_BUCKET = "rehearsal-audio";

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const adminClient = (): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

export interface PaidSpeech {
  id: string;
  speech_type: string;
  answers: Record<string, unknown>;
  country: string | null;
  american: boolean;
  text: string;
}

/** Loads a paid speech by id + access token, with the chosen version's text. */
export async function loadPaidSpeech(
  db: SupabaseClient,
  speechId: string,
  accessToken: string,
  versionIndex?: number,
): Promise<PaidSpeech | null> {
  const { data: s } = await db
    .from("speeches")
    .select("id, speech_type, answers, generated_speech, versions, created_at, country, paid")
    .eq("id", speechId)
    .eq("access_token", accessToken)
    .eq("paid", true)
    .maybeSingle();
  if (!s) return null;
  const versions = readVersions(s);
  const idx = Number.isInteger(versionIndex) && (versionIndex as number) >= 0 && (versionIndex as number) < versions.length
    ? (versionIndex as number)
    : versions.length - 1;
  return {
    id: s.id,
    speech_type: s.speech_type,
    answers: (s.answers as Record<string, unknown>) || {},
    country: s.country,
    american: ["US", "CA"].includes(String(s.country || "").toUpperCase()),
    text: versions[idx]?.text || s.generated_speech || "",
  };
}

export const paragraphsOf = (text: string) =>
  text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function rehearsalsUsed(db: SupabaseClient, speechId: string) {
  const { count } = await db.from("rehearsals").select("id", { count: "exact", head: true }).eq("speech_id", speechId);
  return count ?? 0;
}

/** Calls Claude and returns the first JSON object in its reply. */
export async function claudeJson<T>(prompt: string, maxTokens: number, tag: string): Promise<T | null> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return null;
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(90_000),
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-opus-4-8", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!resp.ok) {
    console.error(`[${tag}] anthropic`, resp.status, (await resp.text()).slice(0, 300));
    return null;
  }
  const data = await resp.json();
  const text: string = (data.content || []).map((c: { text?: string }) => c.text || "").join("");
  const match = text.match(/\{[\s\S]*\}/);
  try {
    return match ? (JSON.parse(match[0]) as T) : null;
  } catch {
    console.error(`[${tag}] bad JSON`, text.slice(0, 300));
    return null;
  }
}

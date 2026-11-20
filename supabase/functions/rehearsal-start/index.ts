// Starts an autocue rehearsal for a paid speech: checks the access token and the
// per-speech cap, records the rehearsal, and returns a one-time signed upload URL
// for the recording (private bucket; rehearsal-feedback deletes it once analysed).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  adminClient, AUDIO_BUCKET, corsHeaders, json, loadPaidSpeech, MAX_REHEARSALS, rehearsalsUsed,
} from "../_shared/rehearsal.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { speechId, accessToken, versionIndex } = await req.json();
    if (!speechId || !accessToken) return json({ error: "Missing speech details" }, 400);
    if (!Deno.env.get("OPENAI_API_KEY")) {
      console.error("[rehearsal-start] OPENAI_API_KEY is not set");
      return json({ error: "Rehearsal coaching isn't available right now. Please try again later." }, 503);
    }

    const db = adminClient();
    const speech = await loadPaidSpeech(db, speechId, accessToken, versionIndex);
    if (!speech) return json({ error: "Speech not found" }, 404);

    const used = await rehearsalsUsed(db, speechId);
    if (used >= MAX_REHEARSALS) {
      return json({
        error: `You've used all ${MAX_REHEARSALS} coached rehearsals for this speech. Email adrian@allspeechesgreatandsmall.com if you need more.`,
        code: "limit_reached",
      }, 429);
    }

    const { data: row, error } = await db
      .from("rehearsals")
      .insert({ speech_id: speechId, speech_text: speech.text })
      .select("id")
      .single();
    if (error || !row) throw error || new Error("insert failed");

    const path = `${speechId}/${row.id}.wav`;
    const { data: signed, error: signErr } = await db.storage.from(AUDIO_BUCKET).createSignedUploadUrl(path);
    if (signErr || !signed) throw signErr || new Error("sign failed");
    await db.from("rehearsals").update({ audio_path: path }).eq("id", row.id);

    return json({ rehearsalId: row.id, path, uploadToken: signed.token, remaining: MAX_REHEARSALS - used - 1 });
  } catch (e) {
    console.error("[rehearsal-start]", e);
    return json({ error: "Couldn't start the rehearsal. Please try again." }, 500);
  }
});

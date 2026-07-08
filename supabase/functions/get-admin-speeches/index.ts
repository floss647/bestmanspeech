import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

// Constant-time string comparison to avoid leaking the token via timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require a server-side admin token. This endpoint uses the service-role key
  // and returns all customer PII, so it must never be reachable unauthenticated.
  const adminToken = Deno.env.get("ADMIN_TOKEN");
  const provided = req.headers.get("x-admin-token") ?? "";
  if (!adminToken || !safeEqual(provided, adminToken)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [speechesRes, contactRes, leadsRes] = await Promise.all([
      supabase
        .from("speeches")
        .select("id, email, speech_type, paid, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("contact_submissions")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("leads")
        .select("id, email, speech_type, last_question_reached, converted, partial_answers, created_at, updated_at")
        .order("created_at", { ascending: false }),
    ]);

    if (speechesRes.error) throw speechesRes.error;
    if (contactRes.error) throw contactRes.error;
    if (leadsRes.error) throw leadsRes.error;

    // Deduplicate speeches by email
    const emailMap = new Map<string, typeof speechesRes.data[0] & { attempts: number }>();
    for (const row of speechesRes.data!) {
      const existing = emailMap.get(row.email);
      if (!existing) {
        emailMap.set(row.email, { ...row, attempts: 1 });
      } else {
        existing.attempts++;
        if (row.paid) existing.paid = true;
      }
    }
    const deduped = Array.from(emailMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return new Response(
      JSON.stringify({ speeches: deduped, contacts: contactRes.data, leads: leadsRes.data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Don't leak internal DB errors to the caller.
    console.error("[get-admin-speeches] error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "An error occurred." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find leads older than 30 minutes that haven't had the webhook sent
    // and haven't converted (no matching speech exists)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: abandonedLeads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("abandonment_webhook_sent", false)
      .eq("converted", false)
      .lt("created_at", thirtyMinutesAgo);

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    if (!abandonedLeads || abandonedLeads.length === 0) {
      console.log("No abandoned leads found");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const webhookUrl = Deno.env.get("ZAPIER_REMARKETING_WEBHOOK_URL");
    if (!webhookUrl) {
      console.warn("ZAPIER_REMARKETING_WEBHOOK_URL not set — skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Webhook not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let processed = 0;

    for (const lead of abandonedLeads) {
      // Check if a speech already exists for this email (they completed after all)
      const { data: existingSpeech } = await supabase
        .from("speeches")
        .select("id")
        .eq("email", lead.email)
        .limit(1)
        .maybeSingle();

      if (existingSpeech) {
        // They completed — mark as sent so we don't check again, but don't fire webhook
        await supabase
          .from("leads")
          .update({ abandonment_webhook_sent: true, converted: true })
          .eq("id", lead.id);
        continue;
      }

      // Fire the form_abandoned webhook with a tokenized resume link
      const resumeLink = `https://www.bestmanspeech.com/resume-form?id=${lead.id}&token=${lead.access_token}`;
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: lead.email,
            speech_type: lead.speech_type,
            last_question_reached: lead.last_question_reached,
            started_at: lead.created_at,
            resume_link: resumeLink,
            event: "form_abandoned",
            source: "wedding-speech-app",
          }),
        });

        // Mark as sent
        await supabase
          .from("leads")
          .update({ abandonment_webhook_sent: true })
          .eq("id", lead.id);

        processed++;
        console.log(`Sent form_abandoned webhook for ${lead.email}`);
      } catch (webhookError) {
        console.error(`Failed to send webhook for ${lead.email}:`, webhookError);
      }
    }

    console.log(`Processed ${processed} abandoned leads`);
    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[check-abandoned-leads] error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

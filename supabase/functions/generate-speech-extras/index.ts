import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { speechId, accessToken, type } = await req.json();

    if (!speechId || !accessToken || !type) {
      throw new Error("speechId, accessToken, and type are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify access
    const { data: speech, error } = await supabase
      .from("speeches")
      .select("*")
      .eq("id", speechId)
      .eq("access_token", accessToken)
      .eq("paid", true)
      .single();

    if (error || !speech) {
      throw new Error("Speech not found or access denied");
    }

    const speechText = speech.generated_speech;

    // The All-Inclusive package includes the delivery tips, timing guide, and
    // delivery guide, so every paid speech (verified above) can access them.
    let prompt = "";

    if (type === "delivery-tips") {
      prompt = `You are a professional speech coach. Given the following speech, provide 8-10 practical delivery tips specific to THIS speech. Include tips on:
- Pacing and pauses (reference specific lines)
- Where to make eye contact with the groom, bride, and audience
- Which lines to emphasise for maximum laughs
- Where to slow down for emotional moments
- Body language suggestions
- How to handle nerves at specific transitions

Speech:
${speechText}

Format as a numbered list with clear, actionable advice. Each tip should reference a specific part of the speech.`;
    } else if (type === "timing-breakdown") {
      prompt = `You are a professional speech coach. Analyse the following speech and provide a detailed timing breakdown. Break the speech into sections and estimate the delivery time for each, assuming a natural speaking pace with appropriate pauses for laughter and emotion.

Speech:
${speechText}

Provide:
1. Total estimated delivery time
2. Section-by-section breakdown with:
   - Section name/description
   - Estimated time (e.g., "45 seconds")
   - Notes on pacing (e.g., "pause for laughter here", "slow down for emotion")
3. Overall pacing recommendations

Format clearly with headers and bullet points.`;
    } else if (type === "delivery-guide") {
      prompt = `You are Adrian Simpson, a world-class professional speechwriter and speech coach. Create a comprehensive professional delivery guide for the following speech. This should be a premium, detailed guide covering:

1. **Pre-Speech Preparation** (day of the wedding)
   - What to do in the hours before
   - How to manage nerves
   - Practice techniques

2. **Opening Delivery**
   - How to command attention
   - Voice projection tips
   - First 30 seconds strategy

3. **Comedy Timing**
   - Where to pause for laughs (reference specific jokes in the speech)
   - How to recover if a joke doesn't land
   - Building and releasing tension

4. **Emotional Moments**
   - How to manage your own emotions
   - Voice control during touching parts
   - When to pause and let moments breathe

5. **Physical Presence**
   - Where to stand
   - What to do with your hands
   - Eye contact strategy (groom, bride, audience rotation)

6. **Closing Strong**
   - Building to the toast
   - Voice and energy for the final lines
   - The toast itself — how to deliver it

7. **Practical Tips**
   - Notes vs memorised — the best approach
   - Dealing with microphones
   - What to drink (and not drink) beforehand

Speech:
${speechText}

Write this as a warm, expert guide that feels like personal coaching. Use "you" throughout.`;
    } else {
      throw new Error("Invalid type. Use: delivery-tips, timing-breakdown, or delivery-guide");
    }

    // Call Claude to generate
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("AI API key not configured");

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 3000,
        system: "You are a world-class speech coach and delivery expert.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("AI generation failed:", err);
      throw new Error("Content generation failed. Please try again.");
    }

    const aiData = await aiResponse.json();
    const content = (aiData.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    return new Response(
      JSON.stringify({ content, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Extras error:", msg);
    const safeMessages = [
      "speechId, accessToken, and type are required",
      "Speech not found or access denied",
      "Delivery tips are available for Premium and VIP tiers",
      "Timing breakdown is available for VIP tier only",
      "Professional delivery guide is available for VIP tier only",
      "Invalid type. Use: delivery-tips, timing-breakdown, or delivery-guide",
      "Content generation failed. Please try again.",
      "AI API key not configured",
    ];
    const clientMsg = safeMessages.includes(msg) ? msg : "An error occurred. Please try again.";
    return new Response(JSON.stringify({ error: clientMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

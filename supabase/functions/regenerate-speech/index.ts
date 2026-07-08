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
    const { speechId, accessToken, toneAdjustment } = await req.json();

    if (!speechId || !accessToken) {
      throw new Error("speechId and accessToken are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify access and check regeneration limits
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

    const tier = speech.tier || "basic";

    if (tier === "basic") {
      throw new Error("Regeneration is not available for Basic tier");
    }

    if (tier === "premium" && speech.regenerations_used >= speech.max_regenerations) {
      throw new Error("You've used all your regenerations. Upgrade to VIP for unlimited regenerations.");
    }

    // Get speech details
    const speechType = speech.speech_type || "best-man";
    const answers = speech.answers as Record<string, string>;

    // Allowlist valid tone adjustments to prevent prompt injection
    const ALLOWED_TONES: Record<string, string> = {
      "funnier": "funnier and more humorous",
      "more emotional": "more emotional and heartfelt",
      "shorter": "more concise and shorter",
      "more formal": "more formal and polished",
      "lighter": "lighter and more playful",
      "warmer": "warmer and more personal",
      "more professional": "more professional and refined",
    };

    let toneInstruction: string;
    if (toneAdjustment) {
      const safeTone = ALLOWED_TONES[toneAdjustment.toLowerCase().trim()];
      if (!safeTone) {
        return new Response(
          JSON.stringify({ error: "Invalid tone adjustment. Choose from: funnier, more emotional, shorter, more formal, lighter, warmer, more professional." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      toneInstruction = `\n\nIMPORTANT TONE ADJUSTMENT: The user wants the speech to be ${safeTone}. Adjust the overall tone accordingly while keeping the same content and structure.`;
    } else {
      toneInstruction = "\n\nGenerate a fresh alternative version of this speech. Keep the same key stories and facts but restructure, rewrite jokes differently, and find new angles on the same material.";
    }

    const systemPrompt = "You are a world-class speechwriter trained in Adrian Simpson's methodology. You write wedding speeches that are personal, heartfelt, and genuinely funny. Use British English spelling throughout.";

    const prompt = `Using the following information, write a completely new version of this ${speechType} speech. It must feel genuinely different — different structure, different jokes, different transitions — while using the same facts and stories.

Previous speech for reference (write something DIFFERENT):
${speech.generated_speech}

User's answers:
${JSON.stringify(answers, null, 2)}
${toneInstruction}

Write a completely fresh speech that uses the same information but with different structure, different jokes, and different transitions. It should feel like a genuinely different speech, not a rewrite. Minimum 1400 words.`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("AI API key not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
      }),
    });

     if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("AI generation failed:", err);
      throw new Error("Speech generation failed. Please try again.");
    }

    const aiData = await aiResponse.json();
    const newSpeech = aiData.choices?.[0]?.message?.content || "";

    // Increment regeneration count (skip for VIP unlimited)
    if (tier !== "vip") {
      await supabase
        .from("speeches")
        .update({ regenerations_used: speech.regenerations_used + 1 })
        .eq("id", speechId);
    }

    return new Response(
      JSON.stringify({
        speech: newSpeech,
        regenerationsUsed: speech.regenerations_used + 1,
        maxRegenerations: speech.max_regenerations,
        tier,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Regeneration error:", msg);
    // Only expose safe, expected error messages to client
    const safeMessages = [
      "speechId and accessToken are required",
      "Speech not found or access denied",
      "Regeneration is not available for Basic tier",
      "You've used all your regenerations. Upgrade to VIP for unlimited regenerations.",
      "Speech generation failed. Please try again.",
      "AI API key not configured",
    ];
    const clientMsg = safeMessages.includes(msg) ? msg : "An error occurred. Please try again.";
    return new Response(JSON.stringify({ error: clientMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

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
    const { speechId, email, accessToken } = await req.json();

    if (!speechId || !email || !accessToken) {
      throw new Error("Speech ID, email, and access token are required");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not set - email will not be sent yet");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email delivery is not configured yet. You can access your speech with the magic link.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const appUrl = req.headers.get("origin") || "http://localhost:5173";
    const magicLink = `${appUrl}/speech?id=${speechId}&token=${accessToken}`;

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@bestmanspeech.com",
        to: email,
        subject: "Your Speech is Ready!",
        html: `
          <h2>Your Speech from bestmanspeech.com</h2>
          <p>We've crafted your speech. Click the link below to access it:</p>
          <p><a href="${magicLink}" style="background-color: #d4af37; padding: 12px 24px; color: white; text-decoration: none; border-radius: 6px; display: inline-block;">View My Speech</a></p>
          <p>This link is personal to you and expires in 7 days.</p>
          <p>Can't wait to hear how it goes!</p>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[send-speech-email] error:", msg);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

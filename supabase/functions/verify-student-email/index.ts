import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_PATTERNS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2}$/i,
  /\.univ-[a-z-]+\.fr$/i,
  /\.u-[a-z-]+\.fr$/i,
  /\.etu\.[a-z-]+\.fr$/i,
  /\.etud\.[a-z-]+\.fr$/i,
  /\.univ\.fr$/i,
  /\.ac-[a-z-]+\.fr$/i,
  /\.ens[a-z]*\.fr$/i,
  /\.insa[a-z-]*\.fr$/i,
  /\.iut[a-z-]*\.fr$/i,
  /\.grenoble-inp\.fr$/i,
  /\.parisnanterre\.fr$/i,
  /\.sorbonne-universite\.fr$/i,
  /\.universite-paris-saclay\.fr$/i,
  /\.umontpellier\.fr$/i,
  /\.univ-grenoble-alpes\.fr$/i,
  /\.uga\.fr$/i,
];

function isAcademicEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(domain));
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendVerificationEmail(to: string, confirmUrl: string, resendApiKey: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Amal <onboarding@resend.dev>",
      to: [to],
      subject: "Confirme ton email étudiant – Amal",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">Vérifie ton email étudiant 🎓</h1>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 24px;">
            Clique sur le bouton ci-dessous pour confirmer ton adresse <strong>${to}</strong> et débloquer toutes les fonctionnalités d'Amal.
          </p>
          <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #D4A853, #C49B4A); color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px;">
            Confirmer mon email ✅
          </a>
          <p style="font-size: 13px; color: #999; margin-top: 24px; line-height: 1.5;">
            Ce lien expire dans 24 heures. Si tu n'as pas fait cette demande, ignore cet email.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Resend error:", res.status, errorBody);
    throw new Error(`Resend API error: ${res.status}`);
  }

  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_email } = await req.json();

    if (!student_email || typeof student_email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email étudiant requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedEmail = student_email.trim().toLowerCase();

    if (!isAcademicEmail(trimmedEmail)) {
      return new Response(
        JSON.stringify({
          error: "invalid_domain",
          message: "Cet email ne correspond pas à un domaine universitaire reconnu (.edu, .univ-*.fr, etc.)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: recentRequests } = await serviceClient
      .from("student_email_verifications")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentRequests && recentRequests.length >= 3) {
      return new Response(
        JSON.stringify({ error: "rate_limit", message: "Trop de tentatives. Réessaie dans 24h." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingVerified } = await serviceClient
      .from("student_email_verifications")
      .select("user_id")
      .eq("student_email", trimmedEmail)
      .eq("verified", true)
      .single();

    if (existingVerified && existingVerified.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "email_taken", message: "Cet email étudiant est déjà utilisé par un autre compte." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = generateToken();
    await serviceClient.from("student_email_verifications").insert({
      user_id: user.id,
      student_email: trimmedEmail,
      token,
    });

    const confirmUrl = `${supabaseUrl}/functions/v1/confirm-student-email?token=${token}`;

    // Send email via Resend if API key is configured
    if (resendApiKey) {
      await sendVerificationEmail(trimmedEmail, confirmUrl, resendApiKey);
      console.log(`Verification email sent to ${trimmedEmail}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email de vérification envoyé",
          email_sent: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: return link (dev mode)
    console.log(`Verification link for ${trimmedEmail}: ${confirmUrl}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Lien de vérification généré",
        email_sent: false,
        confirm_url: confirmUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-student-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

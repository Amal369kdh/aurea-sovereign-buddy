import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed academic email domains
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

    // Auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    // Rate limit: max 3 verification requests per 24h
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

    // Check if email already used by another user
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

    // Generate token and store
    const token = generateToken();
    await serviceClient.from("student_email_verifications").insert({
      user_id: user.id,
      student_email: trimmedEmail,
      token,
    });

    // Build confirmation URL
    const projectUrl = supabaseUrl.replace(".supabase.co", "");
    const confirmUrl = `${supabaseUrl}/functions/v1/confirm-student-email?token=${token}`;

    // Send email via Supabase Auth admin (magic link style)
    // We use a simple approach: send via the AI gateway as a formatted email
    // For now, we'll use Supabase's built-in email by creating a simple redirect
    
    // Actually, let's send a real email using Supabase Auth's invite mechanism
    // But since we can't customize that easily, we'll return the confirmation link
    // and let the frontend handle showing it (in dev) or send via a proper email service
    
    // For production: integrate with Resend, SendGrid, etc.
    // For now: return success and the user clicks the confirm link directly
    
    console.log(`Verification link for ${trimmedEmail}: ${confirmUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lien de vérification généré",
        // In production, remove this and send via email service
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

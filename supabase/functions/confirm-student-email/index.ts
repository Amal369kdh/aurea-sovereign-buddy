import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const APP_URL = "https://aurea-student.fr";

  // ── GET: browser clicked the email link ──────────────────────────────────────
  // Immediately redirect to the app which will call us back via POST
  if (req.method === "GET") {
    if (!token) {
      return Response.redirect(`${APP_URL}/verify-email?error=missing_token`, 302);
    }
    return Response.redirect(`${APP_URL}/verify-email?token=${encodeURIComponent(token)}`, 302);
  }

  // ── POST: app calls this function to complete verification ───────────────────
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      const postToken = body.token || token;

      if (!postToken) {
        return new Response(JSON.stringify({ error: "missing_token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const tokenHash = await sha256Hex(postToken);

      // ── Étape 1 : vérifier d'abord que le token existe et n'est pas expiré ────
      const { data: verification, error: fetchError } = await supabase
        .from("student_email_verifications")
        .select("id, user_id, student_email, verified, expires_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();

      // Token introuvable : invalide ou déjà consommé
      if (fetchError || !verification) {
        return new Response(JSON.stringify({ error: "invalid_token" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(verification.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "expired_token" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Déjà vérifié (appel idempotent normal)
      if (verification.verified) {
        return new Response(
          JSON.stringify({ success: true, already_verified: true, user_id: verification.user_id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Étape 2 : Consommer le token de façon atomique ────────────────────────
      // UPDATE atomique : ne réussit que si token_hash correspond ET verified=false.
      // Si React StrictMode envoie 2 requêtes en parallèle, une seule gagnera le UPDATE.
      // L'autre trouvera 0 lignes et retournera un succès idempotent.
      const { data: consumed, error: updateVerifError } = await supabase
        .from("student_email_verifications")
        .update({ verified: true, token_hash: "CONSUMED" })
        .eq("id", verification.id)
        .eq("verified", false) // ← condition atomique : ne passe qu'une fois
        .select("id, user_id, student_email")
        .maybeSingle();

      if (updateVerifError) {
        console.error("Update verification error:", updateVerifError);
        return new Response(JSON.stringify({ error: "update_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 0 lignes retournées → un appel parallèle a déjà consommé le token → succès idempotent
      if (!consumed) {
        return new Response(
          JSON.stringify({ success: true, already_verified: true, user_id: verification.user_id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Étape 3 : Promouvoir le profil en "temoin" ────────────────────────────
      // Cette opération est idempotente (UPDATE sur un profil déjà "temoin" est sans effet)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status: "temoin", is_verified: true })
        .eq("user_id", consumed.user_id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return new Response(JSON.stringify({ error: "profile_update_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, user_id: consumed.user_id, student_email: consumed.student_email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("confirm-student-email POST error:", e);
      return new Response(JSON.stringify({ error: "unexpected_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "method_not_allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

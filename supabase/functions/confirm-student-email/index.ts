import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(htmlPage("Erreur", "Token manquant.", false), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find the verification record
    const { data: verification, error: fetchError } = await supabase
      .from("student_email_verifications")
      .select("*")
      .eq("token", token)
      .single();

    if (fetchError || !verification) {
      return new Response(htmlPage("Lien invalide", "Ce lien de vérification n'existe pas ou a déjà été utilisé.", false), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Check expiry
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(htmlPage("Lien expiré", "Ce lien a expiré. Demande un nouveau lien depuis l'application.", false), {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Check if already verified
    if (verification.verified) {
      return new Response(htmlPage("Déjà vérifié ✅", "Ton email étudiant a déjà été vérifié. Tu peux retourner sur l'application.", true), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from("student_email_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Update verification error:", updateError);
      return new Response(htmlPage("Erreur", "Impossible de valider. Réessaie.", false), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Update profile status to 'temoin'
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ status: "temoin", is_verified: true })
      .eq("user_id", verification.user_id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return new Response(htmlPage("Erreur partielle", "Vérification enregistrée mais statut non mis à jour. Contacte le support.", false), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(
      htmlPage(
        "Email vérifié ✅",
        `Ton email étudiant <strong>${verification.student_email}</strong> a été vérifié avec succès ! Tu es maintenant <strong>Témoin</strong> et tu as accès à toutes les fonctionnalités. Retourne sur l'application pour continuer.`,
        true
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    console.error("confirm-student-email error:", e);
    return new Response(htmlPage("Erreur", "Une erreur inattendue s'est produite.", false), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

function htmlPage(title: string, message: string, success: boolean): string {
  const color = success ? "#22c55e" : "#ef4444";
  const icon = success ? "✅" : "❌";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #0a0e1a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 1.25rem;
      padding: 2.5rem;
      max-width: 420px;
      text-align: center;
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: ${color}; }
    p { font-size: 0.875rem; color: #94a3b8; line-height: 1.6; }
    strong { color: #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

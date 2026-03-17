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

  // Force UTF-8 + no sniffing so browsers never misread the encoding
  const htmlHeaders = {
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(htmlPage("Erreur", "Token manquant.", false), {
        status: 400,
        headers: htmlHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Hash the incoming token and look up by hash (never store/compare plaintext)
    const tokenHash = await sha256Hex(token);

    // Find the verification record — select only non-sensitive fields
    const { data: verification, error: fetchError } = await supabase
      .from("student_email_verifications")
      .select("id, user_id, student_email, verified, expires_at")
      .eq("token_hash", tokenHash)
      .single();

    if (fetchError || !verification) {
      return new Response(
        htmlPage(
          "Lien invalide",
          "Ce lien de v&#233;rification n&#8217;existe pas ou a d&#233;j&#224; &#233;t&#233; utilis&#233;.",
          false
        ),
        { status: 404, headers: htmlHeaders }
      );
    }

    // Check expiry
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        htmlPage(
          "Lien expir&#233;",
          "Ce lien a expir&#233;. Demande un nouveau lien depuis l&#8217;application.",
          false
        ),
        { status: 410, headers: htmlHeaders }
      );
    }

    // Check if already verified
    if (verification.verified) {
      return new Response(
        htmlPage(
          "D&#233;j&#224; v&#233;rifi&#233; &#10003;",
          "Ton email &#233;tudiant a d&#233;j&#224; &#233;t&#233; v&#233;rifi&#233;. Tu peux retourner sur l&#8217;application.",
          true
        ),
        { status: 200, headers: htmlHeaders }
      );
    }

    // Mark as verified AND wipe the token_hash so the link is strictly one-time-use
    const { error: updateError } = await supabase
      .from("student_email_verifications")
      .update({ verified: true, token_hash: "CONSUMED" })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Update verification error:", updateError);
      return new Response(
        htmlPage("Erreur", "Impossible de valider. R&#233;essaie.", false),
        { status: 500, headers: htmlHeaders }
      );
    }

    // Update profile status to 'temoin'
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ status: "temoin", is_verified: true })
      .eq("user_id", verification.user_id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return new Response(
        htmlPage(
          "Erreur partielle",
          "V&#233;rification enregistr&#233;e mais statut non mis &#224; jour. Contacte le support.",
          false
        ),
        { status: 500, headers: htmlHeaders }
      );
    }

    const appUrl = "https://aurea-student.fr";
    const userId = verification.user_id;

    // Page with auto-close script that signals the opener tab via localStorage
    const successHtml = htmlPage(
      "Email v&#233;rifi&#233; &#10003;",
      `Ton email &#233;tudiant <strong>${verification.student_email}</strong> a &#233;t&#233; v&#233;rifi&#233; avec succ&#232;s&#160;! Tu es maintenant <strong>T&#233;moin</strong> et tu as acc&#232;s &#224; toutes les fonctionnalit&#233;s.<br><br><a href="${appUrl}" id="appLink" style="display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,#D4A853,#C49B4A);color:#0d1117;border-radius:0.75rem;font-weight:700;text-decoration:none;font-size:0.875rem;">Acc&#233;der &#224; mon espace &#8594;</a>`,
      true,
      userId
    );

    return new Response(successHtml, { status: 200, headers: htmlHeaders });
  } catch (e) {
    console.error("confirm-student-email error:", e);
    return new Response(
      htmlPage("Erreur", "Une erreur inattendue s&#8217;est produite.", false),
      { status: 500, headers: htmlHeaders }
    );
  }
});

function htmlPage(title: string, message: string, success: boolean): string {
  const color = success ? "#22c55e" : "#ef4444";
  const icon = success ? "&#9989;" : "&#10060;";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      width: 100%;
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

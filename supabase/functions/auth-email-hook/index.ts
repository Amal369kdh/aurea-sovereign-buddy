import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildEmailHtml(title: string, intro: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0d1117;border-radius:16px;overflow:hidden;border:1px solid #1e2530;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 32px 24px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#D4A853,#C49B4A);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:36px;text-align:center;">♛</div>
                <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                  <span style="background:linear-gradient(135deg,#D4A853,#F0C060);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;color:#D4A853;">Aurea</span>
                  <span style="color:#f1f5f9;"> Student</span>
                </span>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4A85340,transparent);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#f1f5f9;line-height:1.4;">${title}</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">${intro}</p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#D4A853,#C49B4A);">
                    <a href="${ctaUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#0d1117;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">
                      ${ctaLabel} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- URL fallback -->
          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0;font-size:11px;color:#475569;line-height:1.6;">
                Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br />
                <a href="${ctaUrl}" style="color:#D4A853;word-break:break-all;">${ctaUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#1e2530,transparent);margin-bottom:16px;"></div>
              <p style="margin:0;font-size:11px;color:#334155;text-align:center;line-height:1.6;">
                Tu reçois cet email car un compte a été créé ou une action a été demandée sur <strong style="color:#475569;">Aurea Student</strong>.<br />
                Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send via Resend ───────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, resendApiKey: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "L'équipe Aurea <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return await res.json();
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("auth-email-hook payload type:", payload?.email_data?.email_action_type);

    const user = payload?.user;
    const emailData = payload?.email_data;

    if (!user?.email || !emailData) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email_action_type, confirmation_url, token_hash, redirect_to, site_url } = emailData;

    // Build the confirmation URL
    const actionUrl =
      confirmation_url ??
      `${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to ?? site_url}`;

    let subject: string;
    let html: string;

    switch (email_action_type) {
      case "signup":
      case "email_confirmation":
        subject = "Confirme ton adresse email – Aurea Student";
        html = buildEmailHtml(
          "Confirme ton adresse email 📧",
          `Bienvenue dans notre cercle.<br /><br />
           Pour activer ton compte <strong style="color:#f1f5f9;">Aurea Student</strong> et accéder à toutes les ressources pour ton installation à Grenoble, confirme ton adresse email en cliquant sur le bouton ci-dessous.<br /><br />
           Ce lien est valable <strong style="color:#f1f5f9;">24 heures</strong>.`,
          "Confirmer mon adresse email",
          actionUrl
        );
        break;

      case "recovery":
        subject = "Réinitialise ton mot de passe – Aurea Student";
        html = buildEmailHtml(
          "Réinitialisation de ton mot de passe 🔑",
          `Tu as demandé à réinitialiser le mot de passe de ton compte <strong style="color:#f1f5f9;">Aurea Student</strong>.<br /><br />
           Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong style="color:#f1f5f9;">1 heure</strong>.<br /><br />
           Si tu n'es pas à l'origine de cette demande, tu peux ignorer cet email — ton mot de passe reste inchangé.`,
          "Réinitialiser mon mot de passe",
          actionUrl
        );
        break;

      case "invite":
        subject = "Tu es invité(e) sur Aurea Student 🎓";
        html = buildEmailHtml(
          "Invitation sur Aurea Student 🎓",
          `Tu as été invité(e) à rejoindre <strong style="color:#f1f5f9;">Aurea Student</strong>, la plateforme qui aide les étudiants à s'installer à Grenoble.<br /><br />
           Clique sur le bouton ci-dessous pour créer ton compte et rejoindre la communauté.`,
          "Accepter l'invitation",
          actionUrl
        );
        break;

      case "magiclink":
        subject = "Ton lien de connexion – Aurea Student";
        html = buildEmailHtml(
          "Connexion sans mot de passe 🔗",
          `Utilise ce lien à usage unique pour te connecter à <strong style="color:#f1f5f9;">Aurea Student</strong>.<br /><br />
           Ce lien expire dans <strong style="color:#f1f5f9;">1 heure</strong> et ne peut être utilisé qu'une seule fois.`,
          "Me connecter",
          actionUrl
        );
        break;

      case "email_change":
        subject = "Confirme ton nouvel email – Aurea Student";
        html = buildEmailHtml(
          "Changement d'adresse email 📬",
          `Tu as demandé à changer l'adresse email associée à ton compte <strong style="color:#f1f5f9;">Aurea Student</strong>.<br /><br />
           Clique sur le bouton ci-dessous pour confirmer cette modification.`,
          "Confirmer le changement",
          actionUrl
        );
        break;

      default:
        console.log("Unhandled email action type:", email_action_type);
        return new Response(JSON.stringify({ message: "Event type not handled" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    await sendEmail(user.email, subject, html, resendApiKey);
    console.log(`Email sent: ${email_action_type} → ${user.email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("auth-email-hook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

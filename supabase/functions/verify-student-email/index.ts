import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Academic domain validation ────────────────────────────────────────────────

const ALLOWED_PATTERNS = [
  // ── Patterns internationaux ────────────────────────────────
  /(^|\.)edu$/i,
  /(^|\.)edu\.[a-z]{2}$/i,
  // ── Patterns génériques français ──────────────────────────
  /(^|\.)univ-[a-z-]+\.fr$/i,
  /(^|\.)u-[a-z-]+\.fr$/i,
  /(^|\.)etu\.[a-z-]+\.fr$/i,
  /(^|\.)etud\.[a-z-]+\.fr$/i,
  /(^|\.)etudiant\.[a-z-]+\.fr$/i,
  /(^|\.)univ\.fr$/i,
  /(^|\.)ac-[a-z-]+\.fr$/i,
  /(^|\.)ens[a-z-]*\.fr$/i,
  /(^|\.)insa[a-z-]*\.fr$/i,
  /(^|\.)iut[a-z-]*\.fr$/i,
  /(^|\.)centrale-[a-z-]+\.fr$/i,
  /(^|\.)sciencespo[a-z-]*\.fr$/i,
  // ── Grandes écoles & universités explicites ────────────────
  /(^|\.)grenoble-inp\.fr$/i,
  /(^|\.)parisnanterre\.fr$/i,
  /(^|\.)sorbonne-universite\.fr$/i,
  /(^|\.)universite-paris-saclay\.fr$/i,
  /(^|\.)umontpellier\.fr$/i,
  /(^|\.)univ-grenoble-alpes\.fr$/i,
  /(^|\.)uga\.fr$/i,
  /(^|\.)hec\.edu$/i,
  /(^|\.)polytechnique\.edu$/i,
  /(^|\.)essec\.edu$/i,
  /(^|\.)u-paris\.fr$/i,
  /(^|\.)unistra\.fr$/i,
  /(^|\.)univ-amu\.fr$/i,
  /(^|\.)amu\.fr$/i,
  /(^|\.)univ-cotedazur\.fr$/i,
  /(^|\.)unice\.fr$/i,
  /(^|\.)bordeaux-inp\.fr$/i,
  /(^|\.)imt-nord-europe\.fr$/i,
  /(^|\.)ec-lyon\.fr$/i,
  /(^|\.)em-lyon\.com$/i,
  // ── Vérification en table allowed_domains (fallback) ──────
  // La fonction vérifie aussi explicitement la table allowed_domains via serviceClient
];

function isAcademicEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(domain));
}

// ─── Token generation & hashing ───────────────────────────────────────────────

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Email HTML builder ────────────────────────────────────────────────────────

function buildVerificationEmailHtml(studentEmail: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirme ton email étudiant – Aurea Student</title>
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
              <h1 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#f1f5f9;line-height:1.4;">Vérifie ton email étudiant 🎓</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">
                Clique sur le bouton ci-dessous pour confirmer ton adresse
                <strong style="color:#f1f5f9;">${studentEmail}</strong>
                et débloquer toutes les fonctionnalités d'<strong style="color:#f1f5f9;">Aurea Student</strong>
                (Hub Social, Rencontres, messagerie privée et toutes tes démarches d'installation).<br /><br />
                Ce lien est valable <strong style="color:#f1f5f9;">24 heures</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#D4A853,#C49B4A);">
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#0d1117;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">
                      Confirmer mon email étudiant →
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
                <a href="${confirmUrl}" style="color:#D4A853;word-break:break-all;">${confirmUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#1e2530,transparent);margin-bottom:16px;"></div>
              <p style="margin:0;font-size:11px;color:#334155;text-align:center;line-height:1.6;">
                Tu reçois cet email car une vérification d'email étudiant a été demandée sur <strong style="color:#475569;">Aurea Student</strong>.<br />
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

// ─── Main handler ──────────────────────────────────────────────────────────────

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
    const emailDomain = trimmedEmail.split("@")[1] ?? "";

    // ── Étape 1 : validation par regex (patterns académiques connus) ──────────
    const passesPattern = isAcademicEmail(trimmedEmail);

    // ── Étape 2 : si le regex ne passe pas, vérifier la table allowed_domains ─
    // Cela permet d'ajouter des domaines spécifiques sans modifier le code
    let passesTable = false;
    if (!passesPattern && emailDomain) {
      const tempService = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: domainRow } = await tempService
        .from("allowed_domains")
        .select("domain")
        .eq("domain", emailDomain)
        .maybeSingle();
      passesTable = !!domainRow;
    }

    if (!passesPattern && !passesTable) {
      return new Response(
        JSON.stringify({
          error: "invalid_domain",
          message: "Cet email ne correspond pas à un domaine universitaire reconnu. Utilise ton adresse académique (.edu, .univ-*.fr, .etu.*.fr, etc.)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate the calling user
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

    // Rate-limit: max 3 requests per 24h per user
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

    // Guard: email not already verified by another account
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

    // Generate token, hash it in JS (no pgcrypto dependency), store only the hash
    const token = generateToken();
    const tokenHash = await sha256Hex(token);

    const { error: insertError } = await serviceClient
      .from("student_email_verifications")
      .insert({ user_id: user.id, student_email: trimmedEmail, token_hash: tokenHash });

    if (insertError) {
      console.error("Insert verification error:", JSON.stringify(insertError));
      return new Response(
        JSON.stringify({ error: "Une erreur est survenue lors de la création du token." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build confirmation URL pointing to the APP (not the function directly)
    // The app's /verify-email page will call the function via POST — no raw HTML in browser
    const APP_URL = "https://aurea-student.fr";
    const confirmUrl = `${APP_URL}/verify-email?token=${token}`;

    // Build email payload for Lovable Cloud email queue
    const messageId = `student-verify-${user.id}-${Date.now()}`;
    const plainText = `Confirme ton email étudiant – Aurea Student\n\nClique sur ce lien pour confirmer ton adresse ${trimmedEmail} et débloquer toutes les fonctionnalités d'Aurea Student :\n\n${confirmUrl}\n\nCe lien est valable 24 heures.\n\nSi tu n'es pas à l'origine de cette demande, ignore cet email.`;

    // Generate a unique unsubscribe token (required by the transactional email API)
    const unsubTokenArr = new Uint8Array(16);
    crypto.getRandomValues(unsubTokenArr);
    const unsubscribeToken = Array.from(unsubTokenArr, (b) => b.toString(16).padStart(2, "0")).join("");

    // Store the unsubscribe token so it can be resolved later if needed
    await serviceClient.from("email_unsubscribe_tokens").upsert(
      { email: trimmedEmail, token: unsubscribeToken },
      { onConflict: "email" }
    );

    const emailPayload = {
      message_id: messageId,
      to: trimmedEmail,
      from: "Aurea Student <noreply@notify.aurea-student.fr>",
      sender_domain: "notify.aurea-student.fr",
      subject: "Confirme ton email étudiant – Aurea Student",
      html: buildVerificationEmailHtml(trimmedEmail, confirmUrl),
      text: plainText,
      purpose: "transactional",
      label: "student_email_verification",
      queued_at: new Date().toISOString(),
      idempotency_key: messageId,
      unsubscribe_token: unsubscribeToken,
    };

    const { error: enqueueError } = await serviceClient.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: emailPayload,
    });

    if (enqueueError) {
      console.error("Enqueue email error:", enqueueError);
      // Fallback: return the confirm URL so the user isn't blocked
      return new Response(
        JSON.stringify({
          success: true,
          message: "Lien de vérification généré (email indisponible temporairement)",
          email_sent: false,
          confirm_url: confirmUrl,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verification email enqueued for ${trimmedEmail} (message_id: ${messageId})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de vérification envoyé",
        email_sent: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-student-email error:", e);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue, réessaie." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

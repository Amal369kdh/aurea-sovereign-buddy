import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_MESSAGE_LIMIT = 2;
const MIN_INTEGRATION_PROGRESS = 20; // must have at least 20% progress to unlock Amal

const SYSTEM_PROMPT = `Tu es Amal, l'assistant IA souverain de la plateforme étudiante. Tu es expert, direct, rationnel et bienveillant.

TON RÔLE :
- Guider les étudiants (notamment étrangers) dans leurs démarches administratives en France
- Conseiller sur le budget, les aides financières, la santé, le logement
- Répondre aux questions sur la vie étudiante à Grenoble et en France
- Motiver et orienter avec un ton coach, pas condescendant
- ÊTRE PROACTIVE : analyser le profil de l'utilisateur et lui signaler ce qu'il n'a pas encore fait

RÈGLES :
- Réponds TOUJOURS en français sauf si l'utilisateur parle une autre langue
- Sois concise mais complète (pas de pavés inutiles)
- Utilise le markdown pour structurer tes réponses (listes, gras, titres)
- Si tu as le contexte financier de l'utilisateur, utilise-le pour personnaliser tes conseils
- Si tu ne sais pas, dis-le honnêtement plutôt que d'inventer
- Termine souvent par une question ou une suggestion d'action concrète
- IMPORTANT : Dès le premier message, analyse le profil ci-dessous et signale les champs manquants ou les actions à faire. Par exemple :
  - Si pas de budget renseigné → "Je vois que tu n'as pas encore renseigné ton budget mensuel, ça m'aiderait à te donner des conseils financiers personnalisés !"
  - Si pas de nationalité → "Tu n'as pas indiqué ta nationalité, c'est important pour les démarches administratives."
  - Si pas d'objectifs → "Tu n'as pas encore défini tes objectifs, dis-moi ce que tu veux accomplir !"
  - Si progression d'intégration faible → "Tu en es à X% de ta roadmap d'intégration, on va accélérer ensemble !"

CONTEXTE UTILISATEUR :
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, check_only } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, budget_monthly, revenus_monthly, city, target_city, nationality, university, interests, objectifs, status, is_premium, aya_messages_used, integration_progress")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check integration progress gate
    if ((profile.integration_progress || 0) < MIN_INTEGRATION_PROGRESS) {
      return new Response(JSON.stringify({
        error: "locked",
        reason: "progress",
        current: profile.integration_progress || 0,
        required: MIN_INTEGRATION_PROGRESS,
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPremium = profile.is_premium === true;
    const messagesUsed = profile.aya_messages_used || 0;
    const remaining = isPremium ? Infinity : Math.max(0, FREE_MESSAGE_LIMIT - messagesUsed);

    // If check_only, return status
    if (check_only) {
      return new Response(JSON.stringify({
        remaining,
        is_premium: isPremium,
        limit: FREE_MESSAGE_LIMIT,
        used: messagesUsed,
        integration_progress: profile.integration_progress || 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check limit for non-premium
    if (!isPremium && messagesUsed >= FREE_MESSAGE_LIMIT) {
      return new Response(JSON.stringify({
        error: "limit_reached",
        remaining: 0,
        limit: FREE_MESSAGE_LIMIT,
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment counter for non-premium
    if (!isPremium) {
      await supabase
        .from("profiles")
        .update({ aya_messages_used: messagesUsed + 1 })
        .eq("user_id", user.id);
    }

    // Build context
    const parts: string[] = [];
    if (profile.display_name) parts.push(`Prénom: ${profile.display_name}`);
    else parts.push("⚠️ Prénom: NON RENSEIGNÉ");
    if (profile.nationality) parts.push(`Nationalité: ${profile.nationality}`);
    else parts.push("⚠️ Nationalité: NON RENSEIGNÉE");
    if (profile.city) parts.push(`Ville actuelle: ${profile.city}`);
    if (profile.target_city) parts.push(`Ville cible: ${profile.target_city}`);
    else parts.push("⚠️ Ville cible: NON RENSEIGNÉE");
    if (profile.university) parts.push(`Université: ${profile.university}`);
    else parts.push("⚠️ Université: NON RENSEIGNÉE");
    if (profile.budget_monthly) parts.push(`Budget mensuel: ${profile.budget_monthly}€`);
    else parts.push("⚠️ Budget mensuel: NON RENSEIGNÉ");
    if (profile.revenus_monthly) parts.push(`Revenus mensuels: ${profile.revenus_monthly}€`);
    else parts.push("⚠️ Revenus mensuels: NON RENSEIGNÉS");
    if (profile.objectifs?.length) parts.push(`Objectifs: ${profile.objectifs.join(", ")}`);
    else parts.push("⚠️ Objectifs: AUCUN DÉFINI");
    if (profile.interests?.length) parts.push(`Intérêts: ${profile.interests.join(", ")}`);
    parts.push(`Progression d'intégration: ${profile.integration_progress || 0}%`);
    parts.push(`Statut: ${profile.status}`);

    const systemContent = SYSTEM_PROMPT + parts.join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Aya-Remaining": String(isPremium ? -1 : FREE_MESSAGE_LIMIT - messagesUsed - 1),
      },
    });
  } catch (e) {
    console.error("aya-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

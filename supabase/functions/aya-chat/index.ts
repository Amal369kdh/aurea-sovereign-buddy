import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es Aya, l'assistante IA souveraine de la plateforme étudiante. Tu es experte, directe, rationnelle et bienveillante.

TON RÔLE :
- Guider les étudiants (notamment étrangers) dans leurs démarches administratives en France
- Conseiller sur le budget, les aides financières, la santé, le logement
- Répondre aux questions sur la vie étudiante à Grenoble et en France
- Motiver et orienter avec un ton coach, pas condescendant

RÈGLES :
- Réponds TOUJOURS en français sauf si l'utilisateur parle une autre langue
- Sois concise mais complète (pas de pavés inutiles)
- Utilise le markdown pour structurer tes réponses (listes, gras, titres)
- Si tu as le contexte financier de l'utilisateur, utilise-le pour personnaliser tes conseils
- Si tu ne sais pas, dis-le honnêtement plutôt que d'inventer
- Termine souvent par une question ou une suggestion d'action concrète

CONTEXTE UTILISATEUR (si disponible) :
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Try to get user profile for context
    let userContext = "";
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, budget_monthly, revenus_monthly, city, target_city, nationality, university, interests, objectifs, status")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          const parts: string[] = [];
          if (profile.display_name) parts.push(`Prénom: ${profile.display_name}`);
          if (profile.nationality) parts.push(`Nationalité: ${profile.nationality}`);
          if (profile.city) parts.push(`Ville actuelle: ${profile.city}`);
          if (profile.target_city) parts.push(`Ville cible: ${profile.target_city}`);
          if (profile.university) parts.push(`Université: ${profile.university}`);
          if (profile.budget_monthly) parts.push(`Budget mensuel: ${profile.budget_monthly}€`);
          if (profile.revenus_monthly) parts.push(`Revenus mensuels: ${profile.revenus_monthly}€`);
          if (profile.objectifs?.length) parts.push(`Objectifs: ${profile.objectifs.join(", ")}`);
          if (profile.interests?.length) parts.push(`Intérêts: ${profile.interests.join(", ")}`);
          if (profile.status) parts.push(`Statut: ${profile.status}`);
          userContext = parts.join("\n");
        }
      }
    }

    const systemContent = SYSTEM_PROMPT + (userContext || "Aucun contexte disponible.");

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
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("aya-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

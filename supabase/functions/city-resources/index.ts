import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_CITIES = ["grenoble", "lyon", "montpellier", "toulouse", "clermont-ferrand", "marseille", "bordeaux", "nantes", "lille"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { city, force_refresh } = body;
    const targetCity = city || "Grenoble";
    const cacheKey = targetCity.toLowerCase().trim();

    if (!SUPPORTED_CITIES.includes(cacheKey)) {
      return new Response(
        JSON.stringify({ city: targetCity, coming_soon: true, message: "Ta ville arrive bientôt ⚡" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service-role client to read/write cache (bypasses RLS for reads too)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check DB cache (unless admin forces refresh)
    if (!force_refresh) {
      const { data: cached } = await adminClient
        .from("city_resources_cache")
        .select("data, last_updated_at")
        .eq("city", cacheKey)
        .maybeSingle();

      if (cached?.data) {
        return new Response(
          JSON.stringify({ ...cached.data, last_updated_at: cached.last_updated_at }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch from Perplexity
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const prompt = `Pour un étudiant (potentiellement étranger) vivant à ${targetCity}, France, donne-moi des informations ACTUELLES et VÉRIFIÉES sous forme JSON structuré. Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.

{
  "city": "${targetCity}",
  "crous": {
    "name": "CROUS de [région]",
    "address": "adresse complète",
    "phone": "numéro",
    "url": "site officiel",
    "resto_u": [{"name": "nom", "address": "adresse", "url": "lien si dispo"}]
  },
  "transport": {
    "network_name": "nom du réseau (ex: TAG, TCL, RTM)",
    "student_subscription": "nom et prix de l'abo étudiant",
    "url": "site officiel"
  },
  "health": {
    "university_health_center": {"name": "nom", "address": "adresse", "phone": "tel"},
    "emergency": "numéro des urgences locales ou hôpital le plus proche",
    "sos_medecins": {"phone": "tel local", "url": "site"},
    "nightline": "numéro local si disponible"
  },
  "prefecture": {
    "name": "nom",
    "address": "adresse",
    "rdv_url": "lien pour prendre rdv en ligne",
    "phone": "tel"
  },
  "caf": {
    "address": "adresse CAF locale",
    "phone": "tel",
    "url": "https://www.caf.fr"
  },
  "banques": {
    "liste": [
      {"name": "Hello Bank", "link": "URL officielle", "student_offer": "nom de l'offre étudiante si elle existe"},
      {"name": "BNP Paribas", "link": "URL officielle", "student_offer": "nom de l'offre étudiante si elle existe"},
      {"name": "Boursorama", "link": "URL officielle", "student_offer": "nom de l'offre étudiante si elle existe"},
      {"name": "Revolut", "link": "URL officielle", "student_offer": "nom de l'offre étudiante si elle existe"},
      {"name": "N26", "link": "URL officielle", "student_offer": "nom de l'offre étudiante si elle existe"}
    ],
    "conseil": "Une seule phrase naturelle avec conseil pratique pour ouvrir un compte étudiant à ${targetCity}"
  },
  "logement": {
    "residences_crous": [{"name": "nom", "address": "adresse", "url": "lien si dispo"}],
    "autres": ["2-3 plateformes locales recommandées"]
  },
  "useful_tips": [
    "3-5 conseils pratiques spécifiques à ${targetCity} pour un étudiant étranger, rédigés en phrases naturelles complètes, sans aucune référence entre crochets comme [1] ou [source], sans puces markdown, juste du texte propre et lisible"
  ]
}`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Tu es un assistant qui fournit des informations locales vérifiées pour étudiants en France. Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Perplexity error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Une erreur est survenue, réessaie." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    const citations = result.citations || [];

    let parsed: any = null;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      parsed = { raw: content, parse_error: true };
    }

    const responseData = {
      ...parsed,
      citations,
      fetched_at: new Date().toISOString(),
    };

    // Persist to DB using upsert
    await adminClient
      .from("city_resources_cache")
      .upsert(
        { city: cacheKey, data: responseData, last_updated_at: new Date().toISOString() },
        { onConflict: "city" }
      );

    return new Response(JSON.stringify({ ...responseData, last_updated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("city-resources error:", e);
    return new Response(JSON.stringify({ error: "Une erreur est survenue, réessaie." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

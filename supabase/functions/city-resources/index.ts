import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cityCache = new Map<string, { data: any; ts: number }>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

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

    const { city } = await req.json();
    const targetCity = city || "Grenoble";
    const cacheKey = targetCity.toLowerCase().trim();

    // Check cache
    const cached = cityCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
  "useful_tips": [
    "3-5 conseils pratiques spécifiques à ${targetCity} pour un étudiant étranger"
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
      return new Response(JSON.stringify({ error: "Erreur du service de recherche", status: response.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    const citations = result.citations || [];

    // Parse JSON from response (handle markdown code blocks)
    let parsed: any = null;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      // If JSON parsing fails, return raw content
      parsed = { raw: content, parse_error: true };
    }

    const responseData = {
      ...parsed,
      citations,
      fetched_at: new Date().toISOString(),
    };

    // Cache result
    cityCache.set(cacheKey, { data: responseData, ts: Date.now() });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("city-resources error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

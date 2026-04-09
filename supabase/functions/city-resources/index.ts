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
    const { city } = body;
    const targetCity = city || "Grenoble";
    const cacheKey = targetCity.toLowerCase().trim();

    // Service-role client to read cache
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Read from DB cache — all cities are pre-populated manually
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

    // City not in cache — return coming soon
    return new Response(
      JSON.stringify({ city: targetCity, coming_soon: true, message: "Ta ville arrive bientôt ⚡" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("city-resources error:", e);
    return new Response(JSON.stringify({ error: "Une erreur est survenue, réessaie." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

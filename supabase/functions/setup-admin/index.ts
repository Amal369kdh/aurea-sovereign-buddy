import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, password, secret } = await req.json();

    if (secret !== "aurea-admin-setup-2026") {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Update existing user: confirm email + set password
    const { error: updateAuthError } = await adminClient.auth.admin.updateUser(userId, {
      password,
      email_confirm: true,
    });

    if (updateAuthError) {
      return new Response(JSON.stringify({ error: "Auth update failed: " + updateAuthError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert the profile with admin status
    const { error: upsertError } = await adminClient
      .from("profiles")
      .upsert({
        user_id: userId,
        status: "admin",
        display_name: "Admin",
        avatar_initials: "AD",
        nationality: "🇫🇷 Française",
        city: "Paris",
        university: "Admin",
        objectifs: ["admin"],
        is_in_france: true,
        onboarding_step: 99,
      }, { onConflict: "user_id" });

    if (upsertError) {
      return new Response(JSON.stringify({ error: "Profile upsert failed: " + upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erreur interne: " + err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

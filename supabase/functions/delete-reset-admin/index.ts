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
    const { userId, email, password, secret } = await req.json();

    if (secret !== "aurea-admin-setup-2026") {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete existing user
    await adminClient.auth.admin.deleteUser(userId);

    // Wait for cascade delete
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Recreate user
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Admin" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = userData.user.id;

    // Wait for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Set admin status
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        status: "admin",
        display_name: "Admin",
        avatar_initials: "AD",
        nationality: "🇫🇷 Française",
        city: "Paris",
        university: "Admin",
        objectifs: ["admin"],
        is_in_france: true,
        onboarding_step: 99,
      })
      .eq("user_id", newUserId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "User created but profile update failed: " + updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, newUserId }), {
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

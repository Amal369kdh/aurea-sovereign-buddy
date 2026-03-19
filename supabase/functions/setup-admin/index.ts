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

    const adminSecret = Deno.env.get("ADMIN_SETUP_SECRET");
    if (!adminSecret || secret !== adminSecret) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Update user password + confirm email via REST API
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ password, email_confirm: true }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      return new Response(JSON.stringify({ error: "Auth update failed: " + err }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Upsert the profile with admin status via REST
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=user_id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({
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
      }),
    });

    if (!upsertRes.ok) {
      const err = await upsertRes.text();
      return new Response(JSON.stringify({ error: "Profile upsert failed: " + err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('[setup-admin] error:', err);
    return new Response(JSON.stringify({ error: 'Une erreur est survenue.' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user with anon client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role to delete all user data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete in dependency order
    const tables = [
      { table: "solution_messages", column: "sender_id" },
      { table: "solution_conversations", column: "post_author_id" },
      { table: "solution_conversations", column: "helper_id" },
      { table: "dating_messages", column: "sender_id" },
      { table: "dating_matches", column: "user_a" },
      { table: "dating_matches", column: "user_b" },
      { table: "dating_likes", column: "liker_id" },
      { table: "dating_likes", column: "liked_id" },
      { table: "dating_profiles", column: "user_id" },
      { table: "announcement_likes", column: "user_id" },
      { table: "comments", column: "author_id" },
      { table: "announcements", column: "author_id" },
      { table: "connections", column: "requester_id" },
      { table: "connections", column: "target_id" },
      { table: "messages", column: "sender_id" },
      { table: "messages", column: "receiver_id" },
      { table: "reports", column: "reporter_id" },
      { table: "student_email_verifications", column: "user_id" },
      { table: "user_documents", column: "user_id" },
      { table: "user_tasks", column: "user_id" },
      { table: "resources_links", column: "created_by" },
      { table: "organizations", column: "user_id" },
      { table: "profiles", column: "user_id" },
    ];

    for (const { table, column } of tables) {
      await adminClient.from(table).delete().eq(column, userId);
    }

    // Delete auth user — this allows re-registration with the same email
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Erreur lors de la suppression du compte" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

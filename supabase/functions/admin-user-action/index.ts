import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | { type: "suspend"; target_user_id: string; days: number }
  | { type: "unsuspend"; target_user_id: string }
  | { type: "force_verify"; target_user_id: string }
  | { type: "delete"; target_user_id: string; confirm_display_name: string };

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // CRITICAL: verify caller is admin
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (callerProfile?.status !== "admin") {
      return new Response(JSON.stringify({ error: "Accès admin requis" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Action;

    if (!body.target_user_id || typeof body.target_user_id !== "string") {
      return new Response(JSON.stringify({ error: "target_user_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent admin from acting on themselves for destructive actions
    if (body.target_user_id === user.id && (body.type === "delete" || body.type === "suspend")) {
      return new Response(JSON.stringify({ error: "Tu ne peux pas effectuer cette action sur ton propre compte." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === "suspend") {
      const days = Math.min(Math.max(Number(body.days) || 7, 1), 365);
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await adminClient
        .from("profiles")
        .update({ suspended_until: until })
        .eq("user_id", body.target_user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, suspended_until: until }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === "unsuspend") {
      const { error } = await adminClient
        .from("profiles")
        .update({ suspended_until: null })
        .eq("user_id", body.target_user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === "force_verify") {
      const { error } = await adminClient
        .from("profiles")
        .update({ is_verified: true, status: "temoin" })
        .eq("user_id", body.target_user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === "delete") {
      // Double-check: require typed display_name match
      const { data: target } = await adminClient
        .from("profiles")
        .select("display_name")
        .eq("user_id", body.target_user_id)
        .maybeSingle();

      if (!target) {
        return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if ((target.display_name ?? "").trim().toLowerCase() !== (body.confirm_display_name ?? "").trim().toLowerCase()) {
        return new Response(JSON.stringify({ error: "Le pseudo de confirmation ne correspond pas" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = body.target_user_id;
      const tables = [
        { table: "feedbacks", column: "user_id" },
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
        { table: "notifications", column: "user_id" },
        { table: "push_subscriptions", column: "user_id" },
        { table: "profiles", column: "user_id" },
      ];

      for (const { table, column } of tables) {
        await adminClient.from(table).delete().eq(column, userId);
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("Error deleting auth user:", deleteError);
        return new Response(JSON.stringify({ error: "Erreur suppression auth" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-user-action error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

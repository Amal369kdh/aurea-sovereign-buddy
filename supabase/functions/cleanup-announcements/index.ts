import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete non-pinned announcements older than 14 days or past expires_at
    const { data, error } = await supabase
      .from("announcements")
      .delete()
      .eq("is_pinned", false)
      .lt("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Also delete expired ones
    const { error: error2 } = await supabase
      .from("announcements")
      .delete()
      .eq("is_pinned", false)
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString());

    if (error2) throw error2;

    return new Response(
      JSON.stringify({ success: true, deleted: data?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Bug, Lightbulb, AlertCircle, Trash2 } from "lucide-react";

type Feedback = {
  id: string;
  user_id: string;
  category: "bug" | "idee" | "plainte";
  message: string;
  status: "nouveau" | "lu" | "traite";
  created_at: string;
  display_name?: string | null;
};

const CAT_META: Record<string, { icon: typeof Bug; color: string; label: string }> = {
  bug: { icon: Bug, color: "text-red-400 border-red-500/40 bg-red-500/10", label: "Bug" },
  idee: { icon: Lightbulb, color: "text-amber-400 border-amber-500/40 bg-amber-500/10", label: "Idée" },
  plainte: { icon: AlertCircle, color: "text-orange-400 border-orange-500/40 bg-orange-500/10", label: "Plainte" },
};

const STATUS_META: Record<string, string> = {
  nouveau: "bg-primary/15 text-primary border-primary/30",
  lu: "bg-secondary text-muted-foreground border-border",
  traite: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const AdminFeedbacks = () => {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "nouveau" | "lu" | "traite">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: fbData } = await supabase
      .from("feedbacks")
      .select("id, user_id, category, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (fbData) {
      const userIds = [...new Set(fbData.map((f) => f.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.display_name]));
      setFeedbacks(fbData.map((f) => ({ ...f, display_name: nameMap[f.user_id] ?? null })) as Feedback[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: "nouveau" | "lu" | "traite") => {
    const { error } = await supabase.from("feedbacks").update({ status }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setFeedbacks((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Supprimer ce feedback ?")) return;
    const { error } = await supabase.from("feedbacks").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      toast({ title: "Feedback supprimé" });
    }
  };

  const filtered = filter === "all" ? feedbacks : feedbacks.filter((f) => f.status === filter);
  const counts = {
    all: feedbacks.length,
    nouveau: feedbacks.filter((f) => f.status === "nouveau").length,
    lu: feedbacks.filter((f) => f.status === "lu").length,
    traite: feedbacks.filter((f) => f.status === "traite").length,
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(["all", "nouveau", "lu", "traite"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === f ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f === "all" ? "Tous" : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun feedback dans cette catégorie.</p>
        </div>
      )}

      {filtered.map((f) => {
        const meta = CAT_META[f.category];
        const Icon = meta.icon;
        return (
          <div key={f.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.color}`}>
                <Icon className="h-3 w-3" /> {meta.label}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_META[f.status]}`}>
                {f.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {f.display_name ?? f.user_id.slice(0, 8)} · {new Date(f.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <p className="mb-3 text-sm text-foreground whitespace-pre-wrap">{f.message}</p>
            <div className="flex flex-wrap gap-2">
              {(["nouveau", "lu", "traite"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(f.id, s)}
                  disabled={f.status === s}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    f.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                  } disabled:cursor-default`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => deleteFeedback(f.id)}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

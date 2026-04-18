import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BellRing, Check, AlertTriangle, Info, RefreshCw } from "lucide-react";

type Alert = {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string | null;
  related_id: string | null;
  is_resolved: boolean;
  created_at: string;
};

const SEVERITY_META: Record<string, { color: string; icon: typeof Info }> = {
  info: { color: "border-blue-500/40 bg-blue-500/10 text-blue-400", icon: Info },
  warning: { color: "border-amber-500/40 bg-amber-500/10 text-amber-400", icon: AlertTriangle },
  critical: { color: "border-destructive/40 bg-destructive/10 text-destructive", icon: AlertTriangle },
};

export const AdminAlerts = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("admin_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!showResolved) q = q.eq("is_resolved", false);
    const { data } = await q;
    if (data) setAlerts(data as Alert[]);
    setLoading(false);
  }, [showResolved]);

  useEffect(() => { load(); }, [load]);

  // Realtime: nouvelles alertes apparaissent immédiatement
  useEffect(() => {
    const channel = supabase
      .channel("admin_alerts_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_alerts" }, (payload) => {
        const newAlert = payload.new as Alert;
        if (showResolved || !newAlert.is_resolved) {
          setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
          toast({ title: "🚨 Nouvelle alerte admin", description: newAlert.title });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showResolved, toast]);

  const resolve = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("admin_alerts")
      .update({ is_resolved: true, resolved_by: user?.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_resolved: true } : a).filter((a) => showResolved || !a.is_resolved));
      toast({ title: "Alerte marquée comme résolue ✓" });
    }
  };

  const checkSpike = async () => {
    setChecking(true);
    const { error } = await supabase.rpc("check_signup_spike" as any);
    setChecking(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Vérification effectuée" });
      load();
    }
  };

  const activeCount = alerts.filter((a) => !a.is_resolved).length;

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{activeCount} alerte(s) active(s)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkSpike}
            disabled={checking}
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Vérifier inscriptions
          </button>
          <button
            onClick={() => setShowResolved((v) => !v)}
            className={`rounded-2xl border px-3 py-1.5 text-xs font-bold transition-colors ${
              showResolved ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {showResolved ? "Masquer résolues" : "Voir résolues"}
          </button>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <Check className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
          <p className="text-sm font-bold text-emerald-400">Aucune alerte. Tout va bien ✨</p>
        </div>
      )}

      {alerts.map((a) => {
        const meta = SEVERITY_META[a.severity];
        const Icon = meta.icon;
        return (
          <div key={a.id} className={`rounded-2xl border p-4 ${meta.color} ${a.is_resolved ? "opacity-60" : ""}`}>
            <div className="mb-2 flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-foreground">{a.title}</p>
                {a.description && <p className="mt-1 text-xs text-foreground/80">{a.description}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("fr-FR")} · {a.severity}
                </p>
              </div>
            </div>
            {!a.is_resolved && (
              <button
                onClick={() => resolve(a.id)}
                className="flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold text-foreground hover:bg-foreground/20 transition-colors"
              >
                <Check className="h-3 w-3" /> Marquer résolue
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

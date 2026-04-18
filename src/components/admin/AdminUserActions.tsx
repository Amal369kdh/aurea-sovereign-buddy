import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pause, Play, ShieldCheck, Trash2, AlertTriangle, X } from "lucide-react";

type UserRow = {
  user_id: string;
  display_name: string | null;
  city: string | null;
  university: string | null;
  status: string;
  is_premium: boolean;
  is_verified: boolean;
  points_social: number;
  created_at: string;
  suspended_until?: string | null;
};

type Props = {
  users: UserRow[];
  onChanged: () => void;
};

const callAction = async (action: Record<string, unknown>) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-action`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(action),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Erreur");
  return json;
};

export const AdminUserActions = ({ users, onChanged }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [suspendDays, setSuspendDays] = useState<Record<string, number>>({});

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (u.display_name ?? "").toLowerCase().includes(s) ||
      (u.city ?? "").toLowerCase().includes(s) ||
      (u.university ?? "").toLowerCase().includes(s) ||
      u.user_id.toLowerCase().includes(s)
    );
  });

  const isSuspended = (u: UserRow) =>
    u.suspended_until && new Date(u.suspended_until) > new Date();

  const handleSuspend = async (u: UserRow) => {
    const days = suspendDays[u.user_id] ?? 7;
    setBusy(u.user_id);
    try {
      await callAction({ type: "suspend", target_user_id: u.user_id, days });
      toast({ title: `Suspendu ${days} jour(s) ✓` });
      onChanged();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleUnsuspend = async (u: UserRow) => {
    setBusy(u.user_id);
    try {
      await callAction({ type: "unsuspend", target_user_id: u.user_id });
      toast({ title: "Réactivé ✓" });
      onChanged();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleForceVerify = async (u: UserRow) => {
    setBusy(u.user_id);
    try {
      await callAction({ type: "force_verify", target_user_id: u.user_id });
      toast({ title: "Vérification forcée ✓" });
      onChanged();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(confirmDelete.user_id);
    try {
      await callAction({
        type: "delete",
        target_user_id: confirmDelete.user_id,
        confirm_display_name: confirmText,
      });
      toast({ title: "Compte supprimé ✓" });
      setConfirmDelete(null);
      setConfirmText("");
      onChanged();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par pseudo, ville, université…"
        className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      <p className="text-xs text-muted-foreground">{filtered.length} utilisateur(s)</p>

      <div className="space-y-3">
        {filtered.map((u) => {
          const suspended = isSuspended(u);
          return (
            <div key={u.user_id} className={`rounded-2xl border bg-card p-4 ${suspended ? "border-destructive/40" : "border-border"}`}>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{u.display_name ?? "—"}</span>
                    {suspended && (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">
                        🚫 Suspendu
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {u.city ?? "—"} · {u.university ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.status} · {u.is_verified ? "Vérifié" : "Non vérifié"} · {u.points_social} pts
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!suspended ? (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={suspendDays[u.user_id] ?? 7}
                      onChange={(e) => setSuspendDays((p) => ({ ...p, [u.user_id]: Number(e.target.value) }))}
                      className="w-16 rounded-xl border border-border bg-background px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() => handleSuspend(u)}
                      disabled={busy === u.user_id}
                      className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    >
                      <Pause className="h-3 w-3" /> Suspendre
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleUnsuspend(u)}
                    disabled={busy === u.user_id}
                    className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" /> Réactiver
                  </button>
                )}
                {!u.is_verified && (
                  <button
                    onClick={() => handleForceVerify(u)}
                    disabled={busy === u.user_id}
                    className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="h-3 w-3" /> Forcer vérification
                  </button>
                )}
                <button
                  onClick={() => { setConfirmDelete(u); setConfirmText(""); }}
                  disabled={busy === u.user_id}
                  className="ml-auto flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" /> Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setConfirmDelete(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-destructive/40 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="text-base font-extrabold text-destructive">Suppression définitive</h3>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-sm text-foreground">
              Tu vas supprimer <span className="font-bold">{confirmDelete.display_name ?? confirmDelete.user_id.slice(0, 8)}</span> et toutes ses données. <span className="font-bold text-destructive">Cette action est irréversible.</span>
            </p>
            <p className="mb-2 text-xs text-muted-foreground">
              Pour confirmer, tape exactement le pseudo : <span className="font-mono font-bold text-foreground">{confirmDelete.display_name}</span>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tape le pseudo ici"
              className="mb-4 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-2xl border border-border bg-secondary py-2.5 text-sm font-bold text-foreground hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={busy === confirmDelete.user_id || confirmText.trim().toLowerCase() !== (confirmDelete.display_name ?? "").trim().toLowerCase()}
                className="flex-1 flex items-center justify-center gap-1 rounded-2xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {busy === confirmDelete.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

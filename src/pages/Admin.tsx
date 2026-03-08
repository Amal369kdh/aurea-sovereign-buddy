import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, Crown, Handshake, Link2, Trophy, Zap, GraduationCap,
  ArrowLeft, Loader2, Trash2, Plus, ShieldCheck, ToggleLeft, ToggleRight,
  RefreshCw, Save, AlertTriangle, Shield, Pin,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey =
  | "overview"
  | "users"
  | "premium"
  | "partners"
  | "resources"
  | "league"
  | "features"
  | "domains"
  | "moderation";

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
};

type FeatureFlag = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
};

type Partner = {
  id: string;
  name: string;
  type: string;
  offer: string | null;
  is_active: boolean;
};

type AllowedDomain = {
  id: string;
  domain: string;
  university_name: string | null;
};

type ResourceRow = {
  id: string;
  title: string;
  url: string;
  category: string;
  is_verified: boolean;
  created_at: string;
};

type UniversityLeague = {
  university: string;
  total_points: number;
  member_count: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-3xl border border-border bg-card p-5">
    <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
    {children}
  </div>
);

const KpiCard = ({ label, value, icon }: { label: string; value: string | number; icon: string }) => (
  <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-5">
    <span className="text-2xl">{icon}</span>
    <span className="text-2xl font-extrabold text-foreground">{value}</span>
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    admin: "bg-red-500/15 text-red-400 border-red-500/30",
    temoin: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    explorateur: "bg-secondary text-muted-foreground border-border",
    gold: "bg-primary/15 text-primary border-primary/30",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${map[status] ?? map.explorateur}`}>
      {status}
    </span>
  );
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Vue générale", icon: LayoutDashboard },
  { key: "users", label: "Utilisateurs", icon: Users },
  { key: "premium", label: "Premium", icon: Crown },
  { key: "partners", label: "Partenaires", icon: Handshake },
  { key: "resources", label: "Ressources", icon: Link2 },
  { key: "league", label: "Ligue des Facs", icon: Trophy },
  { key: "features", label: "Fonctionnalités", icon: Zap },
  { key: "domains", label: "Domaines", icon: GraduationCap },
];

// ─── Main component ───────────────────────────────────────────────────────────

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Data states
  const [kpi, setKpi] = useState({ total: 0, newWeek: 0, verified: 0, premiumRevenue: 0 });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [league, setLeague] = useState<UniversityLeague[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newPartner, setNewPartner] = useState({ name: "", type: "bank", offer: "" });
  const [newDomain, setNewDomain] = useState({ domain: "", university_name: "" });
  const [newResource, setNewResource] = useState({ title: "", url: "", category: "social" });

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      });
  }, [user]);

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [profilesRes, newUsersRes, verifiedRes, premiumRes, featuresRes, partnersRes, domainsRes, resourcesRes] =
      await Promise.all([
        supabase.from("profiles").select("user_id, display_name, city, university, status, is_premium, is_verified, points_social, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("is_premium", true),
        supabase.from("feature_flags").select("*").order("key"),
        supabase.from("partners").select("*").order("name"),
        supabase.from("allowed_domains").select("*").order("domain"),
        supabase.from("resources_links").select("id, title, url, category, is_verified, created_at").order("created_at", { ascending: false }).limit(50),
      ]);

    if (profilesRes.data) setUsers(profilesRes.data as UserRow[]);
    if (featuresRes.data) setFeatures(featuresRes.data as FeatureFlag[]);
    if (partnersRes.data) setPartners(partnersRes.data as Partner[]);
    if (domainsRes.data) setDomains(domainsRes.data as AllowedDomain[]);
    if (resourcesRes.data) setResources(resourcesRes.data as ResourceRow[]);

    // Build league from profiles
    if (profilesRes.data) {
      const map: Record<string, { total: number; count: number }> = {};
      for (const p of profilesRes.data) {
        if (!p.university) continue;
        if (!map[p.university]) map[p.university] = { total: 0, count: 0 };
        map[p.university].total += p.points_social ?? 0;
        map[p.university].count += 1;
      }
      const sorted = Object.entries(map)
        .map(([university, v]) => ({ university, total_points: v.total, member_count: v.count }))
        .sort((a, b) => b.total_points - a.total_points);
      setLeague(sorted);
    }

    setKpi({
      total: profilesRes.data?.length ?? 0,
      newWeek: newUsersRes.count ?? 0,
      verified: verifiedRes.count ?? 0,
      premiumRevenue: (premiumRes.count ?? 0) * 9,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const setUserStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Statut mis à jour" }); fetchAll(); }
  };

  const setPremium = async (userId: string, is_premium: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_premium }).eq("user_id", userId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: is_premium ? "Premium activé ✓" : "Premium désactivé" }); fetchAll(); }
  };

  const toggleFeature = async (flag: FeatureFlag) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled: !flag.enabled, updated_at: new Date().toISOString() })
      .eq("id", flag.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setFeatures((prev) => prev.map((f) => (f.id === flag.id ? { ...f, enabled: !f.enabled } : f)));
      toast({ title: `${flag.label} ${!flag.enabled ? "activé" : "désactivé"}` });
    }
  };

  const addPartner = async () => {
    if (!newPartner.name.trim()) return;
    const { error } = await supabase.from("partners").insert({ ...newPartner, offer: newPartner.offer || null });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Partenaire ajouté ✓" }); setNewPartner({ name: "", type: "bank", offer: "" }); fetchAll(); }
  };

  const deletePartner = async (id: string) => {
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Partenaire supprimé" }); fetchAll(); }
  };

  const addDomain = async () => {
    if (!newDomain.domain.trim()) return;
    const { error } = await supabase.from("allowed_domains").insert({ ...newDomain, university_name: newDomain.university_name || null });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Domaine ajouté ✓" }); setNewDomain({ domain: "", university_name: "" }); fetchAll(); }
  };

  const deleteDomain = async (id: string) => {
    const { error } = await supabase.from("allowed_domains").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Domaine supprimé" }); fetchAll(); }
  };

  const addResource = async () => {
    if (!newResource.title.trim() || !newResource.url.trim()) return;
    const { error } = await supabase.from("resources_links").insert([{ 
      title: newResource.title, 
      url: newResource.url,
      category: newResource.category as "social" | "jobs" | "alternance" | "sante" | "reorientation",
      created_by: user!.id 
    }]);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Ressource ajoutée ✓" }); setNewResource({ title: "", url: "", category: "social" }); fetchAll(); }
  };

  const deleteResource = async (id: string) => {
    const { error } = await supabase.from("resources_links").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Ressource supprimée" }); fetchAll(); }
  };

  const resetLeague = async () => {
    const { error } = await supabase.from("profiles").update({ points_social: 0 }).neq("user_id", "00000000-0000-0000-0000-000000000000");
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Ligue réinitialisée ✓" }); fetchAll(); }
  };

  // ─── Gate checks ─────────────────────────────────────────────────────────

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-bold text-foreground">Accès refusé</p>
        <p className="text-sm text-muted-foreground">Tu n'as pas les droits administrateur.</p>
        <button onClick={() => navigate("/")} className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
          Retour au dashboard
        </button>
      </div>
    );
  }

  // ─── Tab content renderers ────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Utilisateurs total" value={kpi.total} icon="👥" />
        <KpiCard label="Nouveaux cette semaine" value={kpi.newWeek} icon="🆕" />
        <KpiCard label="Témoins vérifiés" value={kpi.verified} icon="✅" />
        <KpiCard label="Revenus estimés (€/mois)" value={`${kpi.premiumRevenue} €`} icon="💰" />
      </div>
      <Section title="Répartition des statuts">
        {(["explorateur", "temoin", "gold", "admin"] as const).map((s) => {
          const count = users.filter((u) => u.status === s).length;
          const pct = kpi.total > 0 ? Math.round((count / kpi.total) * 100) : 0;
          return (
            <div key={s} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold text-foreground capitalize">{s}</span>
                <span className="text-muted-foreground">{count} ({pct}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full gold-gradient transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.user_id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{u.display_name ?? "—"}</span>
                {u.is_verified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                {u.is_premium && <Crown className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {u.city ?? "—"} · {u.university ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString("fr-FR")} · {u.points_social} pts
              </p>
            </div>
            <StatusBadge status={u.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["explorateur", "temoin", "admin"].map((s) => (
              <button
                key={s}
                onClick={() => setUserStatus(u.user_id, s)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  u.status === s
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setPremium(u.user_id, !u.is_premium)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                u.is_premium
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {u.is_premium ? "✓ Premium" : "+ Premium"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPremium = () => {
    const premiumUsers = users.filter((u) => u.is_premium);
    return (
      <div className="space-y-4">
        <Section title="Utilisateurs premium actifs">
          {premiumUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun utilisateur premium.</p>
          )}
          {premiumUsers.map((u) => (
            <div key={u.user_id} className="mb-3 flex items-center justify-between last:mb-0">
              <div>
                <p className="text-sm font-bold text-foreground">{u.display_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{u.city ?? "—"}</p>
              </div>
              <button
                onClick={() => setPremium(u.user_id, false)}
                className="rounded-full border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                Révoquer
              </button>
            </div>
          ))}
        </Section>
        <Section title="Offrir le premium">
          <p className="mb-3 text-xs text-muted-foreground">
            Sélectionne un utilisateur dans l'onglet Utilisateurs et clique "+ Premium" pour lui offrir l'accès gratuitement.
          </p>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            💡 {premiumUsers.length} utilisateur(s) premium · ~{premiumUsers.length * 9} € de revenus estimés/mois
          </div>
        </Section>
      </div>
    );
  };

  const renderPartners = () => (
    <div className="space-y-4">
      <Section title="Partenaires actifs">
        {partners.length === 0 && <p className="text-sm text-muted-foreground">Aucun partenaire.</p>}
        {partners.map((p) => (
          <div key={p.id} className="mb-3 flex items-center justify-between last:mb-0">
            <div>
              <p className="text-sm font-bold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.type} · {p.offer ?? "—"}</p>
            </div>
            <button onClick={() => deletePartner(p.id)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </Section>
      <Section title="Ajouter un partenaire">
        <div className="space-y-3">
          <input className={inputCls} placeholder="Nom du partenaire" value={newPartner.name} onChange={(e) => setNewPartner((p) => ({ ...p, name: e.target.value }))} />
          <select className={inputCls} value={newPartner.type} onChange={(e) => setNewPartner((p) => ({ ...p, type: e.target.value }))}>
            <option value="bank">🏦 Banque</option>
            <option value="insurance">🛡️ Assurance</option>
            <option value="housing">🏠 Logement</option>
            <option value="other">📦 Autre</option>
          </select>
          <input className={inputCls} placeholder="Offre associée (ex: Compte gratuit 3 mois)" value={newPartner.offer} onChange={(e) => setNewPartner((p) => ({ ...p, offer: e.target.value }))} />
          <button onClick={addPartner} className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> Ajouter le partenaire
          </button>
        </div>
      </Section>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-4">
      <Section title="Ressources existantes">
        {resources.length === 0 && <p className="text-sm text-muted-foreground">Aucune ressource.</p>}
        {resources.map((r) => (
          <div key={r.id} className="mb-3 flex items-start justify-between gap-3 last:mb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{r.title}</p>
              <p className="truncate text-xs text-muted-foreground">{r.url}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${r.is_verified ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                {r.is_verified ? "✓ Vérifié" : r.category}
              </span>
            </div>
            <button onClick={() => deleteResource(r.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </Section>
      <Section title="Ajouter une ressource">
        <div className="space-y-3">
          <input className={inputCls} placeholder="Titre" value={newResource.title} onChange={(e) => setNewResource((r) => ({ ...r, title: e.target.value }))} />
          <input className={inputCls} placeholder="URL (https://…)" value={newResource.url} onChange={(e) => setNewResource((r) => ({ ...r, url: e.target.value }))} />
          <select className={inputCls} value={newResource.category} onChange={(e) => setNewResource((r) => ({ ...r, category: e.target.value }))}>
            <option value="social">Social</option>
            <option value="jobs">Emploi</option>
            <option value="alternance">Alternance</option>
            <option value="sante">Santé</option>
            <option value="reorientation">Réorientation</option>
          </select>
          <button onClick={addResource} className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> Ajouter la ressource
          </button>
        </div>
      </Section>
    </div>
  );

  const renderLeague = () => (
    <div className="space-y-4">
      <Section title="Classement des universités">
        {league.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée.</p>}
        {league.map((l, i) => (
          <div key={l.university} className="mb-3 flex items-center gap-3 last:mb-0">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${i === 0 ? "gold-gradient text-primary-foreground" : i === 1 ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{l.university}</p>
              <p className="text-xs text-muted-foreground">{l.member_count} membre(s)</p>
            </div>
            <span className="font-extrabold text-primary">{l.total_points} pts</span>
          </div>
        ))}
      </Section>
      <button
        onClick={resetLeague}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Réinitialiser la saison (reset tous les points)
      </button>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Ces toggles activent ou désactivent des fonctionnalités sans modifier le code. Utile pour déployer V2 et V3 progressivement.
      </p>
      {features.map((flag) => (
        <div key={flag.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-bold text-foreground">{flag.label}</p>
            {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
          </div>
          <button
            onClick={() => toggleFeature(flag)}
            className="flex items-center gap-2 transition-colors"
            aria-label={`Toggle ${flag.label}`}
          >
            {flag.enabled ? (
              <ToggleRight className="h-8 w-8 text-primary" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-muted-foreground" />
            )}
            <span className={`text-xs font-bold ${flag.enabled ? "text-primary" : "text-muted-foreground"}`}>
              {flag.enabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      ))}
    </div>
  );

  const renderDomains = () => (
    <div className="space-y-4">
      <Section title="Domaines autorisés pour badge Témoin">
        {domains.length === 0 && <p className="text-sm text-muted-foreground">Aucun domaine.</p>}
        {domains.map((d) => (
          <div key={d.id} className="mb-3 flex items-center justify-between last:mb-0">
            <div>
              <p className="text-sm font-mono font-bold text-foreground">@{d.domain}</p>
              <p className="text-xs text-muted-foreground">{d.university_name ?? "—"}</p>
            </div>
            <button onClick={() => deleteDomain(d.id)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </Section>
      <Section title="Ajouter un domaine">
        <div className="space-y-3">
          <input className={inputCls} placeholder="Domaine (ex: etu.univ-paris.fr)" value={newDomain.domain} onChange={(e) => setNewDomain((d) => ({ ...d, domain: e.target.value }))} />
          <input className={inputCls} placeholder="Nom de l'université (optionnel)" value={newDomain.university_name} onChange={(e) => setNewDomain((d) => ({ ...d, university_name: e.target.value }))} />
          <button onClick={addDomain} className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> Ajouter le domaine
          </button>
        </div>
      </Section>
    </div>
  );

  const RENDERERS: Record<TabKey, () => React.ReactNode> = {
    overview: renderOverview,
    users: renderUsers,
    premium: renderPremium,
    partners: renderPartners,
    resources: renderResources,
    league: renderLeague,
    features: renderFeatures,
    domains: renderDomains,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-lg">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold gold-text">Admin</span>
          <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">Panel</span>
        </div>
        <button onClick={fetchAll} className="ml-auto flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-muted-foreground hover:bg-accent transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="overflow-x-auto border-b border-border bg-background/90 backdrop-blur-lg sticky top-[61px] z-10">
        <div className="flex min-w-max gap-1 px-4 py-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                tab === key
                  ? "gold-gradient text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {RENDERERS[tab]()}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;

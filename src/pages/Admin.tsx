import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, Crown, Handshake, Link2, Trophy, Zap, GraduationCap,
  ArrowLeft, Loader2, Trash2, Plus, ShieldCheck, ToggleLeft, ToggleRight,
  RefreshCw, Save, AlertTriangle, Shield, Pin, MapPin,
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
  | "moderation"
  | "city_resources";

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
  url: string | null;
  is_active: boolean;
  click_count?: number;
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

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_announcement_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reported_display_name?: string | null;
};

type PinnedAnnouncement = {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
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
  { key: "moderation", label: "Modération", icon: Shield },
  { key: "premium", label: "Premium", icon: Crown },
  { key: "partners", label: "Partenaires", icon: Handshake },
  { key: "resources", label: "Ressources", icon: Link2 },
  { key: "league", label: "Ligue des Facs", icon: Trophy },
  { key: "features", label: "Fonctionnalités", icon: Zap },
  { key: "domains", label: "Domaines", icon: GraduationCap },
  { key: "city_resources", label: "Ressources Ville", icon: MapPin },
];

// ─── Main component ───────────────────────────────────────────────────────────

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Data states
  const [kpi, setKpi] = useState({ total: 0, newWeek: 0, verified: 0, premiumRevenue: 0, ayaMsgToday: 0, postsToday: 0, verifiedRate: 0, premiumCount: 0 });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [league, setLeague] = useState<UniversityLeague[]>([]);
  const [loading, setLoading] = useState(true);

  // Moderation states
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<PinnedAnnouncement[]>([]);
  const [newPinnedContent, setNewPinnedContent] = useState("");
  const [publishingPinned, setPublishingPinned] = useState(false);

  // City resources states
  const [cityResourcesCache, setCityResourcesCache] = useState<{ city: string; last_updated_at: string }[]>([]);
  const [refreshingCity, setRefreshingCity] = useState<string | null>(null);

  // Form states
  const [newPartner, setNewPartner] = useState({ name: "", type: "bank", offer: "", url: "" });
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
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [profilesRes, newUsersRes, verifiedRes, premiumRes, featuresRes, partnersRes, domainsRes, resourcesRes, reportsRes, pinnedRes, ayaTodayRes, postsTodayRes] =
      await Promise.all([
        supabase.from("profiles").select("user_id, display_name, city, university, status, is_premium, is_verified, points_social, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("is_premium", true),
        supabase.from("feature_flags").select("*").order("key"),
        supabase.from("partners").select("*").order("name"),
        supabase.from("allowed_domains").select("*").order("domain"),
        supabase.from("resources_links").select("id, title, url, category, is_verified, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("reports").select("id, reporter_id, reported_user_id, reported_announcement_id, reason, details, status, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
        supabase.from("announcements").select("id, content, created_at, likes_count").eq("is_pinned", true).order("created_at", { ascending: false }),
        supabase.from("profiles").select("aya_messages_used").gt("aya_messages_used", 0),
        supabase.from("announcements").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      ]);

    if (profilesRes.data) setUsers(profilesRes.data as UserRow[]);
    if (featuresRes.data) setFeatures(featuresRes.data as FeatureFlag[]);
    if (partnersRes.data) setPartners(partnersRes.data as Partner[]);
    if (domainsRes.data) setDomains(domainsRes.data as AllowedDomain[]);
    if (resourcesRes.data) setResources(resourcesRes.data as ResourceRow[]);
    if (reportsRes.data) {
      const enriched = reportsRes.data.map((r) => ({
        ...r,
        reported_display_name: users.find((u) => u.user_id === r.reported_user_id)?.display_name ?? r.reported_user_id?.slice(0, 8) ?? "—",
      }));
      setReports(enriched as ReportRow[]);
    }
    if (pinnedRes.data) setPinnedAnnouncements(pinnedRes.data as PinnedAnnouncement[]);

    // Fetch city resources cache metadata
    const { data: cityData } = await (supabase as any)
      .from("city_resources_cache")
      .select("city, last_updated_at")
      .order("city");
    if (cityData) setCityResourcesCache(cityData as { city: string; last_updated_at: string }[]);

    // Build league from profiles
    if (profilesRes.data) {
      const leagueMap: Record<string, { total: number; count: number }> = {};
      for (const p of profilesRes.data) {
        if (!p.university) continue;
        if (!leagueMap[p.university]) leagueMap[p.university] = { total: 0, count: 0 };
        leagueMap[p.university].total += p.points_social ?? 0;
        leagueMap[p.university].count += 1;
      }
      const sorted = Object.entries(leagueMap)
        .map(([university, v]) => ({ university, total_points: v.total, member_count: v.count }))
        .sort((a, b) => b.total_points - a.total_points);
      setLeague(sorted);
    }

    const totalUsers = profilesRes.data?.length ?? 0;
    const verifiedCount = verifiedRes.count ?? 0;
    const premiumCount = premiumRes.count ?? 0;
    const ayaMsgToday = ayaTodayRes.data?.reduce((sum, p) => sum + (p.aya_messages_used ?? 0), 0) ?? 0;
    const verifiedRate = totalUsers > 0 ? Math.round((verifiedCount / totalUsers) * 100) : 0;

    setKpi({
      total: totalUsers,
      newWeek: newUsersRes.count ?? 0,
      verified: verifiedCount,
      premiumRevenue: premiumCount * 9,
      ayaMsgToday,
      postsToday: postsTodayRes.count ?? 0,
      verifiedRate,
      premiumCount,
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

  const warnUser = async (reportId: string, reportedUserId: string | null) => {
    if (!reportedUserId) return;
    await supabase.from("reports").update({ status: "warned" }).eq("id", reportId);
    toast({ title: "Avertissement envoyé", description: "Le signalement est marqué comme traité." });
    fetchAll();
  };

  const suspendUser = async (reportId: string, reportedUserId: string | null) => {
    if (!reportedUserId) return;
    const suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const [suspendRes, reportRes] = await Promise.all([
      supabase.from("profiles").update({ suspended_until: suspendedUntil } as any).eq("user_id", reportedUserId),
      supabase.from("reports").update({ status: "suspended" }).eq("id", reportId),
    ]);
    if (suspendRes.error) {
      toast({ title: "Erreur", description: suspendRes.error.message, variant: "destructive" });
    } else {
      toast({ title: "Utilisateur suspendu 7 jours ✓" });
      fetchAll();
    }
  };

  const publishPinned = async () => {
    if (!newPinnedContent.trim() || !user) return;
    setPublishingPinned(true);
    const { error } = await supabase.from("announcements").insert({
      content: newPinnedContent.trim(),
      author_id: user.id,
      is_pinned: true,
      category: "general" as const,
    });
    setPublishingPinned(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Annonce épinglée publiée ✓" }); setNewPinnedContent(""); fetchAll(); }
  };

  const deletePinned = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Annonce supprimée" }); fetchAll(); }
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

  const renderOverview = () => {
    // Calcul des utilisateurs avec ≥5 signalements (depuis les reports déjà chargés)
    const reportCountByUser = reports.reduce<Record<string, number>>((acc, r) => {
      if (r.reported_user_id) {
        acc[r.reported_user_id] = (acc[r.reported_user_id] ?? 0) + 1;
      }
      return acc;
    }, {});
    const flaggedUsers = Object.entries(reportCountByUser)
      .filter(([, count]) => count >= 5)
      .map(([userId, count]) => ({
        userId,
        count,
        displayName: users.find((u) => u.user_id === userId)?.display_name ?? userId.slice(0, 8),
      }));

    return (
      <div className="space-y-4">
        {/* Alerte utilisateurs très signalés */}
        {flaggedUsers.length > 0 && (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">
                {flaggedUsers.length} utilisateur{flaggedUsers.length > 1 ? "s" : ""} avec ≥5 signalements
              </span>
            </div>
            <div className="space-y-2">
              {flaggedUsers.map(({ userId, count, displayName }) => (
                <div key={userId} className="flex items-center justify-between rounded-2xl bg-destructive/10 px-4 py-2">
                  <span className="text-sm font-semibold text-foreground">{displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-xs font-bold text-destructive">
                      {count} signalements
                    </span>
                    <button
                      onClick={() => setTab("moderation")}
                      className="rounded-xl border border-destructive/30 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Gérer →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Inscrits total" value={kpi.total} icon="👥" />
          <KpiCard label="Nouveaux / semaine" value={`+${kpi.newWeek}`} icon="🆕" />
          <KpiCard label="Témoins vérifiés" value={`${kpi.verified} (${kpi.verifiedRate}%)`} icon="✅" />
          <KpiCard label="Premium actifs" value={`${kpi.premiumCount} · ${kpi.premiumRevenue} €/mois`} icon="💰" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <KpiCard label="Publications aujourd'hui" value={kpi.postsToday} icon="📝" />
          <KpiCard label="Messages Amal (total)" value={kpi.ayaMsgToday} icon="🤖" />
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
  };

  const renderUsers = () => (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.user_id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{u.display_name ?? "—"}</span>
                {u.is_verified && <ShieldCheck className="h-4 w-4 text-success" />}
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

  const renderCityResources = () => {
    const SUPPORTED_CITIES = ["grenoble"];
    return (
      <div className="space-y-4">
        <Section title="Cache ressources par ville">
          <p className="mb-4 text-xs text-muted-foreground">
            Les ressources ville sont générées via IA une seule fois puis sauvegardées. Utilise le bouton ci-dessous pour forcer une mise à jour manuelle depuis l'IA.
          </p>
          {SUPPORTED_CITIES.map((city) => {
            const cached = cityResourcesCache.find((c) => c.city === city);
            return (
              <div key={city} className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground capitalize">{city}</p>
                  <p className="text-xs text-muted-foreground">
                    {cached
                      ? `Dernière mise à jour : ${new Date(cached.last_updated_at).toLocaleString("fr-FR")}`
                      : "Pas encore généré"}
                  </p>
                </div>
                <button
                  disabled={refreshingCity === city}
                  onClick={async () => {
                    setRefreshingCity(city);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/city-resources`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session?.access_token}`,
                            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                          },
                          body: JSON.stringify({ city, force_refresh: true }),
                        }
                      );
                      toast({ title: `Ressources ${city} mises à jour ✓` });
                      fetchAll();
                    } catch {
                      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
                    } finally {
                      setRefreshingCity(null);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refreshingCity === city ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Forcer la mise à jour
                </button>
              </div>
            );
          })}
        </Section>
      </div>
    );
  };

  const renderModeration = () => (
    <div className="space-y-5">
      {/* Section 1: Signalements */}
      <Section title={`Signalements en attente (${reports.length})`}>
        {reports.length === 0 && <p className="text-sm text-muted-foreground">Aucun signalement en attente.</p>}
        {reports.map((r) => (
          <div key={r.id} className="mb-4 rounded-2xl border border-border bg-secondary/40 p-4 last:mb-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">
                  {r.reported_user_id ? `Utilisateur : ${r.reported_display_name}` : "Annonce signalée"}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-destructive">{r.reason}</p>
                {r.details && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.details}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => warnUser(r.id, r.reported_user_id)}
                className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-bold text-warning hover:bg-warning/20 transition-colors"
              >
                ⚠️ Avertir
              </button>
              <button
                onClick={() => suspendUser(r.id, r.reported_user_id)}
                disabled={!r.reported_user_id}
                className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-40"
              >
                🚫 Suspendre 7 jours
              </button>
            </div>
          </div>
        ))}
      </Section>

      {/* Section 2: Publier une annonce épinglée */}
      <Section title="Publier une annonce épinglée">
        <div className="space-y-3">
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            placeholder="Texte de l'annonce importante à épingler pour tous les utilisateurs…"
            value={newPinnedContent}
            onChange={(e) => setNewPinnedContent(e.target.value)}
          />
          <button
            onClick={publishPinned}
            disabled={!newPinnedContent.trim() || publishingPinned}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {publishingPinned ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />}
            Publier l'annonce épinglée
          </button>
        </div>
      </Section>

      {/* Section 3: Annonces épinglées actives */}
      <Section title={`Annonces épinglées actives (${pinnedAnnouncements.length})`}>
        {pinnedAnnouncements.length === 0 && <p className="text-sm text-muted-foreground">Aucune annonce épinglée.</p>}
        {pinnedAnnouncements.map((a) => (
          <div key={a.id} className="mb-3 flex items-start justify-between gap-3 last:mb-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground line-clamp-2">{a.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString("fr-FR")} · {a.likes_count} ❤️
              </p>
            </div>
            <button
              onClick={() => deletePinned(a.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </Section>
    </div>
  );

  const RENDERERS: Record<TabKey, () => React.ReactNode> = {
    overview: renderOverview,
    users: renderUsers,
    moderation: renderModeration,
    premium: renderPremium,
    partners: renderPartners,
    resources: renderResources,
    league: renderLeague,
    features: renderFeatures,
    domains: renderDomains,
    city_resources: renderCityResources,
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ShieldCheck, Save, Heart, Sparkles } from "lucide-react";
import DeleteAccountButton from "@/components/DeleteAccountButton";

const NATIONALITIES = [
  "🇫🇷 Française",
  "🇲🇦 Marocaine", "🇹🇳 Tunisienne", "🇩🇿 Algérienne", "🇸🇳 Sénégalaise",
  "🇨🇮 Ivoirienne", "🇨🇲 Camerounaise", "🇬🇦 Gabonaise", "🇨🇬 Congolaise",
  "🇲🇱 Malienne", "🇧🇫 Burkinabè", "🇹🇬 Togolaise", "🇧🇯 Béninoise",
  "🇲🇬 Malgache", "🇲🇷 Mauritanienne", "🇹🇩 Tchadienne", "Autre",
];

const VISA_TYPES = [
  "Visa étudiant (VLS-TS)",
  "Titre de séjour étudiant",
  "Passeport talent",
  "Visa de long séjour",
  "Autre",
];

const LOGEMENT_OPTIONS = [
  { value: "crous", label: "🏢 Résidence CROUS" },
  { value: "prive", label: "🏠 Logement privé" },
  { value: "famille", label: "👨‍👩‍👧 Chez la famille" },
  { value: "colocation", label: "🤝 Colocation" },
  { value: "cherche", label: "🔍 En recherche" },
];

const OBJECTIFS_LIST = [
  { id: "diplome", label: "🎓 Obtenir mon diplôme" },
  { id: "job", label: "💼 Trouver un job/stage" },
  { id: "reseau", label: "🤝 Développer mon réseau" },
  { id: "papiers", label: "📄 Régulariser mes papiers" },
  { id: "logement", label: "🏠 Trouver un logement" },
  { id: "sante", label: "🏥 M'occuper de ma santé" },
];

const TYPES_FORMATION = [
  "Licence (L1/L2/L3)", "Master (M1/M2)", "Doctorat (PhD)",
  "BUT / Bachelor", "BTS", "Classe préparatoire (CPGE)",
  "École d'ingénieurs", "École de commerce", "Formation professionnelle", "Autre",
];

const DIPLOMES_VISES = [
  "Bac+3 (Licence, Bachelor)", "Bac+4 (Master 1)",
  "Bac+5 (Master 2, Ingénieur, Grande École)", "Bac+8 (Doctorat)",
  "BTS / BUT", "Certificat professionnel", "Autre",
];

type ProfileData = {
  display_name: string;
  city: string;
  university: string;
  university_id: string | null;
  nationality: string;
  visa_type: string;
  logement_situation: string;
  mutuelle: boolean;
  budget_monthly: number | null;
  revenus_monthly: number | null;
  objectifs: string[];
  is_verified: boolean;
  points_social: number;
  status: string;
  avatar_initials: string;
  faculte: string;
  type_formation: string;
  diplome_vise: string;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-3xl border border-border bg-card p-5">
    <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
    {children}
  </div>
);

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4 last:mb-0">
    <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
    {children}
  </div>
);

const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

const selectClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer";

type DatingProfileData = {
  id: string;
  bio: string | null;
  looking_for: string;
  show_me: string;
  is_active: boolean;
};

const lookingForLabels: Record<string, string> = {
  amitie: "🤝 Amitié",
  relation: "❤️ Relation",
  les_deux: "💫 Les deux",
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [universities, setUniversities] = useState<{ id: string; name: string; city: string }[]>([]);
  const [datingProfile, setDatingProfile] = useState<DatingProfileData | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    city: "",
    university: "",
    university_id: null,
    nationality: "",
    visa_type: "",
    logement_situation: "",
    mutuelle: false,
    budget_monthly: null,
    revenus_monthly: null,
    objectifs: [],
    is_verified: false,
    points_social: 0,
    status: "explorateur",
    avatar_initials: "?",
    faculte: "",
    type_formation: "",
    diplome_vise: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [profileRes, univRes, datingRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "display_name, city, university, university_id, nationality, visa_type, logement_situation, mutuelle, budget_monthly, revenus_monthly, objectifs, is_verified, points_social, status, avatar_initials, faculte, type_formation, diplome_vise"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("universities").select("id, name, city").order("name"),
        supabase.from("dating_profiles").select("id, bio, looking_for, show_me, is_active").eq("user_id", user.id).maybeSingle(),
      ]);

      if (univRes.data) setUniversities(univRes.data);
      if (datingRes.data) setDatingProfile(datingRes.data as DatingProfileData);

      if (profileRes.data) {
        const d = profileRes.data as any;
        setProfile({
          display_name: d.display_name ?? "",
          city: d.city ?? "",
          university: d.university ?? "",
          university_id: d.university_id ?? null,
          nationality: d.nationality ?? "",
          visa_type: d.visa_type ?? "",
          logement_situation: d.logement_situation ?? "",
          mutuelle: d.mutuelle ?? false,
          budget_monthly: d.budget_monthly ?? null,
          revenus_monthly: d.revenus_monthly ?? null,
          objectifs: (d.objectifs as string[]) ?? [],
          is_verified: d.is_verified ?? false,
          points_social: d.points_social ?? 0,
          status: d.status ?? "explorateur",
          avatar_initials: d.avatar_initials ?? "?",
          faculte: d.faculte ?? "",
          type_formation: d.type_formation ?? "",
          diplome_vise: d.diplome_vise ?? "",
        });
      }
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const toggleObjectif = (id: string) =>
    setProfile((prev) => ({
      ...prev,
      objectifs: prev.objectifs.includes(id)
        ? prev.objectifs.filter((o) => o !== id)
        : [...prev.objectifs, id],
    }));

  const handleUniversityChange = (name: string) => {
    const found = universities.find((u) => u.name === name);
    setProfile((prev) => ({
      ...prev,
      university: name,
      university_id: found?.id ?? null,
    }));
  };


  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const initials = profile.display_name.trim().slice(0, 2).toUpperCase() || "?";
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        avatar_initials: initials,
        city: profile.city,
        university: profile.university,
        university_id: profile.university_id,
        nationality: profile.nationality,
        visa_type: profile.visa_type || null,
        logement_situation: profile.logement_situation || null,
        mutuelle: profile.mutuelle,
        budget_monthly: profile.budget_monthly,
        revenus_monthly: profile.revenus_monthly,
        objectifs: profile.objectifs,
        faculte: (profile.faculte as any) || null,
        type_formation: (profile.type_formation as any) || null,
        diplome_vise: (profile.diplome_vise as any) || null,
      } as any)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil sauvegardé ✓", description: "Tes informations ont été mises à jour." });
    }
  };


  const isFrench = profile.nationality === "🇫🇷 Française";

  const statusLabel: Record<string, string> = {
    explorateur: "Explorateur",
    temoin: "Témoin",
    gold: "Gold",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-bold text-foreground">Mon Profil</span>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        {/* ── Header avatar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card py-7"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full gold-gradient text-2xl font-extrabold text-primary-foreground shadow-lg">
            {profile.avatar_initials}
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-lg font-extrabold text-foreground">{profile.display_name || "—"}</p>
          <div className="flex items-center gap-2">
              {(profile.status === "temoin" || profile.status === "admin" || profile.is_verified) ? (
                <span className="flex items-center gap-1 rounded-full bg-success/15 px-3 py-0.5 text-xs font-bold text-success">
                  <ShieldCheck className="h-3 w-3" />
                  {profile.status === "admin" ? "Admin" : "Témoin ✅"}
                </span>
              ) : (
                <span className="rounded-full border border-border bg-secondary px-3 py-0.5 text-xs font-semibold text-muted-foreground">
                  Explorateur
                </span>
              )}
              <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-semibold text-muted-foreground">
                ✦ {profile.points_social} pts
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Informations de base ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Section title="Informations de base">
            <FieldRow label="Prénom / Pseudo">
              <div className="relative">
                <input
                  className={`${inputClass} pr-10 bg-secondary/60 cursor-not-allowed text-muted-foreground`}
                  value={profile.display_name}
                  readOnly
                  disabled
                  placeholder="Ton prénom ou pseudo"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                  🔒
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <span>⚠️</span>
                <span>Le pseudo est définitif et ne peut pas être modifié.</span>
              </p>
            </FieldRow>
            <FieldRow label="Ville">
              <input
                className={inputClass}
                value={profile.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Ex: Paris"
              />
            </FieldRow>
            <FieldRow label="Université">
              <select
                className={selectClass}
                value={profile.university}
                onChange={(e) => handleUniversityChange(e.target.value)}
              >
                <option value="">— Sélectionne ton université —</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.city})
                  </option>
                ))}
                <option value="Autre">Autre / Non listée</option>
              </select>
            </FieldRow>
          </Section>
        </motion.div>

        {/* ── Mon profil ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section title="Mon profil">
            <FieldRow label="Nationalité">
              <select
                className={selectClass}
                value={profile.nationality}
                onChange={(e) => set("nationality", e.target.value)}
              >
                <option value="">— Sélectionne —</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </FieldRow>

            {!isFrench && (
              <FieldRow label="Type de visa">
                <select
                  className={selectClass}
                  value={profile.visa_type}
                  onChange={(e) => set("visa_type", e.target.value)}
                >
                  <option value="">— Sélectionne —</option>
                  {VISA_TYPES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FieldRow>
            )}

            <FieldRow label="Situation de logement">
              <select
                className={selectClass}
                value={profile.logement_situation}
                onChange={(e) => set("logement_situation", e.target.value)}
              >
                <option value="">— Sélectionne —</option>
                {LOGEMENT_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Mutuelle étudiante">
              <div className="flex gap-3">
                {[{ val: true, label: "✅ Oui" }, { val: false, label: "❌ Non" }].map(({ val, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set("mutuelle", val)}
                    className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all ${
                      profile.mutuelle === val
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FieldRow>
          </Section>
        </motion.div>

        {/* ── Finances ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Section title="Finances">
            <FieldRow label="Budget mensuel (€)">
              <input
                type="number"
                className={inputClass}
                value={profile.budget_monthly ?? ""}
                onChange={(e) => set("budget_monthly", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ex: 800"
                min={0}
              />
            </FieldRow>
            <FieldRow label="Revenus mensuels (€)">
              <input
                type="number"
                className={inputClass}
                value={profile.revenus_monthly ?? ""}
                onChange={(e) => set("revenus_monthly", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ex: 400"
                min={0}
              />
            </FieldRow>
          </Section>
        </motion.div>

        {/* ── Objectifs ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Section title="Mes objectifs">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OBJECTIFS_LIST.map((obj) => {
                const checked = profile.objectifs.includes(obj.id);
                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => toggleObjectif(obj.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition-all ${
                      checked
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                      checked ? "border-primary bg-primary" : "border-border"
                    }`}>
                      {checked && <span className="text-[10px] font-black text-primary-foreground">✓</span>}
                    </span>
                    {obj.label}
                  </button>
                );
              })}
            </div>
          </Section>
        </motion.div>

        {/* ── Save button ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-3xl gold-gradient py-4 text-base font-extrabold text-primary-foreground shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </motion.div>

        {/* ── Profil Rencontres ── */}
        {datingProfile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Section title="Profil Rencontres">
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3">
                  <Heart className="h-4 w-4 shrink-0 text-primary fill-primary" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">Je cherche</p>
                    <p className="text-xs text-muted-foreground">{lookingForLabels[datingProfile.looking_for] || datingProfile.looking_for}</p>
                  </div>
                  <span className={`rounded-xl px-3 py-1 text-xs font-bold ${datingProfile.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {datingProfile.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
                {datingProfile.bio && (
                  <div className="rounded-2xl bg-secondary/50 px-4 py-3">
                    <p className="text-xs font-semibold text-foreground mb-1">Bio</p>
                    <p className="text-xs text-muted-foreground italic">"{datingProfile.bio}"</p>
                  </div>
                )}
                <button
                  onClick={() => navigate("/hub-social")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  Voir les Rencontres
                </button>
              </div>
            </Section>
          </motion.div>
        )}

        {/* ── Danger zone ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Section title="Zone de danger">
            <DeleteAccountButton />
          </Section>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;

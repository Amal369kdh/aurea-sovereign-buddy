import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, Globe, MapPin, GraduationCap, Target,
  ArrowRight, ArrowLeft, Loader2, Check, Plane, Star,
} from "lucide-react";

const NATIONALITIES = [
  "🇫🇷 Française",
  "🇲🇦 Marocaine", "🇹🇳 Tunisienne", "🇩🇿 Algérienne", "🇸🇳 Sénégalaise",
  "🇨🇮 Ivoirienne", "🇨🇲 Camerounaise", "🇬🇦 Gabonaise", "🇨🇬 Congolaise",
  "🇲🇱 Malienne", "🇧🇫 Burkinabè", "🇹🇬 Togolaise", "🇧🇯 Béninoise",
  "🇲🇬 Malgache", "🇲🇷 Mauritanienne", "🇹🇩 Tchadienne", "Autre",
];

// Grenoble est la ville pilote — les autres villes afficheront "Ta ville arrive bientôt"
const CITIES = [
  { name: "Grenoble", pilot: true },
  { name: "Lyon", pilot: true },
  { name: "Paris", pilot: false },
  { name: "Bordeaux", pilot: true },
  { name: "Toulouse", pilot: true },
  { name: "Montpellier", pilot: true },
  { name: "Clermont-Ferrand", pilot: true },
  { name: "Strasbourg", pilot: false },
  { name: "Nantes", pilot: true },
  { name: "Lille", pilot: false },
  { name: "Rennes", pilot: false },
  { name: "Marseille", pilot: true },
  { name: "Nice", pilot: false },
  { name: "Autre", pilot: false },
];

const OBJECTIFS = [
  { id: "diplome", label: "🎓 Obtenir mon diplôme" },
  { id: "job", label: "💼 Trouver un job/stage" },
  { id: "reseau", label: "🤝 Développer mon réseau" },
  { id: "rencontres", label: "🧑‍🤝‍🧑 Rencontrer d'autres étudiants" },
  { id: "logement", label: "🏠 Trouver un logement" },
  { id: "sante", label: "🏥 Gérer ma santé & mutuelle" },
];

type StepKey = "nationality" | "location" | "city" | "university" | "objectifs";

const Onboarding = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  const [nationality, setNationality] = useState("");
  const [isInFrance, setIsInFrance] = useState<boolean | null>(null);
  const [selectedCity, setSelectedCity] = useState("Grenoble");
  const [university, setUniversity] = useState("");
  const [objectifs, setObjectifs] = useState<string[]>([]);

  const isFrench = nationality === "🇫🇷 Française";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const hardTimeout = setTimeout(() => {
      if (!cancelled) setProfileReady(true);
    }, 8000);

    const checkProfile = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, nationality, university, objectifs, is_in_france, city")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (data) {
          if (data.nationality) setNationality(data.nationality);
          if (data.university) setUniversity(data.university);
          if (data.objectifs && (data.objectifs as string[]).length > 0) setObjectifs(data.objectifs as string[]);
          if (data.is_in_france !== null) setIsInFrance(data.is_in_france);
          if (data.city) setSelectedCity(data.city);
          clearTimeout(hardTimeout);
          setProfileReady(true);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkProfile, 600);
          return;
        }

        try {
          await supabase.from("profiles").insert({ user_id: user.id, status: "explorateur" });
        } catch { /* already exists or RLS */ }
        clearTimeout(hardTimeout);
        if (!cancelled) setProfileReady(true);
      } catch {
        clearTimeout(hardTimeout);
        if (!cancelled) setProfileReady(true);
      }
    };

    checkProfile();
    return () => {
      cancelled = true;
      clearTimeout(hardTimeout);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isFrench) setIsInFrance(true);
  }, [isFrench]);

  const buildSteps = (): StepKey[] => {
    const steps: StepKey[] = ["nationality"];
    if (!isFrench) steps.push("location");
    steps.push("city", "university", "objectifs");
    return steps;
  };

  const STEPS = buildSteps();
  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const canNext = (): boolean => {
    switch (currentStep) {
      case "nationality": return nationality.length > 0;
      case "location": return isInFrance !== null;
      case "city": return selectedCity.trim().length > 0;
      case "university": return university.trim().length > 0;
      case "objectifs": return objectifs.length > 0;
      default: return true;
    }
  };

  const toggle = (val: string) => {
    setObjectifs((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : prev.length < 3 ? [...prev, val] : prev
    );
  };

  const saveProgress = async () => {
    if (!user) return;
    try {
      await supabase.from("profiles").upsert({
        user_id: user.id,
        ...(nationality ? { nationality } : {}),
        ...(isInFrance !== null ? { is_in_france: isFrench ? true : isInFrance } : {}),
        ...(selectedCity ? { city: selectedCity, target_city: selectedCity } : {}),
        ...(university ? { university } : {}),
        ...(objectifs.length > 0 ? { objectifs } : {}),
      }, { onConflict: "user_id" });
    } catch { /* non-blocking */ }
  };

  const handleNext = async () => {
    await saveProgress();
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);

    const studentStatus = isFrench ? "francais" : isInFrance ? "en_france" : "futur_arrivant";
    const effectiveIsInFrance = isFrench ? true : isInFrance;

    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          nationality,
          city: selectedCity,
          target_city: selectedCity,
          university,
          objectifs,
          is_in_france: effectiveIsInFrance,
          student_status: studentStatus,
          onboarding_step: 3,
          status: "explorateur",
        }, { onConflict: "user_id" });

      if (!error) { lastError = null; break; }
      lastError = error;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
    }

    setSubmitting(false);

    if (lastError) {
      toast({ title: "Connexion instable 📡", description: "Réessaie dans quelques secondes.", variant: "destructive" });
      return;
    }

    toast({ title: "C'est parti ! 🔥", description: "Ton espace est prêt — on est là pour toi." });
    window.location.href = "/";
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "ton pseudo";

  if (loading || !profileReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Préparation de ton espace…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gold-gradient mb-3">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-extrabold">
            <span className="gold-text">Start clean ✨</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Étape {step + 1} / {STEPS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full gold-gradient"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            {currentStep === "nationality" && (
              <StepLayout icon={<Globe className="h-5 w-5" />} title="Quelle est ta nationalité ?">
                <div className="grid grid-cols-2 gap-2">
                  {NATIONALITIES.map((n) => (
                    <ChoiceButton key={n} selected={nationality === n} onClick={() => setNationality(n)} label={n} />
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "location" && (
              <StepLayout icon={<Plane className="h-5 w-5" />} title="Es-tu déjà en France ?">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <ToggleChoice selected={isInFrance === true} onClick={() => setIsInFrance(true)} label="🇫🇷 Oui, je suis déjà en France" />
                    <ToggleChoice selected={isInFrance === false} onClick={() => setIsInFrance(false)} label="✈️ Non, pas encore arrivé(e)" />
                  </div>
                  {isInFrance === false && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <Plane className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-primary">Parfait !</p>
                          <p className="mt-1 text-xs text-primary/80">Tu verras les démarches pré-arrivée en priorité. Tu pourras activer la France depuis ton dossier.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </StepLayout>
            )}

            {currentStep === "city" && (
              <StepLayout icon={<MapPin className="h-5 w-5" />} title="Ta ville d'études ?">
                <p className="mb-3 text-xs text-muted-foreground">Grenoble, Lyon, Montpellier, Toulouse, Clermont-Ferrand, Marseille, Bordeaux et Nantes sont actives ⚡</p>
                <div className="grid grid-cols-2 gap-2">
                  {CITIES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedCity(c.name)}
                      className={`relative flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-medium transition-all cursor-pointer text-left ${
                        selectedCity === c.name
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {c.pilot && <Star className="h-3 w-3 shrink-0 text-primary fill-primary" />}
                      <span>{c.name}</span>
                      {c.pilot && (
                        <span className="absolute -top-1.5 -right-1 text-[9px] font-bold rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 leading-none">
                          Actif
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {!CITIES.find(c => c.name === selectedCity)?.pilot && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">⚡</span>
                      <div>
                        <p className="text-sm font-semibold text-primary">{selectedCity} bientôt disponible !</p>
                        <p className="mt-1 text-xs text-primary/80">
                          Tu auras accès à toute la structure de l'app et au Hub Social. Les ressources locales de {selectedCity} seront activées très prochainement.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </StepLayout>
            )}

            {currentStep === "university" && (
              <StepLayout icon={<GraduationCap className="h-5 w-5" />} title="Ton université ou école ?">
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-2.5">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs text-primary font-medium">
                    Ville : <strong>{selectedCity}</strong>
                    {CITIES.find(c => c.name === selectedCity)?.pilot && ` — ville active 🔥`}
                  </p>
                </div>
                <input
                  type="text"
                  placeholder={`Ex : Université de ${selectedCity}`}
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  maxLength={150}
                  autoFocus
                  className="w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </StepLayout>
            )}

            {currentStep === "objectifs" && (
              <StepLayout icon={<Target className="h-5 w-5" />} title="Tes objectifs prioritaires (max 3)">
                <p className="mb-3 text-xs text-muted-foreground">Sélectionne ce qui te correspond le mieux.</p>
                <div className="grid grid-cols-1 gap-2">
                  {OBJECTIFS.map((o) => (
                    <ToggleChoice
                      key={o.id}
                      selected={objectifs.includes(o.id)}
                      onClick={() => toggle(o.id)}
                      label={o.label}
                    />
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 rounded-2xl bg-primary/10 border-2 border-primary/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔒</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        Ton pseudo <span className="gold-text">"{displayName}"</span> est définitif
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Les autres membres verront ce nom. Il ne pourra plus être modifié.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StepLayout>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
          )}
          <button
            onClick={isLast ? handleFinish : handleNext}
            disabled={!canNext() || submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl gold-gradient py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLast ? (
              <>On valide ✅ <Check className="h-4 w-4" /></>
            ) : (
              <>Suivant <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Reusable sub-components ─── */

const StepLayout = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-4 flex items-center gap-2 text-primary">
      {icon}
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
    {children}
  </div>
);

const ChoiceButton = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className={`rounded-2xl border px-3 py-2.5 text-xs font-medium transition-all cursor-pointer text-left ${
      selected
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
    }`}
  >
    {label}
  </button>
);

const ToggleChoice = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
      selected
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
    }`}
  >
    {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
    {label}
  </button>
);

export default Onboarding;

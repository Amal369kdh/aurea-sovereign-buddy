import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, Globe, MapPin, GraduationCap, Target,
  ArrowRight, ArrowLeft, Loader2, Check, Plane, AlertTriangle,
} from "lucide-react";

const NATIONALITIES = [
  "🇫🇷 Française",
  "🇲🇦 Marocaine", "🇹🇳 Tunisienne", "🇩🇿 Algérienne", "🇸🇳 Sénégalaise",
  "🇨🇮 Ivoirienne", "🇨🇲 Camerounaise", "🇬🇦 Gabonaise", "🇨🇬 Congolaise",
  "🇲🇱 Malienne", "🇧🇫 Burkinabè", "🇹🇬 Togolaise", "🇧🇯 Béninoise",
  "🇲🇬 Malgache", "🇲🇷 Mauritanienne", "🇹🇩 Tchadienne", "Autre",
];

const CITIES = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille",
  "Nantes", "Strasbourg", "Montpellier", "Grenoble", "Rennes", "Rouen",
];

const OBJECTIFS = [
  { id: "diplome", label: "🎓 Obtenir mon diplôme" },
  { id: "job", label: "💼 Trouver un job/stage" },
  { id: "reseau", label: "🤝 Développer mon réseau" },
  { id: "papiers", label: "📄 Régulariser mes papiers" },
  { id: "logement", label: "🏠 Trouver un logement" },
  { id: "sante", label: "🏥 M'occuper de ma santé" },
];

type StepKey = "nationality" | "location" | "city" | "university" | "objectifs";

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  const [nationality, setNationality] = useState("");
  const [isInFrance, setIsInFrance] = useState<boolean | null>(null);
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");
  const [objectifs, setObjectifs] = useState<string[]>([]);

  const isFrench = nationality === "🇫🇷 Française";

  // Wait for profile to exist before showing onboarding
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const checkProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setProfileReady(true);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkProfile, 800);
        return;
      }

      // Fallback: create empty profile
      await supabase.from("profiles").insert({ user_id: user.id });
      if (!cancelled) setProfileReady(true);
    };

    checkProfile();
    return () => { cancelled = true; };
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

  const canNext = (): boolean => {
    switch (currentStep) {
      case "nationality": return nationality.length > 0;
      case "location": return isInFrance !== null;
      case "city": return city.length > 0;
      case "university": return university.length > 0;
      case "objectifs": return objectifs.length > 0;
      default: return true;
    }
  };

  const toggle = (val: string) => {
    setObjectifs((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : prev.length < 3 ? [...prev, val] : prev
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);

    const studentStatus = isFrench ? "francais" : isInFrance ? "en_france" : "futur_arrivant";

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        nationality,
        city,
        target_city: city,
        university,
        objectifs,
        is_in_france: isInFrance,
        student_status: studentStatus,
        onboarding_step: 3,
        status: "explorateur",
      }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } else {
      toast({ title: "Bienvenue chez toi 🏠", description: "Ton profil est prêt !" });
      navigate("/", { replace: true });
    }
    setSubmitting(false);
  };

  const isLast = step === STEPS.length - 1;

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
            <span className="gold-text">Complète ton profil</span>
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
                    <ToggleChoice selected={isInFrance === false} onClick={() => setIsInFrance(false)} label="✈️ Non, je ne suis pas encore arrivé(e)" />
                  </div>
                  {isInFrance === true && (
                    <InfoBox variant="warning" icon={<AlertTriangle className="h-5 w-5" />} title="Note">
                      Les procédures pré-arrivée seront masquées. Tu pourras les réactiver depuis ton dossier.
                    </InfoBox>
                  )}
                  {isInFrance === false && (
                    <InfoBox variant="info" icon={<Plane className="h-5 w-5" />} title="Parfait !">
                      Tu verras les procédures pré-arrivée en priorité.
                    </InfoBox>
                  )}
                </div>
              </StepLayout>
            )}

            {currentStep === "city" && (
              <StepLayout
                icon={<MapPin className="h-5 w-5" />}
                title={isInFrance ? "Dans quelle ville es-tu ?" : "Dans quelle ville vas-tu étudier ?"}
              >
                <div className="grid grid-cols-3 gap-2">
                  {CITIES.map((c) => (
                    <ChoiceButton key={c} selected={city === c} onClick={() => setCity(c)} label={c} />
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "university" && (
              <StepLayout icon={<GraduationCap className="h-5 w-5" />} title="Ton université ou école ?">
                <input
                  type="text"
                  placeholder="Ex : Université Grenoble Alpes"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  maxLength={150}
                  className="w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </StepLayout>
            )}

            {currentStep === "objectifs" && (
              <StepLayout icon={<Target className="h-5 w-5" />} title="Tes objectifs prioritaires (max 3)">
                <p className="mb-3 text-xs text-muted-foreground">Pour personnaliser ton expérience.</p>
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
            onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
            disabled={!canNext() || submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLast ? (
              <>Terminer <Check className="h-4 w-4" /></>
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

const ChoiceButton = ({ selected, onClick, label, rounded }: { selected: boolean; onClick: () => void; label: string; rounded?: boolean }) => (
  <button
    onClick={onClick}
    className={`${rounded ? "rounded-full" : "rounded-2xl"} border px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
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
    {selected && <Check className="h-4 w-4 text-primary" />}
    {label}
  </button>
);

const InfoBox = ({ variant, icon, title, children }: { variant: "warning" | "info"; icon: React.ReactNode; title: string; children: React.ReactNode }) => {
  const colors = variant === "warning"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "border-primary/30 bg-primary/5 text-primary";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-4 ${colors}`}>
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs opacity-80">{children}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding;

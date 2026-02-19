import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, Globe, MapPin, GraduationCap, Target, Heart,
  Wallet, ArrowRight, ArrowLeft, Loader2, Check, Plane, AlertTriangle,
  UtensilsCrossed, ShoppingCart, Sparkles, Users,
} from "lucide-react";

/* ─── Constants ─── */

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

const INTERESTS = [
  "Football", "Musique", "Cuisine", "Voyages", "Lecture", "Tech",
  "Cinéma", "Mode", "Fitness", "Photographie", "Gaming", "Art",
];

const DIETARY_OPTIONS = [
  "Classique", "Végétarien", "Halal", "Vegan", "Sans gluten",
];

const CUISINE_OPTIONS = [
  "Africaine", "Maghrébine", "Européenne", "Asiatique", "Américaine", "Indienne",
];

const STORE_OPTIONS = [
  "Lidl", "Carrefour", "Leclerc", "Aldi", "Intermarché", "Épiceries locales",
];

const EXPERTISE_OPTIONS = [
  "Maths", "Droit", "Langues", "Cuisine", "Bons plans", "Informatique", "Sciences", "Administratif",
];

const LOOKING_FOR_OPTIONS = [
  { id: "amis", label: "👥 Amis" },
  { id: "aide_admin", label: "📋 Aide administrative" },
  { id: "sport", label: "⚽ Partenaires de sport" },
  { id: "etudes", label: "📚 Groupe d'études" },
  { id: "sorties", label: "🎉 Sorties" },
];

/* ─── Step definitions ─── */

// Step 1: Identity (required for access)
type Step1Key = "nationality" | "location" | "city" | "university";
// Step 2: Profile for AI personalization  
type Step2Key = "objectifs" | "budget" | "dietary" | "stores";
// Step 3: Social
type Step3Key = "interests" | "expertise" | "lookingfor";

type StepKey = Step1Key | Step2Key | Step3Key;

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 data
  const [nationality, setNationality] = useState("");
  const [isInFrance, setIsInFrance] = useState<boolean | null>(null);
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");

  // Step 2 data
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [dietary, setDietary] = useState("Classique");
  const [cuisinePrefs, setCuisinePrefs] = useState<string[]>([]);
  const [budgetGroceries, setBudgetGroceries] = useState("");
  const [nearbyStores, setNearbyStores] = useState<string[]>([]);

  // Step 3 data
  const [interests, setInterests] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  const isFrench = nationality === "🇫🇷 Française";

  // Build dynamic steps based on nationality
  const buildSteps = (): StepKey[] => {
    const steps: StepKey[] = ["nationality"];
    if (!isFrench) steps.push("location");
    steps.push("city", "university", "objectifs", "budget", "dietary", "stores", "interests", "expertise", "lookingfor");
    return steps;
  };

  const STEPS = buildSteps();
  const currentStep = STEPS[step];

  // Auto-set isInFrance for French nationals
  useEffect(() => {
    if (isFrench) setIsInFrance(true);
  }, [isFrench]);

  const canNext = (): boolean => {
    switch (currentStep) {
      case "nationality": return nationality.length > 0;
      case "location": return isInFrance !== null;
      case "city": return city.length > 0;
      case "university": return university.length > 0;
      case "objectifs": return objectifs.length > 0;
      case "budget": return budget.length > 0;
      case "dietary": return true; // has default
      case "stores": return true; // optional
      case "interests": return interests.length > 0;
      case "expertise": return true; // optional
      case "lookingfor": return true; // optional
      default: return true;
    }
  };

  const toggle = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string, max: number) => {
    setArr((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : prev.length < max ? [...prev, val] : prev);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);

    const budgetNum = parseInt(budget) || null;
    const groceriesNum = parseInt(budgetGroceries) || null;
    const studentStatus = isFrench ? "francais" : isInFrance ? "en_france" : "futur_arrivant";

    const { error } = await supabase
      .from("profiles")
      .update({
        nationality,
        city,
        target_city: city,
        university,
        objectifs,
        interests,
        budget_monthly: budgetNum,
        is_in_france: isInFrance,
        student_status: studentStatus,
        dietary,
        cuisine_preferences: cuisinePrefs,
        budget_groceries_weekly: groceriesNum,
        nearby_stores: nearbyStores,
        expertise_domains: expertise,
        looking_for: lookingFor,
        onboarding_step: 3,
        status: "explorateur",
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } else {
      toast({ title: "Bienvenue chez toi 🏠", description: "Ton profil est prêt !" });
      navigate("/", { replace: true });
    }
    setSubmitting(false);
  };

  const isLast = step === STEPS.length - 1;

  // Phase labels for progress
  const getPhaseLabel = () => {
    const phaseIndex = STEPS.indexOf(currentStep);
    if (phaseIndex <= STEPS.indexOf("university")) return "① Identité";
    if (phaseIndex <= STEPS.indexOf("stores")) return "② Profil IA";
    return "③ Social";
  };

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
            {getPhaseLabel()} — Étape {step + 1} / {STEPS.length}
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
                    <ToggleChoice
                      selected={isInFrance === true}
                      onClick={() => setIsInFrance(true)}
                      label="🇫🇷 Oui, je suis déjà en France"
                    />
                    <ToggleChoice
                      selected={isInFrance === false}
                      onClick={() => setIsInFrance(false)}
                      label="✈️ Non, je ne suis pas encore arrivé(e)"
                    />
                  </div>
                  {isInFrance === true && (
                    <InfoBox variant="warning" icon={<AlertTriangle className="h-5 w-5" />} title="Note">
                      Les procédures pré-arrivée (visa, Campus France…) seront masquées. Tu pourras les réactiver depuis ton dossier.
                    </InfoBox>
                  )}
                  {isInFrance === false && (
                    <InfoBox variant="info" icon={<Plane className="h-5 w-5" />} title="Parfait !">
                      Tu verras les procédures pré-arrivée en priorité pour être 100% prêt(e) le jour J.
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
                <p className="mb-3 text-xs text-muted-foreground">Cela permet à l'IA de te donner des conseils ciblés.</p>
                <div className="grid grid-cols-1 gap-2">
                  {OBJECTIFS.map((o) => (
                    <ToggleChoice
                      key={o.id}
                      selected={objectifs.includes(o.id)}
                      onClick={() => toggle(objectifs, setObjectifs, o.id, 3)}
                      label={o.label}
                    />
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "budget" && (
              <StepLayout icon={<Wallet className="h-5 w-5" />} title="Ton budget mensuel estimé ?">
                <div className="grid grid-cols-2 gap-2">
                  {["300", "500", "700", "1000", "1500", "2000"].map((b) => (
                    <ChoiceButton key={b} selected={budget === b} onClick={() => setBudget(b)} label={`${b} €/mois`} />
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "dietary" && (
              <StepLayout icon={<UtensilsCrossed className="h-5 w-5" />} title="Ton profil alimentaire">
                <p className="mb-3 text-xs text-muted-foreground">
                  Pour personnaliser les bons plans repas et le comparateur.
                </p>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Régime alimentaire</p>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((d) => (
                      <ChoiceButton key={d} selected={dietary === d} onClick={() => setDietary(d)} label={d} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Préférences culinaires (max 3)</p>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map((c) => (
                      <ChoiceButton key={c} selected={cuisinePrefs.includes(c)} onClick={() => toggle(cuisinePrefs, setCuisinePrefs, c, 3)} label={c} />
                    ))}
                  </div>
                </div>
              </StepLayout>
            )}

            {currentStep === "stores" && (
              <StepLayout icon={<ShoppingCart className="h-5 w-5" />} title="Budget courses & magasins">
                <p className="mb-3 text-xs text-muted-foreground">
                  Optionnel — pour recevoir des alertes promos personnalisées.
                </p>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Budget courses hebdomadaire</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["20", "30", "50", "80", "100", "150"].map((b) => (
                      <ChoiceButton key={b} selected={budgetGroceries === b} onClick={() => setBudgetGroceries(b)} label={`${b} €`} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Magasins de proximité</p>
                  <div className="flex flex-wrap gap-2">
                    {STORE_OPTIONS.map((s) => (
                      <ChoiceButton key={s} selected={nearbyStores.includes(s)} onClick={() => toggle(nearbyStores, setNearbyStores, s, 4)} label={s} />
                    ))}
                  </div>
                </div>
              </StepLayout>
            )}

            {currentStep === "interests" && (
              <StepLayout icon={<Heart className="h-5 w-5" />} title="Tes centres d'intérêt (max 5)">
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => (
                    <ChoiceButton
                      key={i}
                      selected={interests.includes(i)}
                      onClick={() => toggle(interests, setInterests, i, 5)}
                      label={i}
                      rounded
                    />
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "expertise" && (
              <StepLayout icon={<Sparkles className="h-5 w-5" />} title="Ton domaine d'expertise (pour aider les autres)">
                <p className="mb-3 text-xs text-muted-foreground">
                  Optionnel — les autres étudiants pourront te solliciter dans l'entraide.
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_OPTIONS.map((e) => (
                    <ChoiceButton key={e} selected={expertise.includes(e)} onClick={() => toggle(expertise, setExpertise, e, 3)} label={e} rounded />
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "lookingfor" && (
              <StepLayout icon={<Users className="h-5 w-5" />} title="Ce que tu recherches ici">
                <div className="grid grid-cols-1 gap-2">
                  {LOOKING_FOR_OPTIONS.map((o) => (
                    <ToggleChoice
                      key={o.id}
                      selected={lookingFor.includes(o.id)}
                      onClick={() => toggle(lookingFor, setLookingFor, o.id, 4)}
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

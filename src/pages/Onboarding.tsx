import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, Globe, MapPin, GraduationCap, Target, Heart,
  Wallet, ArrowRight, ArrowLeft, Loader2, Check,
} from "lucide-react";

const NATIONALITIES = [
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
  { id: "diplome", label: "🎓 Obtenir mon diplôme", },
  { id: "job", label: "💼 Trouver un job/stage", },
  { id: "reseau", label: "🤝 Développer mon réseau", },
  { id: "papiers", label: "📄 Régulariser mes papiers", },
  { id: "logement", label: "🏠 Trouver un logement", },
  { id: "sante", label: "🏥 M'occuper de ma santé", },
];

const INTERESTS = [
  "Football", "Musique", "Cuisine", "Voyages", "Lecture", "Tech",
  "Cinéma", "Mode", "Fitness", "Photographie", "Gaming", "Art",
];

type Step = "nationality" | "city" | "university" | "objectifs" | "interests" | "budget";

const STEPS: Step[] = ["nationality", "city", "university", "objectifs", "interests", "budget"];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [nationality, setNationality] = useState("");
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState("");

  const currentStep = STEPS[step];

  const canNext = () => {
    switch (currentStep) {
      case "nationality": return nationality.length > 0;
      case "city": return city.length > 0;
      case "university": return university.length > 0;
      case "objectifs": return objectifs.length > 0;
      case "interests": return interests.length > 0;
      case "budget": return budget.length > 0;
    }
  };

  const toggleObjectif = (id: string) =>
    setObjectifs((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : prev.length < 3 ? [...prev, id] : prev);

  const toggleInterest = (label: string) =>
    setInterests((prev) => prev.includes(label) ? prev.filter((i) => i !== label) : prev.length < 5 ? [...prev, label] : prev);

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);

    const budgetNum = parseInt(budget) || null;
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
        status: "temoin",
      } as any)
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
                    <button
                      key={n}
                      onClick={() => setNationality(n)}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                        nationality === n
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "city" && (
              <StepLayout icon={<MapPin className="h-5 w-5" />} title="Dans quelle ville étudies-tu ?">
                <div className="grid grid-cols-3 gap-2">
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCity(c)}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                        city === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "university" && (
              <StepLayout icon={<GraduationCap className="h-5 w-5" />} title="Ton université ou école ?">
                <input
                  type="text"
                  placeholder="Ex: Université Grenoble Alpes"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </StepLayout>
            )}

            {currentStep === "objectifs" && (
              <StepLayout icon={<Target className="h-5 w-5" />} title="Tes objectifs prioritaires (max 3)">
                <div className="grid grid-cols-1 gap-2">
                  {OBJECTIFS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => toggleObjectif(o.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                        objectifs.includes(o.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {objectifs.includes(o.id) && <Check className="h-4 w-4 text-primary" />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "interests" && (
              <StepLayout icon={<Heart className="h-5 w-5" />} title="Tes centres d'intérêt (max 5)">
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => (
                    <button
                      key={i}
                      onClick={() => toggleInterest(i)}
                      className={`rounded-full border px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
                        interests.includes(i)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </StepLayout>
            )}

            {currentStep === "budget" && (
              <StepLayout icon={<Wallet className="h-5 w-5" />} title="Ton budget mensuel estimé ?">
                <div className="grid grid-cols-2 gap-2">
                  {["300", "500", "700", "1000", "1500", "2000"].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBudget(b)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-all cursor-pointer ${
                        budget === b
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {b} €/mois
                    </button>
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

const StepLayout = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-4 flex items-center gap-2 text-primary">
      {icon}
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
    {children}
  </div>
);

export default Onboarding;

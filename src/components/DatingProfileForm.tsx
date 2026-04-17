import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldAlert, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DatingProfileFormProps {
  onSubmit: (data: { bio: string; looking_for: string; show_me: string }) => Promise<void>;
}

const lookingForOptions = [
  { value: "amitie", label: "Amitié", emoji: "🤝" },
  { value: "relation", label: "Relation", emoji: "❤️" },
  { value: "les_deux", label: "Les deux", emoji: "💫" },
];

const showMeOptions = [
  { value: "tous", label: "Tout le monde" },
  { value: "hommes", label: "Hommes" },
  { value: "femmes", label: "Femmes" },
];

const calcAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const DatingProfileForm = ({ onSubmit }: DatingProfileFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("les_deux");
  const [showMe, setShowMe] = useState("tous");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedCharter, setAcceptedCharter] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [loadingAge, setLoadingAge] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("birth_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAge(calcAge((data as { birth_date: string | null } | null)?.birth_date ?? null));
        setLoadingAge(false);
      });
  }, [user]);

  const handleSubmit = async () => {
    if (age === null) {
      toast({
        title: "Date de naissance requise",
        description: "Renseigne ta date de naissance dans Mon Profil pour accéder aux Rencontres.",
        variant: "destructive",
      });
      return;
    }
    if (age < 18) {
      toast({
        title: "Réservé aux majeurs",
        description: "Les Rencontres sont accessibles uniquement à partir de 18 ans.",
        variant: "destructive",
      });
      return;
    }
    if (!acceptedCharter) {
      toast({
        title: "Charte de respect",
        description: "Tu dois accepter la charte pour continuer.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    await onSubmit({ bio, looking_for: lookingFor, show_me: showMe });
    setSubmitting(false);
  };

  // Block if minor
  if (!loadingAge && age !== null && age < 18) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/20">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="mt-3 text-lg font-extrabold text-foreground">Réservé aux majeurs</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Les Rencontres ne sont accessibles qu'à partir de 18 ans. Tu peux profiter du Hub Social en attendant 💛
        </p>
      </motion.div>
    );
  }

  // Block if no birth_date
  if (!loadingAge && age === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md rounded-3xl border border-primary/20 bg-card p-6 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Heart className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mt-3 text-lg font-extrabold text-foreground">Date de naissance requise</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pour accéder aux Rencontres, renseigne ta date de naissance dans <strong>Mon Profil</strong>. Cela nous permet de vérifier ta majorité (18+).
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-3xl border border-primary/20 bg-card p-6"
    >
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-primary/20">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="mt-3 text-xl font-extrabold text-foreground">Crée ton profil Rencontres</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Réservé aux 18+. Ton profil social reste séparé.
        </p>
      </div>

      {/* Bio */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-foreground">Bio courte</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Décris-toi en quelques mots…"
          rows={3}
          maxLength={200}
          className="w-full resize-none rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground">{bio.length}/200</p>
      </div>

      {/* Looking for */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-foreground">Je cherche</label>
        <div className="flex gap-2">
          {lookingForOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLookingFor(opt.value)}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                lookingFor === opt.value
                  ? "gold-gradient text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Show me */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-semibold text-foreground">Me montrer</label>
        <div className="flex gap-2">
          {showMeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setShowMe(opt.value)}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                showMe === opt.value
                  ? "gold-gradient text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charte de respect */}
      <label className="mb-5 flex cursor-pointer items-start gap-2 rounded-2xl border border-border bg-secondary/30 p-3 hover:border-primary/50 transition-colors">
        <input
          type="checkbox"
          checked={acceptedCharter}
          onChange={(e) => setAcceptedCharter(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
        />
        <span className="text-[11px] text-muted-foreground leading-relaxed">
          Je m'engage à respecter les autres, à <strong className="text-foreground">ne pas envoyer de contenu inapproprié</strong>, à signaler tout abus, et je comprends que tout comportement irrespectueux entraînera la suppression de mon profil.
        </span>
      </label>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || loadingAge}
        className="w-full rounded-2xl gold-gradient py-3 text-sm font-extrabold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {submitting ? "Création…" : "Activer mon profil Rencontres"}
      </button>
    </motion.div>
  );
};

export default DatingProfileForm;

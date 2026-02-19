import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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

const DatingProfileForm = ({ onSubmit }: DatingProfileFormProps) => {
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("les_deux");
  const [showMe, setShowMe] = useState("tous");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({ bio, looking_for: lookingFor, show_me: showMe });
    setSubmitting(false);
  };

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
          Obligatoire pour accéder aux rencontres. Ton profil social reste séparé.
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
      <div className="mb-6">
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

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-2xl gold-gradient py-3 text-sm font-extrabold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {submitting ? "Création…" : "Activer mon profil Rencontres"}
      </button>
    </motion.div>
  );
};

export default DatingProfileForm;

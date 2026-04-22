import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Loader2, AlertTriangle, Trash2, Pause, Play } from "lucide-react";
import { DatingProfile } from "@/hooks/useDating";

interface DatingProfileSettingsProps {
  open: boolean;
  onClose: () => void;
  profile: DatingProfile;
  onUpdate: (data: { bio: string; looking_for: string; show_me: string; is_active: boolean }) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
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

const DatingProfileSettings = ({ open, onClose, profile, onUpdate, onDelete }: DatingProfileSettingsProps) => {
  const [bio, setBio] = useState(profile.bio || "");
  const [lookingFor, setLookingFor] = useState(profile.looking_for);
  const [showMe, setShowMe] = useState(profile.show_me);
  const [isActive, setIsActive] = useState(profile.is_active);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onUpdate({ bio, looking_for: lookingFor, show_me: showMe, is_active: isActive });
    setSaving(false);
    if (ok) onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await onDelete();
    setDeleting(false);
    if (ok) {
      setConfirmDelete(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Mon profil Rencontres</h3>
                <p className="text-xs text-muted-foreground">Modifie, mets en pause ou supprime</p>
              </div>
            </div>

            {/* Active toggle */}
            <button
              onClick={() => setIsActive(!isActive)}
              className={`mb-4 flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                isActive
                  ? "border-success/30 bg-success/10"
                  : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {isActive ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/20 text-success">
                    <Play className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Pause className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {isActive ? "Profil actif" : "Profil en pause"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? "Tu apparais dans les Rencontres" : "Personne ne te voit"}
                  </p>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full transition-all ${isActive ? "bg-success" : "bg-muted"}`}>
                <div className={`h-5 w-5 rounded-full bg-card mt-0.5 transition-all ${isActive ? "ml-[22px]" : "ml-0.5"}`} />
              </div>
            </button>

            {/* Bio */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-foreground">Bio courte</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                rows={3}
                maxLength={200}
                placeholder="Décris-toi en quelques mots…"
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

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </button>

            {/* Danger zone */}
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-xs font-bold text-destructive">Zone de danger</p>
              </div>
              <p className="mb-3 text-[11px] text-muted-foreground leading-relaxed">
                Supprimer ton profil Rencontres efface ton profil dating, tous tes likes, matchs et messages dating. <strong>Ton compte principal reste intact.</strong>
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/15 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer mon profil Rencontres
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-destructive">Es-tu sûr·e ? Cette action est définitive.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-2xl border border-border bg-secondary py-2.5 text-xs font-bold text-foreground cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground disabled:opacity-50 cursor-pointer"
                    >
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DatingProfileSettings;

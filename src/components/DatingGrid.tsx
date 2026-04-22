import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Crown, Heart, Loader2, Settings, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDating } from "@/hooks/useDating";
import DatingProfileForm from "@/components/DatingProfileForm";
import DatingProfileSettings from "@/components/DatingProfileSettings";
import { useState } from "react";

interface DatingGridProps {
  onConnectClick: () => void;
}

const lookingForLabels: Record<string, string> = {
  amitie: "🤝 Amitié",
  relation: "❤️ Relation",
  les_deux: "💫 Ouvert·e",
};

const DatingGrid = ({ onConnectClick }: DatingGridProps) => {
  const {
    myProfile,
    candidates,
    likesReceived,
    isPremium,
    loading,
    profileLoading,
    quota,
    createDatingProfile,
    toggleLike,
    updateProfile,
    deleteProfile,
  } = useDating();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // No dating profile → show form
  if (!myProfile) {
    return <DatingProfileForm onSubmit={createDatingProfile} />;
  }

  return (
    <div>
      {/* Likes received banner */}
      <div className="mb-5 flex items-center justify-between rounded-3xl border border-primary/20 bg-primary/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">
              {likesReceived} personne{likesReceived !== 1 ? "s" : ""} t'{likesReceived !== 1 ? "ont" : "a"} liké
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isPremium ? "Découvre qui t'a liké ci-dessous" : "Passe Gold pour voir qui"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPremium && (
            <button
              onClick={onConnectClick}
              className="flex items-center gap-1.5 rounded-xl gold-gradient px-4 py-2 text-xs font-bold text-primary-foreground cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5" /> Gold
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer"
            title="Paramètres de mon profil Rencontres"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quota likes du jour */}
      {quota && !quota.is_premium && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs text-foreground">
              <span className="font-bold">{quota.remaining}</span>
              <span className="text-muted-foreground"> / {quota.limit} likes restants aujourd'hui</span>
            </p>
          </div>
          {quota.remaining <= 5 && (
            <button
              onClick={onConnectClick}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Illimité avec Gold →
            </button>
          )}
        </div>
      )}

      {/* Pause banner si profil désactivé */}
      {!myProfile.is_active && (
        <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-xs font-bold text-foreground">⏸ Ton profil est en pause</p>
          <p className="text-[11px] text-muted-foreground">
            Personne ne te voit. Réactive-le dans les paramètres pour réapparaître.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">À proximité</h2>
        <p className="text-xs text-muted-foreground">Étudiants avec un profil rencontre actif</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Aucun profil trouvé pour le moment. Reviens bientôt ! 🌟</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c, i) => (
            <motion.div
              key={c.user_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="group rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Avatar */}
              <div className="mb-4 flex flex-col items-center">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground">
                    {c.avatar_initials}
                  </div>
                  {c.is_verified && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full gold-gradient">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">{c.display_name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {c.city || "—"} · {c.university || "—"}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  {c.same_city && (
                    <Badge className="h-5 border-0 bg-primary/15 text-[10px] text-primary">Ta ville</Badge>
                  )}
                  {c.is_verified && (
                    <Badge className="h-5 border-0 bg-primary/15 text-[10px] text-primary">Témoin</Badge>
                  )}
                  <Badge className="h-5 border-0 bg-success/15 text-[10px] text-success">
                    {lookingForLabels[c.looking_for] || c.looking_for}
                  </Badge>
                </div>
              </div>

              {/* Bio */}
              {c.bio && (
                <p className="mb-3 text-center text-xs text-muted-foreground italic leading-relaxed">"{c.bio}"</p>
              )}

              {/* Interests */}
              {c.interests.length > 0 && (
                <div className="mb-4 flex flex-wrap justify-center gap-1.5">
                  {c.interests.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-xl bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Like button */}
              <button
                onClick={() => toggleLike(c.user_id, c.liked_by_me)}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  c.liked_by_me
                    ? "border border-primary/30 bg-primary/10 text-primary"
                    : "gold-gradient text-primary-foreground hover:opacity-90"
                }`}
              >
                <Heart className={`h-4 w-4 ${c.liked_by_me ? "fill-primary" : ""}`} />
                {c.liked_by_me ? "Aimé ✓" : "J'aime"}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {settingsOpen && myProfile && (
        <DatingProfileSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          profile={myProfile}
          onUpdate={updateProfile}
          onDelete={deleteProfile}
        />
      )}
    </div>
  );
};

export default DatingGrid;

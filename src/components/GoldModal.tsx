import { motion, AnimatePresence } from "framer-motion";
import { Crown, MessageCircle, Sparkles, ShieldCheck, X } from "lucide-react";

interface GoldModalProps {
  open: boolean;
  onClose: () => void;
}

const perks = [
  { icon: MessageCircle, label: "Messagerie illimitée", desc: "Contacte n'importe quel étudiant vérifié." },
  { icon: ShieldCheck, label: "Accès prioritaire au Hub", desc: "Tes posts sont mis en avant." },
  { icon: Sparkles, label: "Coach Aya IA sans limite", desc: "Pose toutes tes questions, 24/7." },
];

const GoldModal = ({ open, onClose }: GoldModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-[2rem] border border-primary/30"
            style={{
              background: "linear-gradient(180deg, hsl(222 35% 12% / 0.95) 0%, hsl(222 47% 6% / 0.98) 100%)",
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header glow */}
            <div className="relative flex flex-col items-center px-6 pt-10 pb-6">
              <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-primary/30">
                <Crown className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold gold-text">Passe Gold</h2>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                L'expérience Aurea complète.
              </p>
            </div>

            {/* Perks */}
            <div className="flex flex-col gap-3 px-6 pb-6">
              {perks.map((perk) => (
                <div
                  key={perk.label}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <perk.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{perk.label}</p>
                    <p className="text-xs text-muted-foreground">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-8">
              <button className="w-full rounded-2xl gold-gradient py-3.5 text-base font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 cursor-pointer">
                Débloquer Gold — 4,99 €/mois
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Sans engagement · Annulable à tout moment
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GoldModal;

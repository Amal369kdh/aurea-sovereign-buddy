import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, Send, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const REASONS = [
  "Harcèlement ou intimidation",
  "Contenu inapproprié ou offensant",
  "Spam ou arnaque",
  "Usurpation d'identité",
  "Autre",
];

interface ReportDialogProps {
  targetUserId?: string;
  targetAnnouncementId?: string;
  onClose: () => void;
  open: boolean;
}

const ReportDialog = ({ targetUserId, targetAnnouncementId, onClose, open }: ReportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !user) return;

    const trimmedDetails = details.trim().slice(0, 500);
    setSending(true);

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: targetUserId || null,
      reported_announcement_id: targetAnnouncementId || null,
      reason,
      details: trimmedDetails || null,
    });

    setSending(false);

    if (error) {
      toast({ title: "Erreur", description: "Le signalement n'a pas pu être envoyé.", variant: "destructive" });
    } else {
      toast({ title: "Signalement envoyé ✓", description: "Notre équipe va examiner ce contenu." });
      setReason("");
      setDetails("");
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-4xl border border-border bg-card p-6 mx-4"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Signaler</h3>
                <p className="text-xs text-muted-foreground">Ton signalement est confidentiel</p>
              </div>
            </div>

            {/* Reasons */}
            <div className="mb-4 space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all cursor-pointer ${
                    reason === r
                      ? "border border-destructive/40 bg-destructive/10 text-destructive"
                      : "border border-border bg-secondary/50 text-foreground hover:bg-secondary"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Optional details */}
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Détails supplémentaires (optionnel, max 500 caractères)…"
              className="mb-4 w-full resize-none rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive/40 focus:outline-none"
              rows={3}
              maxLength={500}
            />

            <button
              onClick={handleSubmit}
              disabled={!reason || sending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-5 py-3 text-sm font-bold text-destructive-foreground transition-all disabled:opacity-50 cursor-pointer"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer le signalement
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportDialog;

/* ─── Inline report trigger button (use in SocialFeed posts) ─── */
export const ReportButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive cursor-pointer"
    title="Signaler"
  >
    <Flag className="h-3.5 w-3.5" />
  </button>
);

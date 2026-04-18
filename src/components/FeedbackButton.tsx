import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Loader2, Bug, Lightbulb, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Category = "bug" | "idee" | "plainte";

const CATEGORIES: { value: Category; label: string; icon: typeof Bug; color: string }[] = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-400 border-red-500/40 bg-red-500/10" },
  { value: "idee", label: "Idée", icon: Lightbulb, color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  { value: "plainte", label: "Plainte", icon: AlertCircle, color: "text-orange-400 border-orange-500/40 bg-orange-500/10" },
];

export const FeedbackButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("idee");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      toast({ title: "Message trop court", description: "Au moins 5 caractères.", variant: "destructive" });
      return;
    }
    if (trimmed.length > 1000) {
      toast({ title: "Message trop long", description: "Max 1000 caractères.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("feedbacks").insert({
      user_id: user.id,
      category,
      message: trimmed,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Merci ! 💛", description: "Ton avis nous aide à améliorer Aurea." });
    setMessage("");
    setOpen(false);
  };

  return (
    <>
      {/* Floating button — bottom-right, above mobile bottom nav, below Aya which is at bottom-6 right-6 */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Donner mon avis"
        className="fixed bottom-24 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/90 text-muted-foreground shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:text-primary md:bottom-28 md:right-6"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-foreground">Donner mon avis</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-4 text-xs text-muted-foreground">
                Ton retour est lu par l'équipe. Merci de rester respectueux 🙏
              </p>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition-all ${
                        active
                          ? c.color
                          : "border-border bg-background text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décris ce que tu veux nous dire (5 à 1000 caractères)…"
                rows={5}
                maxLength={1000}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="mb-3 mt-1 text-right text-xs text-muted-foreground">
                {message.length}/1000
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || message.trim().length < 5}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer mon avis"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

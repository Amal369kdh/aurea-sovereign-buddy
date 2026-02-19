import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Sparkles, ChevronDown, Plane, MapPin, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import { useIntegration } from "@/contexts/IntegrationContext";

const PhaseChecklist = () => {
  const { phases, toggleTask, isInFrance, setIsInFrance } = useIntegration();
  const [openPhase, setOpenPhase] = useState<string | null>(phases[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-foreground">Parcours d'intégration</h2>
      <p className="text-sm text-muted-foreground">Coche chaque étape et suis les liens pour avancer dans tes démarches.</p>

      {/* Location toggle banner */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isInFrance ? (
              <MapPin className="h-5 w-5 text-primary" />
            ) : (
              <Plane className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isInFrance ? "Tu es en France 🇫🇷" : "Pas encore en France ✈️"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isInFrance
                  ? "Les procédures pré-arrivée sont masquées"
                  : "Toutes les procédures sont affichées"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsInFrance(isInFrance === true ? false : true)}
            className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80 cursor-pointer"
          >
            {isInFrance ? "Afficher pré-arrivée" : "Je suis en France"}
          </button>
        </div>

        {isInFrance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Les procédures pré-arrivée (visa, Campus France…) sont masquées. 
              Clique sur « Afficher pré-arrivée » si tu dois encore les compléter.
            </p>
          </motion.div>
        )}
      </div>

      <div className="space-y-3 mt-4">
        {phases.map((phase) => {
          const doneCount = phase.items.filter((i) => i.done).length;
          const isOpen = openPhase === phase.id;
          const allDone = doneCount === phase.items.length;

          return (
            <div key={phase.id} className="rounded-4xl bg-card border border-border overflow-hidden">
              <button
                onClick={() => setOpenPhase(isOpen ? null : phase.id)}
                className="flex w-full items-center gap-4 p-5 text-left cursor-pointer transition-colors hover:bg-secondary/30"
              >
                <span className="text-2xl">{phase.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{phase.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {doneCount}/{phase.items.length} complétées
                  </p>
                </div>
                {allDone && (
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    Terminé ✓
                  </span>
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
                  <span className="text-xs font-bold text-foreground">
                    {Math.round((doneCount / phase.items.length) * 100)}%
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-5 pb-4 pt-2 space-y-2">
                      {phase.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-border/50 bg-secondary/20 overflow-hidden">
                          <motion.div
                            layout
                            className="group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/40"
                            onClick={() => toggleTask(phase.id, item.id)}
                          >
                            <motion.div
                              animate={item.done ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 0.3 }}
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                item.done
                                  ? "gold-gradient"
                                  : "border-2 border-muted-foreground/30"
                              }`}
                            >
                              {item.done ? (
                                <Check className="h-4 w-4 text-primary-foreground" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground/30" />
                              )}
                            </motion.div>

                            <span
                              className={`flex-1 text-sm font-medium transition-colors ${
                                item.done
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {item.label}
                            </span>

                            {item.hasAya && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                              >
                                <Sparkles className="h-3 w-3" />
                                Amal
                              </button>
                            )}
                          </motion.div>

                          {/* Tip & Link section */}
                          {(item.tip || item.link) && (
                            <div className="px-4 pb-3 pt-0 flex flex-wrap items-center gap-2">
                              {item.tip && (
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <Info className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{item.tip}</span>
                                </div>
                              )}
                              {item.link && (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Lien officiel
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseChecklist;

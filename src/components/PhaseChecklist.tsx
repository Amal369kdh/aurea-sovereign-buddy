import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useIntegration } from "@/contexts/IntegrationContext";

const PhaseChecklist = () => {
  const { phases, toggleTask } = useIntegration();
  const [openPhase, setOpenPhase] = useState<string | null>(phases[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-foreground">Parcours d'intégration</h2>
      <p className="text-sm text-muted-foreground">Coche chaque étape pour augmenter ton Score de Souveraineté.</p>

      <div className="space-y-3 mt-4">
        {phases.map((phase) => {
          const doneCount = phase.items.filter((i) => i.done).length;
          const isOpen = openPhase === phase.id;
          const allDone = doneCount === phase.items.length;

          return (
            <div key={phase.id} className="rounded-4xl bg-card border border-border overflow-hidden">
              {/* Phase header */}
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

              {/* Items */}
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
                        <motion.div
                          key={item.id}
                          layout
                          className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-secondary/40 cursor-pointer"
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
                              Demander à Aya
                            </button>
                          )}
                        </motion.div>
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

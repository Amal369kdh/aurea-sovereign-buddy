import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Sparkles, ChevronDown, Plane, MapPin, AlertTriangle, ExternalLink, Info, Lock } from "lucide-react";
import { useState } from "react";
import { useIntegration } from "@/contexts/IntegrationContext";

const PhaseChecklist = () => {
  const { phases, toggleTask, isInFrance, isFrench, setIsInFrance } = useIntegration();
  const [openPhase, setOpenPhase] = useState<string | null>(phases[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-foreground">Parcours d'intégration</h2>
      <p className="text-sm text-muted-foreground">Coche chaque étape et suis les liens pour avancer dans tes démarches.</p>

      {/* Location toggle — hidden for French nationals */}
      {!isFrench && (
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
                    : "Tu peux prévisualiser les étapes sur place"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsInFrance(!isInFrance)}
              className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              {isInFrance ? "Afficher pré-arrivée" : "Je suis en France"}
            </button>
          </div>

          {isInFrance === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3"
            >
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-primary">
                Les étapes « sur place » sont affichées en aperçu 🔒 pour que tu puisses anticiper. 
                Elles se débloqueront quand tu passeras en mode « Je suis en France ».
              </p>
            </motion.div>
          )}
        </div>
      )}

      <div className="space-y-3 mt-4">
        {phases.map((phase) => {
          const activeItems = phase.items.filter((i) => !i.locked);
          const doneCount = activeItems.filter((i) => i.done).length;
          const isOpen = openPhase === phase.id;
          const allDone = activeItems.length > 0 && doneCount === activeItems.length;
          const isLocked = phase.locked;

          return (
            <div key={phase.id} className={`rounded-4xl bg-card border overflow-hidden ${isLocked ? "border-border/50 opacity-75" : "border-border"}`}>
              <button
                onClick={() => setOpenPhase(isOpen ? null : phase.id)}
                className="flex w-full items-center gap-4 p-5 text-left cursor-pointer transition-colors hover:bg-secondary/30"
              >
                <span className="text-2xl">{phase.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{phase.title}</p>
                    {isLocked && (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <Lock className="h-3 w-3" /> Aperçu
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLocked
                      ? `${phase.items.length} étapes — disponible une fois en France`
                      : `${doneCount}/${activeItems.length} complétées`}
                  </p>
                </div>
                {allDone && !isLocked && (
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    Terminé ✓
                  </span>
                )}
                {!isLocked && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
                    <span className="text-xs font-bold text-foreground">
                      {activeItems.length > 0 ? Math.round((doneCount / activeItems.length) * 100) : 0}%
                    </span>
                  </div>
                )}
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
                        <div key={item.id} className={`rounded-2xl border border-border/50 overflow-hidden ${item.locked ? "bg-muted/30" : "bg-secondary/20"}`}>
                          <motion.div
                            layout
                            className={`group flex items-center gap-3 px-4 py-3 transition-colors ${
                              item.locked ? "cursor-default opacity-60" : "cursor-pointer hover:bg-secondary/40"
                            }`}
                            onClick={() => !item.locked && toggleTask(phase.id, item.id)}
                          >
                            <motion.div
                              animate={item.done && !item.locked ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 0.3 }}
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                item.locked
                                  ? "border-2 border-muted-foreground/20 bg-muted/50"
                                  : item.done
                                  ? "gold-gradient"
                                  : "border-2 border-muted-foreground/30"
                              }`}
                            >
                              {item.locked ? (
                                <Lock className="h-3 w-3 text-muted-foreground/40" />
                              ) : item.done ? (
                                <Check className="h-4 w-4 text-primary-foreground" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground/30" />
                              )}
                            </motion.div>

                            <span
                              className={`flex-1 text-sm font-medium transition-colors ${
                                item.locked
                                  ? "text-muted-foreground"
                                  : item.done
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {item.label}
                            </span>

                            {item.hasAya && !item.locked && (
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                              >
                                <Sparkles className="h-3 w-3" /> Amal
                              </button>
                            )}
                          </motion.div>

                          {/* Tip & Link — hidden for locked items */}
                          {!item.locked && (item.tip || item.link) && (
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
                                  <ExternalLink className="h-3 w-3" /> Lien officiel
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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, Trash2, ToggleLeft, ToggleRight,
  MessageCircle, Users, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { useMentoring } from "@/hooks/useMentoring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const TOPICS = [
  { id: "logement", label: "🏠 Logement", desc: "Trouver un appart, CROUS, colocation" },
  { id: "admin", label: "📂 Admin & visa", desc: "Préfecture, titre de séjour, CAF" },
  { id: "job", label: "💼 Job & stages", desc: "CV, entretien, alternance" },
  { id: "sante", label: "🏥 Santé", desc: "Mutuelle, médecin, urgences" },
  { id: "budget", label: "💰 Budget", desc: "Bourses, aides, gestion argent" },
  { id: "social", label: "🤝 Vie sociale", desc: "Intégration, associations, réseaux" },
  { id: "orientation", label: "🎯 Orientation", desc: "Études, réorientation, master" },
  { id: "general", label: "✨ Général", desc: "Tout sujet utile" },
];

const MentoringWidget = () => {
  const { offers, myOffers, loading, createOffer, toggleOffer, deleteOffer, contactMentor, isTemoin } = useMentoring();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleCreate = async () => {
    if (!selectedTopic) return;
    setCreating(true);
    const result = await createOffer(selectedTopic, description);
    if (result?.error) {
      toast({ title: "Erreur", description: "Impossible de créer l'offre", variant: "destructive" });
    } else {
      toast({ title: "Offre créée ! 🎓", description: "Les étudiants peuvent maintenant te contacter" });
      setShowCreate(false);
      setSelectedTopic("");
      setDescription("");
    }
    setCreating(false);
  };

  const handleContact = async (offerId: string, mentorId: string, mentorName: string) => {
    await contactMentor(offerId, mentorId);
    toast({ title: "Demande envoyée ! 📩", description: `${mentorName} recevra une notification` });
  };

  const topicLabel = (id: string) => TOPICS.find(t => t.id === id)?.label || id;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full cursor-pointer">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            Mentorat Témoin
          </CardTitle>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        <p className="text-xs text-muted-foreground mt-1">
          Des étudiants expérimentés proposent leur aide gratuitement
        </p>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <CardContent className="space-y-3 pt-2">
              {/* Create offer button for témoins */}
              {isTemoin && (
                <div>
                  {!showCreate ? (
                    <Button size="sm" onClick={() => setShowCreate(true)} className="w-full gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      Proposer du mentorat
                    </Button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 rounded-2xl border border-border bg-background p-4">
                      <p className="text-sm font-semibold">Quel sujet ?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {TOPICS.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTopic(t.id)}
                            className={`rounded-xl border px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                              selectedTopic === t.id
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <span className="font-medium">{t.label}</span>
                            <br />
                            <span className="text-muted-foreground">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Décris ton expérience en quelques mots (optionnel)…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreate} disabled={!selectedTopic || creating} className="flex-1">
                          {creating ? "Création…" : "Publier"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* My offers (if témoin) */}
              {myOffers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mes offres</p>
                  {myOffers.map(offer => (
                    <div key={offer.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{topicLabel(offer.topic)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {offer.contact_count} demande{offer.contact_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button onClick={() => toggleOffer(offer.id, !offer.is_active)} className="cursor-pointer">
                        {offer.is_active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => deleteOffer(offer.id)} className="cursor-pointer">
                        <Trash2 className="h-4 w-4 text-destructive/60 hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Available offers from other mentors */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">Chargement…</p>
              ) : offers.length === 0 ? (
                <div className="text-center py-4">
                  <Sparkles className="h-6 w-6 text-primary/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Aucun mentor disponible pour le moment</p>
                  <p className="text-[11px] text-muted-foreground">Les témoins vérifiés peuvent proposer leur aide ici</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mentors disponibles</p>
                  {offers.map(offer => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-background p-3 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {offer.mentor_initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{offer.mentor_name}</p>
                          <p className="text-xs text-primary font-medium">{topicLabel(offer.topic)}</p>
                        </div>
                      </div>
                      {offer.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{offer.description}</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleContact(offer.id, offer.mentor_id, offer.mentor_name || "Mentor")}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Demander de l'aide
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default MentoringWidget;

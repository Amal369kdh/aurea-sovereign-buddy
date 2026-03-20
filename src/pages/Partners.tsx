import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Handshake, Clock, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";

type Partner = {
  id: string;
  name: string;
  type: string;
  offer: string | null;
  url: string | null;
  is_active: boolean;
};

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  bank: { label: "Banque", emoji: "🏦", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  insurance: { label: "Assurance / Mutuelle", emoji: "🛡️", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  housing: { label: "Logement", emoji: "🏠", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  jobs: { label: "Jobs étudiants", emoji: "💼", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  alternance: { label: "Alternance", emoji: "🎓", color: "bg-primary/10 text-primary border-primary/20" },
  leisure: { label: "Loisirs", emoji: "🎭", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

type ComingSoonItem = { emoji: string; title: string; sub: string; category: string; url?: string };

// Offres "à venir" pour renforcer la proposition B2B
const COMING_SOON: ComingSoonItem[] = [
  { emoji: "🏦", title: "Comparateur bancaire", sub: "Trouve la meilleure offre étudiant — SG, BNP, Hello Bank, Boursobank", category: "Banque" },
  { emoji: "🛡️", title: "Mutuelle étudiante", sub: "Comparatif LMDE, HEYME, April — sans frais cachés", category: "Assurance" },
  { emoji: "🏠", title: "Accompagnement recherche de logement", sub: "Alertes annonces personnalisées, checklist caution & bail — bientôt", category: "Logement" },
  { emoji: "📱", title: "Comparateur forfaits mobiles", sub: "Free, Bouygues, SFR, Orange — meilleur rapport qualité/prix", category: "Téléphonie" },
  { emoji: "🛒", title: "Comparateur de prix — courses", sub: "Lidl, Aldi, Leclerc, Carrefour — compare les paniers selon ton budget", category: "Alimentation" },
];

const trackClick = async (partnerId: string, userId: string) => {
  await (supabase as any).from("partner_link_clicks").insert({ partner_id: partnerId, user_id: userId });
};

const Partners = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("partners")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setPartners(data as Partner[]);
        setLoading(false);
      });
  }, []);

  const types = ["all", ...Array.from(new Set(partners.map((p) => p.type)))];
  const filtered = filter === "all" ? partners : partners.filter((p) => p.type === filter);

  const handlePartnerClick = async (partner: Partner) => {
    if (!partner.url) return;
    if (user) await trackClick(partner.id, user.id);
    window.open(partner.url, "_blank", "noopener noreferrer");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
        <div className="mx-auto max-w-2xl px-4 pt-6 lg:pt-8">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl gold-gradient">
                <Handshake className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground">Partenaires</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-1">
              Offres sélectionnées pour les étudiants — vérifiées et transparentes.
            </p>
          </div>

          {/* Filter tabs */}
          {types.length > 1 && (
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {types.map((t) => {
                const meta = TYPE_LABELS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      filter === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {t === "all" ? "Tous" : `${meta?.emoji ?? ""} ${meta?.label ?? t}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active partners */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-3xl bg-secondary/40 animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3 mb-8">
              {filtered.map((partner, i) => {
                const meta = TYPE_LABELS[partner.type];
                return (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group rounded-3xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:card-glow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl">
                        {meta?.emoji ?? "🤝"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-base font-bold text-foreground">{partner.name}</span>
                          <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-primary/8 text-primary border-primary/20">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Partenaire vérifié
                          </span>
                        </div>
                        {meta && (
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold mb-1 ${meta.color}`}>
                            {meta.emoji} {meta.label}
                          </span>
                        )}
                        {partner.offer && (
                          <p className="text-sm text-muted-foreground leading-snug">{partner.offer}</p>
                        )}
                      </div>
                    </div>
                    {partner.url && (
                      <button
                        onClick={() => handlePartnerClick(partner)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
                      >
                        Voir l'offre
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="mb-8 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-12 text-center">
              <span className="text-3xl">🤝</span>
              <p className="text-sm font-semibold text-foreground">Partenariats en cours de négociation</p>
              <p className="text-xs text-muted-foreground">Les premières offres arrivent très bientôt.</p>
            </div>
          )}

          {/* Coming soon section */}
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">À venir</h2>
          </div>
          <div className="space-y-3 mb-8">
            {COMING_SOON.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-4 rounded-3xl border border-dashed border-border bg-secondary/20 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-xl">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">{item.title}</p>
                    {item.url ? (
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">Disponible</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Bientôt</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/15 transition-colors cursor-pointer"
                  >
                    Voir <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          {/* B2B contact banner */}
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground mb-1">Tu représentes une organisation ?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aurea connecte les étudiants internationaux en France à des services adaptés à leur parcours.
                  Intéressé par un partenariat ?
                </p>
                <a
                  href="mailto:contact@aurea-student.app"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/15 cursor-pointer"
                >
                  Nous contacter
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Partners;

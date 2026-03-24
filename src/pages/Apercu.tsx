import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Crown, Users, MessageCircle, ShieldCheck, ArrowRight,
  Home, Landmark, Stethoscope, Bus, Briefcase, HeartHandshake,
  ClipboardCheck, Sparkles, Lock, Globe, MapPin, Heart,
  ChevronDown, ChevronRight as ChevRight,
} from "lucide-react";

// Fake hub social posts for preview
const FAKE_POSTS = [
  {
    initials: "YB",
    name: "Yasmine_B",
    category: "logement",
    categoryLabel: "Logement",
    time: "2h",
    content: "Salut ! Je cherche une colocation à Grenoble pour septembre. Budget ~400€/mois. Je suis en Master 2 à l'UGA, calme et ordonné. Si quelqu'un a une chambre libre, écrivez-moi 🙏 #logement #coloc #Grenoble",
    likes: 8,
    comments: 3,
    verified: false,
  },
  {
    initials: "KM",
    name: "Kofi_Mensah",
    category: "entraide",
    categoryLabel: "Entraide",
    time: "5h",
    content: "Bonjour ! Je cherche quelqu'un pour m'aider à comprendre le système CAF — j'ai reçu un courrier et je ne sais pas comment remplir le formulaire. Est-ce que quelqu'un l'a déjà fait ? #CAF #aides #entraide",
    likes: 12,
    comments: 5,
    verified: false,
  },
  {
    initials: "TM",
    name: "Théo_Moreau",
    category: "sorties",
    categoryLabel: "Sorties",
    time: "1j",
    content: "Ce week-end randonnée vers le Vercors 🏔️ — départ samedi 9h depuis la gare. Gratuit, ouvert à tous les étudiants. On sera ~20 personnes. Qui est dispo ? #randonnée #Vercors #sorties",
    likes: 24,
    comments: 11,
    verified: true,
  },
  {
    initials: "AU",
    name: "Équipe Aurea",
    category: "general",
    categoryLabel: "Général",
    time: "3j",
    content: "Bienvenue sur Aurea 👋 — L'app qui t'aide à t'installer à Grenoble. Démarches, logement, communauté — tout au même endroit. #aurea #Grenoble",
    likes: 31,
    comments: 7,
    verified: true,
  },
];

const FAKE_TILES = [
  { step: 1, title: "Ton spot 🏡", subtitle: "Logement • CROUS & plateformes", icon: Home, accent: "bg-warning/15 text-warning" },
  { step: 2, title: "Mode légal activé ⚖️", subtitle: "Titre de séjour & ANEF", icon: Landmark, accent: "bg-info/15 text-info" },
  { step: 3, title: "Zéro galère admin 📂", subtitle: "CAF, bourses & fac", icon: ClipboardCheck, accent: "gold-gradient text-primary-foreground" },
  { step: 4, title: "Cash flow mode 💸", subtitle: "Ouvrir un compte étudiant", icon: Landmark, accent: "bg-primary/15 text-primary" },
  { step: 5, title: "100% couvert 🛡️", subtitle: "Soins, urgences & bien-être", icon: Stethoscope, accent: "bg-destructive/15 text-destructive" },
  { step: 6, title: "Life unlocked 🔓", subtitle: "Transport, repas à 1€ & sport", icon: Bus, accent: "bg-success/15 text-success" },
  { step: 7, title: "Level up ta carrière 🚀", subtitle: "Jobs, stages & orientation", icon: Briefcase, accent: "bg-info/15 text-info" },
  { step: 8, title: "On est là pour toi 🤝", subtitle: "Aide alimentaire & soutien", icon: HeartHandshake, accent: "bg-destructive/10 text-destructive" },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Espace 100% étudiant", desc: "Communauté vérifiée, uniquement pour étudiants en France." },
  { icon: Users, title: "Hub Social de ta ville", desc: "Publications, entraide, logement, sorties…" },
  { icon: MessageCircle, title: "Messagerie privée", desc: "Échange en toute confiance avec d'autres étudiants." },
  { icon: Globe, title: "Ressources locales IA", desc: "Ressources personnalisées pour ta ville en temps réel." },
];

const CATEGORY_COLORS: Record<string, string> = {
  logement: "bg-warning/10 text-warning border-warning/20",
  entraide: "bg-success/10 text-success border-success/20",
  sorties: "bg-info/10 text-info border-info/20",
  general: "bg-muted/50 text-muted-foreground border-border",
};

export default function Apercu() {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gold-gradient">
            <Crown className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-extrabold">
            <span className="gold-text">Aurea</span>{" "}
            <span className="text-foreground">Student</span>
          </span>
        </div>
        <button
          onClick={goAuth}
          className="flex items-center gap-1.5 rounded-full gold-gradient px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
        >
          Rejoindre <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-5 pt-8 pb-6 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary">Aperçu de la plateforme — Grenoble 🇫🇷</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight text-foreground mb-3">
          Ton cercle étudiant,<br />
          <span className="gold-text">sécurisé & vérifié.</span>
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-6">
          Aurea regroupe les étudiants dans un espace de confiance. Entraide, logement, emploi, vie sociale — tout en un. Découvre ce qui t'attend.
        </p>
        <button
          onClick={goAuth}
          className="inline-flex items-center gap-2 rounded-2xl gold-gradient px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-opacity hover:opacity-90 cursor-pointer"
        >
          Créer mon compte gratuitement <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-2 text-xs text-muted-foreground">Gratuit · Sécurisé · Réservé aux étudiants</p>
      </motion.div>

      {/* ── Lock overlay notice ── */}
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Lock className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-primary/80">
          <span className="font-bold">Aperçu démonstration</span> — Les données affichées sont fictives. Inscris-toi pour accéder aux vraies ressources de ta ville.
        </p>
        <button onClick={goAuth} className="shrink-0 text-xs font-bold text-primary hover:underline cursor-pointer">S'inscrire →</button>
      </div>

      <div className="px-4 pb-20 space-y-6">
        {/* ── Feature highlights ── */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ce qui t'attend</p>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f, i) => (
              <motion.button
                key={i}
                onClick={goAuth}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/30 hover:bg-card/80 cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{f.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Dashboard preview (tiles) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dashboard — ressources</p>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Sparkles className="h-2.5 w-2.5" /> Personnalisé par IA
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FAKE_TILES.map((t, i) => (
              <motion.button
                key={t.title}
                onClick={goAuth}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="group flex w-full items-center gap-3 rounded-3xl border border-border bg-card p-5 text-left transition-all hover:border-primary/20 hover:card-glow cursor-pointer"
              >
                <span className="absolute top-2 right-2 hidden text-[10px] text-muted-foreground/50">{t.step}</span>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${t.accent}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Hub Social preview ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hub Social — aperçu</p>
            <span className="text-[10px] text-muted-foreground">Grenoble · actif maintenant</span>
          </div>
          <div className="space-y-3">
            {FAKE_POSTS.map((post, i) => (
              <motion.button
                key={i}
                onClick={goAuth}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="w-full rounded-3xl border border-border bg-card p-4 text-left transition-all hover:border-primary/20 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gold-gradient text-xs font-bold text-primary-foreground">
                    {post.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{post.name}</span>
                      {post.verified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[post.category]}`}>
                        {post.categoryLabel}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{post.time}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/80 leading-relaxed line-clamp-2">{post.content}</p>
                    <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {post.comments} réponses
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-primary font-semibold">
                        <Lock className="h-3 w-3" /> Commenter
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── CTA bottom ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center"
        >
          <div className="mb-4 flex -space-x-2 justify-center">
            {["YB", "KM", "TM", "PS", "LD"].map((init, i) => (
              <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card gold-gradient text-[10px] font-bold text-primary-foreground">
                {init}
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-foreground mb-1">Des étudiants t'attendent déjà 🎓</p>
          <p className="text-xs text-muted-foreground mb-4">Rejoins la communauté Aurea — gratuit, sécurisé, vérifiable.</p>
          <button
            onClick={goAuth}
            className="inline-flex items-center gap-2 rounded-2xl gold-gradient px-8 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          >
            Rejoindre maintenant <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { ShieldCheck, Heart, MessageCircle, Share2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Category = "all" | "entraide" | "sorties" | "logement";

interface Post {
  id: number;
  author: string;
  avatar: string;
  uni: string;
  verified: boolean;
  category: Category;
  content: string;
  likes: number;
  comments: number;
  time: string;
}

const posts: Post[] = [
  {
    id: 1,
    author: "Amina K.",
    avatar: "AK",
    uni: "UGA",
    verified: true,
    category: "entraide",
    content: "Quelqu'un sait comment faire la demande de numéro de sécu en ligne ? J'ai reçu mon VLS-TS mais la plateforme AMELI ne fonctionne pas… 😩",
    likes: 12,
    comments: 5,
    time: "il y a 2h",
  },
  {
    id: 2,
    author: "Lucas M.",
    avatar: "LM",
    uni: "INSA Lyon",
    verified: true,
    category: "sorties",
    content: "🎉 Soirée d'intégration ce vendredi au Macadam ! Venez nombreux, c'est gratuit pour les étudiants avant 23h.",
    likes: 34,
    comments: 18,
    time: "il y a 4h",
  },
  {
    id: 3,
    author: "Fatou D.",
    avatar: "FD",
    uni: "UJM",
    verified: true,
    category: "logement",
    content: "Chambre dispo en coloc à Saint-Martin-d'Hères, 350€/mois charges comprises. Proche tram B. DM si intéressé·e !",
    likes: 8,
    comments: 3,
    time: "il y a 6h",
  },
  {
    id: 4,
    author: "Yuki T.",
    avatar: "YT",
    uni: "Grenoble INP",
    verified: false,
    category: "entraide",
    content: "Est-ce que quelqu'un a un bon plan pour une assurance habitation pas chère ? Je viens d'arriver.",
    likes: 5,
    comments: 7,
    time: "il y a 8h",
  },
  {
    id: 5,
    author: "Carlos R.",
    avatar: "CR",
    uni: "Sciences Po",
    verified: true,
    category: "sorties",
    content: "Groupe de running tous les dimanches matin au Parc Paul Mistral 🏃‍♂️ On est déjà 8, rejoignez-nous !",
    likes: 21,
    comments: 9,
    time: "il y a 1j",
  },
];

const categoryLabels: Record<Category, string> = {
  all: "Tout",
  entraide: "Entraide",
  sorties: "Sorties",
  logement: "Logement",
};

const categoryColors: Record<string, string> = {
  entraide: "bg-info/20 text-info",
  sorties: "bg-primary/20 text-primary",
  logement: "bg-success/20 text-success",
};

interface SocialFeedProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
}

const SocialFeed = ({ activeCategory, onCategoryChange }: SocialFeedProps) => {
  const filtered = activeCategory === "all" ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-none">
        {(Object.keys(categoryLabels) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
              activeCategory === cat
                ? "gold-gradient text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Trust banner */}
      <div className="mb-6 flex items-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 px-5 py-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-primary">Espace sécurisé</span> — Seuls les Témoins vérifiés peuvent envoyer des messages privés.
        </p>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-4">
        {filtered.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className="rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary/20"
          >
            {/* Author row */}
            <div className="mb-3 flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                  {post.avatar}
                </div>
                {post.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gold-gradient">
                    <ShieldCheck className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{post.author}</span>
                  {post.verified && (
                    <Badge className="h-5 border-0 bg-primary/15 text-[10px] text-primary">Témoin</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {post.uni} · {post.time}
                </p>
              </div>
              <Badge className={`border-0 text-[10px] ${categoryColors[post.category] || ""}`}>
                {categoryLabels[post.category]}
              </Badge>
            </div>

            {/* Content */}
            <p className="mb-4 text-sm leading-relaxed text-foreground/90">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-5">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary cursor-pointer">
                <Heart className="h-4 w-4" /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary cursor-pointer">
                <MessageCircle className="h-4 w-4" /> {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary cursor-pointer">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 cursor-pointer">
                <Sparkles className="h-3.5 w-3.5" /> Aya
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;

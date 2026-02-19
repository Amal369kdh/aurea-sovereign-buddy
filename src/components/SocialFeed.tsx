import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, MessageCircle, Share2, Sparkles, Send, Pin, Loader2, Flag, HandHeart, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import LikersPopover from "@/components/LikersPopover";
import GoldModal from "@/components/GoldModal";
import { Badge } from "@/components/ui/badge";
import { useAnnouncements, type AnnouncementCategory } from "@/hooks/useAnnouncements";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ReportDialog from "@/components/ReportDialog";
import CommentSection from "@/components/CommentSection";

type Category = AnnouncementCategory | "all";

const categoryLabels: Record<Category, string> = {
  all: "Tout",
  entraide: "Entraide",
  sorties: "Sorties",
  logement: "Logement",
  general: "Général",
};

const categoryColors: Record<string, string> = {
  entraide: "bg-info/20 text-info",
  sorties: "bg-primary/20 text-primary",
  logement: "bg-success/20 text-success",
  general: "bg-muted text-muted-foreground",
};

interface SocialFeedProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
}

const SocialFeed = ({ activeCategory, onCategoryChange }: SocialFeedProps) => {
  const { announcements, loading, createPost, toggleLike } = useAnnouncements(
    activeCategory === "all" ? "all" : activeCategory
  );

  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<AnnouncementCategory>("general");
  const [posting, setPosting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ userId?: string; announcementId?: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [goldOpen, setGoldOpen] = useState(false);

  const handlePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    await createPost(newContent.trim(), newCategory);
    setNewContent("");
    setPosting(false);
  };

  return (
    <div>
      {/* Category Tabs */}
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
      <div className="mb-4 flex items-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 px-5 py-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-primary">Espace sécurisé</span> — Seuls les Témoins vérifiés peuvent envoyer des messages privés.
        </p>
      </div>

      {/* Entraide & Bénévolat banner */}
      <div className="mb-6 rounded-3xl border border-success/20 bg-success/5 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-success/15">
            <HandHeart className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Entraide & Bénévolat</h3>
            <p className="text-[11px] text-muted-foreground">
              Aide au tutorat, déménagement, accompagnement… Chaque post d'entraide te rapporte <span className="font-bold text-success">+5 points</span> pour la Ligue des Facs !
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-success/15 px-3 py-1.5">
            <Trophy className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-bold text-success">+5 pts</span>
          </div>
        </div>
        <button
          onClick={() => {
            onCategoryChange("entraide");
            setNewCategory("entraide");
          }}
          className="mt-1 text-xs font-semibold text-success hover:underline cursor-pointer"
        >
          → Poster dans Entraide
        </button>
      </div>

      {/* Compose box */}
      <div className="mb-6 rounded-3xl border border-border bg-card p-4">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Partage quelque chose avec la communauté…"
          className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          rows={3}
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {(["general", "entraide", "sorties", "logement"] as AnnouncementCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewCategory(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  newCategory === cat
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
          <button
            onClick={handlePost}
            disabled={posting || !newContent.trim()}
            className="flex items-center gap-2 rounded-2xl gold-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all disabled:opacity-50 cursor-pointer"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publier
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Aucune publication pour le moment. Sois le premier à poster ! 🚀</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary/20"
            >
              {/* Pinned indicator */}
              {post.is_pinned && (
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Pin className="h-3 w-3" /> Épinglé
                </div>
              )}

              {/* Author row */}
              <div className="mb-3 flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                    {post.author_initials}
                  </div>
                  {post.author_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gold-gradient">
                      <ShieldCheck className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{post.author_name}</span>
                    {post.author_verified && (
                      <Badge className="h-5 border-0 bg-primary/15 text-[10px] text-primary">Témoin</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.author_university || "Université"} ·{" "}
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
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
                <LikersPopover
                  announcementId={post.id}
                  likesCount={post.likes_count}
                  likedByMe={post.liked_by_me}
                  onToggleLike={() => toggleLike(post.id, post.liked_by_me)}
                  onGoldClick={() => setGoldOpen(true)}
                />
                <button
                  onClick={() => {
                    setExpandedComments((prev) => {
                      const next = new Set(prev);
                      if (next.has(post.id)) next.delete(post.id);
                      else next.add(post.id);
                      return next;
                    });
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" /> {post.comments_count}
                  {expandedComments.has(post.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary cursor-pointer">
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setReportTarget({ announcementId: post.id })}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive cursor-pointer"
                  title="Signaler"
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>
                <button className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 cursor-pointer">
                  <Sparkles className="h-3.5 w-3.5" /> Aya
                </button>
              </div>

              {/* Comments section */}
              {expandedComments.has(post.id) && (
                <CommentSection announcementId={post.id} postAuthorId={post.author_id} />
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ReportDialog
        open={!!reportTarget}
        targetUserId={reportTarget?.userId}
        targetAnnouncementId={reportTarget?.announcementId}
        onClose={() => setReportTarget(null)}
      />
      <GoldModal open={goldOpen} onClose={() => setGoldOpen(false)} />
    </div>
  );
};

export default SocialFeed;

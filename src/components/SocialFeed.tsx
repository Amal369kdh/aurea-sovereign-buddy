import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, MessageCircle, Share2, Sparkles, Send, Pin, Loader2, Flag, HandHeart, Trophy, ChevronDown, ChevronUp, Hash, Trash2 } from "lucide-react";
import LikersPopover from "@/components/LikersPopover";
import GoldModal from "@/components/GoldModal";
import { Badge } from "@/components/ui/badge";
import { useAnnouncements, type AnnouncementCategory } from "@/hooks/useAnnouncements";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ReportDialog from "@/components/ReportDialog";
import CommentSection from "@/components/CommentSection";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

/** Extrait les hashtags d'un texte et retourne le contenu + les tags */
function parseHashtags(content: string): { text: string; tags: string[] } {
  const tagRegex = /#([\wÀ-ÿ]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return { text: content, tags };
}

/** Rendu du contenu avec hashtags mis en évidence — #ASM en bleu, autres en doré */
function ContentWithHashtags({ content }: { content: string }) {
  const parts = content.split(/(#[\wÀ-ÿ]+)/g);
  return (
    <p className="mb-4 text-sm leading-relaxed text-foreground/90">
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <span
            key={i}
            className={
              part.toLowerCase() === "#asm"
                ? "font-semibold text-info"
                : "font-semibold text-primary"
            }
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </p>
  );
}

interface SocialFeedProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  readOnly?: boolean;
  isVerified?: boolean;
  /** If provided, automatically expand & scroll to this post (deep-link from notification) */
  highlightPostId?: string;
}

const SocialFeed = ({ activeCategory, onCategoryChange, readOnly = false, isVerified = false, highlightPostId }: SocialFeedProps) => {
  const { announcements, loading, createPost, deletePost, toggleLike } = useAnnouncements(
    activeCategory === "all" ? "all" : activeCategory
  );
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status once
  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_admin", { _user_id: user.id }).then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<AnnouncementCategory>("general");
  const [posting, setPosting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ userId?: string; announcementId?: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [goldOpen, setGoldOpen] = useState(false);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrolledToHighlight = useRef(false);

  // Auto-expand + scroll to highlighted post once announcements are loaded
  useEffect(() => {
    if (!highlightPostId || scrolledToHighlight.current || loading) return;
    const el = postRefs.current[highlightPostId];
    if (el) {
      setExpandedComments((prev) => new Set([...prev, highlightPostId]));
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        scrolledToHighlight.current = true;
      }, 200);
    }
  }, [highlightPostId, loading, announcements]);

  const MAX_POST_CHARS = 800;
  const MIN_ENTRAIDE_CHARS = 50;
  const isEntrade = newCategory === "entraide";
  const charCount = newContent.trim().length;
  const isEntraideTooShort = isEntrade && charCount > 0 && charCount < MIN_ENTRAIDE_CHARS;
  const isTooLong = charCount > MAX_POST_CHARS;
  const canPost = charCount > 0 && !isEntraideTooShort && !isTooLong;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    await createPost(newContent.trim(), newCategory);
    setNewContent("");
    setPosting(false);
  };

  // Filtrage client-side par hashtag
  const filteredAnnouncements = activeHashtag
    ? announcements.filter((post) => {
        const { tags } = parseHashtags(post.content);
        return tags.includes(activeHashtag);
      })
    : announcements;

  // Hashtags populaires extraits de toutes les publications
  const allTags = announcements.flatMap((post) => parseHashtags(post.content).tags);
  const tagFrequency = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const popularTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag]) => tag);

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
          <span className="font-bold text-primary">Espace sécurisé</span> — Seuls les Témoins vérifiés peuvent publier, commenter et liker.
        </p>
      </div>

      {/* Hashtags populaires */}
      {popularTags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {activeHashtag && (
            <button
              onClick={() => setActiveHashtag(null)}
              className="flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive cursor-pointer"
            >
              ✕ Effacer filtre
            </button>
          )}
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveHashtag(activeHashtag === tag ? null : tag)}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeHashtag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Hash className="h-3 w-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

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

      {/* Compose box — hidden for read-only (unverified) users */}
      {!readOnly && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-4">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value.slice(0, MAX_POST_CHARS))}
            placeholder="Partage quelque chose… Tu peux utiliser des #hashtags pour être plus facilement retrouvé."
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={3}
          />
          {/* Category chips — scrollable on mobile */}
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {(["general", "entraide", "sorties", "logement"] as AnnouncementCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewCategory(cat)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  newCategory === cat
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
          {/* Char count + Validation */}
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className={isEntraideTooShort ? "text-destructive font-semibold" : ""}>
              {isEntraideTooShort
                ? `Entraide : min. ${MIN_ENTRAIDE_CHARS} caractères pour les points (${charCount}/${MIN_ENTRAIDE_CHARS})`
                : isEntrade && charCount >= MIN_ENTRAIDE_CHARS
                ? "✓ Longueur suffisante"
                : ""}
            </span>
            <span className={`tabular-nums font-semibold ${isTooLong ? "text-destructive" : charCount > MAX_POST_CHARS * 0.85 ? "text-primary" : ""}`}>
              {charCount}/{MAX_POST_CHARS}
            </span>
          </div>
          {/* Send button */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={handlePost}
              disabled={posting || !canPost}
              className="flex items-center gap-2 rounded-2xl gold-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all disabled:opacity-50 cursor-pointer"
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publier
            </button>
          </div>
        </div>
      )}

      {/* Filtre hashtag actif */}
      {activeHashtag && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2">
          <Hash className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-primary">
            Publications avec #{activeHashtag} — {filteredAnnouncements.length} résultat(s)
          </p>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {activeHashtag
              ? `Aucune publication avec #${activeHashtag}.`
              : "Aucune publication pour le moment. Sois le premier à poster ! 🚀"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAnnouncements.map((post, i) => (
            <motion.div
              key={post.id}
              ref={(el) => { postRefs.current[post.id] = el; }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className={`rounded-3xl border bg-card p-5 transition-all hover:border-primary/20 ${
                highlightPostId === post.id
                  ? "border-primary/50 ring-2 ring-primary/20"
                  : "border-border"
              }`}
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
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                    post.author_name === "Équipe Aurea"
                      ? "gold-gradient text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {post.author_verified ? post.author_initials : "?"}
                  </div>
                  {post.author_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gold-gradient">
                      <ShieldCheck className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {post.author_verified ? post.author_name : "Anonyme"}
                    </span>
                    {post.author_verified && (
                      post.author_name === "Équipe Aurea" ? (
                        <Badge className="h-5 border-0 gold-gradient text-[10px] text-primary-foreground">Admin</Badge>
                      ) : (
                        <Badge className="h-5 border-0 bg-primary/15 text-[10px] text-primary">Témoin</Badge>
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.author_verified
                      ? (post.author_name === "Équipe Aurea" ? "Aurea Student" : (post.author_university || "Université"))
                      : "Vérifie ton email pour voir les profils"}{" "}·{" "}
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <Badge className={`border-0 text-[10px] ${categoryColors[post.category] || ""}`}>
                  {categoryLabels[post.category]}
                </Badge>
              </div>

              {/* Content avec hashtags mis en évidence */}
              <ContentWithHashtags content={post.content} />

              {/* Hashtags cliquables */}
              {parseHashtags(post.content).tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {parseHashtags(post.content).tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveHashtag(activeHashtag === tag ? null : tag)}
                      className={`flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        activeHashtag === tag
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      <Hash className="h-2.5 w-2.5" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-5">
                <LikersPopover
                  announcementId={post.id}
                  likesCount={post.likes_count}
                  likedByMe={post.liked_by_me}
                  onToggleLike={() => toggleLike(post.id, post.liked_by_me)}
                  onGoldClick={() => setGoldOpen(true)}
                  isVerified={isVerified}
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
                  <Sparkles className="h-3.5 w-3.5" /> Amal
                </button>
              </div>

              {/* Comments section */}
              {expandedComments.has(post.id) && (
                <CommentSection
                  announcementId={post.id}
                  postAuthorId={post.author_id}
                  postCategory={post.category}
                  readOnly={readOnly}
                />
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

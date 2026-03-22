import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2, ShieldCheck, MessageSquare, AtSign } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import SolutionChatDialog from "@/components/SolutionChatDialog";
import { supabase } from "@/integrations/supabase/client";

interface CommentSectionProps {
  announcementId: string;
  postAuthorId: string;
  readOnly?: boolean;
}

// Parse @pseudo mentions in comment text and highlight them
const renderCommentContent = (content: string) => {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-bold text-primary">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const CommentSection = ({ announcementId, postAuthorId, readOnly = false }: CommentSectionProps) => {
  const { user } = useAuth();
  const { comments, loading, addComment, markAsSolution } = useComments(announcementId);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [solutionConvId, setSolutionConvId] = useState<string | null>(null);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<{ user_id: string; display_name: string; avatar_initials: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCommentRef = useRef<HTMLDivElement>(null);
  const prevCommentCountRef = useRef(comments.length);

  // Auto-scroll to the new comment after posting
  useEffect(() => {
    if (comments.length > prevCommentCountRef.current) {
      prevCommentCountRef.current = comments.length;
      setTimeout(() => {
        lastCommentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    } else {
      prevCommentCountRef.current = comments.length;
    }
  }, [comments.length]);

  // Detect @mention typing and fetch suggestions from existing commenters + profiles
  useEffect(() => {
    const cursorPos = inputRef.current?.selectionStart ?? newComment.length;
    const textBeforeCursor = newComment.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const search = mentionMatch[1].toLowerCase();
      setMentionSearch(search);

      // Build suggestions from people who already commented on this post
      const commenters = comments
        .filter((c) => c.author_id !== user?.id)
        .reduce<{ user_id: string; display_name: string; avatar_initials: string }[]>((acc, c) => {
          if (!acc.find((x) => x.user_id === c.author_id)) {
            acc.push({
              user_id: c.author_id,
              display_name: c.author_name,
              avatar_initials: c.author_initials,
            });
          }
          return acc;
        }, []);

      const filtered = search
        ? commenters.filter((c) => c.display_name.toLowerCase().includes(search))
        : commenters;

      setMentionSuggestions(filtered.slice(0, 5));
    } else {
      setMentionSearch(null);
      setMentionSuggestions([]);
    }
  }, [newComment, comments, user?.id]);

  const insertMention = (displayName: string) => {
    const cursorPos = inputRef.current?.selectionStart ?? newComment.length;
    const textBeforeCursor = newComment.slice(0, cursorPos);
    const textAfterCursor = newComment.slice(cursorPos);
    const replaced = textBeforeCursor.replace(/@\w*$/, `@${displayName.replace(/\s+/g, "_")} `);
    setNewComment(replaced + textAfterCursor);
    setMentionSearch(null);
    setMentionSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const MAX_COMMENT_CHARS = 400;

  const handlePost = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || trimmed.length > MAX_COMMENT_CHARS) return;
    setPosting(true);
    await addComment(trimmed);

    // Send notifications to all @mentioned users, linked to the announcement
    const mentionedNames = [...trimmed.matchAll(/@(\w+)/g)].map((m) => m[1].replace(/_/g, " ").toLowerCase());
    if (mentionedNames.length > 0) {
      const mentionedCommenters = comments.filter((c) =>
        mentionedNames.some((n) =>
          c.author_name.toLowerCase() === n ||
          c.author_name.toLowerCase().replace(/\s+/g, "_") === n.replace(/\s+/g, "_")
        )
      );
      const uniqueMentioned = [...new Map(mentionedCommenters.map((c) => [c.author_id, c])).values()];
      const myName = comments.find((c) => c.author_id === user?.id)?.author_name ?? "Quelqu'un";

      for (const mentioned of uniqueMentioned) {
        if (mentioned.author_id !== user?.id) {
          await supabase.from("notifications").insert({
            user_id: mentioned.author_id,
            type: "mention",
            title: `${myName} t'a mentionné 👋`,
            body: trimmed.slice(0, 80),
            // Link notification to the announcement so the bell redirects to Hub Social
            data: { announcement_id: announcementId },
          });
        }
      }
    }

    setNewComment("");
    setPosting(false);
  };

  const handleMarkSolution = async (commentId: string, helperId: string) => {
    await markAsSolution(commentId, helperId);
  };

  const openSolutionChat = async (commentId: string) => {
    const { data } = await supabase
      .from("solution_conversations")
      .select("id")
      .eq("comment_id", commentId)
      .single();
    if (data) setSolutionConvId(data.id);
  };

  const isPostAuthor = user?.id === postAuthorId;
  const hasSolution = comments.some((c) => c.is_solution);

  return (
    <div className="mt-3 border-t border-border pt-3">
      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment, idx) => (
            <motion.div
              key={comment.id}
              ref={idx === comments.length - 1 ? lastCommentRef : null}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-3 text-sm ${
                comment.is_solution
                  ? "border border-success/30 bg-success/5"
                  : "bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  {comment.author_initials}
                </div>
                <span className="text-xs font-semibold text-foreground">{comment.author_name}</span>
                {comment.author_verified && (
                  <ShieldCheck className="h-3 w-3 text-primary" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                </span>
                {comment.is_solution && (
                  <Badge className="h-4 border-0 bg-success/15 text-[9px] text-success ml-auto">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Solution
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                {renderCommentContent(comment.content)}
              </p>

              <div className="mt-2 flex items-center gap-2">
                {/* Reply button — inserts @mention */}
                {!readOnly && comment.author_id !== user?.id && (
                  <button
                    onClick={() => {
                      const pseudo = comment.author_name.replace(/\s+/g, "_");
                      setNewComment((prev) => `${prev}@${pseudo} `);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <AtSign className="h-3 w-3" /> Répondre
                  </button>
                )}

                {/* Mark as solution button */}
                {isPostAuthor && comment.author_id !== user?.id && !hasSolution && (
                  <button
                    onClick={() => handleMarkSolution(comment.id, comment.author_id)}
                    className="flex items-center gap-1 rounded-xl bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success hover:bg-success/20 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Marquer comme solution
                  </button>
                )}

                {/* Open solution chat button */}
                {comment.is_solution && (comment.author_id === user?.id || isPostAuthor) && (
                  <button
                    onClick={() => openSolutionChat(comment.id)}
                    className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3 w-3" /> Chat privé (3 msg max)
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Compose comment — hidden for unverified users */}
      {readOnly ? (
        <div className="mt-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Vérifie ton email étudiant</span> pour commenter.
          </p>
        </div>
      ) : (
        <div className="mt-3 relative">
          {/* @mention suggestions dropdown */}
          {mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 right-0 z-30 rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              {mentionSuggestions.map((s) => (
                <button
                  key={s.user_id}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(s.display_name); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {s.avatar_initials}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{s.display_name}</span>
                  <AtSign className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && mentionSuggestions.length === 0) handlePost();
                if (e.key === "Escape") { setMentionSearch(null); setMentionSuggestions([]); }
              }}
              placeholder="Ajouter un commentaire… (@pseudo pour mentionner)"
              className="flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={handlePost}
              disabled={posting || !newComment.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl gold-gradient text-primary-foreground disabled:opacity-40 cursor-pointer"
            >
              {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}

      <SolutionChatDialog
        conversationId={solutionConvId}
        onClose={() => setSolutionConvId(null)}
      />
    </div>
  );
};

export default CommentSection;

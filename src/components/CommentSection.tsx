import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2, ShieldCheck, MessageSquare } from "lucide-react";
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
}

const CommentSection = ({ announcementId, postAuthorId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { comments, loading, addComment, markAsSolution } = useComments(announcementId);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [solutionConvId, setSolutionConvId] = useState<string | null>(null);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    await addComment(newComment.trim());
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
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
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
              <p className="text-xs text-foreground/85 leading-relaxed">{comment.content}</p>

              <div className="mt-2 flex items-center gap-2">
                {/* Mark as solution button - only for post author, not own comment, and no existing solution */}
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

      {/* Compose comment */}
      <div className="mt-3 flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
          placeholder="Ajouter un commentaire…"
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

      <SolutionChatDialog
        conversationId={solutionConvId}
        onClose={() => setSolutionConvId(null)}
      />
    </div>
  );
};

export default CommentSection;

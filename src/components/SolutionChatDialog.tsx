import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Lock } from "lucide-react";
import { useSolutionChat } from "@/hooks/useSolutionChat";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SolutionChatDialogProps {
  conversationId: string | null;
  onClose: () => void;
}

const SolutionChatDialog = ({ conversationId, onClose }: SolutionChatDialogProps) => {
  const { user } = useAuth();
  const { messages, loading, canSend, myMsgCount, sendMessage } = useSolutionChat(conversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !canSend) return;
    setSending(true);
    await sendMessage(input.trim());
    setInput("");
    setSending(false);
  };

  if (!conversationId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="flex h-[400px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-success/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">💬 Chat Solution</span>
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                {myMsgCount}/3 msgs
              </span>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Échangez vos contacts ici. Vous avez chacun 3 messages maximum.
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                      msg.sender_id === user?.id
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="mt-1 text-[9px] opacity-60">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            {canSend ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Échange tes contacts…"
                  className="flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl gold-gradient text-primary-foreground disabled:opacity-40 cursor-pointer"
                >
                  {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Limite de 3 messages atteinte
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SolutionChatDialog;

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Send, Loader2, MessageCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import AppSidebar from "@/components/AppSidebar";
import SecuritySovereign from "@/components/SecuritySovereign";
import AmalTrigger from "@/components/AyaTrigger";
import MobileBottomNav from "@/components/MobileBottomNav";
import VerifiedGate from "@/components/VerifiedGate";

const Messages = () => {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const { conversations, messages, loading, isTemoin, sendMessage } = useMessages(selectedUserId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !selectedUserId) return;
    setSending(true);
    const ok = await sendMessage(selectedUserId, draft.trim());
    if (ok) setDraft("");
    setSending(false);
  };

  const selectedConv = conversations.find((c) => c.user_id === selectedUserId);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 flex overflow-hidden">
        <VerifiedGate featureName="la Messagerie privée">
          {/* Conversations list */}
          <div className="flex flex-1 overflow-hidden">
            <div className="w-80 shrink-0 border-r border-border flex flex-col">
              <div className="border-b border-border px-5 py-4">
                <h1 className="text-lg font-extrabold text-foreground">Messages</h1>
                <p className="text-xs text-muted-foreground">Conversations privées entre Témoins</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Aucune conversation pour le moment.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connecte-toi avec des Témoins depuis le Hub Social.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUserId(conv.user_id)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors cursor-pointer border-b border-border/50 ${
                        selectedUserId === conv.user_id ? "bg-primary/10" : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                          {conv.avatar_initials}
                        </div>
                        {conv.is_verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full gold-gradient">
                            <ShieldCheck className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground truncate">{conv.display_name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: fr })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {!selectedUserId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">Sélectionne une conversation</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                    <div className="relative">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                        {selectedConv?.avatar_initials || "??"}
                      </div>
                      {selectedConv?.is_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full gold-gradient">
                          <ShieldCheck className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">{selectedConv?.display_name}</span>
                      {selectedConv?.is_verified && (
                        <Badge className="ml-2 h-5 border-0 bg-primary/15 text-[10px] text-primary">Témoin</Badge>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Messages expirent après 30 jours</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02, duration: 0.2 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-3xl px-4 py-3 ${
                              isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Input */}
                  <div className="border-t border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder="Écris ton message…"
                        className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !draft.trim()}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl gold-gradient text-primary-foreground transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </VerifiedGate>
      </main>

      <SecuritySovereign />
      <AmalTrigger />
      <MobileBottomNav />
    </div>
  );
};

export default Messages;

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Crown, Heart, Lock, MessageCircle, Send, ArrowLeft, MapPin, Loader2, Flag, UserMinus, MoreVertical } from "lucide-react";
import { DatingMatch } from "@/hooks/useDating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReportDialog from "@/components/ReportDialog";
import { useToast } from "@/hooks/use-toast";

interface DatingMatchesProps {
  matches: DatingMatch[];
  isPremium: boolean;
  onGoldClick: () => void;
  onUnmatch?: (matchId: string) => Promise<boolean>;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const DatingMatches = ({ matches, isPremium, onGoldClick, onUnmatch }: DatingMatchesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeChat, setActiveChat] = useState<DatingMatch | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("dating_messages")
        .select("*")
        .eq("match_id", activeChat.match_id)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((data as ChatMessage[]) || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`dating-chat-${activeChat.match_id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "dating_messages",
        filter: `match_id=eq.${activeChat.match_id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !activeChat || !newMsg.trim()) return;
    setSending(true);
    const trimmed = newMsg.trim().slice(0, 1000);
    await supabase.from("dating_messages").insert({
      match_id: activeChat.match_id,
      sender_id: user.id,
      content: trimmed,
    });
    setNewMsg("");
    setSending(false);
  };

  const handleUnmatch = async () => {
    if (!activeChat || !onUnmatch) return;
    const ok = await onUnmatch(activeChat.match_id);
    if (ok) {
      toast({ title: "Match défait", description: "La conversation a été supprimée." });
      setActiveChat(null);
      setConfirmUnmatch(false);
      setMenuOpen(false);
    }
  };

  // Gold gate
  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md rounded-3xl border border-primary/20 bg-card p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Matchs réservés aux Gold</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu as {matches.length} match{matches.length !== 1 ? "s" : ""} en attente ! Passe Gold pour découvrir qui et commencer à discuter.
        </p>
        <button
          onClick={onGoldClick}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-extrabold text-primary-foreground cursor-pointer"
        >
          <Crown className="h-4 w-4" /> Débloquer mes matchs
        </button>
      </motion.div>
    );
  }

  // Chat view
  if (activeChat) {
    return (
      <div className="flex h-[calc(100vh-220px)] flex-col rounded-3xl border border-border bg-card">
        {/* Header */}
        <div className="relative flex items-center gap-3 border-b border-border px-5 py-4">
          <button onClick={() => setActiveChat(null)} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
            {activeChat.partner_initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{activeChat.partner_name}</p>
            <p className="text-[11px] text-muted-foreground">
              <MapPin className="mr-0.5 inline h-3 w-3" />{activeChat.partner_city || "—"}
            </p>
          </div>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary cursor-pointer"
            title="Options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-3 top-14 z-20 w-52 rounded-2xl border border-border bg-card shadow-xl py-1.5">
              <button
                onClick={() => { setReportOpen(true); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
              >
                <Flag className="h-3.5 w-3.5 text-destructive" /> Signaler
              </button>
              <button
                onClick={() => { setConfirmUnmatch(true); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <UserMinus className="h-3.5 w-3.5" /> Défaire le match
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              💬 C'est un match ! Envoie le premier message…
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMine
                      ? "gold-gradient text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Écris un message…"
            className="flex-1 rounded-2xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!newMsg.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Confirm unmatch dialog */}
        {confirmUnmatch && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-3xl">
            <div className="w-[90%] max-w-sm rounded-3xl border border-destructive/30 bg-card p-6">
              <h3 className="mb-2 text-base font-bold text-foreground">Défaire ce match ?</h3>
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                Cette action efface le match, vos messages, et empêche un nouveau match instantané. Action irréversible.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmUnmatch(false)}
                  className="flex-1 rounded-2xl border border-border bg-secondary py-2.5 text-xs font-bold text-foreground cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUnmatch}
                  className="flex-1 rounded-2xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetUserId={activeChat.partner_id}
        />
      </div>
    );
  }

  // Match list
  return (
    <div>
      <div className="mb-5 flex items-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 px-5 py-3">
        <Heart className="h-5 w-5 text-primary fill-primary" />
        <p className="text-sm font-bold text-foreground">
          {matches.length} match{matches.length !== 1 ? "s" : ""} mutuels
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Aucun match pour le moment. Continue à liker des profils ! 💫</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m, i) => (
            <motion.button
              key={m.match_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setActiveChat(m)}
              className="flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-base font-bold text-foreground">
                {m.partner_initials}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{m.partner_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  <MapPin className="mr-0.5 inline h-3 w-3" />{m.partner_city || "—"} · {m.partner_university || "—"}
                </p>
              </div>
              <MessageCircle className="h-5 w-5 text-primary" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatingMatches;

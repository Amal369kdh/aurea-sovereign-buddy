import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, Lock, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aya-chat`;
const SESSION_KEY = "amal_chat_history";

const SUGGESTIONS = [
  "Quelles aides financières pour un étudiant étranger ?",
  "Comment ouvrir un compte bancaire en France ?",
  "Aide-moi à faire mon budget mensuel",
  "Quelles démarches pour un titre de séjour ?",
];

interface AmalChatProps {
  open: boolean;
  onClose: () => void;
}

type AmalStatus = {
  remaining: number;
  is_premium: boolean;
  limit: number;
  used: number;
  integration_progress: number;
} | null;

const AmalChat = ({ open, onClose }: AmalChatProps) => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AmalStatus>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [locked, setLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  }), [session]);

  // Check status when chat opens
  useEffect(() => {
    if (!open) return;
    setStatusLoading(true);
    fetch(CHAT_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ check_only: true, messages: [] }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "locked") {
          setLocked(true);
        } else if (data.remaining !== undefined) {
          setStatus(data);
          // Only lock if limit reached AND we already have messages (user saw response)
          if (data.remaining <= 0 && !data.is_premium && messages.length > 0) {
            setLimitReached(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, [open, authHeaders]);

  useEffect(() => {
    if (open && !locked && !limitReached) inputRef.current?.focus();
  }, [open, locked, limitReached]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const streamChat = useCallback(
    async (allMessages: Msg[]) => {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ messages: allMessages }),
      });

      if (resp.status === 403) {
        const data = await resp.json();
        if (data.error === "limit_reached") {
          setLimitReached(true);
          throw new Error("Tu as utilisé tes messages gratuits. Passe en Gold pour continuer avec Amal !");
        }
        if (data.error === "locked") {
          setLocked(true);
          throw new Error("Complète ta roadmap pour débloquer Amal.");
        }
      }

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erreur réseau" }));
        throw new Error(err.error || "Erreur réseau");
      }

      // Update remaining from header
      const rem = resp.headers.get("X-Aya-Remaining");
      if (rem !== null) {
        const r = parseInt(rem);
        setStatus((prev) => prev ? { ...prev, remaining: r < 0 ? Infinity : r, used: prev.used + 1 } : prev);
        // Don't lock immediately — let the user read the streamed response first
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantSoFar = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const snapshot = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
          }
          return [...prev, { role: "assistant", content: snapshot }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // After stream completes, check if this was the last free message
      if (rem !== null && parseInt(rem) <= 0) {
        setLimitReached(true);
      }
    },
    [session, authHeaders]
  );

  const send = async (text: string) => {
    if (!text.trim() || isLoading || limitReached || locked) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${e.message || "Erreur de connexion"}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLockedScreen = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Lock className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-sm font-bold text-foreground">Amal est verrouillé</h3>
      <p className="text-xs text-muted-foreground">
        {locked
          ? `Tu dois atteindre au moins 20% de progression dans ta roadmap pour débloquer Amal. Tu en es à ${status?.integration_progress ?? 0}%.`
          : "Tu as utilisé tes messages gratuits. Passe en Gold pour un accès illimité à Amal !"}
      </p>
      <button className="mt-2 flex items-center gap-2 rounded-xl gold-gradient px-4 py-2 text-xs font-bold text-primary-foreground">
        <Crown className="h-4 w-4" /> Passer Gold
      </button>
    </div>
  );

  // Show lock screen only if locked by progress OR if limit reached and no active streaming
  const showLockScreen = locked || (limitReached && !isLoading);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-4 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 gold-gradient">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
              <span className="text-sm font-bold text-primary-foreground">Amal — Coach IA</span>
            </div>
            <div className="flex items-center gap-2">
              {status && !status.is_premium && !locked && (
                <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {status.remaining}/{status.limit}
                </span>
              )}
              <button onClick={onClose} className="rounded-full p-1 text-primary-foreground/80 hover:text-primary-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {statusLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : showLockScreen && messages.length === 0 ? (
            renderLockedScreen()
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Salut ! Je suis <strong className="gold-text">Amal</strong>, ton assistant. Pose-moi une question ou choisis un sujet 👇
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-foreground hover:border-primary/50 hover:bg-secondary transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-secondary px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}

                {/* Soft lock banner after messages */}
                {limitReached && !locked && !isLoading && messages.length > 0 && (
                  <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                      Tu as utilisé tes {status?.limit ?? 2} messages gratuits avec Amal.
                    </p>
                    <button className="flex items-center gap-2 mx-auto rounded-xl gold-gradient px-4 py-2 text-xs font-bold text-primary-foreground">
                      <Crown className="h-3 w-3" /> Passer Gold pour un accès illimité
                    </button>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={limitReached ? "Passe Gold pour continuer..." : "Pose ta question à Amal..."}
                    className="flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                    disabled={isLoading || limitReached}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim() || limitReached}
                    className="flex h-9 w-9 items-center justify-center rounded-xl gold-gradient text-primary-foreground disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AmalChat;

import { useState, useRef, useEffect } from "react";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const typeIcon: Record<string, string> = {
  new_message: "💬",
  new_match: "💛",
  new_comment: "🗨️",
  mention: "👋",
  system: "📢",
};

// Navigate to the notification's origin when clicked — deep-link to post when possible
function useNotificationTarget() {
  const navigate = useNavigate();
  return (type: string, data: Record<string, unknown> | null) => {
    if (!data) return;
    if (type === "new_message" && data.sender_id) {
      navigate("/messages");
    } else if ((type === "new_comment" || type === "mention") && data.announcement_id) {
      // Deep-link: pass announcement_id as query param so HubSocial can scroll to it
      navigate(`/hub-social?post=${data.announcement_id}`);
    } else if (type === "new_match" && data.match_id) {
      navigate("/hub-social?tab=matchs");
    }
  };
}

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const goToOrigin = useNotificationTarget();

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-2xl transition-colors hover:bg-sidebar-accent cursor-pointer"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary" />
        ) : (
          <Bell className="h-5 w-5 text-muted-foreground" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full gold-gradient text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            // Mobile : plein écran depuis le bord droit / Desktop : ancré à droite, jamais coupé à gauche
            className="fixed right-2 top-16 z-50 w-[calc(100vw-1rem)] max-w-sm rounded-3xl border border-border bg-card shadow-xl overflow-hidden sm:right-4 sm:w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-bold text-foreground">
                Notifications {unreadCount > 0 && <span className="ml-1 text-primary">({unreadCount})</span>}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tout lire
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Rien de nouveau 🎉
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead(n.id);
                      goToOrigin(n.type, n.data);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent cursor-pointer ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 text-lg leading-none shrink-0">
                      {typeIcon[n.type] ?? "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${!n.is_read ? "text-primary" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;

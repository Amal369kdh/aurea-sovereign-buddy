import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderLock, Users, MessageCircle, ShieldAlert, Handshake, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FolderLock, label: "Dossier", path: "/mon-dossier" },
  { icon: Users, label: "Social", path: "/hub-social" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Handshake, label: "Partenaires", path: "/partners" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(data?.status === "admin"));
  }, [user]);

  const allItems = [
    ...navItems,
    ...(isAdmin ? [{ icon: ShieldAlert, label: "Admin", path: "/admin" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-around border-t border-border bg-card/95 backdrop-blur-lg px-2 py-2 safe-bottom">
      {allItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="relative flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-colors cursor-pointer"
          >
            {active && (
              <motion.div
                layoutId="mobile-nav-active"
                className="absolute inset-0 rounded-2xl bg-primary/15"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            {/* Badge for messages unread */}
            {item.path === "/messages" && unreadCount > 0 && (
              <span className="absolute right-2 top-1 flex h-4 w-4 items-center justify-center rounded-full gold-gradient text-[9px] font-bold text-primary-foreground z-20">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <item.icon
              className={`relative z-10 h-5 w-5 ${
                active
                  ? item.path === "/admin"
                    ? "text-destructive"
                    : "text-primary"
                  : "text-muted-foreground"
              }`}
            />
            <span
              className={`relative z-10 text-[10px] font-semibold ${
                active
                  ? item.path === "/admin"
                    ? "text-destructive"
                    : "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;

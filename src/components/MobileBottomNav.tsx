import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderLock, Users, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FolderLock, label: "Dossier", path: "/mon-dossier" },
  { icon: Users, label: "Social", path: "/hub-social" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-around border-t border-border bg-card/95 backdrop-blur-lg px-2 py-2 safe-bottom">
      {navItems.map((item) => {
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
            <item.icon
              className={`relative z-10 h-5 w-5 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span
              className={`relative z-10 text-[10px] font-semibold ${
                active ? "text-primary" : "text-muted-foreground"
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

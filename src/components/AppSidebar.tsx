import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderLock,
  Users,
  MessageCircle,
  Sparkles,
  Settings,
  Crown,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FolderLock, label: "Mon Dossier", path: "/mon-dossier" },
  { icon: Users, label: "Hub Social", path: "/hub-social" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Sparkles, label: "Aya IA", path: "#" },
  { icon: Settings, label: "Réglages", path: "#" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-border bg-sidebar p-4">
      <div className="mb-8 flex items-center gap-2 px-3 cursor-pointer" onClick={() => navigate("/")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl gold-gradient">
          <Crown className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-extrabold gold-text">Aurea</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              onClick={() => item.path !== "#" && navigate(item.path)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl gold-gradient p-4">
        <p className="text-sm font-bold text-primary-foreground">Passe Gold ✨</p>
        <p className="mt-1 text-xs text-primary-foreground/70">
          Débloque Aya illimitée et le mode rencontre.
        </p>
        <button className="mt-3 w-full rounded-xl bg-primary-foreground/20 py-2 text-xs font-bold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/30">
          Découvrir
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

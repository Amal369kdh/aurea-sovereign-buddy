import { MapPin, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="flex items-center justify-between px-6 py-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="gold-text">Aurea</span>{" "}
          <span className="text-foreground">Student</span>
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>Grenoble, France</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" />
          {displayName}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full gold-gradient text-sm font-bold text-primary-foreground">
          {initials}
        </div>
        <button
          onClick={signOut}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive cursor-pointer"
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;

import { MapPin, ShieldCheck, LogOut, Settings } from "lucide-react";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const [city, setCity] = useState("France");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("city")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.city) setCity(data.city);
      });
  }, [user]);

  return (
    <header className="flex items-center justify-between px-6 py-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="gold-text">Aurea</span>{" "}
          <span className="text-foreground">Student</span>
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{city}, France</span>
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
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-accent cursor-pointer"
              title="Réglages"
            >
              <Settings className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-3 space-y-2">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
            <div className="border-t border-border pt-2">
              <DeleteAccountButton />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};

export default DashboardHeader;

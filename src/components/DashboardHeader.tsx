import { MapPin, ShieldCheck, LogOut, Settings, User, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ProfileData = {
  city: string | null;
  next_deadline_date: string | null;
  next_deadline_label: string | null;
};

const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const [profile, setProfile] = useState<ProfileData>({ city: null, next_deadline_date: null, next_deadline_label: null });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("city, next_deadline_date, next_deadline_label")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as ProfileData);
      });
  }, [user]);

  // Compute days until deadline
  const daysUntil = profile.next_deadline_date
    ? Math.ceil((new Date(profile.next_deadline_date).getTime() - Date.now()) / 86_400_000)
    : null;
  const deadlineUrgent = daysUntil !== null && daysUntil <= 7;

  return (
    <header className="px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="gold-text">Aurea</span>{" "}
            <span className="text-foreground">Student</span>
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{profile.city ?? "France"}, France</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
                onClick={() => navigate("/profile")}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <User className="h-4 w-4" />
                Mon profil
              </button>
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
      </div>

      {/* Prochaine échéance administrative */}
      {profile.next_deadline_label && daysUntil !== null && daysUntil >= 0 && (
        <div
          className={`mt-3 flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 ${
            deadlineUrgent
              ? "border-destructive/30 bg-destructive/5"
              : "border-primary/20 bg-primary/5"
          }`}
        >
          <CalendarClock className={`h-3.5 w-3.5 shrink-0 ${deadlineUrgent ? "text-destructive" : "text-primary"}`} />
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-semibold ${deadlineUrgent ? "text-destructive" : "text-primary"}`}>
              {profile.next_deadline_label}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              — dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
            </span>
          </div>
          {deadlineUrgent && (
            <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
              Urgent
            </span>
          )}
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;

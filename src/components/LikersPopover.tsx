import { useState, useEffect } from "react";
import { Crown, Heart, Loader2, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LikersPopoverProps {
  announcementId: string;
  likesCount: number;
  likedByMe: boolean;
  onToggleLike: () => void;
  onGoldClick: () => void;
}

interface LikerProfile {
  display_name: string;
  avatar_initials: string;
}

const LikersPopover = ({ announcementId, likesCount, likedByMe, onToggleLike, onGoldClick }: LikersPopoverProps) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [open, setOpen] = useState(false);

  // Check premium status
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setIsPremium(data.is_premium);
      });
  }, [user]);

  const fetchLikers = async () => {
    if (!isPremium || likesCount === 0) return;
    setLoadingLikers(true);

    const { data: likes } = await supabase
      .from("announcement_likes")
      .select("user_id")
      .eq("announcement_id", announcementId)
      .limit(20);

    if (likes && likes.length > 0) {
      const userIds = likes.map((l) => l.user_id);
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("display_name, avatar_initials")
        .in("user_id", userIds);

      setLikers(
        (profiles || []).map((p) => ({
          display_name: p.display_name || "Anonyme",
          avatar_initials: p.avatar_initials || "??",
        }))
      );
    }
    setLoadingLikers(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && isPremium) fetchLikers();
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onToggleLike}
        className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
          likedByMe ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
        }`}
      >
        <Heart className={`h-4 w-4 ${likedByMe ? "fill-primary" : ""}`} />
      </button>

      {likesCount > 0 && (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              {likesCount}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 rounded-2xl border border-border bg-card p-3" align="start">
            {isPremium ? (
              loadingLikers ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Aimé par
                  </p>
                  {likers.map((liker, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-foreground">
                        {liker.avatar_initials}
                      </div>
                      <span className="text-xs font-medium text-foreground">{liker.display_name}</span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {likesCount} personne{likesCount > 1 ? "s" : ""} {likesCount > 1 ? "ont" : "a"} aimé
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Passe Gold pour voir qui a aimé tes publications
                </p>
                <button
                  onClick={() => { setOpen(false); onGoldClick(); }}
                  className="mt-1 flex items-center gap-1.5 rounded-xl gold-gradient px-4 py-1.5 text-[11px] font-bold text-primary-foreground cursor-pointer"
                >
                  <Crown className="h-3 w-3" /> Débloquer Gold
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {likesCount === 0 && (
        <span className="text-xs text-muted-foreground">0</span>
      )}
    </div>
  );
};

export default LikersPopover;

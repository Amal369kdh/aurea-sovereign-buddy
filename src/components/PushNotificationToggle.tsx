import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const PushNotificationToggle = () => {
  const { permission, subscribe, unsubscribe, loading } = usePushNotifications();
  const { toast } = useToast();

  if (permission === "unsupported") {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Les notifications push ne sont pas supportées par ton navigateur</span>
      </div>
    );
  }

  const isEnabled = permission === "granted";

  const handleToggle = async () => {
    if (isEnabled) {
      await unsubscribe();
      toast({ title: "Notifications désactivées", description: "Tu ne recevras plus de notifications push." });
    } else {
      const ok = await subscribe();
      if (ok) {
        toast({ title: "Notifications activées 🔔", description: "Tu recevras les notifications même quand l'app est fermée." });
      } else if (permission === "denied") {
        toast({
          title: "Notifications bloquées",
          description: "Autorise les notifications dans les paramètres de ton navigateur.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium">Notifications push</p>
          <p className="text-xs text-muted-foreground">
            {isEnabled ? "Activées — tu reçois les alertes en temps réel" : "Reçois les alertes même quand l'app est fermée"}
          </p>
        </div>
      </div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      )}
    </div>
  );
};

export default PushNotificationToggle;

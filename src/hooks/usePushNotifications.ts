import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BJuEknJHaGL_TV9sUIFvBebsnIxZF8wncIlhV-tS49dHYIF8er_qKgBvBW7uZLw1SNcRyDe2J0YbW0zwVMkdRq8";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type PushState = "prompt" | "granted" | "denied" | "unsupported";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushState>("prompt");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushState);
  }, []);

  const subscribe = useCallback(async () => {
    if (!user || permission === "unsupported") return false;
    setLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushState);
      if (result !== "granted") {
        setLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription first
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Invalid subscription");
      }

      // Save to database (upsert by user_id + endpoint)
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        { onConflict: "user_id,endpoint" },
      );

      if (error) throw error;
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      setLoading(false);
      return false;
    }
  }, [user, permission]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", endpoint);
      }
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
  }, [user]);

  return { permission, subscribe, unsubscribe, loading };
};

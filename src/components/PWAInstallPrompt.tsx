import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Déjà installé ou déjà refusé récemment → on n'affiche pas
    const dismissed = localStorage.getItem("aurea_pwa_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Déjà en mode standalone (installé)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const iosCheck =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (iosCheck) {
      // Sur iOS, on affiche notre propre banner (pas de beforeinstallprompt)
      setIsIOS(true);
      // Délai pour ne pas afficher immédiatement
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShow(false);
      }
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("aurea_pwa_dismissed", Date.now().toString());
    setShow(false);
  };

  if (isInstalled || (!show)) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80"
        >
          <div className="rounded-3xl border border-primary/30 bg-card shadow-2xl shadow-black/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gold-gradient">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  Installe l'app Aurea 📱
                </p>
                {isIOS ? (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Appuie sur{" "}
                    <span className="font-semibold text-foreground">
                      Partager ↑
                    </span>{" "}
                    puis{" "}
                    <span className="font-semibold text-foreground">
                      Sur l'écran d'accueil
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Accès rapide depuis ton écran d'accueil. Fonctionne offline.
                  </p>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
              >
                <Download className="h-4 w-4" />
                Installer gratuitement
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;

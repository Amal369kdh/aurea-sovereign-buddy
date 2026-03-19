import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import AmalChat from "./AmalChat";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const AmalTrigger = () => {
  const [open, setOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { flags } = useFeatureFlags();
  const amalEnabled = flags["amal_chat"] !== false;

  // Masquer le bouton quand le clavier virtuel est actif sur mobile
  useEffect(() => {
    const initialHeight = window.innerHeight;
    const handleResize = () => {
      // Si la hauteur diminue de plus de 150px, le clavier est probablement ouvert
      setKeyboardVisible(window.innerHeight < initialHeight - 150);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!amalEnabled) return null;

  return (
    <>
      <AnimatePresence>
        {!keyboardVisible && (
          <motion.button
            data-amal-trigger
            className="fixed bottom-24 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full gold-gradient shadow-lg animate-pulse-gold cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen((v) => !v)}
            aria-label="Lancer Amal"
            style={{ willChange: "auto" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
      <AmalChat open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AmalTrigger;

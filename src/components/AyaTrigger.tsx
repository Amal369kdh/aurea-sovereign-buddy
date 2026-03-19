import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AmalChat from "./AmalChat";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const AmalTrigger = () => {
  const [open, setOpen] = useState(false);
  const { flags } = useFeatureFlags();
  const amalEnabled = flags["amal_chat"] !== false;

  if (!amalEnabled) return null;

  return (
      <motion.button
        data-amal-trigger
        className="fixed bottom-24 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full gold-gradient shadow-lg animate-pulse-gold cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Lancer Amal"
        style={{ willChange: "auto" }}
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </motion.button>
      <AmalChat open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AmalTrigger;

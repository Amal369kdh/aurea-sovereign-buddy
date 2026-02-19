import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AyaChat from "./AyaChat";

const AyaTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gold-gradient shadow-lg animate-pulse-gold cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Lancer Aya"
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </motion.button>
      <AyaChat open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AyaTrigger;

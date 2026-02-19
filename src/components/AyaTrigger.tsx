import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AmalChat from "./AmalChat";

const AmalTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gold-gradient shadow-lg animate-pulse-gold cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Lancer Amal"
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </motion.button>
      <AmalChat open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AmalTrigger;

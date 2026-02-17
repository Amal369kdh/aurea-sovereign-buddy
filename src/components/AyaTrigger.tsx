import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const AyaTrigger = () => {
  return (
    <motion.button
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gold-gradient shadow-lg animate-pulse-gold cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Lancer Aya"
    >
      <Sparkles className="h-6 w-6 text-primary-foreground" />
    </motion.button>
  );
};

export default AyaTrigger;

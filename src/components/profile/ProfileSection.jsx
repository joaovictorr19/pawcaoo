import React from "react";
import { motion } from "framer-motion";

// Wrapper que aplica animação de fade + slide-up escalonada com spring suave
// Cada secção do perfil "sobe" fluidamente ao carregar
export default function ProfileSection({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
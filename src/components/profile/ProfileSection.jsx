import React from "react";
import { motion } from "framer-motion";

// Wrapper que aplica animação de fade + slide-up escalonada com spring suave
// Cada secção do perfil "sobe" fluidamente ao carregar
export default function ProfileSection({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Mostra uma mensagem de confirmação visual quando `show` é true.
 * Auto-desaparece após `duration` ms (default 3s).
 */
export default function SaveConfirmation({ show, message = "Dados salvos com sucesso!", duration = 3000, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(t);
    }
  }, [show, duration, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </motion.span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
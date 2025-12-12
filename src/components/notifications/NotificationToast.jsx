import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertCircle, CheckCircle, Info, Zap } from 'lucide-react';

// Context para gerenciar notificações toast
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Container Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { 
      id, 
      ...toast,
      timestamp: Date.now()
    };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove após duração
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Container fixo que organiza a pilha
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed z-[9999] pointer-events-none">
      {/* Desktop: bottom-right */}
      <div className="hidden md:block fixed bottom-4 right-4 w-[400px] max-w-[calc(100vw-2rem)]">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              index={index}
              onRemove={onRemove}
              position="desktop"
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile: top-center (estilo iPhone, abaixo do header) */}
      <div className="md:hidden fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-md">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              index={index}
              onRemove={onRemove}
              position="mobile"
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Componente individual de Toast
function ToastItem({ toast, index, onRemove, position }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'warning': return <Zap className="w-5 h-5 text-orange-600 flex-shrink-0" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
      default: return <Bell className="w-5 h-5 text-gray-600 flex-shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-orange-500';
      case 'info': return 'border-blue-500';
      default: return 'border-gray-400';
    }
  };

  const animations = position === 'desktop' 
    ? {
        initial: { opacity: 0, x: 100, scale: 0.9 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 100, scale: 0.9 }
      }
    : {
        initial: { opacity: 0, y: -50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -50, scale: 0.9 }
      };

  return (
    <motion.div
      layout
      {...animations}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
        layout: { duration: 0.2 }
      }}
      className="mb-3 pointer-events-auto"
      style={{
        zIndex: 9999 - index // Mais recente fica no topo
      }}
    >
      <div className={`
        relative overflow-hidden rounded-2xl border-2 ${getBorderColor()}
        bg-white/85 backdrop-blur-xl
        shadow-xl shadow-black/10
        min-h-[80px] max-w-full
      `}>
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative p-4 flex gap-3 items-start">
          {/* Icon */}
          <div className="mt-0.5">
            {getIcon()}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="font-bold text-sm text-gray-900 mb-1 leading-tight">
                {toast.title}
              </h4>
            )}
            {toast.description && (
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                {toast.description}
              </p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Progress bar (auto-dismiss indicator) */}
        {toast.duration && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-30"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Hook helper para uso fácil
export function useNotificationToast() {
  const { addToast } = useToast();

  return {
    success: (title, description, action) => addToast({ type: 'success', title, description, action }),
    error: (title, description, action) => addToast({ type: 'error', title, description, action }),
    warning: (title, description, action) => addToast({ type: 'warning', title, description, action }),
    info: (title, description, action) => addToast({ type: 'info', title, description, action }),
    custom: (config) => addToast(config),
  };
}
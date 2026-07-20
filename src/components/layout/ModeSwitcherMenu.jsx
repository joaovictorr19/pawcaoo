import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Briefcase, User, Shield, Hotel } from 'lucide-react';

const ICONS = { professional: Briefcase, client: User, admin: Shield, hotel: Hotel };
const ICON_STYLES = {
  professional: 'bg-teal-50 text-[#207373]',
  client: 'bg-orange-50 text-orange-500',
  admin: 'bg-purple-50 text-purple-600',
  hotel: 'bg-blue-50 text-blue-600',
};

/**
 * Dropdown premium para alternar entre painéis (Profissional / Cliente / Admin / Hotel).
 */
export default function ModeSwitcherMenu({ open, onToggle, currentLabel, options }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 h-8 pl-3 pr-2.5 text-[11px] font-bold rounded-full transition-all duration-200 text-[#1a1a1a] active:scale-95"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: open ? '0 2px 10px rgba(32, 115, 115, 0.15)' : 'none',
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-2xl p-1.5 w-[200px] origin-top"
            style={{
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.16)',
            }}
          >
            <p className="px-3 pt-1.5 pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
              Mudar de painel
            </p>
            <div className="space-y-0.5">
              {options.map((opt) => {
                const Icon = ICONS[opt.key] || User;
                const iconCls = ICON_STYLES[opt.key] || ICON_STYLES.client;
                return (
                  <button
                    key={opt.key}
                    onClick={opt.onClick}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-left ${
                      opt.active ? 'bg-[#207373]/8' : 'hover:bg-slate-50 active:bg-slate-100'
                    }`}
                    style={opt.active ? { background: 'rgba(32, 115, 115, 0.08)' } : {}}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className={`flex-1 text-xs font-bold ${opt.active ? 'text-[#207373]' : 'text-slate-800'}`}>
                      {opt.label}
                    </span>
                    {opt.active && <Check className="w-4 h-4 text-[#207373] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
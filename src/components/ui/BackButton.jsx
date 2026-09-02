import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Seta para voltar à página anterior — usada nos painéis.
 */
export default function BackButton({ className = '', to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : (window.history.length > 1 ? navigate(-1) : navigate('/')))}
      aria-label="Voltar"
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-slate-200 text-slate-700 hover:bg-white hover:text-slate-900 shadow-sm transition-all active:scale-95 shrink-0 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}
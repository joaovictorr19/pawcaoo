import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';

const LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export { LANGUAGES };

export default function LanguageSelector({ className = '' }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="h-8 w-8 rounded-full flex items-center justify-center text-base hover:bg-slate-100 transition-colors border border-slate-200"
        title={current.name}
        aria-label="Selecionar idioma"
      >
        {current.flag}
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 min-w-[130px]">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${language === lang.code ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
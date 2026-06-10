import React from 'react';
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

  return (
    <div className={`flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 gap-0.5 ${className}`}>
      {LANGUAGES.map((option) => (
        <button
          key={option.code}
          onClick={() => setLanguage(option.code)}
          aria-label={option.name}
          title={option.name}
          className={`h-7 w-7 rounded-full text-sm transition-all ${
            language === option.code
              ? 'bg-white shadow-sm ring-1 ring-slate-200 scale-110'
              : 'opacity-50 hover:opacity-80'
          }`}
        >
          {option.flag}
        </button>
      ))}
    </div>
  );
}
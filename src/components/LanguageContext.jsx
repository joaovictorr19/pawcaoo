import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Supported languages
const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'fr', 'de', 'it'];

// Browser language to our language code mapping
const BROWSER_LANG_MAP = {
  'pt': 'pt',
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'fr': 'fr',
  'fr-FR': 'fr',
  'de': 'de',
  'de-DE': 'de',
  'it': 'it',
  'it-IT': 'it'
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'pt',
      setLanguage: () => {},
      availableLanguages: SUPPORTED_LANGUAGES
    };
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    // 1. Check URL params first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      if (langParam && SUPPORTED_LANGUAGES.includes(langParam)) {
        return langParam;
      }
    }
    
    // 2. Check localStorage
    const savedLang = localStorage.getItem('pawcao_language');
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
      return savedLang;
    }
    
    // 3. Detect from browser
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage;
      if (BROWSER_LANG_MAP[browserLang]) {
        return BROWSER_LANG_MAP[browserLang];
      }
      // Try just the first part (e.g., 'pt' from 'pt-PT')
      const baseLang = browserLang.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(baseLang)) {
        return baseLang;
      }
    }
    
    // 4. Default to Portuguese
    return 'pt';
  });

  const setLanguage = (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('pawcao_language', lang);
      
      // Update HTML lang attribute for SEO
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    localStorage.setItem('pawcao_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    availableLanguages: SUPPORTED_LANGUAGES
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
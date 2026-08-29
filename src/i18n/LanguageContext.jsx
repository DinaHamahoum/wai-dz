import { createContext, useContext, useState, useEffect } from 'react';
import fr from './fr';
import ar from './ar';

const translations = { fr, ar };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('wai-lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('wai-lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      result = result?.[k];
    }
    return result ?? key;
  };

  const toggleLang = () => setLang((l) => (l === 'fr' ? 'ar' : 'fr'));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};

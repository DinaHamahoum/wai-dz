import { useLanguage } from '../i18n/LanguageContext';

/**
 * Compact language switcher (FR | AR) for use inside dashboard sidebars.
 * Reads and updates the global LanguageContext.
 */
export default function LanguageSwitcher({ isRTL }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border-gold)',
        background: 'var(--color-accent-light)',
        gap: 0,
        marginBottom: 8,
      }}
    >
      <button
        onClick={() => setLang('fr')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          padding: '0 8px',
          color: lang === 'fr' ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
          transition: 'color 0.2s',
        }}
        title="Français"
      >
        FR
      </button>
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-border-gold)',
          userSelect: 'none',
        }}
      >
        |
      </span>
      <button
        onClick={() => setLang('ar')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          padding: '0 8px',
          color: lang === 'ar' ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
          transition: 'color 0.2s',
        }}
        title="العربية"
      >
        AR
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/logo.png';

export default function Navbar({ hideAuth = false }) {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';  
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.howItWorks'), href: '/#comment-ca-marche' },
    { label: t('nav.about'), href: '/#acteurs' },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 'var(--nav-height)',
        background: isTransparent ? 'transparent' : scrolled ? 'rgba(251, 249, 245, 0.97)' : 'var(--color-bg)',
        backdropFilter: isTransparent ? 'none' : 'blur(20px)',
        borderBottom: isTransparent ? 'none' : '1px solid var(--color-border)',
        boxShadow: isTransparent ? 'none' : scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Haute Classe Capsule Logo Badge */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="logo-badge">
            <img src={logo} alt="WAI DZ" />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center" style={{ gap: 44 }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: isTransparent ? 'rgba(255,255,255,0.88)' : 'var(--color-primary)',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = isTransparent ? '#ffffff' : 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.color = isTransparent ? 'rgba(255,255,255,0.88)' : 'var(--color-primary)'}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Language Switcher */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: isTransparent ? '1px solid rgba(255,255,255,0.45)' : '1px solid var(--color-border-gold)',
              background: 'transparent',
              gap: 0,
            }}
          >
            <button
              onClick={() => setLang('fr')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.15em',
                padding: '0 6px',
                color: isTransparent
                  ? (lang === 'fr' ? '#ffffff' : 'rgba(255,255,255,0.4)')
                  : (lang === 'fr' ? 'var(--color-accent-dark)' : 'var(--color-text-muted)'),
                transition: 'all var(--transition)',
              }}
            >
              FR
            </button>
            <span style={{
              fontSize: 10,
              color: isTransparent ? 'rgba(255,255,255,0.3)' : 'var(--color-border-gold)',
              userSelect: 'none',
            }}>|</span>
            <button
              onClick={() => setLang('ar')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.15em',
                padding: '0 6px',
                color: isTransparent
                  ? (lang === 'ar' ? '#ffffff' : 'rgba(255,255,255,0.4)')
                  : (lang === 'ar' ? 'var(--color-accent-dark)' : 'var(--color-text-muted)'),
                transition: 'all var(--transition)',
              }}
            >
              AR
            </button>
          </div>

          {!hideAuth ? (
            <div className="hidden md:flex items-center" style={{ gap: 18 }}>
              <Link
                to="/login"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: isTransparent ? 'rgba(255,255,255,0.88)' : 'var(--color-primary)',
                  transition: 'color var(--transition)',
                }}
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="btn btn-haute"
                style={{
                  fontSize: 11,
                  padding: '12px 28px',
                  background: isTransparent ? '#ffffff' : 'var(--color-primary)',
                  color: isTransparent ? 'var(--color-primary)' : '#ffffff',
                  transition: 'all var(--transition)',
                }}
              >
                {t('nav.register')}
              </Link>
            </div>
          ) : null}

          {/* Mobile hamburger */}
          <button
            className="flex md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              padding: 8, borderRadius: 4,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: isTransparent ? '#ffffff' : 'var(--color-primary)',
            }}
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '28px',
          display: 'flex', flexDirection: 'column', gap: 18,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '10px 12px',
                fontSize: 15,
                fontWeight: 500,
                textDecoration: 'none',
                color: 'var(--color-text)',
              }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <div style={{ paddingTop: 18, borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button
              onClick={() => { setLang(lang === 'fr' ? 'ar' : 'fr'); setMenuOpen(false); }}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-primary)',
                fontSize: 13, fontWeight: 600,
                letterSpacing: '0.12em',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {lang === 'fr' ? 'AR' : 'FR'}
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              {!hideAuth && (
                <>
                  <Link to="/login" className="btn btn-outline-gold" style={{ flex: 1 }}>{t('nav.login')}</Link>
                  <Link to="/register" className="btn btn-haute" style={{ flex: 1 }}>{t('nav.register')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

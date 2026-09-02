import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/logo.png';

export default function Footer() {
  const { t, lang } = useLanguage();

  return (
    <footer style={{
      background: 'var(--color-primary-dark)',
      color: 'rgba(255,255,255,0.7)',
      paddingTop: 80,
      paddingBottom: 40,
      fontFamily: 'var(--font-sans)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 60 }}>

          {/* Brand — Logo Capsule Badge */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <div className="logo-badge">
                  <img src={logo} alt="WAI DZ" />
                </div>
              </Link>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.8, maxWidth: 280, color: 'rgba(255,255,255,0.6)' }}>
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <p style={{ color: '#ffffff', fontWeight: 600, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              {t('footer.links.platform')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: t('footer.links.home'), href: '/' },
                { label: t('footer.links.about'), href: '/#acteurs' },
              ].map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/recyclage/inscription"
                style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-accent)'}
              >
                {lang === 'fr' ? 'Espace Professionnel' : 'الفضاء المهني'}
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p style={{ color: '#ffffff', fontWeight: 600, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              {t('footer.links.legal')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: t('footer.links.privacy'), to: '/confidentialite' },
                { label: t('footer.links.terms'), to: '/conditions-utilisation' },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ color: '#ffffff', fontWeight: 600, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              {t('footer.links.contact')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <Mail size={16} style={{ color: 'var(--color-accent)' }} />
                entreprisedzwai@gmail.com
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <MapPin size={16} style={{ color: 'var(--color-accent)' }} />
                Sétif, Algérie
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
        }}>
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { Users, Recycle, MapPin, Building2, ArrowRight, Award, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  const { t, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const steps = t('home.howItWorks.steps');
  const actors = t('home.actors.list');
  const actions = t('home.rewards.actions');

  // Icônes décoratives cycliques pour les cartes de récompenses
  const rewardIcons = [Award, Recycle, AlertTriangle, MapPin];

  const HERO_IMAGE_POSITION = '50% 50%';

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── STYLES RESPONSIVE POUR LE HERO (MOBILE) ── */}
      <style>{`
        @media (max-width: 768px) {
          .hero-bg-grid {
            grid-template-columns: 1fr !important;
          }
          .hero-bg-grid > div:first-child {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            order: 1 !important;
          }
          .hero-bg-grid > div:last-child {
            display: none !important;
          }
          .hero-gradient {
            background: linear-gradient(180deg, rgba(10,25,18,0.25) 0%, rgba(10,25,18,0.55) 45%, rgba(10,25,18,0.96) 85%, rgba(10,25,18,1) 100%) !important;
          }
          .hero-content-wrap {
            justify-content: center !important;
            align-items: flex-end !important;
            height: 100% !important;
            width: 100% !important;
          }
          .hero-text-box {
            max-width: 100% !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
            text-align: center !important;
          }
          .hero-cta-wrap {
            justify-content: center !important;
          }
          .hero-section {
            min-height: 100vh !important;
          }
          .hero-inner-container {
            padding-top: calc(var(--nav-height) + 24px) !important;
            padding-bottom: 40px !important;
            height: 100% !important;
            display: flex !important;
            align-items: flex-end !important;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: clamp(1.8rem, 8vw, 2.4rem) !important;
          }
        }

        /* ── ÉTAPES ("Comment ça marche") : empiler verticalement sur mobile ── */
        @media (max-width: 768px) {
          .steps-line {
            display: none !important;
          }
          .steps-row {
            flex-direction: column !important;
            gap: 36px !important;
          }
          .steps-row > div {
            width: 100% !important;
            padding: 0 !important;
          }
        }

        /* ── RÉCOMPENSES : garder icône/texte/points sur une seule ligne, sans débordement ── */
        @media (max-width: 640px) {
          .reward-row {
            flex-wrap: nowrap !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 18px 4px !important;
          }
          .reward-icon {
            width: 32px !important;
            height: 32px !important;
          }
          .reward-dots {
            display: none !important;
          }
          .reward-label {
            max-width: none !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            font-size: 0.88rem !important;
            line-height: 1.35 !important;
          }
          .reward-pts {
            flex-shrink: 0 !important;
            margin-left: auto !important;
            font-size: 1.25rem !important;
          }
          .cta-final-btn {
            width: 100% !important;
            box-sizing: border-box !important;
            white-space: normal !important;
            text-align: center !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <Navbar />

      {/* ── HERO SECTION: SPLIT HERO (NO BLANK/EMPTY SPACE) ── */}
      <section
        className="hero-section"
        style={{
          position: 'relative',
          paddingTop: 0,
          paddingBottom: 0,
          minHeight: '100vh',
          background: 'var(--color-primary-dark)',
          color: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Full Section Background Container */}
        <div
          className="hero-bg-grid"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: isRTL ? '1fr 1.15fr' : '1.15fr 1fr',
            direction: 'ltr',
            zIndex: 1,
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            order: isRTL ? 2 : 1,
          }}>
            <img
              src={isRTL ? '/images/home.png' : '/images/home_inv.png'}
              alt="Don't forget to protect the planet"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: HERO_IMAGE_POSITION,
                display: 'block',
              }}
            />
            <div className="hero-gradient" style={{
              position: 'absolute',
              inset: 0,
              background: isRTL
                ? 'linear-gradient(270deg, rgba(10, 25, 18, 0) 0%, rgba(10, 25, 18, 0.45) 45%, rgba(10, 25, 18, 1) 100%)'
                : 'linear-gradient(90deg, rgba(10, 25, 18, 0) 0%, rgba(10, 25, 18, 0.45) 45%, rgba(10, 25, 18, 1) 100%)',
            }} />
          </div>

          <div style={{
            background: 'var(--color-primary-dark)',
            width: '100%',
            height: '100%',
            order: isRTL ? 1 : 2,
          }} />
        </div>

        <div className="container hero-inner-container" style={{ position: 'relative', zIndex: 2, paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: 60 }}>
          <div
            className="hero-content-wrap"
            style={{
              display: 'flex',
              justifyContent: isRTL ? 'flex-start' : 'flex-end',
              direction: 'ltr',
            }}
          >

            <div
              className="hero-text-box"
              style={{
                width: '100%',
                maxWidth: 500,
                direction: isRTL ? 'rtl' : 'ltr',
                textAlign: isRTL ? 'right' : 'left',
                paddingLeft: isRTL ? 0 : 24,
                paddingRight: isRTL ? 24 : 0,
              }}
            >
              <span style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#79C3A6',
                marginBottom: 16,
              }}>
                {t('home.hero.badge')}
              </span>

              <h1
                className="hero-title"
                style={{
                  fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                  fontSize: isRTL ? 'clamp(2.2rem, 4vw, 3.2rem)' : 'clamp(2.5rem, 4.2vw, 3.4rem)',
                  fontWeight: isRTL ? 800 : 400,
                  lineHeight: 1.18,
                  color: '#ffffff',
                  marginBottom: 20,
                  textShadow: '0 4px 20px rgba(0,0,0,0.9)',
                }}
              >
                {t('home.hero.title')} <br />
                <span style={{ fontStyle: isRTL ? 'normal' : 'italic', color: '#79C3A6' }}>
                  {t('home.hero.titleHighlight')}
                </span>
              </h1>

              <p style={{
                marginBottom: 32,
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.75,
                textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              }}>
                {t('home.hero.subtitle')}
              </p>

              <div className="hero-cta-wrap" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link
                  to="/register"
                  className="btn btn-forest"
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    fontWeight: 700,
                    padding: '14px 32px',
                    fontSize: 13,
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <span>{t('home.hero.ctaPrimary')}</span>
                  <ArrowRight size={16} style={isRTL ? { transform: 'scaleX(-1)' } : {}} />
                </Link>
                <a
                  href="#comment-ca-marche"
                  className="btn btn-outline-dark"
                  style={{
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    padding: '14px 32px',
                    fontSize: 13,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {t('home.hero.ctaSecondary')}
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3 OVERLAPPING CARDS (CRESCENT STYLE) ── */}
      <section style={{ marginTop: 56, position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {[
              { title: isRTL ? 'بلاغ سريع' : 'Signalement Rapide', desc: isRTL ? 'تحديد مواقع الحاويات الممتلئة بسهولة' : 'Géolocalisez les conteneurs pleins en un clic.', icon: AlertTriangle },
              { title: isRTL ? 'جمع مخصص' : 'Collecte Sur-Mesure', desc: isRTL ? 'للأفراد والمؤسسات والجمعيات' : 'Pour particuliers, universités et entreprises.', icon: Recycle },
              { title: isRTL ? 'مكافآت بيئية' : 'Récompenses Éco', desc: isRTL ? 'اكسب نقاطاً واكتشف هدايا مفاجئة' : 'Gagnez des points pour chaque geste écologique.', icon: Award },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  padding: '30px 28px',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform var(--transition), box-shadow var(--transition)',
                  textAlign: isRTL ? 'right' : 'left',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                >
                  <div style={{ color: 'var(--color-accent)', marginBottom: 16 }}>
                    <Icon size={28} strokeWidth={1.25} />
                  </div>
                  <h3 style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-primary)',
                    fontWeight: isRTL ? 700 : 400,
                    marginBottom: 10,
                  }}>
                    {card.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION: TITRE EN HAUT / IMAGE AU MILIEU / ÉTAPES EN POINTILLÉS EN BAS ── */}
      <section id="comment-ca-marche" className="section how-it-works-section" style={{ background: '#ffffff', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">

          {/* Titre centré en haut */}
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
            <span className="section-haute-eyebrow">{t('home.howItWorks.subtitle')}</span>
            <h2 className="section-title" style={{ fontStyle: isRTL ? 'normal' : 'italic' }}>{t('home.howItWorks.title')}</h2>
          </div>

          

          {/* Étapes en pointillés en bas */}
          <div style={{ maxWidth: 900, margin: '64px auto 0', position: 'relative' }}>
            {/* Ligne pointillée horizontale reliant les étapes */}
            <div className="steps-line" style={{
              position: 'absolute',
              top: 19,
              left: 19,
              right: 19,
              borderTop: '1px dashed var(--color-border)',
              zIndex: 0,
            }} />

            <div className="steps-row" style={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 1,
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              {Array.isArray(steps) && steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  flex: '1 1 0',
                  padding: '0 12px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent)',
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <h3 style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '1.05rem',
                    fontWeight: isRTL ? 700 : 400,
                    color: 'var(--color-primary)',
                    margin: 0,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── ACTORS SECTION ── */}
      <section id="acteurs" className="section" style={{ background: '#ffffff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 80px' }}>
            <span className="section-haute-eyebrow">
              {t('home.actors.subtitle')}
            </span>
            <h2 className="section-title" style={{ fontStyle: isRTL ? 'normal' : 'italic' }}>
              {t('home.actors.title')}
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 36,
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {Array.isArray(actors) && actors.map((actor, i) => (
              <div key={i} style={{
                borderTop: '2px solid var(--color-accent)',
                paddingTop: 32,
                textAlign: isRTL ? 'right' : 'left',
              }}>
                <div style={{ color: 'var(--color-accent)', marginBottom: 22 }}>
                  {i === 0 ? <Users size={28} strokeWidth={1.25} />
                    : i === 1 ? <Recycle size={28} strokeWidth={1.25} />
                      : i === 2 ? <MapPin size={28} strokeWidth={1.25} />
                        : <Building2 size={28} strokeWidth={1.25} />}
                </div>
                <h3 style={{
                  fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                  fontSize: '1.3rem',
                  fontWeight: isRTL ? 700 : 400,
                  marginBottom: 14,
                  color: 'var(--color-primary)',
                }}>
                  {actor.title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.85 }}>
                  {actor.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REWARDS SECTION ── */}
      <section id="recompenses" className="section" style={{ background: 'var(--color-primary-dark)', color: '#ffffff' }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 72px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: 20,
              fontWeight: 600,
            }}>
              {t('home.rewards.subtitle')}
            </span>
            <h2 className="section-title" style={{ color: '#ffffff', fontStyle: isRTL ? 'normal' : 'italic' }}>
              {t('home.rewards.title')}
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', marginTop: 20, lineHeight: 1.85 }}>
              {t('home.rewards.desc')}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            columnGap: 64,
            maxWidth: 920,
            margin: '0 auto',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {Array.isArray(actions) && actions.map((a, i) => {
              const RewardIcon = rewardIcons[i % rewardIcons.length];
              return (
                <div key={i} className="reward-row" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '24px 6px',
                  borderTop: '1px solid var(--color-border-gold)',
                  transition: 'background var(--transition)',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
                    const pts = e.currentTarget.querySelector('.reward-pts');
                    const icon = e.currentTarget.querySelector('.reward-icon');
                    if (pts) pts.style.transform = 'scale(1.08)';
                    if (icon) icon.style.borderColor = 'var(--color-accent)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    const pts = e.currentTarget.querySelector('.reward-pts');
                    const icon = e.currentTarget.querySelector('.reward-icon');
                    if (pts) pts.style.transform = 'scale(1)';
                    if (icon) icon.style.borderColor = 'var(--color-border-gold)';
                  }}
                >
                  <div className="reward-icon" style={{
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: '1px solid var(--color-border-gold)',
                    color: 'var(--color-accent)',
                    transition: 'border-color var(--transition)',
                  }}>
                    <RewardIcon size={16} strokeWidth={1.5} />
                  </div>

                  <span className="reward-label" style={{
                    flexShrink: 0,
                    fontSize: '0.98rem',
                    color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.4,
                    maxWidth: 200,
                  }}>
                    {a.label}
                  </span>

                  <span className="reward-dots" style={{
                    flex: 1,
                    minWidth: 16,
                    borderBottom: '1px dotted rgba(255,255,255,0.28)',
                    transform: 'translateY(-6px)',
                  }} />

                  <span className="reward-pts" style={{
                    flexShrink: 0,
                    display: 'inline-block',
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '1.6rem',
                    fontWeight: isRTL ? 700 : 400,
                    fontStyle: isRTL ? 'normal' : 'italic',
                    color: 'var(--color-accent)',
                    lineHeight: 1,
                    transition: 'transform var(--transition)',
                  }}>
                    {a.pts}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 56, textAlign: 'center' }}>
            <Link
              to="/register"
              className="btn btn-haute-gold btn-lg cta-final-btn"
              style={{ fontWeight: 600 }}
            >
              <span>{t('home.cta.button')}</span>
              <ArrowRight size={15} style={isRTL ? { transform: 'scaleX(-1)' } : {}} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
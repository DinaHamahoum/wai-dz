import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import logo from '../../assets/logo.png';

export default function Login() {
  const { t, lang } = useLanguage();
  const { getRoleRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const infoMsg = location.state?.info ?? '';
  const isRTL = lang === 'ar';
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError(lang === 'fr' ? 'Veuillez remplir tous les champs.' : 'يرجى ملء جميع الحقول.');
      return;
    }
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setLoading(false);
      const isEmailNotConfirmed = authError.message?.toLowerCase().includes('email not confirmed');
      if (isEmailNotConfirmed) {
        setError(lang === 'fr'
          ? 'Veuillez confirmer votre adresse e-mail avant de vous connecter.'
          : 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.'
        );
      } else {
        setError(lang === 'fr'
          ? 'Email ou mot de passe incorrect.'
          : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
        );
      }
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, statut_compte, type_etablissement, nom, telephone, wilaya, commune, adresse')
      .eq('id', data.user.id)
      .maybeSingle();

    setLoading(false);

    const meta = data.user?.user_metadata || {};
    const isCommune =
      meta.type_etablissement === 'commune' ||
      meta.role === 'commune' ||
      profileData?.type_etablissement === 'commune' ||
      profileData?.role === 'commune';

    // Synchronisation du profil en base si nécessaire (pour corriger les profils créés avec des valeurs par défaut)
    if (meta.nom || meta.type_etablissement || isCommune) {
      await supabase.from('profiles').update({
        nom: (profileData?.nom && profileData.nom !== 'User') ? profileData.nom : (meta.nom || meta.full_name || profileData?.nom),
        telephone: profileData?.telephone || meta.telephone || meta.phone || '',
        role: isCommune ? 'etablissement' : (profileData?.role || meta.role || 'citoyen'),
        type_etablissement: isCommune ? 'commune' : (profileData?.type_etablissement || meta.type_etablissement || null),
        wilaya: profileData?.wilaya || meta.wilaya || '',
        commune: profileData?.commune || meta.commune || '',
        adresse: profileData?.adresse || meta.adresse || meta.address || '',
      }).eq('id', data.user.id);
    }

    const userRole = isCommune ? 'commune' : (profileData?.role || meta.role || 'citoyen');
    const userStatus = profileData?.statut_compte || meta.statut_compte;

    if (userStatus === 'en_attente_validation') {
      await supabase.auth.signOut();
      setError(lang === 'fr'
        ? 'Votre compte est en attente de validation par un administrateur.'
        : 'حسابك في انتظار المراجعة من قِبل المشرف.'
      );
      return;
    }

    if (isCommune) {
      navigate('/commune/dashboard');
    } else {
      navigate(getRoleRoute(userRole));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'var(--color-primary-dark)', overflow: 'hidden' }}>
      {/* Styles scopés : bascule 1 colonne (mobile) → 2 colonnes (desktop), comme le hero de Home */}
      <style>{`
        .auth-split { display: grid; grid-template-columns: 1fr; height: 100vh; width: 100vw; overflow: hidden; }
        .auth-visual { display: none; }
        .auth-form-panel {
          background: var(--color-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          height: 100vh;
          overflow-y: auto;
          box-sizing: border-box;
        }
        @media (min-width: 960px) {
          .auth-split { grid-template-columns: 1.05fr 1fr; height: 100vh; overflow: hidden; }
          .auth-visual { display: flex !important; height: 100vh; position: relative; overflow: hidden; }
          .auth-form-panel { height: 100vh; overflow-y: auto; }
        }
      `}</style>

      <div className="auth-split">
        {/* ── Panneau visuel (image fixe en background + vignette sombre), masqué en mobile ── */}
        <div className="auth-visual" style={{
          position: 'relative',
          minHeight: '100vh',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          backgroundImage: 'url(/images/home_inv.png)',
          backgroundSize: 'auto 115%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'var(--color-primary-dark)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,25,18,0.05) 0%, rgba(10,25,18,0.55) 55%, rgba(10,25,18,0.96) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '0 40px 48px', color: '#ffffff', direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#79C3A6',
              marginBottom: 10,
            }}>
              {t('home.hero.badge')}
            </span>
            <h2 style={{
              fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
              fontSize: 'clamp(1.3rem, 1.8vw, 1.7rem)',
              fontWeight: isRTL ? 800 : 400,
              lineHeight: 1.22,
              marginBottom: 10,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
              maxWidth: 360,
            }}>
              {t('home.hero.title')}{' '}
              <span style={{ fontStyle: isRTL ? 'normal' : 'italic', color: '#79C3A6' }}>
                {t('home.hero.titleHighlight')}
              </span>
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, maxWidth: 340, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
              {t('home.hero.subtitle')}
            </p>
          </div>
        </div>

        {/* ── Panneau formulaire ── */}
        <div className="auth-form-panel">
        <div style={{
          width: '100%',
          maxWidth: 380,
          background: '#ffffff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
          padding: '32px 28px',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
              <div className="logo-badge" style={{ transform: 'scale(0.8)' }}>
                <img src={logo} alt="Logo" />
              </div>
            </Link>

            <span style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: 8,
            }}>
              {isRTL ? 'مرحباً بعودتك' : 'Bon retour'}
            </span>

            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: isRTL ? 700 : 400,
              fontStyle: isRTL ? 'normal' : 'italic',
              color: 'var(--color-primary)',
              marginBottom: 6,
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-serif)',
            }}>
              {t('auth.login.title')}
            </h1>
            <p style={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
              maxWidth: 300,
              margin: '0 auto',
            }}>
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* Info message */}
          {infoMsg && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-accent-light)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--color-primary)',
              marginBottom: 16,
              textAlign: isRTL ? 'right' : 'left',
            }}>
              {infoMsg}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: '#dc2626',
              marginBottom: 16,
              textAlign: isRTL ? 'right' : 'left',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label className="input-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('auth.login.email')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  ...(isRTL ? { right: 14 } : { left: 14 }),
                  color: 'var(--color-accent)', pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('auth.login.emailPlaceholder')}
                  className="input"
                  style={{
                    paddingLeft: isRTL ? 16 : 44,
                    paddingRight: isRTL ? 44 : 16,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}>
                <label className="input-label" style={{ marginBottom: 0 }}>
                  {t('auth.login.password')}
                </label>
                <a href="#" style={{
                  fontSize: 12, color: 'var(--color-accent)',
                  textDecoration: 'none', fontWeight: 600,
                }}>
                  {t('auth.login.forgot')}
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  ...(isRTL ? { right: 14 } : { left: 14 }),
                  color: 'var(--color-accent)', pointerEvents: 'none',
                }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  className="input"
                  style={{
                    paddingLeft: isRTL ? 44 : 44,
                    paddingRight: isRTL ? 44 : 44,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  style={{
                    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                    ...(isRTL ? { left: 12 } : { right: 12 }),
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', padding: 4,
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-forest"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 4,
                opacity: loading ? 0.85 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span>{t('auth.login.loading')}</span>
              ) : (
                <>
                  <span>{t('auth.login.submit')}</span>
                  <ArrowRight size={16} style={isRTL ? { transform: 'scaleX(-1)' } : {}} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}>
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" style={{
              color: 'var(--color-primary)',
              fontWeight: 700,
              textDecoration: 'none',
            }}>
              {t('auth.login.register')}
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
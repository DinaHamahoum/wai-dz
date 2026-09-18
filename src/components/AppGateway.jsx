import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { User, Building2, Recycle, FileBarChart, Landmark, ArrowRight, ArrowLeft, CheckCircle2, Leaf } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AppGateway({ children }) {
  const { lang, setLang } = useLanguage();
  const [stage, setStage] = useState('loading');
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    // DEV Helper: if URL has ?reset=1, clear localStorage to test the flow
    if (window.location.search.includes('reset=1')) {
      localStorage.removeItem('language');
      localStorage.removeItem('wai_selected_role');
      window.history.replaceState({}, document.title, "/");
      setStage('language');
      return;
    }

    // API Mobile/Deep linking: Accept lang and role via URL params
    const searchParams = new URLSearchParams(window.location.search);
    const urlLang = searchParams.get('lang');
    const urlRole = searchParams.get('role');

    if (urlLang && urlRole) {
      localStorage.setItem('language', urlLang);
      localStorage.setItem('wai_selected_role', urlRole);
      setLang(urlLang);
      setSelectedRole(urlRole);
      setStage('app');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const savedLang = localStorage.getItem('language');
    const savedRole = localStorage.getItem('wai_selected_role');

    if (!savedLang) {
      setStage('language');
    } else if (!savedRole) {
      setStage('role');
    } else {
      setSelectedRole(savedRole);
      setStage('app');
    }
  }, []);

  const handleSelectLanguage = (l) => {
    setLang(l);
    setStage('role');
  };

  const handleSelectRole = (r) => {
    setSelectedRole(r);
  };

  const handleContinue = () => {
    if (selectedRole) {
      localStorage.setItem('wai_selected_role', selectedRole);
      setStage('app');
      window.location.href = '/login';
    }
  };

  if (stage === 'loading') {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAF9' }}></div>;
  }

  if (stage === 'app') {
    return <>{children}</>;
  }

  const isRTL = lang === 'ar';

  const ROLES = [
    { id: 'etablissement', icon: Building2, labelFr: 'Établissement', labelAr: 'مؤسسة', subFr: 'Déclarez et suivez vos déchets commerciaux', subAr: 'تصريح وتتبع النفايات التجارية والصناعية' },
    { id: 'citoyen', icon: User, labelFr: 'Citoyen', labelAr: 'مواطن', subFr: 'Triez chez vous et signalez un point noir', subAr: 'فرز منزلي وإبلاغ عن النقاط السوداء' },
    { id: 'cet', icon: FileBarChart, labelFr: 'CET', labelAr: 'مركز الردم التقني', subFr: 'Pilotez la pesée et le traitement du site', subAr: 'تسيير الميزان ومعالجة النفايات بالموقع' },
    { id: 'societe_recyclage', icon: Recycle, labelFr: 'Société de recyclage', labelAr: 'شركة إعادة التدوير', subFr: 'Organisez la collecte et la valorisation', subAr: 'تنظيم الجمع وتثمين المواد القابلة للتدوير' },
  ];

  // Actors shown on the welcome screen so every profile is represented, not just citizens
  const ACTORS = [
    { icon: Landmark, labelFr: 'Communes', labelAr: 'البلديات' },
    { icon: User, labelFr: 'Citoyens', labelAr: 'المواطنون' },
    { icon: Building2, labelFr: 'Établissements', labelAr: 'المؤسسات' },
    { icon: FileBarChart, labelFr: 'C.E.T', labelAr: 'مراكز الردم' },
    { icon: Recycle, labelFr: 'Recycleurs', labelAr: 'الرسكلة' },
  ];

  // PAGE 1: LANGUAGE SELECTION
  if (stage === 'language') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F4F6F5',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* ── HERO TOP ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 56,
          flex: '0 0 auto',
          position: 'relative',
        }}>
          {/* Decorative leaf accents, subtle nod to recycling without being a generic badge */}
          <Leaf size={18} color="var(--color-accent)" style={{ position: 'absolute', top: 24, left: '18%', opacity: 0.35, transform: 'rotate(-18deg)' }} />
          <Leaf size={14} color="var(--color-accent)" style={{ position: 'absolute', top: 64, right: '16%', opacity: 0.3, transform: 'rotate(24deg)' }} />

          <div style={{
            width: 264, height: 264, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--color-accent) 0%, rgba(14,110,87,0.6) 68%, transparent 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 24px 60px rgba(14,110,87,0.28)',
          }}>
            <div style={{
              width: 168, height: 168, borderRadius: '50%',
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(14,110,87,0.08)',
            }}>
              <img src={logo} alt="WAI DZ" style={{ width: '72%', height: 'auto', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* ── CONTENU TEXTE ── */}
        <div style={{
          flex: 1, background: '#fff',
          borderRadius: '32px 32px 0 0',
          marginTop: -36,
          padding: '44px 28px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.06)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-arabic-display)',
            fontSize: '2.2rem', fontWeight: 800,
            color: 'var(--color-primary)',
            lineHeight: 1.3, marginBottom: 14,
          }}>
            معًا من أجل تسيير ذكي للنفايات
          </h1>
          <p style={{
            fontSize: '0.95rem', color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)', marginBottom: 28, maxWidth: 320, lineHeight: 1.5,
          }}>
            Ensemble pour une gestion intelligente des déchets.
          </p>

          {/* Bande des profils concernés — remplace l'ancienne fausse barre de navigation */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 18,
            width: '100%', maxWidth: 380, marginBottom: 32,
            padding: '14px 8px',
            background: 'var(--color-primary-light)',
            borderRadius: 18,
          }}>
            {ACTORS.map(({ icon: Icon, labelFr, labelAr }) => (
              <div key={labelFr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <Icon size={18} color="var(--color-primary)" strokeWidth={1.75} />
                <span style={{ fontSize: 9.5, color: 'var(--color-primary)', fontWeight: 600, lineHeight: 1.2 }}>
                  {isRTL ? labelAr : labelFr}
                </span>
              </div>
            ))}
          </div>

          {/* Boutons langue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360 }}>
            <button
              onClick={() => handleSelectLanguage('ar')}
              style={{
                width: '100%', padding: '18px 24px', borderRadius: 16,
                background: 'var(--color-primary)', color: '#fff',
                fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                boxShadow: '0 6px 20px rgba(14,110,87,0.35)', transition: 'all 0.2s',
                fontFamily: 'var(--font-arabic)'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>🇩🇿</span> العربية
            </button>

            <button
              onClick={() => handleSelectLanguage('fr')}
              style={{
                width: '100%', padding: '18px 24px', borderRadius: 16,
                background: '#fff', color: 'var(--color-primary)',
                fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer',
                border: '2px solid var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>🇫🇷</span> Français
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PAGE 2: ROLE SELECTION
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAF9',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(14, 110, 87, 0.08) 0%, transparent 50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-sans)',
      paddingBottom: 40,
    }}>
      <div style={{ width: '100%', maxWidth: 500, padding: '40px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Title */}
        <div style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)', fontWeight: 800, marginBottom: 12 }}>
            <span style={{ fontSize: 16, letterSpacing: '0.05em' }}>WAIDZ</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>
            {isRTL ? 'اختيار نوع المستخدم' : "Choisir le type d'utilisateur"}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
            {isRTL ? 'كل صفة لها مساحتها الخاصة، اختر ما يناسبك' : 'Chaque profil a son espace dédié, sélectionnez le vôtre'}
          </p>
        </div>

        {/* Roles Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => handleSelectRole(r.id)}
                style={{
                  background: '#fff', borderRadius: 16, padding: '18px 14px',
                  border: `2px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                  boxShadow: isSelected ? '0 4px 16px rgba(14,110,87,0.15)' : '0 2px 10px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: 8, left: 8, color: 'var(--color-accent)' }}>
                    <CheckCircle2 size={18} fill="var(--color-accent)" color="#fff" />
                  </div>
                )}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={22} color="var(--color-accent)" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
                  {isRTL ? r.labelAr : r.labelFr}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  {isRTL ? r.subAr : r.subFr}
                </p>
              </div>
            );
          })}
        </div>

        {/* Commune (Full width card) */}
        <div
          onClick={() => handleSelectRole('commune')}
          style={{
            background: '#fff', borderRadius: 16, padding: '16px 20px',
            border: `2px solid ${selectedRole === 'commune' ? 'var(--color-accent)' : 'transparent'}`,
            boxShadow: selectedRole === 'commune' ? '0 4px 16px rgba(14,110,87,0.15)' : '0 2px 10px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', position: 'relative', transition: 'all 0.2s', marginBottom: 30
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={22} color="var(--color-accent)" strokeWidth={1.5} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {isRTL ? 'بلدية' : 'Commune'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                {isRTL ? 'إشراف على النفايات على المستوى المحلي' : 'Supervisez la gestion des déchets à l\'échelle locale'}
              </p>
            </div>
          </div>
          {selectedRole === 'commune' && (
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: isRTL ? 'auto' : 16, left: isRTL ? 16 : 'auto', color: 'var(--color-accent)' }}>
              <CheckCircle2 size={20} fill="var(--color-accent)" color="#fff" />
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          style={{
            width: '100%', padding: 18, borderRadius: 16, background: 'var(--color-primary)', color: '#fff',
            fontSize: '1.1rem', fontWeight: 700, border: 'none', cursor: !selectedRole ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            opacity: !selectedRole ? 0.5 : 1,
            boxShadow: '0 8px 24px rgba(18,38,30,0.25)', transition: 'all 0.2s', marginTop: 'auto'
          }}
        >
          {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
          <span>{isRTL ? 'متابعة' : 'Continuer'}</span>
        </button>

      </div>
    </div>
  );
}
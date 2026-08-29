import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Landmark, GraduationCap, Dumbbell, Building2, Heart,
  UtensilsCrossed, Cross, Building, ArrowRight,
  ArrowLeft, Eye, EyeOff, Mail, Lock, Phone, MapPin, ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ESTABLISHMENT_TYPES } from '../../constants/establishmentTypes';
import logo from '../../assets/logo.png';

/* ── Algeria wilayas (58) ── */
const WILAYAS = [
  '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi',
  '05 - Batna', '06 - Béjaïa', '07 - Biskra', '08 - Béchar',
  '09 - Blida', '10 - Bouira', '11 - Tamanrasset', '12 - Tébessa',
  '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou', '16 - Alger',
  '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
  '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma',
  '25 - Constantine', '26 - Médéa', '27 - Mostaganem', '28 - M\'Sila',
  '29 - Mascara', '30 - Ouargla', '31 - Oran', '32 - El Bayadh',
  '33 - Illizi', '34 - Bordj Bou Arréridj', '35 - Boumerdès', '36 - El Tarf',
  '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
  '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla',
  '45 - Naâma', '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane',
  '49 - Timimoun', '50 - Bordj Badji Mokhtar', '51 - Ouled Djellal',
  '52 - Béni Abbès', '53 - In Salah', '54 - In Guezzam',
  '55 - Touggourt', '56 - Djanet', '57 - El Meghaier', '58 - El Meniaa',
];

/* ── Citizen / Establishment type config ── */
const TYPES = [
  { key: 'particulier', icon: User },
  { key: ESTABLISHMENT_TYPES.COMMUNE,     icon: Landmark },
  { key: ESTABLISHMENT_TYPES.UNIVERSITE,  icon: GraduationCap },
  { key: ESTABLISHMENT_TYPES.SPORT,       icon: Dumbbell },
  { key: ESTABLISHMENT_TYPES.ENTREPRISE,  icon: Building2 },
  { key: ESTABLISHMENT_TYPES.ASSOCIATION, icon: Heart },
  { key: ESTABLISHMENT_TYPES.RESTAURANT,  icon: UtensilsCrossed },
  { key: ESTABLISHMENT_TYPES.HOPITAL,     icon: Cross },
  { key: ESTABLISHMENT_TYPES.MOSQUEE,     icon: Building },
];

/* Mapping: type UI → rôle DB */
const TYPE_TO_ROLE = {
  particulier:                        'citoyen',
  [ESTABLISHMENT_TYPES.COMMUNE]:      'etablissement',
  [ESTABLISHMENT_TYPES.UNIVERSITE]:   'etablissement',
  [ESTABLISHMENT_TYPES.SPORT]:        'etablissement',
  [ESTABLISHMENT_TYPES.ENTREPRISE]:   'etablissement',
  [ESTABLISHMENT_TYPES.ASSOCIATION]:  'etablissement',
  [ESTABLISHMENT_TYPES.RESTAURANT]:   'etablissement',
  [ESTABLISHMENT_TYPES.HOPITAL]:      'etablissement',
  [ESTABLISHMENT_TYPES.MOSQUEE]:      'etablissement',
};

export default function Register() {
  const { t, lang } = useLanguage();
  const { getRoleRoute } = useAuth();
  const navigate = useNavigate();
  const isRTL = lang === 'ar';

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPersonal = selectedType === 'particulier';

  const [form, setForm] = useState({
    fullName: '', institutionName: '', email: '',
    phone: '', wilaya: '', commune: '', address: '',
    password: '', confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleStep1 = () => {
    if (!selectedType) {
      setError(lang === 'fr' ? 'Veuillez choisir un type de profil.' : 'يرجى اختيار نوع الملف الشخصي.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password || !form.wilaya) {
      setError(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires.' : 'يرجى ملء جميع الحقول الإلزامية.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }
    if (form.password.length < 8) {
      setError(lang === 'fr' ? 'Le mot de passe doit comporter au moins 8 caractères.' : 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.');
      return;
    }
    setLoading(true);

    const nom = isPersonal ? form.fullName : form.institutionName;
    const role = TYPE_TO_ROLE[selectedType] ?? 'citoyen';
    const typeEtablissement = (role === 'etablissement' || selectedType === 'commune' || selectedType === ESTABLISHMENT_TYPES.COMMUNE) ? selectedType : null;

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nom,
          full_name: nom,
          name: nom,
          telephone: form.phone,
          phone: form.phone,
          role,
          type_etablissement: typeEtablissement,
          wilaya: form.wilaya,
          commune: form.commune,
          adresse: form.address,
          address: form.address,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    /* ── Enregistrer le profil dans la table profiles ── */
    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        nom,
        telephone: form.phone,
        role,
        wilaya: form.wilaya,
        commune: form.commune,
        adresse: form.address,
        type_etablissement: typeEtablissement,
        statut_compte: 'actif',
      });
      if (profileError) {
        console.error('Erreur upsert profiles:', profileError.message);
      }
    }

    setLoading(false);
    /* Si confirmation email désactivée → session directe, rediriger */
    if (data.session) {
      navigate(getRoleRoute(role));
    } else {
      /* Confirmation email activée → informer l'utilisateur */
      navigate('/login', {
        state: {
          info: lang === 'fr'
            ? 'Compte créé ! Vérifiez votre email pour confirmer votre inscription.'
            : 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد تسجيلك.',
        }
      });
    }
  };

  const reg = t('auth.register');

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'var(--color-primary-dark)', overflow: 'hidden' }}>
      {/* Styles scopés : bascule 1 colonne (mobile) → 2 colonnes (desktop), comme le hero de Home */}
      <style>{`
        .auth-split { display: grid; grid-template-columns: 1fr; height: 100vh; width: 100vw; overflow: hidden; }
        .auth-visual { display: none; }
        .auth-form-panel {
          background: var(--color-bg);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 28px 16px 40px;
          height: 100vh;
          overflow-y: auto;
          box-sizing: border-box;
        }
        @media (min-width: 960px) {
          .auth-split { grid-template-columns: 1fr 1.05fr; height: 100vh; overflow: hidden; }
          .auth-visual { display: flex !important; height: 100vh; position: relative; overflow: hidden; }
          .auth-form-panel { height: 100vh; overflow-y: auto; }
        }
        .type-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
      `}</style>

      <div className="auth-split">
        {/* ── Panneau visuel (image fixe en background + vignette sombre), masqué en mobile — à gauche pour équilibrer Login ── */}
        <div className="auth-visual" style={{
          position: 'relative',
          minHeight: '100vh',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          order: isRTL ? 2 : 1,
          backgroundImage: 'url(/images/home_inv.png)',
          backgroundSize: 'auto 115%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'var(--color-primary-dark)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,25,18,0.1) 0%, rgba(10,25,18,0.6) 55%, rgba(10,25,18,0.97) 100%)',
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
              {t('home.rewards.subtitle')}
            </span>
            <h2 style={{
              fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
              fontSize: 'clamp(1.3rem, 1.8vw, 1.7rem)',
              fontWeight: isRTL ? 800 : 400,
              fontStyle: isRTL ? 'normal' : 'italic',
              lineHeight: 1.22,
              marginBottom: 10,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
              maxWidth: 360,
            }}>
              {t('home.rewards.title')}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, maxWidth: 340, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
              {t('home.rewards.desc')}
            </p>
          </div>
        </div>

        {/* ── Panneau formulaire ── */}
        <div className="auth-form-panel" style={{ order: isRTL ? 1 : 2 }}>
        <div style={{ width: '100%', maxWidth: step === 1 ? 560 : 420 }}>
          {/* Logo + titre */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 10 }}>
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
              marginBottom: 6,
            }}>
              {isRTL ? 'انضم إلينا' : 'Rejoindre'}
            </span>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: isRTL ? 700 : 400,
              fontStyle: isRTL ? 'normal' : 'italic',
              color: 'var(--color-primary)',
              marginBottom: 2,
              fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-serif)',
            }}>
              {reg.title}
            </h1>

            {/* Step indicator — numérotation serif italique dorée, comme "Comment ça marche" sur Home */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '1.1rem',
                    fontStyle: isRTL ? 'normal' : 'italic',
                    fontWeight: isRTL ? 700 : 400,
                    color: s <= step ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    opacity: s <= step ? 1 : 0.5,
                    transition: 'all var(--transition)',
                  }}>
                    0{s}
                  </span>
                  {s === 1 && (
                    <span style={{
                      width: 24,
                      height: 1,
                      background: step > 1 ? 'var(--color-accent)' : 'var(--color-border)',
                      transition: 'background var(--transition)',
                    }} />
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {reg.step} {step} {reg.of} 2
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px 22px',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', marginBottom: 20,
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#dc2626',
                textAlign: isRTL ? 'right' : 'left',
              }}>
                {error}
              </div>
            )}

            {/* ── STEP 1: Type selection ── */}
            {step === 1 && (
              <div>
                <p style={{
                  fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                  fontSize: '1.05rem',
                  fontWeight: isRTL ? 700 : 400,
                  fontStyle: isRTL ? 'normal' : 'italic',
                  color: 'var(--color-primary)',
                  marginBottom: 4,
                  textAlign: isRTL ? 'right' : 'left',
                }}>
                  {reg.step1Title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, textAlign: isRTL ? 'right' : 'left' }}>
                  {reg.step1Subtitle}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: 10,
                  marginBottom: 18,
                }}>
                  {TYPES.map(({ key, icon: Icon }) => {
                    const typeInfo = reg.types?.[key] || {};
                    const selected = selectedType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className="type-card"
                        onClick={() => { setSelectedType(key); setError(''); }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          gap: 6, padding: '12px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: selected ? 'var(--color-accent-light)' : '#ffffff',
                          boxShadow: selected ? 'var(--shadow-md)' : 'none',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                          textAlign: 'center',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-gold)'}`,
                          color: 'var(--color-accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all var(--transition)',
                        }}>
                          <Icon size={14} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: selected ? 'var(--color-primary)' : 'var(--color-text)', lineHeight: 1.25 }}>
                            {typeInfo.label}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.25, marginTop: 1 }}>
                            {typeInfo.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleStep1}
                  className="btn btn-forest"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {reg.next}
                  {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </div>
            )}

            {/* ── STEP 2: Form ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{
                  fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                  fontSize: '1rem',
                  fontWeight: isRTL ? 700 : 400,
                  fontStyle: isRTL ? 'normal' : 'italic',
                  color: 'var(--color-primary)',
                  marginBottom: 0,
                  textAlign: isRTL ? 'right' : 'left',
                }}>
                  {reg.step2Title}
                </p>

                {/* Name field — label changes by type */}
                <div>
                  <label className="input-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isPersonal ? reg.fields.fullName : reg.fields.institutionName}
                  </label>
                  <input
                    type="text"
                    name={isPersonal ? 'fullName' : 'institutionName'}
                    value={isPersonal ? form.fullName : form.institutionName}
                    onChange={handleChange}
                    placeholder={isPersonal ? reg.placeholders.fullName : reg.placeholders.institutionName}
                    className="input"
                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="input-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{reg.fields.email}</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { right: 14 } : { left: 14 }),
                      color: 'var(--color-accent)', pointerEvents: 'none',
                    }} />
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder={reg.placeholders.email} className="input"
                      style={{ paddingLeft: isRTL ? 16 : 42, paddingRight: isRTL ? 42 : 16, textAlign: isRTL ? 'right' : 'left' }}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="input-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{reg.fields.phone}</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { right: 14 } : { left: 14 }),
                      color: 'var(--color-accent)', pointerEvents: 'none',
                    }} />
                    <input
                      type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder={reg.placeholders.phone} className="input"
                      style={{ paddingLeft: isRTL ? 16 : 42, paddingRight: isRTL ? 42 : 16, textAlign: isRTL ? 'right' : 'left' }}
                    />
                  </div>
                </div>

                {/* Wilaya */}
                <div>
                  <label className="input-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{reg.fields.wilaya}</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { right: 14 } : { left: 14 }),
                      color: 'var(--color-accent)', pointerEvents: 'none',
                    }} />
                    <select
                      name="wilaya" value={form.wilaya} onChange={handleChange}
                      className="input"
                      style={{
                        paddingLeft: isRTL ? 16 : 42, paddingRight: isRTL ? 42 : 36,
                        appearance: 'none', cursor: 'pointer',
                        color: form.wilaya ? 'var(--color-text)' : 'var(--color-text-muted)',
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                      required
                    >
                      <option value="" disabled hidden>{reg.placeholders.wilaya}</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <ChevronDown size={15} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { left: 12 } : { right: 12 }),
                      color: 'var(--color-text-muted)', pointerEvents: 'none',
                    }} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="input-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{reg.fields.password}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { right: 14 } : { left: 14 }),
                      color: 'var(--color-accent)', pointerEvents: 'none',
                    }} />
                    <input
                      type={showPwd ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange}
                      placeholder={reg.placeholders.password} className="input"
                      style={{ paddingLeft: isRTL ? 44 : 42, paddingRight: isRTL ? 42 : 44, textAlign: isRTL ? 'right' : 'left' }}
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { left: 12 } : { right: 12 }),
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', padding: 4,
                    }}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="input-label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{reg.fields.confirmPassword}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { right: 14 } : { left: 14 }),
                      color: 'var(--color-accent)', pointerEvents: 'none',
                    }} />
                    <input
                      type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder={reg.placeholders.confirmPassword} className="input"
                      style={{ paddingLeft: isRTL ? 44 : 42, paddingRight: isRTL ? 42 : 44, textAlign: isRTL ? 'right' : 'left' }}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(s => !s)} style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...(isRTL ? { left: 12 } : { right: 12 }),
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', padding: 4,
                    }}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 2, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="btn btn-outline-dark"
                    style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
                  >
                    {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                    {reg.back}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-forest"
                    disabled={loading}
                    style={{ flex: 1, opacity: loading ? 0.85 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite' }} />
                        {reg.loading}
                      </span>
                    ) : reg.submit}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sign-in link */}
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 16 }}>
            {reg.hasAccount}{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              {reg.login}
            </Link>
          </p>

          {/* Recycling company link */}
          <div style={{
            marginTop: 16, paddingTop: 14,
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center', fontSize: 12, color: 'var(--color-text-secondary)',
          }}>
            {lang === 'fr' ? 'Vous représentez une entreprise ?' : 'هل تمثل شركة؟'}{' '}
            <Link to="/recyclage/inscription" style={{ color: 'var(--color-accent-dark)', fontWeight: 700, textDecoration: 'none' }}>
              {lang === 'fr' ? 'Espace Professionnel (Recyclage & CET)' : 'المساحة المهنية (التدوير و CET)'}
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
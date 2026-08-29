import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, Phone, MapPin, ChevronDown,
  Building2, FileText, ArrowRight, CheckCircle2, Recycle,
  BadgeCheck, Sparkles, Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { supabase } from '../../lib/supabase';
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

/* ── Subscription plans (recyclage only) ── */
const PLANS = [
  {
    key: 'essai',
    label: 'Essai gratuit',
    duration: '7 jours',
    price: 'Gratuit',
    icon: Sparkles,
    features: ['Accès complet 7 jours', 'Jusqu\'à 10 collectes', 'Support par email'],
    color: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
  },
  {
    key: 'mensuel',
    label: 'Mensuel',
    duration: 'Par mois',
    price: '4 900 DA',
    icon: Recycle,
    features: ['Collectes illimitées', 'Tableau de bord avancé', 'Support prioritaire'],
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    recommended: true,
  },
  {
    key: 'annuel',
    label: 'Annuel',
    duration: 'Par an',
    price: '49 000 DA',
    icon: BadgeCheck,
    features: ['Tout le plan mensuel', '2 mois offerts', 'Manager dédié'],
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
];

/* ── Organisme types config ── */
const ORGANISME_TYPES = [
  {
    key: 'societe_recyclage',
    role: 'societe_recyclage',
    agrementTable: 'agrements_recyclage',
    icon: Recycle,
    labelFr: 'Société de recyclage',
    labelAr: 'شركة إعادة التدوير',
    descFr: 'Collecte et traitement des déchets recyclables',
    descAr: 'جمع ومعالجة النفايات القابلة لإعادة التدوير',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    visualText: {
      eyebrowFr: 'Espace Recyclage',
      eyebrowAr: 'مساحة التدوير',
      titleFr: 'Rejoignez le réseau algérien du recyclage responsable',
      titleAr: 'انضم إلى الشبكة الجزائرية لإعادة التدوير المسؤول',
      subtitleFr: 'Connectez votre société aux citoyens et établissements qui ont besoin de vos services.',
      subtitleAr: 'اربط شركتك بالمواطنين والمؤسسات الذين يحتاجون إلى خدمات الجمع الخاصة بك.',
    },
  },
  {
    key: 'cet',
    role: 'cet',
    agrementTable: 'agrements_cet',
    icon: Trash2,
    labelFr: 'Centre d\'Enfouissement Technique (CET)',
    labelAr: 'مركز الردم التقني (CET)',
    descFr: 'Gestion et enfouissement des déchets non recyclables',
    descAr: 'إدارة وردم النفايات غير القابلة لإعادة التدوير',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#d1d5db',
    visualText: {
      eyebrowFr: 'Espace CET',
      eyebrowAr: 'مساحة مركز CET',
      titleFr: 'Gérez les déchets non recyclables à l\'échelle de votre wilaya',
      titleAr: 'أدِر النفايات غير القابلة للتدوير على مستوى ولايتك',
      subtitleFr: 'Recevez et traitez les demandes de collecte de déchets non recyclables des citoyens.',
      subtitleAr: 'استقبل وعالج طلبات جمع النفايات غير القابلة لإعادة التدوير من المواطنين.',
    },
  },
];

/* ── Input field helper ── */
function Field({ label, required, icon: Icon, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--color-text)', marginBottom: 6, letterSpacing: '0.02em',
      }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={15} style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: 14, color: 'var(--color-accent)', pointerEvents: 'none', zIndex: 1,
          }} />
        )}
        {children}
      </div>
    </div>
  );
}

export default function RecyclageRegister() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const { getRoleRoute } = useAuth();
  const navigate = useNavigate();

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('essai');

  /* ── Organisme type selection ── */
  const [organismeType, setOrganismeType] = useState('societe_recyclage');
  const currentOrganisme = ORGANISME_TYPES.find((o) => o.key === organismeType);
  const isCET = organismeType === 'cet';

  const [form, setForm] = useState({
    nomSociete: '',
    email: '',
    phone: '',
    wilaya: '',
    commune: '',
    adresse: '',
    numeroAgrement: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.nomSociete.trim()) return lang === 'fr' ? 'Le nom est obligatoire.' : 'الاسم إلزامي.';
    if (!form.email.trim()) return lang === 'fr' ? "L'email est obligatoire." : 'البريد الإلكتروني إلزامي.';
    if (!form.password) return lang === 'fr' ? 'Le mot de passe est obligatoire.' : 'كلمة المرور إلزامية.';
    if (form.password.length < 8) return lang === 'fr' ? 'Le mot de passe doit comporter au moins 8 caractères.' : 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
    if (form.password !== form.confirmPassword) return lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'كلمتا المرور غير متطابقتين.';
    if (!form.phone.trim()) return lang === 'fr' ? 'Le téléphone est obligatoire.' : 'رقم الهاتف إلزامي.';
    if (!form.wilaya) return lang === 'fr' ? 'La wilaya est obligatoire.' : 'الولاية إلزامية.';
    if (!form.numeroAgrement.trim()) return lang === 'fr' ? "Le numéro d'agrément est obligatoire." : 'رقم الاعتماد إلزامي.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const agrementNum = form.numeroAgrement.trim();
    const agrementTable = currentOrganisme.agrementTable;

    /* ── 1. Vérification dans la table d'agrément correspondante ── */
    const { data: agrementData, error: agrementErr } = await supabase
      .from(agrementTable)
      .select('*')
      .eq('numero_agrement', agrementNum)
      .maybeSingle();

    if (agrementErr) {
      setLoading(false);
      setError(lang === 'fr' ? "Erreur lors de la vérification du numéro d'agrément." : 'خطأ أثناء التحقق من رقم الاعتماد.');
      return;
    }
    if (!agrementData) {
      setLoading(false);
      setError(lang === 'fr' ? "Le numéro d'agrément renseigné est invalide ou inexistant." : 'رقم الاعتماد المدخل غير صالح أو غير موجود.');
      return;
    }
    if (agrementData.statut !== 'actif') {
      setLoading(false);
      setError(lang === 'fr' ? "Ce numéro d'agrément est actuellement suspendu." : 'رقم الاعتماد هذا معلق حالياً.');
      return;
    }
    if (agrementData.utilise) {
      setLoading(false);
      setError(lang === 'fr' ? "Ce numéro d'agrément a déjà été utilisé." : 'تم استخدام هذا الرقم من قبل.');
      return;
    }

    /* ── 2. Inscription Auth Supabase ── */
    const role = currentOrganisme.role;
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nom: form.nomSociete,
          telephone: form.phone,
          role,
          wilaya: form.wilaya,
          commune: form.commune,
          adresse: form.adresse,
          numero_agrement: agrementNum,
          type_abonnement: selectedPlan,
          organisme_type: organismeType,
        },
      },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    /* ── 3. Enregistrer le profil ── */
    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        nom: form.nomSociete,
        telephone: form.phone,
        role,
        wilaya: form.wilaya,
        commune: form.commune,
        adresse: form.adresse,
        numero_agrement: agrementNum,
        statut_compte: 'actif',
        type_abonnement: selectedPlan,
      });
      if (profileError) {
        console.error('Erreur upsert profiles:', profileError.message);
      }
    }

    /* ── 4. Marquer le numéro d'agrément comme utilisé ── */
    await supabase
      .from(agrementTable)
      .update({ utilise: true })
      .eq('id', agrementData.id);

    setLoading(false);

    if (data.session) {
      navigate(getRoleRoute(role));
    } else {
      navigate('/login', {
        state: {
          info: lang === 'fr'
            ? 'Compte créé avec succès ! Vérifiez votre email pour confirmer votre inscription.'
            : 'تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني لتأكيد التسجيل.',
        },
      });
    }
  };

  const vt = currentOrganisme.visualText;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'var(--color-primary-dark)', overflow: 'hidden' }}>
      <style>{`
        .recyclage-split { display: grid; grid-template-columns: 1fr; height: 100vh; width: 100vw; overflow: hidden; }
        .recyclage-visual { display: none; }
        .recyclage-form-panel {
          background: var(--color-bg);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 20px 48px;
          height: 100vh;
          overflow-y: auto;
          box-sizing: border-box;
        }
        @media (min-width: 1024px) {
          .recyclage-split { grid-template-columns: 1fr 1.4fr; height: 100vh; overflow: hidden; }
          .recyclage-visual { display: flex !important; height: 100vh; position: relative; overflow: hidden; }
          .recyclage-form-panel { height: 100vh; overflow-y: auto; }
        }
        .plan-card { transition: all 0.2s ease; cursor: pointer; }
        .plan-card:hover { transform: translateY(-3px); }
        .org-btn { transition: all 0.2s ease; cursor: pointer; }
        .org-btn:hover { transform: translateY(-2px); }
        .recyclage-input {
          width: 100%; padding: 11px 14px 11px 40px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 13px; font-family: inherit;
          color: var(--color-text);
          background: #ffffff;
          outline: none; box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .recyclage-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(58, 160, 110, 0.12);
        }
        .recyclage-input-no-icon { padding-left: 14px; }
        .recyclage-select { appearance: none; cursor: pointer; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="recyclage-split">
        {/* ── Panneau visuel gauche ── */}
        <div className="recyclage-visual" style={{
          position: 'relative', minHeight: '100vh',
          flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden',
        }}>
          <img
            src="/images/recyclage.jpg"
            alt="Organisme professionnel"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(10,25,18,0.2) 0%, rgba(10,25,18,0.65) 50%, rgba(10,25,18,0.97) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '0 40px 48px', color: '#ffffff' }}>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#79C3A6', marginBottom: 10,
            }}>
              {lang === 'fr' ? vt.eyebrowFr : vt.eyebrowAr}
            </span>
            <h2 style={{
              fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
              fontSize: 'clamp(1.3rem, 1.8vw, 1.7rem)',
              fontWeight: 400, fontStyle: isRTL ? 'normal' : 'italic',
              lineHeight: 1.22, marginBottom: 10,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)', maxWidth: 340,
            }}>
              {lang === 'fr' ? vt.titleFr : vt.titleAr}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 320 }}>
              {lang === 'fr' ? vt.subtitleFr : vt.subtitleAr}
            </p>
          </div>
        </div>

        {/* ── Panneau formulaire droit ── */}
        <div className="recyclage-form-panel">
          <div style={{ width: '100%', maxWidth: 520 }}>

            {/* Logo + titre */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 10 }}>
                <div className="logo-badge" style={{ transform: 'scale(0.8)' }}>
                  <img src={logo} alt="Logo" />
                </div>
              </Link>
              <span style={{
                display: 'inline-block', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--color-accent)', marginBottom: 6,
              }}>
                {lang === 'fr' ? 'Espace Professionnel' : 'مساحة المهنيين'}
              </span>
              <h1 style={{
                fontSize: '1.5rem', fontWeight: 400, fontStyle: isRTL ? 'normal' : 'italic',
                color: 'var(--color-primary)', marginBottom: 4,
                fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
              }}>
                {lang === 'fr' ? 'Inscription professionnelle' : 'التسجيل المهني'}
              </h1>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {lang === 'fr' ? 'Créez votre espace professionnel en quelques minutes' : 'قم بإنشاء مساحتك المهنية في بضع دقائق'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', marginBottom: 20,
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#dc2626',
              }}>
                {error}
              </div>
            )}

            {/* Card */}
            <div style={{
              background: '#ffffff', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)', padding: '28px 24px',
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ══ STEP 0 : Choix du type d'organisme ══ */}
                <div>
                  <p style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '0.95rem', fontWeight: 400, fontStyle: isRTL ? 'normal' : 'italic',
                    color: 'var(--color-primary)', marginBottom: 14,
                    paddingBottom: 8, borderBottom: '1px solid var(--color-border)',
                  }}>
                    {lang === 'fr' ? "Type d'organisme" : 'نوع الهيئة'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {ORGANISME_TYPES.map((org) => {
                      const OrgIcon = org.icon;
                      const isSelected = organismeType === org.key;
                      return (
                        <button
                          key={org.key}
                          type="button"
                          className="org-btn"
                          onClick={() => { setOrganismeType(org.key); setError(''); }}
                          style={{
                            padding: '16px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${isSelected ? org.color : 'var(--color-border)'}`,
                            background: isSelected ? org.bg : '#fafafa',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            boxShadow: isSelected ? `0 4px 16px ${org.color}22` : 'none',
                            position: 'relative',
                          }}
                        >
                          <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: isSelected ? `${org.color}22` : '#f3f4f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                          }}>
                            <OrgIcon size={18} color={isSelected ? org.color : '#9ca3af'} strokeWidth={1.5} />
                          </div>
                          <p style={{
                            fontSize: 12, fontWeight: 700,
                            color: isSelected ? org.color : 'var(--color-text)',
                            marginBottom: 4, lineHeight: 1.3,
                          }}>
                            {lang === 'fr' ? org.labelFr : org.labelAr}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            {lang === 'fr' ? org.descFr : org.descAr}
                          </p>
                          {isSelected && (
                            <div style={{
                              position: 'absolute', top: 10, right: 10,
                              width: 16, height: 16, borderRadius: '50%',
                              background: org.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <CheckCircle2 size={10} color="#fff" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Section : Informations ── */}
                <div>
                  <p style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '0.95rem', fontWeight: 400, fontStyle: isRTL ? 'normal' : 'italic',
                    color: 'var(--color-primary)', marginBottom: 14,
                    paddingBottom: 8, borderBottom: '1px solid var(--color-border)',
                  }}>
                    {lang === 'fr'
                      ? (isCET ? 'Informations du centre' : 'Informations de la société')
                      : (isCET ? 'معلومات المركز' : 'معلومات الشركة')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    <Field
                      label={lang === 'fr'
                        ? (isCET ? 'Nom du centre' : 'Nom de la société')
                        : (isCET ? 'اسم المركز' : 'اسم الشركة')}
                      required icon={isCET ? Trash2 : Building2}
                    >
                      <input
                        type="text" name="nomSociete" value={form.nomSociete}
                        onChange={handleChange} className="recyclage-input"
                        placeholder={lang === 'fr'
                          ? (isCET ? 'Ex: CET de Sétif' : 'Ex: EcoRecycle Sétif SARL')
                          : (isCET ? 'مثال: مركز ردم سطيف' : 'مثال: إيكو ريسايكل سطيف')}
                        style={{ textAlign: isRTL ? 'right' : 'left', paddingRight: isRTL ? 40 : 14, paddingLeft: isRTL ? 14 : 40 }}
                        id="pro-nom"
                      />
                    </Field>

                    <Field label={lang === 'fr' ? "Numéro d'agrément" : 'رقم الاعتماد'} required icon={FileText}>
                      <input
                        type="text" name="numeroAgrement" value={form.numeroAgrement}
                        onChange={handleChange} className="recyclage-input"
                        placeholder={lang === 'fr'
                          ? (isCET ? 'Ex: CET-2026-019-00001' : 'Ex: AGR-2026-019-00001')
                          : (isCET ? 'مثال: CET-2026-019-00001' : 'مثال: AGR-2026-019-00001')}
                        style={{ textAlign: isRTL ? 'right' : 'left', paddingRight: isRTL ? 40 : 14, paddingLeft: isRTL ? 14 : 40 }}
                        id="pro-numero-agrement"
                      />
                    </Field>
                    <p style={{
                      fontSize: 11, color: 'var(--color-text-muted)',
                      marginTop: -6, display: 'flex', alignItems: 'center', gap: 5,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      textAlign: isRTL ? 'right' : 'left',
                    }}>
                      <BadgeCheck size={12} color="var(--color-accent)" />
                      {lang === 'fr'
                        ? `Vérifié en temps réel dans la table des agréments ${isCET ? 'CET' : 'recyclage'}.`
                        : `يتم التحقق منه في الوقت الفعلي من جدول اعتمادات ${isCET ? 'CET' : 'إعادة التدوير'}.`}
                    </p>

                    <Field label={lang === 'fr' ? 'Téléphone' : 'الهاتف'} required icon={Phone}>
                      <input
                        type="tel" name="phone" value={form.phone}
                        onChange={handleChange} className="recyclage-input"
                        placeholder="+213 555 000 000"
                        style={{ textAlign: isRTL ? 'right' : 'left', paddingRight: isRTL ? 40 : 14, paddingLeft: isRTL ? 14 : 40 }}
                        id="pro-telephone"
                      />
                    </Field>
                  </div>
                </div>

                {/* ── Section : Adresse ── */}
                <div>
                  <p style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '0.95rem', fontWeight: 400, fontStyle: isRTL ? 'normal' : 'italic',
                    color: 'var(--color-primary)', marginBottom: 14,
                    paddingBottom: 8, borderBottom: '1px solid var(--color-border)',
                  }}>
                    {lang === 'fr' ? 'Adresse' : 'العنوان'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Field label={lang === 'fr' ? 'Wilaya' : 'الولاية'} required icon={MapPin}>
                      <select
                        name="wilaya" value={form.wilaya}
                        onChange={handleChange}
                        className="recyclage-input recyclage-select"
                        style={{ color: form.wilaya ? 'var(--color-text)' : 'var(--color-text-muted)', paddingRight: isRTL ? 40 : 36, paddingLeft: isRTL ? 36 : 40, textAlign: isRTL ? 'right' : 'left' }}
                        id="pro-wilaya"
                      >
                        <option value="" disabled hidden>{lang === 'fr' ? 'Sélectionner une wilaya' : 'اختر ولاية'}</option>
                        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <ChevronDown size={14} style={{
                        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                        ...(isRTL ? { left: 12 } : { right: 12 }), color: 'var(--color-text-muted)', pointerEvents: 'none',
                      }} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Field label={lang === 'fr' ? 'Commune' : 'البلدية'}>
                        <input
                          type="text" name="commune" value={form.commune}
                          onChange={handleChange}
                          className="recyclage-input recyclage-input-no-icon"
                          style={{ paddingLeft: 14, paddingRight: 14, textAlign: isRTL ? 'right' : 'left' }}
                          placeholder={lang === 'fr' ? 'Ex: El Hidhab' : 'مثال: الهضاب'}
                          id="pro-commune"
                        />
                      </Field>
                      <Field label={lang === 'fr' ? 'Adresse' : 'العنوان'}>
                        <input
                          type="text" name="adresse" value={form.adresse}
                          onChange={handleChange}
                          className="recyclage-input recyclage-input-no-icon"
                          style={{ paddingLeft: 14, paddingRight: 14, textAlign: isRTL ? 'right' : 'left' }}
                          placeholder={lang === 'fr' ? 'Rue, n°...' : 'شارع، رقم...'}
                          id="pro-adresse"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* ── Section : Accès au compte ── */}
                <div>
                  <p style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '0.95rem', fontWeight: 400, fontStyle: isRTL ? 'normal' : 'italic',
                    color: 'var(--color-primary)', marginBottom: 14,
                    paddingBottom: 8, borderBottom: '1px solid var(--color-border)',
                  }}>
                    {lang === 'fr' ? 'Accès au compte' : 'الوصول إلى الحساب'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Field label={lang === 'fr' ? 'Adresse e-mail' : 'البريد الإلكتروني'} required icon={Mail}>
                      <input
                        type="email" name="email" value={form.email}
                        onChange={handleChange} className="recyclage-input"
                        placeholder={isCET ? 'contact@cet-wilaya.dz' : 'contact@societe.dz'}
                        style={{ textAlign: isRTL ? 'right' : 'left', paddingRight: isRTL ? 40 : 14, paddingLeft: isRTL ? 14 : 40 }}
                        id="pro-email"
                      />
                    </Field>

                    <Field label={lang === 'fr' ? 'Mot de passe' : 'كلمة المرور'} required icon={Lock}>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        name="password" value={form.password}
                        onChange={handleChange} className="recyclage-input"
                        placeholder={lang === 'fr' ? 'Minimum 8 caractères' : '8 أحرف على الأقل'}
                        style={{ textAlign: isRTL ? 'right' : 'left', paddingRight: isRTL ? 44 : 14, paddingLeft: isRTL ? 14 : 44 }}
                        id="pro-password"
                      />
                      <button type="button" onClick={() => setShowPwd(s => !s)} style={{
                        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                        ...(isRTL ? { left: 12 } : { right: 12 }), background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', padding: 4,
                      }}>
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </Field>

                    <Field label={lang === 'fr' ? 'Confirmer le mot de passe' : 'تأكيد كلمة المرور'} required icon={Lock}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword" value={form.confirmPassword}
                        onChange={handleChange} className="recyclage-input"
                        placeholder={lang === 'fr' ? 'Répéter le mot de passe' : 'أعد إدخال كلمة المرور'}
                        style={{ textAlign: isRTL ? 'right' : 'left', paddingRight: isRTL ? 44 : 14, paddingLeft: isRTL ? 14 : 44 }}
                        id="pro-confirm-password"
                      />
                      <button type="button" onClick={() => setShowConfirm(s => !s)} style={{
                        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                        ...(isRTL ? { left: 12 } : { right: 12 }), background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', padding: 4,
                      }}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </Field>
                  </div>
                </div>

                {/* ── Section : Abonnement ── */}
                <div>
                    <p style={{
                      fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                      fontSize: '0.95rem', fontWeight: 400, fontStyle: isRTL ? 'normal' : 'italic',
                      color: 'var(--color-primary)', marginBottom: 14,
                      paddingBottom: 8, borderBottom: '1px solid var(--color-border)',
                    }}>
                      {lang === 'fr' ? 'Choisissez votre abonnement' : 'اختر اشتراكك'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {PLANS.map(({ key, label, duration, price, icon: Icon, features, color, bg, border, recommended }) => {
                        const isSelected = selectedPlan === key;
                        return (
                          <div
                            key={key}
                            className="plan-card"
                            onClick={() => setSelectedPlan(key)}
                            style={{
                              border: `2px solid ${isSelected ? color : border}`,
                              borderRadius: 10, padding: '14px 12px',
                              background: isSelected ? bg : '#fafafa',
                              position: 'relative',
                              boxShadow: isSelected ? `0 4px 16px ${color}22` : 'none',
                            }}
                          >
                            {recommended && (
                              <span style={{
                                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                                background: color, color: '#fff', fontSize: 9, fontWeight: 700,
                                padding: '3px 10px', borderRadius: 99,
                                letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                              }}>
                                {lang === 'fr' ? 'Recommandé' : 'موصى به'}
                              </span>
                            )}
                            <div style={{
                              width: 30, height: 30, borderRadius: 8, background: `${color}22`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                            }}>
                              <Icon size={16} color={color} strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 1 }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{price}</p>
                            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 8 }}>{duration}</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {features.map(f => (
                                <li key={f} style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                                  <CheckCircle2 size={10} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            {isSelected && (
                              <div style={{
                                position: 'absolute', top: 10, right: 10, width: 16, height: 16,
                                borderRadius: '50%', background: color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <CheckCircle2 size={10} color="#fff" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                {/* ── Submit ── */}
                <button
                  type="submit"
                  className="btn btn-forest"
                  id="pro-submit"
                  disabled={loading}
                  style={{
                    width: '100%', marginTop: 6,
                    opacity: loading ? 0.85 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    ...(isCET ? { background: '#374151' } : {}),
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 15, height: 15,
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: 'white', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block',
                      }} />
                      <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>
                        {lang === 'fr' ? 'Création en cours...' : 'جاري الإنشاء...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>
                        {lang === 'fr'
                          ? (isCET ? 'Créer mon compte CET' : 'Créer mon compte professionnel')
                          : (isCET ? 'إنشاء حساب CET' : 'إنشاء حسابي المهني')}
                      </span>
                      <ArrowRight size={18} style={{ ...(isRTL ? { transform: 'scaleX(-1)' } : {}) }} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer links */}
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {lang === 'fr' ? 'Vous avez déjà un compte ?' : 'هل لديك حساب بالفعل؟'}{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                {lang === 'fr' ? 'Se connecter' : 'تسجيل الدخول'}
              </Link>
              <span style={{ margin: '0 8px', color: 'var(--color-border)' }}>·</span>
              <Link to="/register" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                {lang === 'fr' ? 'Inscription citoyen / établissement' : 'تسجيل مواطن / مؤسسة'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, UserCheck, AlertTriangle, RefreshCw,
  Scale, Globe, Mail, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const content = {
  fr: {
    badge: 'Utilisation de la plateforme',
    title: 'Conditions d\'',
    titleHighlight: 'utilisation',
    lastUpdated: 'Dernière mise à jour : 1er août 2026',
    intro:
      'En accédant à la plateforme Wai DZ et en créant un compte, vous acceptez sans réserve les présentes conditions d\'utilisation. Veuillez les lire attentivement avant toute utilisation.',
    sections: [
      {
        icon: FileText,
        title: '1. Objet de la plateforme',
        content: [
          {
            subtitle: 'Mission',
            text: 'Wai DZ est une plateforme numérique algérienne dédiée à la gestion collaborative des déchets. Elle permet aux citoyens et établissements de signaler des conteneurs pleins, de demander des collectes de déchets recyclables et de suivre leurs contributions environnementales.',
          },
          {
            subtitle: 'Public cible',
            text: 'La plateforme s\'adresse aux particuliers, universités, entreprises, associations, restaurants, hôpitaux, mosquées et tout autre établissement situé en Algérie et souhaitant contribuer à un environnement plus propre.',
          },
        ],
      },
      {
        icon: UserCheck,
        title: '2. Inscription et compte utilisateur',
        content: [
          {
            subtitle: 'Conditions d\'inscription',
            text: 'Vous devez avoir au moins 16 ans pour créer un compte. En cas de compte institutionnel, un représentant légal de l\'établissement doit approuver l\'inscription.',
          },
          {
            subtitle: 'Exactitude des informations',
            text: 'Vous vous engagez à fournir des informations véridiques, exactes et à jour lors de votre inscription et à les maintenir à jour en cas de changement.',
          },
          {
            subtitle: 'Sécurité du compte',
            text: 'Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toute activité effectuée depuis votre compte. Toute utilisation non autorisée doit être signalée immédiatement.',
          },
        ],
      },
      {
        icon: AlertTriangle,
        title: '3. Règles d\'utilisation',
        content: [
          {
            subtitle: 'Utilisations autorisées',
            text: 'La plateforme est réservée à un usage personnel ou institutionnel légitime en lien avec la gestion des déchets. Tout signalement ou demande de collecte doit être sincère et correspondre à une situation réelle.',
          },
          {
            subtitle: 'Interdictions',
            text: 'Il est strictement interdit : de soumettre de faux signalements, d\'usurper l\'identité d\'un autre utilisateur, de tenter de manipuler le système de points, d\'utiliser la plateforme à des fins commerciales non autorisées, ou de diffuser tout contenu illicite, offensant ou trompeur.',
          },
          {
            subtitle: 'Sanctions',
            text: 'Tout manquement à ces règles peut entraîner la suspension ou la suppression définitive du compte, sans préavis ni remboursement, et peut faire l\'objet de poursuites judiciaires si la loi l\'exige.',
          },
        ],
      },
      {
        icon: Scale,
        title: '4. Système de récompenses',
        content: [
          {
            subtitle: 'Attribution des points',
            text: 'Les points sont attribués automatiquement selon les actions effectuées sur la plateforme (signalements validés, collectes confirmées, etc.). Wai DZ se réserve le droit de modifier le barème des points à tout moment.',
          },
          {
            subtitle: 'Utilisation des points',
            text: 'Les points accumulés permettent d\'accéder à des récompenses définies par Wai DZ et ses partenaires. Ces récompenses ne sont pas échangeables contre de l\'argent et ne sont pas transmissibles.',
          },
          {
            subtitle: 'Fraude',
            text: 'Toute tentative de manipulation frauduleuse du système de points entraînera l\'annulation immédiate de tous les points accumulés et la fermeture du compte.',
          },
        ],
      },
      {
        icon: RefreshCw,
        title: '5. Modifications des conditions',
        content: [
          {
            subtitle: 'Droit de modification',
            text: 'Wai DZ se réserve le droit de modifier les présentes conditions d\'utilisation à tout moment. Les modifications prennent effet dès leur publication sur la plateforme.',
          },
          {
            subtitle: 'Notification',
            text: 'En cas de modification substantielle, nous vous en informerons par e-mail ou via une notification sur la plateforme. La poursuite de l\'utilisation de la plateforme après modification vaut acceptation des nouvelles conditions.',
          },
        ],
      },
      {
        icon: Globe,
        title: '6. Droit applicable et litiges',
        content: [
          {
            subtitle: 'Droit algérien',
            text: 'Les présentes conditions d\'utilisation sont régies par le droit algérien, notamment la loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.',
          },
          {
            subtitle: 'Résolution des litiges',
            text: 'Tout litige relatif à l\'interprétation ou à l\'exécution des présentes conditions sera soumis à la compétence exclusive des tribunaux algériens compétents.',
          },
        ],
      },
    ],
    contact: {
      title: 'Des questions sur nos conditions ?',
      text: 'Notre équipe juridique est à votre disposition pour toute question relative aux conditions d\'utilisation de la plateforme Wai DZ.',
      email: 'entreprisedzwai@gmail.com',
      button: 'Nous écrire',
    },
    backHome: 'Retour à l\'accueil',
    privacyLink: 'Voir la Politique de confidentialité',
  },
  ar: {
    badge: 'استخدام المنصة',
    title: 'شروط',
    titleHighlight: 'الاستخدام',
    lastUpdated: 'آخر تحديث: 1 أغسطس 2026',
    intro:
      'بالوصول إلى منصة وعي DZ وإنشاء حساب، فإنكم توافقون بصورة كاملة على شروط الاستخدام هذه. يُرجى قراءتها بعناية قبل أي استخدام.',
    sections: [
      {
        icon: FileText,
        title: '١. هدف المنصة',
        content: [
          {
            subtitle: 'المهمة',
            text: 'وعي DZ منصة رقمية جزائرية مخصصة للإدارة التشاركية للنفايات. تتيح للمواطنين والمؤسسات الإبلاغ عن الحاويات الممتلئة وطلب جمع النفايات القابلة للتدوير ومتابعة مساهماتهم البيئية.',
          },
          {
            subtitle: 'الجمهور المستهدف',
            text: 'تستهدف المنصة الأفراد والجامعات والشركات والجمعيات والمطاعم والمستشفيات والمساجد وأي مؤسسة في الجزائر ترغب في المساهمة في بيئة أنظف.',
          },
        ],
      },
      {
        icon: UserCheck,
        title: '٢. التسجيل وحساب المستخدم',
        content: [
          {
            subtitle: 'شروط التسجيل',
            text: 'يجب أن يكون عمركم 16 عاماً على الأقل لإنشاء حساب. في حالة الحساب المؤسسي، يجب أن يوافق ممثل قانوني للمؤسسة على التسجيل.',
          },
          {
            subtitle: 'دقة المعلومات',
            text: 'تلتزمون بتقديم معلومات صادقة ودقيقة ومحدّثة عند التسجيل وتحديثها عند أي تغيير.',
          },
          {
            subtitle: 'أمان الحساب',
            text: 'أنتم مسؤولون عن سرية بيانات تسجيل الدخول وعن أي نشاط يتم من حسابكم. يجب الإبلاغ فوراً عن أي استخدام غير مصرح به.',
          },
        ],
      },
      {
        icon: AlertTriangle,
        title: '٣. قواعد الاستخدام',
        content: [
          {
            subtitle: 'الاستخدامات المسموح بها',
            text: 'المنصة مخصصة للاستخدام الشخصي أو المؤسسي المشروع المرتبط بإدارة النفايات. يجب أن يكون كل بلاغ أو طلب جمع صادقاً ومطابقاً لواقع فعلي.',
          },
          {
            subtitle: 'المحظورات',
            text: 'يُحظر تماماً: تقديم بلاغات كاذبة، أو انتحال هوية مستخدم آخر، أو محاولة التلاعب بنظام النقاط، أو استخدام المنصة لأغراض تجارية غير مرخصة، أو نشر أي محتوى غير مشروع أو مسيء أو مضلل.',
          },
          {
            subtitle: 'العقوبات',
            text: 'يؤدي أي انتهاك لهذه القواعد إلى تعليق الحساب أو حذفه نهائياً دون إشعار مسبق، وقد يخضع للملاحقة القضائية إذا اقتضى القانون ذلك.',
          },
        ],
      },
      {
        icon: Scale,
        title: '٤. نظام المكافآت',
        content: [
          {
            subtitle: 'منح النقاط',
            text: 'تُمنح النقاط تلقائياً وفق الإجراءات المنجزة على المنصة (بلاغات صالحة، جمع مؤكد...). تحتفظ وعي DZ بحق تعديل جدول النقاط في أي وقت.',
          },
          {
            subtitle: 'استخدام النقاط',
            text: 'تتيح النقاط المتراكمة الوصول إلى مكافآت محددة من وعي DZ وشركائها. هذه المكافآت غير قابلة للتحويل إلى نقود ولا للتنازل عنها.',
          },
          {
            subtitle: 'الاحتيال',
            text: 'يؤدي أي تلاعب احتيالي بنظام النقاط إلى إلغاء جميع النقاط المتراكمة فوراً وإغلاق الحساب.',
          },
        ],
      },
      {
        icon: RefreshCw,
        title: '٥. تعديل الشروط',
        content: [
          {
            subtitle: 'حق التعديل',
            text: 'تحتفظ وعي DZ بحق تعديل شروط الاستخدام هذه في أي وقت. تسري التعديلات فور نشرها على المنصة.',
          },
          {
            subtitle: 'الإشعار',
            text: 'في حال إجراء تعديل جوهري، سنُعلمكم بذلك عبر البريد الإلكتروني أو بإشعار على المنصة. يُعدّ استمرار استخدام المنصة بعد التعديل قبولاً للشروط الجديدة.',
          },
        ],
      },
      {
        icon: Globe,
        title: '٦. القانون المطبق والنزاعات',
        content: [
          {
            subtitle: 'القانون الجزائري',
            text: 'تخضع شروط الاستخدام هذه للقانون الجزائري، ولا سيما القانون رقم 18-07 المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة البيانات ذات الطابع الشخصي.',
          },
          {
            subtitle: 'تسوية النزاعات',
            text: 'يختص القضاء الجزائري المختص بالنظر في أي نزاع يتعلق بتفسير هذه الشروط أو تنفيذها.',
          },
        ],
      },
    ],
    contact: {
      title: 'أسئلة حول شروطنا؟',
      text: 'فريقنا القانوني في خدمتكم لأي استفسار يتعلق بشروط استخدام منصة وعي DZ.',
      email: 'entreprisedzwai@gmail.com',
      button: 'راسلونا',
    },
    backHome: 'العودة إلى الرئيسية',
    privacyLink: 'سياسة الخصوصية',
  },
};

export default function TermsOfUse() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const c = content[lang] || content.fr;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* ── HERO BANNER ── */}
      <section
        style={{
          background: 'var(--color-primary-dark)',
          paddingTop: 'calc(var(--nav-height) + 72px)',
          paddingBottom: 72,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -60, left: isRTL ? 'auto' : -60, right: isRTL ? -60 : 'auto',
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(14, 110, 87, 0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, right: isRTL ? 'auto' : 80, left: isRTL ? 80 : 'auto',
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(14, 110, 87, 0.05)', pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: isRTL ? 'right' : 'left', maxWidth: 720 }}>
            <span style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--color-accent)',
              marginBottom: 20,
            }}>
              {c.badge}
            </span>

            <h1 style={{
              fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
              fontSize: isRTL ? 'clamp(2.2rem, 4vw, 3rem)' : 'clamp(2.4rem, 4vw, 3.2rem)',
              fontWeight: isRTL ? 800 : 400,
              lineHeight: 1.2,
              color: '#ffffff',
              marginBottom: 20,
            }}>
              {c.title}{' '}
              <span style={{ color: 'var(--color-accent)', fontStyle: isRTL ? 'normal' : 'italic' }}>
                {c.titleHighlight}
              </span>
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 0 }}>
              {c.lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section style={{ background: '#ffffff', borderBottom: '1px solid var(--color-border)', padding: '40px 0' }}>
        <div className="container">
          <p style={{
            fontSize: '1.05rem', lineHeight: 1.85,
            color: 'var(--color-text-secondary)',
            maxWidth: 760,
            textAlign: isRTL ? 'right' : 'left',
          }}>
            {c.intro}
          </p>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
            {c.sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: '36px 40px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'box-shadow var(--transition)',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                >
                  {/* Section header */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 14, marginBottom: 28,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-accent-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={20} color="var(--color-accent)" strokeWidth={1.5} />
                    </div>
                    <h2 style={{
                      fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                      fontSize: '1.3rem',
                      fontWeight: isRTL ? 700 : 500,
                      color: 'var(--color-primary)',
                      margin: 0,
                    }}>
                      {section.title}
                    </h2>
                  </div>

                  {/* Sub-items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {section.content.map((item, i) => (
                      <div key={i} style={{
                        paddingLeft: isRTL ? 0 : 16,
                        paddingRight: isRTL ? 16 : 0,
                        borderLeft: isRTL ? 'none' : '2px solid var(--color-accent-light)',
                        borderRight: isRTL ? '2px solid var(--color-accent-light)' : 'none',
                      }}>
                        <p style={{
                          fontSize: '0.82rem', fontWeight: 700,
                          letterSpacing: isRTL ? 0 : '0.1em',
                          textTransform: isRTL ? 'none' : 'uppercase',
                          color: 'var(--color-accent)',
                          marginBottom: 6,
                        }}>
                          {item.subtitle}
                        </p>
                        <p style={{
                          fontSize: '0.95rem', lineHeight: 1.75,
                          color: 'var(--color-text-secondary)',
                          margin: 0,
                        }}>
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA ── */}
      <section style={{ background: 'var(--color-primary-dark)', padding: '80px 0' }}>
        <div className="container">
          <div style={{
            maxWidth: 620, margin: '0 auto',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(14, 110, 87, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail size={24} color="var(--color-accent)" strokeWidth={1.5} />
            </div>

            <h2 style={{
              fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
              fontSize: '1.8rem',
              fontWeight: isRTL ? 700 : 400,
              color: '#ffffff',
              margin: 0,
            }}>
              {c.contact.title}
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: 0 }}>
              {c.contact.text}
            </p>

            <a
              href={`mailto:${c.contact.email}`}
              className="btn btn-haute-gold btn-lg"
              style={{ fontWeight: 600, marginTop: 8 }}
            >
              <Mail size={16} />
              <span>{c.contact.button}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        background: '#ffffff',
        borderTop: '1px solid var(--color-border)',
        padding: '28px 0',
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--color-accent)',
              textDecoration: 'none', letterSpacing: '0.05em',
            }}
          >
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{c.backHome}</span>
          </Link>

          <Link
            to="/confidentialite"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)',
              textDecoration: 'none', letterSpacing: '0.05em',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <span>{c.privacyLink}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

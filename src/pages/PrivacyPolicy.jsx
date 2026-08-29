import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const content = {
  fr: {
    badge: 'Vos droits, notre engagement',
    title: 'Politique de',
    titleHighlight: 'Confidentialité',
    lastUpdated: 'Dernière mise à jour : 1er août 2026',
    intro:
      'Chez Wai DZ, la protection de vos données personnelles est une priorité absolue. La présente politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations lorsque vous utilisez notre plateforme.',
    sections: [
      {
        icon: Database,
        title: '1. Données collectées',
        content: [
          {
            subtitle: 'Informations d\'identité',
            text: 'Nom complet, adresse e-mail, numéro de téléphone, type de profil (particulier, établissement, etc.) collectés lors de votre inscription.',
          },
          {
            subtitle: 'Données de localisation',
            text: 'Coordonnées GPS associées à vos signalements ou demandes de collecte afin de géolocaliser les conteneurs et planifier les interventions.',
          },
          {
            subtitle: 'Données d\'utilisation',
            text: 'Journal d\'activité (signalements, demandes, points gagnés), préférences de langue et historique de connexion.',
          },
        ],
      },
      {
        icon: Eye,
        title: '2. Utilisation des données',
        content: [
          {
            subtitle: 'Fonctionnement de la plateforme',
            text: 'Vos données sont utilisées pour gérer votre compte, traiter vos signalements et demandes de collecte, calculer vos points de récompense et améliorer nos services.',
          },
          {
            subtitle: 'Communications',
            text: 'Nous pouvons vous envoyer des notifications relatives à l\'état de vos demandes, des mises à jour importantes de la plateforme ou des informations sur vos récompenses.',
          },
          {
            subtitle: 'Statistiques anonymisées',
            text: 'Des données agrégées et anonymisées peuvent être utilisées à des fins d\'amélioration du service et de rapports environnementaux.',
          },
        ],
      },
      {
        icon: Lock,
        title: '3. Protection et sécurité',
        content: [
          {
            subtitle: 'Chiffrement',
            text: 'Toutes les communications entre votre appareil et nos serveurs sont chiffrées via le protocole HTTPS/TLS. Vos mots de passe sont stockés sous forme hachée et irréversible.',
          },
          {
            subtitle: 'Accès restreint',
            text: 'L\'accès à vos données personnelles est strictement limité aux membres de l\'équipe Wai DZ qui en ont besoin pour l\'exécution de leurs fonctions.',
          },
          {
            subtitle: 'Hébergement sécurisé',
            text: 'Nos données sont hébergées sur des serveurs sécurisés situés en Algérie ou dans l\'Union Européenne, conformément aux réglementations en vigueur.',
          },
        ],
      },
      {
        icon: UserCheck,
        title: '4. Vos droits',
        content: [
          {
            subtitle: 'Accès et rectification',
            text: 'Vous avez le droit d\'accéder à l\'ensemble des données personnelles que nous détenons vous concernant et de demander leur correction si elles s\'avèrent inexactes.',
          },
          {
            subtitle: 'Suppression',
            text: 'Vous pouvez demander la suppression de votre compte et de vos données à tout moment, sauf si la loi nous impose de les conserver.',
          },
          {
            subtitle: 'Portabilité',
            text: 'Sur demande, nous vous fournirons vos données dans un format structuré et lisible par machine.',
          },
        ],
      },
      {
        icon: Shield,
        title: '5. Partage des données',
        content: [
          {
            subtitle: 'Aucune vente',
            text: 'Wai DZ ne vend, ne loue, ni ne commercialise vos données personnelles à des tiers, quelles que soient les circonstances.',
          },
          {
            subtitle: 'Partenaires opérationnels',
            text: 'Vos données de localisation peuvent être partagées avec les sociétés de recyclage ou centres d\'enfouissement partenaires dans le seul but de traiter votre demande de collecte.',
          },
          {
            subtitle: 'Obligations légales',
            text: 'Nous pouvons être amenés à divulguer vos données si la loi algérienne ou une décision de justice l\'exige.',
          },
        ],
      },
    ],
    contact: {
      title: 'Questions sur votre vie privée ?',
      text: 'Notre équipe est disponible pour répondre à toutes vos questions concernant vos données personnelles.',
      email: 'entreprisedzwai@gmail.com',
      button: 'Nous contacter',
    },
    backHome: 'Retour à l\'accueil',
    termsLink: 'Voir les Conditions d\'utilisation',
  },
  ar: {
    badge: 'حقوقكم، التزامنا',
    title: 'سياسة',
    titleHighlight: 'الخصوصية',
    lastUpdated: 'آخر تحديث: 1 أغسطس 2026',
    intro:
      'في وعي DZ، تُعدّ حماية بياناتكم الشخصية أولويتنا القصوى. توضح سياسة الخصوصية هذه كيفية جمع معلوماتكم واستخدامها وتخزينها وحمايتها عند استخدام منصتنا.',
    sections: [
      {
        icon: Database,
        title: '١. البيانات التي نجمعها',
        content: [
          {
            subtitle: 'بيانات الهوية',
            text: 'الاسم الكامل، البريد الإلكتروني، رقم الهاتف، نوع الملف الشخصي (فرد، مؤسسة...) التي يتم جمعها عند التسجيل.',
          },
          {
            subtitle: 'بيانات الموقع الجغرافي',
            text: 'إحداثيات GPS المرتبطة ببلاغاتكم أو طلبات الجمع لتحديد موقع الحاويات وتخطيط التدخلات.',
          },
          {
            subtitle: 'بيانات الاستخدام',
            text: 'سجل النشاط (البلاغات، الطلبات، النقاط المكتسبة)، تفضيلات اللغة وسجل تسجيل الدخول.',
          },
        ],
      },
      {
        icon: Eye,
        title: '٢. استخدام البيانات',
        content: [
          {
            subtitle: 'تشغيل المنصة',
            text: 'تُستخدم بياناتكم لإدارة حسابكم ومعالجة بلاغاتكم وطلبات الجمع وحساب نقاط المكافآت وتحسين خدماتنا.',
          },
          {
            subtitle: 'التواصل',
            text: 'قد نُرسل إليكم إشعارات تتعلق بحالة طلباتكم أو تحديثات مهمة للمنصة أو معلومات حول مكافآتكم.',
          },
          {
            subtitle: 'إحصاءات مجهولة الهوية',
            text: 'يمكن استخدام البيانات المجمّعة والمجهولة لتحسين الخدمة وإعداد التقارير البيئية.',
          },
        ],
      },
      {
        icon: Lock,
        title: '٣. الحماية والأمان',
        content: [
          {
            subtitle: 'التشفير',
            text: 'تُشفَّر جميع الاتصالات بين جهازكم وخوادمنا عبر بروتوكول HTTPS/TLS. تُخزَّن كلمات المرور بصيغة مجزّأة لا رجعة فيها.',
          },
          {
            subtitle: 'وصول مقيّد',
            text: 'يقتصر الوصول إلى بياناتكم الشخصية على أعضاء فريق وعي DZ الذين يحتاجون إليها لأداء مهامهم.',
          },
          {
            subtitle: 'استضافة آمنة',
            text: 'تُستضاف بياناتنا على خوادم آمنة في الجزائر أو الاتحاد الأوروبي وفق الأنظمة المعمول بها.',
          },
        ],
      },
      {
        icon: UserCheck,
        title: '٤. حقوقكم',
        content: [
          {
            subtitle: 'الاطلاع والتصحيح',
            text: 'يحق لكم الاطلاع على جميع بياناتكم الشخصية لدينا وطلب تصحيحها إن كانت غير دقيقة.',
          },
          {
            subtitle: 'الحذف',
            text: 'يمكنكم طلب حذف حسابكم وبياناتكم في أي وقت، إلا إذا كان القانون يُلزمنا بالاحتفاظ بها.',
          },
          {
            subtitle: 'قابلية النقل',
            text: 'بناءً على طلبكم، نزودكم ببياناتكم بتنسيق منظم قابل للقراءة آلياً.',
          },
        ],
      },
      {
        icon: Shield,
        title: '٥. مشاركة البيانات',
        content: [
          {
            subtitle: 'لا بيع للبيانات',
            text: 'لا تبيع وعي DZ بياناتكم الشخصية ولا تؤجّرها ولا تتاجر بها مع أي طرف ثالث تحت أي ظرف.',
          },
          {
            subtitle: 'الشركاء التشغيليون',
            text: 'قد تُشارَك بيانات موقعكم مع شركات إعادة التدوير أو مراكز الردم الشريكة لغرض وحيد هو معالجة طلب الجمع الخاص بكم.',
          },
          {
            subtitle: 'الالتزامات القانونية',
            text: 'قد نُضطر إلى الإفصاح عن بياناتكم إذا اقتضى ذلك القانون الجزائري أو قرار قضائي.',
          },
        ],
      },
    ],
    contact: {
      title: 'أسئلة حول خصوصيتكم؟',
      text: 'فريقنا متاح للإجابة على جميع استفساراتكم المتعلقة ببياناتكم الشخصية.',
      email: 'entreprisedzwai@gmail.com',
      button: 'تواصل معنا',
    },
    backHome: 'العودة إلى الرئيسية',
    termsLink: 'شروط الاستخدام',
  },
};

export default function PrivacyPolicy() {
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
          position: 'absolute', top: -60, right: isRTL ? 'auto' : -60, left: isRTL ? -60 : 'auto',
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(14, 110, 87, 0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: isRTL ? 'auto' : 80, right: isRTL ? 80 : 'auto',
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
      <section style={{
        background: 'var(--color-primary-dark)',
        padding: '80px 0',
      }}>
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
            to="/conditions-utilisation"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)',
              textDecoration: 'none', letterSpacing: '0.05em',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <span>{c.termsLink}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

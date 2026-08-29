import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Map, AlertTriangle, Package, ShoppingCart,
  LogOut, Menu, X, Landmark, RefreshCw, Clock, CheckCircle2,
  FileText, Check, Loader2, Plus, Sparkles, Sliders, ShoppingBag,
  Compass, Minus, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { containerRequestsService } from '../../services/containerRequestsService';
import ContainersMap from '../../components/Map/ContainersMap';

function formatTimeAgo(isoString, lang) {
  if (!isoString) return '—';
  try {
    const diff = Math.floor((Date.now() - new Date(isoString)) / 60000);
    if (diff < 1) return lang === 'fr' ? "À l'instant" : 'الآن';
    if (diff < 60) return lang === 'fr' ? `il y a ${diff} min` : `منذ ${diff} دقيقة`;
    const h = Math.floor(diff / 60);
    if (h < 24) return lang === 'fr' ? `il y a ${h} h` : `منذ ${h} ساعة`;
    return lang === 'fr' ? `il y a ${Math.floor(h / 24)} j` : `منذ ${Math.floor(h / 24)} يوم`;
  } catch { return '—'; }
}

export default function CommuneDashboard() {
  const { lang } = useLanguage();
  const { profile, session, signOut } = useAuth();
  const isRTL = lang === 'ar';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [containers, setContainers] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [containerRequests, setContainerRequests] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const [catalogItems, setCatalogItems] = useState([]);

  // Modales
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [orderModal, setOrderModal] = useState(null); // { item, mode, quantite }
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Formulaire de demande de conteneur sur-mesure
  const [form, setForm] = useState({
    quantite: 1,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const communeNom = profile?.nom || session?.user?.user_metadata?.nom || 'APC';
  const communeWilaya = profile?.wilaya || session?.user?.user_metadata?.wilaya || 'Algérie';
  const communeEmail = session?.user?.email || '';
  const communeTel = profile?.telephone || session?.user?.user_metadata?.telephone || '';

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setLoading(true);
    try {
      const communeId = profile?.id || session?.user?.id;
      const [containersRes, signalementsRes, requestsRes, catRes] = await Promise.all([
        supabase.from('containers_with_coords').select('*'),
        supabase.from('reclamations').select('*').order('created_at', { ascending: false }),
        communeId
          ? containerRequestsService.getAllRequests({ commune_id: communeId })
          : Promise.resolve([]),
        supabase.from('catalogue_conteneurs').select('*').order('created_at', { ascending: false }),
      ]);
      setContainers(containersRes.data || []);
      setSignalements(signalementsRes.data || []);
      setContainerRequests(requestsRes || []);
      setCatalogItems(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateSignalement = async (id, newStatut) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('reclamations').update({ statut: newStatut }).eq('id', id);
      if (!error) setSignalements(prev => prev.map(s => s.id === id ? { ...s, statut: newStatut } : s));
    } finally { setUpdatingId(null); }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert(isRTL ? 'يرجى كتابة وصف للطلب' : 'Veuillez décrire votre demande');
      return;
    }
    setSubmitting(true);
    try {
      const newReq = {
        type_demande: 'personnalise',
        mode_acquisition: 'achat',
        titre_modele: 'Sur-mesure (Personnalisé)',
        categorie: 'Personnalisé',
        capacite: '—',
        materiau: '—',
        nb_flux: '—',
        couleur: '—',
        options_specifiques: [],
        quantite: Number(form.quantite) || 1,
        date_souhaitee: 'Dès que possible',
        lieu_installation: `Commune de ${communeNom}`,
        cahier_charges: form.description,
        commune_id: profile?.id || session?.user?.id || 'commune-active',
        commune_nom: communeNom,
        commune_wilaya: communeWilaya,
        contact_nom: communeNom,
        contact_tel: communeTel,
        contact_email: communeEmail,
      };
      const created = await containerRequestsService.createRequest(newReq);
      setContainerRequests(prev => [created, ...prev]);
      setForm({ quantite: 1, description: '' });
      setCustomModalOpen(false);
      alert(isRTL ? 'تم إرسال الطلب بنجاح!' : 'Demande sur-mesure envoyée avec succès !');
      setActiveTab('my_requests');
    } catch (err) {
      alert(isRTL ? `خطأ: ${err.message}` : `Erreur: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!orderModal) return;
    const { item, mode, quantite } = orderModal;
    setOrderSubmitting(true);
    try {
      const newReq = {
        type_demande: mode,
        mode_acquisition: mode,
        titre_modele: item.titre,
        categorie: item.titre,
        capacite: item.capacite || '—',
        quantite: Number(quantite) || 1,
        date_souhaitee: 'Dès que possible',
        lieu_installation: `Commune de ${communeNom}`,
        cahier_charges: `Commande catalogue : ${item.titre}`,
        commune_id: profile?.id || session?.user?.id || 'commune-active',
        commune_nom: communeNom,
        commune_wilaya: communeWilaya,
        contact_nom: communeNom,
        contact_tel: communeTel,
        contact_email: communeEmail,
      };
      const created = await containerRequestsService.createRequest(newReq);
      setContainerRequests(prev => [created, ...prev]);
      setOrderModal(null);
      alert(isRTL ? 'تم تسجيل الطلب بنجاح!' : 'Commande enregistrée avec succès !');
      setActiveTab('my_requests');
    } catch (err) {
      alert(err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const pendingReports = signalements.filter(s => !s.statut || s.statut === 'en_attente' || s.statut === 'nouveau').length;
  const pendingRequests = containerRequests.filter(r => r.statut === 'en_attente' || r.statut === 'en_etude').length;

  const getStatusBadge = (st) => {
    const map = {
      en_attente:   { label: isRTL ? 'قيد المراجعة' : 'En attente',  bg: '#fef3c7', color: '#d97706' },
      en_etude:     { label: isRTL ? 'قيد الدراسة' : 'En étude',     bg: '#e0e7ff', color: '#4338ca' },
      devis_envoye: { label: isRTL ? 'عرض السعر' : 'Devis reçu',     bg: '#fef9c3', color: '#ca8a04' },
      valide:       { label: isRTL ? 'مقبول' : 'Validée',            bg: '#dcfce7', color: '#15803d' },
      livre:        { label: isRTL ? 'تم التسليم' : 'Livré',         bg: '#d1fae5', color: '#047857' },
      rejete:       { label: isRTL ? 'مرفوض' : 'Refusée',            bg: '#fee2e2', color: '#b91c1c' },
    };
    return map[st] || { label: isRTL ? 'معالجة' : 'En cours', bg: '#f3f4f6', color: '#6b7280' };
  };

  const navItems = [
    { key: 'dashboard',   label: isRTL ? 'لوحة التحكم' : 'Tableau de bord',       icon: LayoutDashboard },
    { key: 'map',         label: isRTL ? 'خريطة الحاويات' : 'Carte des Conteneurs', icon: Map },
    { key: 'signalements',label: isRTL ? 'البلاغات' : 'Signalements',              icon: AlertTriangle, badge: pendingReports || null },
    { key: 'commander',   label: isRTL ? 'طلب حاوية' : 'Commander un Conteneur',  icon: ShoppingCart },
    { key: 'my_requests', label: isRTL ? 'طلباتي' : 'Mes Demandes',               icon: FileText, badge: pendingRequests || null },
  ];

  const card = (title, value, Icon, color, sub) => (
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>{title}</p>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : value}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Mobile menu button */}
      {isMobile && (
        <button onClick={() => setSidebarOpen(s => !s)} style={{
          position: 'fixed', top: 16, [isRTL ? 'right' : 'left']: 16, zIndex: 50,
          background: 'var(--color-primary)', border: 'none', borderRadius: '50%',
          width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', boxShadow: 'var(--shadow-md)',
        }}>
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 250, flexShrink: 0, background: '#fff',
          borderRight: isRTL ? 'none' : '1px solid var(--color-border)',
          borderLeft: isRTL ? '1px solid var(--color-border)' : 'none',
          display: isMobile ? (sidebarOpen ? 'flex' : 'none') : 'flex',
          flexDirection: 'column', padding: '24px 14px 20px', gap: 4,
          position: isMobile && sidebarOpen ? 'fixed' : 'sticky',
          top: 0, height: '100vh',
          [isRTL ? 'right' : 'left']: 0,
          zIndex: isMobile && sidebarOpen ? 40 : 'auto',
          boxShadow: isMobile && sidebarOpen ? 'var(--shadow-lg)' : 'none',
          overflowY: 'auto',
        }}>
          {/* Identité commune */}
          <div style={{ padding: '4px 8px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 10 }}>
              {isRTL ? 'مساحة البلدية' : 'Espace Commune'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <Landmark size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{communeNom}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{communeWilaya}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {navItems.map(({ key, label, icon: Icon, badge }) => {
              const active = activeTab === key;
              return (
                <button key={key} onClick={() => { setActiveTab(key); setSidebarOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '11px 14px',
                  background: active ? 'var(--color-accent-light)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  textAlign: isRTL ? 'right' : 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <Icon size={17} color={active ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
                    <span>{label}</span>
                  </div>
                  {badge != null && (
                    <span style={{ background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <button onClick={signOut} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, color: '#dc2626', fontWeight: 600,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}>
              <LogOut size={16} strokeWidth={1.5} />
              {isRTL ? 'تسجيل الخروج' : 'Déconnexion'}
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, padding: isMobile ? '70px 16px 40px' : '40px 40px', minWidth: 0 }}>

          {/* ══ TAB: DASHBOARD ══ */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
                    {isRTL ? 'مساحة البلدية' : 'Espace Commune'}
                  </p>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>{communeNom}</h1>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    {isRTL ? `ولاية ${communeWilaya}` : `Wilaya de ${communeWilaya}`}
                  </p>
                </div>
                <button onClick={() => fetchData(true)} disabled={refreshing} className="btn btn-outline-dark" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <RefreshCw size={14} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
                  {isRTL ? 'تحديث' : 'Actualiser'}
                </button>
              </div>

              {/* KPI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
                {card(isRTL ? 'الحاويات' : 'Conteneurs suivis', containers.length, Package, 'var(--color-primary)', isRTL ? 'في البلدية' : 'dans la commune')}
                {card(isRTL ? 'البلاغات' : 'Signalements', pendingReports, AlertTriangle, '#dc2626', isRTL ? 'قيد المعالجة' : 'en attente')}
                {card(isRTL ? 'طلبات التجهيز' : 'Demandes envoyées', containerRequests.length, ShoppingCart, '#c8974f', isRTL ? `${pendingRequests} قيد الدراسة` : `${pendingRequests} en cours`)}
              </div>

              {/* Dernières demandes */}
              {containerRequests.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                      {isRTL ? 'آخر الطلبات' : 'Dernières demandes'}
                    </h3>
                    <button onClick={() => setActiveTab('my_requests')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      {isRTL ? 'عرض الكل' : 'Voir tout →'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {containerRequests.slice(0, 3).map(req => {
                      const badge = getStatusBadge(req.statut);
                      return (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', gap: 12 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 2px 0' }}>{req.titre_modele}</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{req.quantite} unités • {formatTimeAgo(req.created_at, lang)}</p>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: MAP ══ */}
          {activeTab === 'map' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'خريطة الحاويات' : 'Carte des Conteneurs'}
              </h1>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 500 }}>
                <ContainersMap />
              </div>
            </div>
          )}

          {/* ══ TAB: SIGNALEMENTS ══ */}
          {activeTab === 'signalements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'بلاغات المواطنين' : 'Signalements Citoyens'}
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {signalements.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0', fontSize: 13 }}>
                    {isRTL ? 'لا توجد بلاغات' : 'Aucun signalement'}
                  </p>
                ) : signalements.map(sig => {
                  const isPending = !sig.statut || sig.statut === 'en_attente' || sig.statut === 'nouveau';
                  return (
                    <div key={sig.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 3px 0' }}>{sig.description || 'Signalement citoyen'}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{formatTimeAgo(sig.created_at, lang)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: isPending ? '#fee2e2' : '#dcfce7', color: isPending ? '#dc2626' : '#16a34a' }}>
                          {isPending ? (isRTL ? 'قيد المعالجة' : 'En attente') : (isRTL ? 'تم الحل' : 'Résolu')}
                        </span>
                        {isPending && (
                          <button onClick={() => handleUpdateSignalement(sig.id, 'resolu')} className="btn btn-forest" style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }} disabled={updatingId === sig.id}>
                            {updatingId === sig.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            {isRTL ? 'تم الحل' : 'Résolu'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ TAB: COMMANDER (STYLE BOUTIQUE MODERNE) ══ */}
          {activeTab === 'commander' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%' }}>
              
              {/* Hero Banner avec Action Sur-Mesure */}
              <div style={{
                background: 'linear-gradient(135deg, #1b3d2f 0%, #0d2319 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: isMobile ? '24px 20px' : '32px 36px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 24,
                boxShadow: '0 12px 32px rgba(27, 61, 47, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative background glow */}
                <div style={{
                  position: 'absolute',
                  top: '-40%',
                  right: isRTL ? 'auto' : '-10%',
                  left: isRTL ? '-10%' : 'auto',
                  width: 320,
                  height: 320,
                  background: 'radial-gradient(circle, rgba(200, 151, 79, 0.25) 0%, rgba(200, 151, 79, 0) 70%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: 560, zIndex: 1 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 20, marginBottom: 14 }}>
                    <Compass size={15} color="#c8974f" />
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: '#f0dfc4', textTransform: 'uppercase' }}>
                      {isRTL ? 'تصاميم معمارية معتمدة' : 'Design & Ingénierie Urbaine'}
                    </span>
                  </div>
                  <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.85rem', fontWeight: 800, margin: '0 0 10px 0', color: '#fff', lineHeight: 1.25 }}>
                    {isRTL ? 'كتالوج المعدات والحاويات' : 'Catalogue des Conteneurs & Mobilier Urbain'}
                  </h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.6 }}>
                    {isRTL 
                      ? 'اختر من النماذج القياسية المصممة لبلديتك، أو اطلب تصميماً مخصصاً حسب احتياجاتك الخاصة.'
                      : 'Sélectionnez des conteneurs standards optimisés pour votre collectivité, ou soumettez un cahier des charges sur-mesure.'}
                  </p>
                </div>

                <div style={{ zIndex: 1 }}>
                  <button
                    onClick={() => setCustomModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #c8974f 0%, #ab7c38 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: '0 4px 16px rgba(200, 151, 79, 0.35)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Sparkles size={18} />
                    <span>{isRTL ? 'طلب نموذج مخصص (على المقاس)' : 'Demande Sur-Mesure'}</span>
                  </button>
                </div>
              </div>

              {/* Section Grille des Conteneurs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 2px 0' }}>
                      {isRTL ? 'النماذج المتوفرة' : 'Modèles Disponibles'}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                      {catalogItems.length} {isRTL ? 'نماذج جاهزة للطلب' : 'modèle(s) disponible(s) immédiatement'}
                    </p>
                  </div>
                </div>

                {catalogItems.length === 0 ? (
                  <div style={{
                    background: '#fff',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '60px 24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14
                  }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={32} color="var(--color-text-muted)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px 0' }}>
                        {isRTL ? 'الكتالوج فارغ حالياً' : 'Aucun modèle dans le catalogue'}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, maxWidth: 420 }}>
                        {isRTL 
                          ? 'لم يقم المهندس بنشر نماذج بعد. يمكنك إرسال طلب مخصص مباشرة!' 
                          : 'L\'administration n\'a pas encore publié de modèles standards. Vous pouvez créer une demande sur-mesure.'}
                      </p>
                    </div>
                    <button onClick={() => setCustomModalOpen(true)} className="btn btn-forest" style={{ marginTop: 8 }}>
                      {isRTL ? 'إنشاء طلب مخصص' : 'Créer une demande sur-mesure'}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 24,
                  }}>
                    {catalogItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          background: '#fff',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                      >
                        {/* Image Preview Container */}
                        <div style={{
                          height: 240,
                          background: '#ffffff',
                          position: 'relative',
                          overflow: 'hidden',
                          borderBottom: '1px solid var(--color-border)',
                        }}>
                          {item.image_url ? (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url(${item.image_url})`,
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'center',
                            }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={52} color="var(--color-text-muted)" style={{ opacity: 0.4 }} />
                            </div>
                          )}

                          {/* Architect Badge Overlay */}
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            [isRTL ? 'right' : 'left']: 12,
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(6px)',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <Compass size={12} color="#c8974f" />
                            <span>Design Pro</span>
                          </div>

                          {/* Capacity Tag */}
                          {item.capacite && (
                            <div style={{
                              position: 'absolute',
                              bottom: 12,
                              [isRTL ? 'left' : 'right']: 12,
                              background: 'rgba(255, 255, 255, 0.92)',
                              backdropFilter: 'blur(4px)',
                              color: 'var(--color-primary)',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}>
                              {item.capacite}
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div style={{ padding: '20px 20px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                              {item.titre}
                            </h3>
                            <p style={{
                              fontSize: 13,
                              color: 'var(--color-text-secondary)',
                              margin: 0,
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: 40
                            }}>
                              {item.description || (isRTL ? 'نموذج معياري عالي الجودة متوفر للتركيب السريع.' : 'Équipement urbain standard conçu pour une durabilité maximale.')}
                            </p>
                          </div>

                          {/* Availability Badges */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {item.disponible_achat && (
                              <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 14 }}>
                                ✓ {isRTL ? 'متاح للشراء' : 'Achat direct'}
                              </span>
                            )}
                            {item.disponible_location && (
                              <span style={{ fontSize: 11, fontWeight: 700, background: '#e0e7ff', color: '#4338ca', padding: '3px 9px', borderRadius: 14 }}>
                                ✓ {isRTL ? 'متاح للكراء' : 'Location longue durée'}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                            {item.disponible_achat && (
                              <button
                                onClick={() => setOrderModal({ item, mode: 'achat', quantite: 5 })}
                                className="btn btn-forest"
                                style={{ flex: 1, fontSize: 13, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              >
                                <ShoppingBag size={15} />
                                <span>{isRTL ? 'شراء' : 'Acheter'}</span>
                              </button>
                            )}
                            {item.disponible_location && (
                              <button
                                onClick={() => setOrderModal({ item, mode: 'location', quantite: 5 })}
                                className="btn btn-outline-dark"
                                style={{ flex: 1, fontSize: 13, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              >
                                <span>{isRTL ? 'كراء' : 'Louer'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ MODAL DEMANDE SUR-MESURE ══ */}
          {customModalOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}>
              <div style={{
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: 520,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                padding: '28px 32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                        {isRTL ? 'طلب حاوية مخصصة' : 'Demande Sur-Mesure'}
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                        {isRTL ? 'حدد متطلباتك وسيقوم مهندسنا بدراستها' : 'Étude personnalisée par notre équipe d\'ingénieurs'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setCustomModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {isRTL ? 'الكمية المطلوبة' : 'Quantité souhaitée'} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.quantite}
                      onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {isRTL ? 'دفتر الشروط والمواصفات' : 'Cahier des charges & Spécifications'} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder={isRTL 
                        ? 'اذكر الأبعاد، المواد (معدن، خشب، بلاستيك)، عدد الفتحات للفرز، والحي المستهدف...' 
                        : 'Dimensions, matériaux (acier galvanisé, bois, polyéthylène), tri sélectif, quartier d\'installation...'}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={() => setCustomModalOpen(false)} className="btn btn-outline-dark">
                      {isRTL ? 'إلغاء' : 'Annuler'}
                    </button>
                    <button type="submit" disabled={submitting} className="btn btn-forest" style={{ minWidth: 140 }}>
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : (isRTL ? 'إرسال الطلب' : 'Envoyer la demande')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══ MODAL COMMANDE CATALOGUE ══ */}
          {orderModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}>
              <div style={{
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: 460,
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                padding: '28px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                    {orderModal.mode === 'achat' ? (isRTL ? 'طلب شراء' : 'Commande d\'achat') : (isRTL ? 'طلب كراء' : 'Demande de location')}
                  </h3>
                  <button onClick={() => setOrderModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Selected Model Preview */}
                <div style={{ display: 'flex', gap: 14, background: 'var(--color-surface)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 20, alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                    {orderModal.item.image_url ? (
                      <img src={orderModal.item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={24} color="var(--color-text-muted)" />
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px 0', color: 'var(--color-primary)' }}>{orderModal.item.titre}</h4>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: orderModal.mode === 'achat' ? '#dcfce7' : '#e0e7ff', color: orderModal.mode === 'achat' ? '#15803d' : '#4338ca' }}>
                      {orderModal.mode === 'achat' ? (isRTL ? 'شراء' : 'Achat direct') : (isRTL ? 'كراء' : 'Location')}
                    </span>
                  </div>
                </div>

                {/* Quantité Selector */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {isRTL ? 'الكمية المطلوبة' : 'Quantité à commander'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setOrderModal(p => ({ ...p, quantite: Math.max(1, (Number(p.quantite) || 1) - 1) }))}
                      style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={orderModal.quantite}
                      onChange={e => setOrderModal(p => ({ ...p, quantite: Math.max(1, parseInt(e.target.value) || 1) }))}
                      style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: 16, fontWeight: 800, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setOrderModal(p => ({ ...p, quantite: (Number(p.quantite) || 1) + 1 }))}
                      style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={() => setOrderModal(null)} className="btn btn-outline-dark">
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={orderSubmitting}
                    className="btn btn-forest"
                    style={{ minWidth: 160 }}
                  >
                    {orderSubmitting ? <Loader2 size={16} className="animate-spin" /> : (isRTL ? 'تأكيد وإرسال' : 'Confirmer la commande')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: MES DEMANDES ══ */}
          {activeTab === 'my_requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'طلباتي' : 'Mes Demandes'}
              </h1>

              {containerRequests.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '40px 20px', textAlign: 'center' }}>
                  <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
                    {isRTL ? 'لم ترسل أي طلب بعد.' : 'Aucune demande envoyée pour le moment.'}
                  </p>
                  <button onClick={() => setActiveTab('commander')} className="btn btn-forest">
                    {isRTL ? 'أرسل طلباً الآن' : 'Faire une demande'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {containerRequests.map(req => {
                    const badge = getStatusBadge(req.statut);
                    return (
                      <div key={req.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: req.reponse_admin ? 10 : 0 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                {req.mode_acquisition === 'location' ? (isRTL ? 'كراء' : 'Location') : req.type_demande === 'personnalise' ? (isRTL ? 'مخصص' : 'Sur-mesure') : (isRTL ? 'شراء' : 'Achat')}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatTimeAgo(req.created_at, lang)}</span>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 2px 0' }}>{req.titre_modele}</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{req.quantite} unités</p>
                            {req.cahier_charges && (
                              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                                {req.cahier_charges.length > 100 ? req.cahier_charges.slice(0, 100) + '...' : req.cahier_charges}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 4, background: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                            {req.devis_montant && (
                              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-accent)', marginTop: 6 }}>{req.devis_montant}</p>
                            )}
                          </div>
                        </div>
                        {req.reponse_admin && (
                          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 10 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 3 }}>
                              {isRTL ? 'رد الإدارة:' : 'Réponse de l\'administration :'}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0 }}>{req.reponse_admin}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

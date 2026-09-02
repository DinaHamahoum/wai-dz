import { useState, useEffect } from 'react';
import {
  Trash2, MapPin, Clock, Check, CheckCircle2, AlertCircle,
  RefreshCw, AlertTriangle, Package, Loader2, Phone, LogOut, Menu, X,
  BatteryMedium, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

/* ── Relative time helper ── */
function formatTimeAgo(isoString, lang) {
  if (!isoString) return '—';
  try {
    const diff = Math.floor((Date.now() - new Date(isoString)) / 60000);
    if (diff < 1) return lang === 'fr' ? "À l'instant" : 'الآن';
    if (diff < 60) return lang === 'fr' ? `il y a ${diff} min` : `منذ ${diff} دقيقة`;
    const h = Math.floor(diff / 60);
    if (h < 24) return lang === 'fr' ? `il y a ${h} h` : `منذ ${h} ساعة`;
    const d = Math.floor(h / 24);
    return lang === 'fr' ? `il y a ${d} j` : `منذ ${d} يوم`;
  } catch {
    return '—';
  }
}

/* ── Localisation display helper ── */
function formatLocalisation(loc, lang) {
  if (!loc) return lang === 'fr' ? 'Non précisé' : 'غير محدد';
  if (typeof loc === 'object' && loc.type === 'Point') {
    return `GPS: ${loc.coordinates[1].toFixed(4)}, ${loc.coordinates[0].toFixed(4)}`;
  }
  if (typeof loc === 'string') {
    if (loc.startsWith('POINT(')) {
      const match = loc.match(/POINT\(([^\s]+)\s+([^\)]+)\)/);
      if (match) return `GPS: ${parseFloat(match[2]).toFixed(4)}, ${parseFloat(match[1]).toFixed(4)}`;
    }
    return loc;
  }
  return lang === 'fr' ? 'Localisation fournie' : 'موقع محدد';
}

/* ── Statut badge ── */
function StatutBadge({ statut, lang }) {
  const map = {
    en_attente:  { labelFr: 'En attente', labelAr: 'في الانتظار',  bg: '#fef9c3', color: '#92400e' },
    nouveau:     { labelFr: 'Nouveau',    labelAr: 'جديد',          bg: '#fef9c3', color: '#92400e' },
    confirmee:   { labelFr: 'Acceptée',  labelAr: 'مقبولة',        bg: '#dbeafe', color: '#1e40af' },
    acceptee:    { labelFr: 'Acceptée',  labelAr: 'مقبولة',        bg: '#dbeafe', color: '#1e40af' },
    en_collecte: { labelFr: 'En cours',  labelAr: 'قيد التنفيذ',   bg: '#dbeafe', color: '#1e40af' },
    terminee:    { labelFr: 'Terminée',  labelAr: 'مكتملة',        bg: '#dcfce7', color: '#15803d' },
  };
  const cfg = map[statut] || { labelFr: statut, labelAr: statut, bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      fontSize: 10, padding: '3px 10px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {lang === 'fr' ? cfg.labelFr : cfg.labelAr}
    </span>
  );
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, value, labelFr, labelAr, color, bg, lang }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{lang === 'fr' ? labelFr : labelAr}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function CETDashboard() {
  const { lang } = useLanguage();
  const { profile, session, signOut } = useAuth();
  const isRTL = lang === 'ar';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  /* ── State ── */
  const [activeTab, setActiveTab]             = useState('demandes');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [demandes, setDemandes]               = useState([]);
  const [signalements, setSignalements]       = useState([]);
  const [conteneurs, setConteneurs]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── Fetch demandes non recyclables ── */
  const fetchDemandes = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const { data: demandesData, error } = await supabase
        .from('demandes_collecte')
        .select('*')
        .eq('categorie_dechet', 'non_recyclable')
        .order('created_at', { ascending: false });

      if (error) { console.error('Erreur fetch demandes CET:', error); setDemandes([]); return; }
      if (!demandesData?.length) { setDemandes([]); return; }

      const userIds = [...new Set(demandesData.map((d) => d.user_id).filter(Boolean))];
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nom, telephone, wilaya, role')
          .in('id', userIds);
        if (profilesData) profilesData.forEach((p) => { profilesMap[p.id] = p; });
      }

      setDemandes(demandesData.map((d) => ({ ...d, profiles: profilesMap[d.user_id] || null })));
    } catch (err) {
      console.error('Erreur fetch demandes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ── Fetch conteneurs ── */
  const fetchConteneurs = async () => {
    try {
      const { data, error } = await supabase
        .from('containers_with_coords')
        .select('*');
      if (error) { console.error('Erreur fetch conteneurs:', error); return; }
      if (data) setConteneurs(data);
    } catch (err) {
      console.error('Erreur fetch conteneurs:', err);
    }
  };

  /* ── Fetch signalements containers ── */
  const fetchSignalements = async () => {
    try {
      const { data, error } = await supabase
        .from('reclamations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) { console.error('Erreur fetch signalements:', error); return; }
      if (!data?.length) { setSignalements([]); return; }

      const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nom, telephone')
          .in('id', userIds);
        if (profilesData) profilesData.forEach((p) => { profilesMap[p.id] = p; });
      }

      setSignalements(data.map((r) => ({ ...r, profiles: profilesMap[r.user_id] || null })));
    } catch (err) {
      console.error('Erreur fetch signalements:', err);
    }
  };

  const refreshAll = async (showSpinner = false) => {
    await Promise.all([fetchDemandes(showSpinner), fetchSignalements(), fetchConteneurs()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleUpdateStatus = async (demandeId, newStatut) => {
    setActionLoadingId(demandeId);
    try {
      const { data, error } = await supabase
        .from('demandes_collecte')
        .update({ statut: newStatut })
        .eq('id', demandeId)
        .select();

      if (error) {
        alert(`Erreur: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        alert(
          isRTL
            ? "تعذر تحديث الحالة في قاعدة البيانات. يرجى تشغيل ملف fix_demandes_collecte_rls.sql في Supabase."
            : "Mise à jour bloquée par les règles de sécurité Supabase. Veuillez exécuter le script SQL fix_demandes_collecte_rls.sql dans Supabase."
        );
        return;
      }

      // Attribution automatique des points de récompense au citoyen
      const targetDemande = demandes.find((d) => d.id === demandeId);
      const targetUserId = data?.[0]?.user_id || targetDemande?.user_id;
      if (targetUserId && (newStatut === "confirmee" || newStatut === "terminee")) {
        const pts = newStatut === "confirmee" ? 3 : 4;
        await supabase.from("recompenses").insert([
          {
            user_id: targetUserId,
            type: newStatut === "confirmee" ? "collecte_confirmee" : "collecte_terminee",
            points: pts,
            demande_id: demandeId,
          },
        ]);
      }

      setDemandes((prev) => prev.map((d) => (d.id === demandeId ? { ...d, statut: newStatut } : d)));
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Filtered data ── */
  const demandesFiltrees = demandes.filter((d) => {
    if (!d) return false;
    if (statusFilter === 'all')        return true;
    if (statusFilter === 'en_attente') return ['en_attente', 'nouveau'].includes(d.statut);
    if (statusFilter === 'confirmee')  return ['confirmee', 'acceptee', 'en_collecte'].includes(d.statut);
    if (statusFilter === 'terminee')   return d.statut === 'terminee';
    return true;
  });

  const countEnAttente  = demandes.filter((d) => d && ['en_attente', 'nouveau'].includes(d.statut)).length;
  const countConfirmees = demandes.filter((d) => d && ['confirmee', 'acceptee', 'en_collecte'].includes(d.statut)).length;
  const countTerminees  = demandes.filter((d) => d && d.statut === 'terminee').length;

  const cetNom = profile?.nom || session?.user?.user_metadata?.nom || (lang === 'fr' ? 'Centre CET' : 'مركز CET');

  const navItems = [
    { key: 'demandes', label: lang === 'fr' ? 'Demandes de collecte' : 'طلبات الجمع', icon: Trash2 },
    { key: 'signalements', label: lang === 'fr' ? 'Signalements réclamations' : 'البلاغات والشكاوى', icon: AlertTriangle },
    { key: 'remplissage', label: lang === 'fr' ? 'Taux de remplissage' : 'مستوى التعبئة', icon: BatteryMedium },
    { key: 'stats', label: lang === 'fr' ? 'Statistiques & Bilan' : 'الإحصائيات والحصيلة', icon: BarChart3 },
  ];

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          style={{
            position: 'fixed',
            top: 16,
            ...(isRTL ? { right: 16 } : { left: 16 }),
            zIndex: 50,
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: '50%',
            width: 42,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            background: '#ffffff',
            borderRight: isRTL ? 'none' : '1px solid var(--color-border)',
            borderLeft: isRTL ? '1px solid var(--color-border)' : 'none',
            display: isMobile ? (sidebarOpen ? 'flex' : 'none') : 'flex',
            flexDirection: 'column',
            padding: '24px 12px 16px',
            gap: 2,
            position: isMobile && sidebarOpen ? 'fixed' : 'sticky',
            top: 0,
            left: isRTL ? 'auto' : 0,
            right: isRTL ? 0 : 'auto',
            height: '100vh',
            zIndex: isMobile && sidebarOpen ? 40 : 'auto',
            boxShadow: isMobile && sidebarOpen ? 'var(--shadow-lg)' : 'none',
            overflowY: 'auto',
          }}
        >
          {/* Profile header */}
          <div style={{ padding: '4px 8px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 12 }}>
              {lang === 'fr' ? 'Espace CET' : 'مساحة مركز CET'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Trash2 size={18} strokeWidth={1.5} color="#6b7280" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cetNom}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                  {lang === 'fr' ? 'Centre d\'Enfouissement' : 'مركز الردم'}
                </p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          {navItems.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 14px',
                  background: active ? 'var(--color-accent-light)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  borderLeft: !isRTL ? `2px solid ${active ? 'var(--color-accent)' : 'transparent'}` : 'none',
                  borderRight: isRTL ? `2px solid ${active ? 'var(--color-accent)' : 'transparent'}` : 'none',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  textAlign: isRTL ? 'right' : 'left',
                  borderRadius: `0 var(--radius-sm) var(--radius-sm) 0`,
                }}
              >
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </button>
            );
          })}

          {/* Sign Out */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={signOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '11px 14px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, color: '#dc2626',
                flexDirection: isRTL ? 'row-reverse' : 'row',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              <LogOut size={16} strokeWidth={1.5} />
              {lang === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: isMobile ? '70px 16px 40px' : '40px 48px', minWidth: 0 }}>
          {/* TAB 3: STATS & BILAN */}
          {activeTab === 'stats' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--color-primary)' }}>
                  {lang === 'fr' ? 'Statistiques & Bilan CET' : 'الإحصائيات والحصيلة'}
                </h1>
                <button
                  onClick={() => refreshAll(true)}
                  disabled={refreshing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                    padding: '10px 18px', background: '#fff', cursor: 'pointer',
                    fontWeight: 600, color: 'var(--color-text)', fontFamily: 'inherit',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <RefreshCw size={15} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
                  {lang === 'fr' ? 'Actualiser' : 'تحديث'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                <StatCard
                  icon={Package} value={demandes.length}
                  labelFr="Total demandes non recyclables" labelAr="إجمالي الطلبات غير القابلة للتدوير"
                  color="var(--color-primary)" bg="var(--color-primary-50)" lang={lang}
                />
                <StatCard
                  icon={Clock} value={countEnAttente}
                  labelFr="En attente" labelAr="في الانتظار"
                  color="#d97706" bg="#fef3c7" lang={lang}
                />
                <StatCard
                  icon={Check} value={countConfirmees}
                  labelFr="Prises en charge" labelAr="قيد المعالجة"
                  color="#2563eb" bg="#dbeafe" lang={lang}
                />
                <StatCard
                  icon={CheckCircle2} value={countTerminees}
                  labelFr="Terminées" labelAr="مكتملة"
                  color="#059669" bg="#dcfce7" lang={lang}
                />
                <StatCard
                  icon={AlertTriangle} value={signalements.length}
                  labelFr="Signalements réclamations" labelAr="البلاغات والشكاوى"
                  color="#dc2626" bg="#fee2e2" lang={lang}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════ TAB: DEMANDES ══════════════════════ */}
          {activeTab === 'demandes' && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <span className="section-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Trash2 size={14} color="var(--color-accent)" />
                    {cetNom}
                  </span>
                  <h1 style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-primary)',
                    lineHeight: 1.1, marginTop: 4,
                  }}>
                    {lang === 'fr' ? 'Demandes de collecte CET' : 'طلبات الجمع مركز CET'}
                  </h1>
                </div>

                <button
                  onClick={() => refreshAll(true)}
                  disabled={refreshing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                    padding: '10px 18px', background: '#fff', cursor: 'pointer',
                    fontWeight: 600, color: 'var(--color-text)', fontFamily: 'inherit',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <RefreshCw size={15} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
                  {lang === 'fr' ? 'Actualiser' : 'تحديث'}
                </button>
              </div>

              {/* Status filter pills */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { key: 'all',        labelFr: 'Toutes',     labelAr: 'الكل',        count: demandes.length },
                  { key: 'en_attente', labelFr: 'En attente', labelAr: 'في الانتظار', count: countEnAttente },
                  { key: 'confirmee',  labelFr: 'En cours',   labelAr: 'قيد المعالجة', count: countConfirmees },
                  { key: 'terminee',   labelFr: 'Terminées',  labelAr: 'مكتملة',      count: countTerminees },
                ].map(({ key, labelFr, labelAr, count }) => {
                  const active = statusFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      style={{
                        padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: active ? 'var(--color-accent-light)' : '#fff',
                        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {lang === 'fr' ? labelFr : labelAr}
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99,
                        background: active ? 'var(--color-accent)' : 'var(--color-bg)',
                        color: active ? '#fff' : 'var(--color-text-muted)',
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Loader2 size={32} color="var(--color-accent)" style={{ animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                    {lang === 'fr' ? 'Chargement des demandes...' : 'جاري التحميل...'}
                  </p>
                </div>
              )}

              {/* Cards Grid */}
              {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                  {demandesFiltrees.map((d) => {
                    if (!d) return null;
                    const isNew       = ['en_attente', 'nouveau'].includes(d.statut);
                    const isConfirmee = ['confirmee', 'acceptee', 'en_collecte'].includes(d.statut);
                    const isTerminee  = d.statut === 'terminee';
                    const isLoading   = actionLoadingId === d.id;

                    const clientNom    = d.profiles?.nom       || (lang === 'fr' ? 'Citoyen' : 'مواطن');
                    const clientTel    = d.profiles?.telephone  || '';
                    const clientWilaya = d.profiles?.wilaya    || '';

                    return (
                      <div
                        key={d.id}
                        style={{
                          background: '#fff',
                          border: isNew ? '1px solid #f59e0b' : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 24,
                          position: 'relative',
                          boxShadow: isNew ? '0 4px 16px rgba(245,158,11,0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        className="card-hover"
                      >
                        {/* Statut badge */}
                        <div style={{ position: 'absolute', top: 18, ...(isRTL ? { left: 18 } : { right: 18 }) }}>
                          <StatutBadge statut={d.statut} lang={lang} />
                        </div>

                        {/* Header */}
                        <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: isNew ? '#fef3c7' : isTerminee ? '#dcfce7' : '#dbeafe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Trash2 size={20} color={isNew ? '#d97706' : isTerminee ? '#15803d' : '#1e40af'} />
                          </div>
                          <div style={{ minWidth: 0, paddingRight: isRTL ? 0 : 90, paddingLeft: isRTL ? 90 : 0 }}>
                            <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 3, fontSize: 15 }}>
                              {clientNom}
                              {clientWilaya && (
                                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 12, marginLeft: 6 }}>
                                  — {clientWilaya}
                                </span>
                              )}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                              {d.type_dechet || (lang === 'fr' ? 'Non recyclable' : 'غير قابل للتدوير')}
                              {d.quantite && <> · <strong>{d.quantite}</strong></>}
                            </p>
                            {d.description && (
                              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                                {d.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: 14,
                          paddingTop: 14, borderTop: '1px solid var(--color-border)',
                          fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 18,
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={13} color="var(--color-accent)" />
                            {formatLocalisation(d.localisation, lang)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={13} />
                            {formatTimeAgo(d.created_at, lang)}
                          </span>
                          {d.type_dechet && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: 'var(--color-text)' }}>
                              <Package size={13} />
                              {(() => {
                                const t = {
                                  'Plastique': 'بلاستيك', 'Carton/Papier': 'كرتون / ورق', 'Verre': 'زجاج',
                                  'Métal': 'معدن', 'Électronique': 'إلكترونيات', 'Arabe': 'عربي (ورق/كتب)',
                                  'Organique': 'عضوي', 'Encombrant': 'مخلفات ضخمة (أثاث، أجهزة)',
                                  'Ménager': 'نفايات منزلية', 'Médical': 'نفايات طبية', 'Chimique': 'نفايات كيميائية / خطرة',
                                  'BTP': 'نفايات البناء والأنقاض', 'Autre': 'آخر'
                                };
                                return lang === 'fr' ? d.type_dechet : (t[d.type_dechet] || d.type_dechet);
                              })()}
                            </span>
                          )}
                          {d.quantite && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: 'var(--color-text)' }}>
                              <span style={{ fontSize: 12 }}>⚖️</span>
                              {d.quantite}
                            </span>
                          )}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#f3f4f6', color: '#374151',
                            borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                          }}>
                            {lang === 'fr' ? 'Non recyclable' : 'غير قابل للتدوير'}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 10 }}>
                          {clientTel && (
                            <a
                              href={`tel:${clientTel}`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                                padding: '10px 14px', fontSize: 13, color: 'var(--color-text)',
                                textDecoration: 'none', fontWeight: 600, fontFamily: 'inherit',
                                background: '#fff', flexShrink: 0,
                              }}
                            >
                              <Phone size={14} /> {lang === 'fr' ? 'Appeler' : 'اتصال'}
                            </a>
                          )}

                          {isNew && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, 'confirmee')}
                              disabled={isLoading}
                              style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                background: 'var(--color-primary)', color: '#fff',
                                border: 'none', borderRadius: 'var(--radius-lg)',
                                padding: '10px 16px', fontSize: 13, fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s ease',
                                fontFamily: 'inherit',
                              }}
                            >
                              {isLoading
                                ? <Loader2 size={14} style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                                : <Check size={14} />}
                              {lang === 'fr' ? 'Accepter la collecte' : 'قبول الطلب'}
                            </button>
                          )}

                          {isConfirmee && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, 'terminee')}
                              disabled={isLoading}
                              style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                background: 'var(--color-accent)', color: '#fff',
                                border: 'none', borderRadius: 'var(--radius-lg)',
                                padding: '10px 16px', fontSize: 13, fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s ease',
                                fontFamily: 'inherit',
                              }}
                            >
                              {isLoading
                                ? <Loader2 size={14} style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                                : <CheckCircle2 size={14} />}
                              {lang === 'fr' ? 'Marquer terminée' : 'تحديد كمكتمل'}
                            </button>
                          )}

                          {isTerminee && (
                            <span style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              background: '#ecfdf5', color: '#059669',
                              borderRadius: 'var(--radius-lg)', padding: '10px 16px',
                              fontSize: 12, fontWeight: 700,
                            }}>
                              <CheckCircle2 size={14} />
                              {lang === 'fr' ? 'Collecte effectuée' : 'تم الجمع'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {!loading && demandesFiltrees.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '64px 20px',
                  background: '#fff', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)', maxWidth: 480, margin: '20px auto 0',
                }}>
                  <AlertCircle size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: 6 }}>
                    {lang === 'fr' ? 'Aucune demande pour le moment' : 'لا توجد طلبات حالياً'}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                    {lang === 'fr'
                      ? 'Les demandes de déchets non recyclables apparaîtront ici dès leur soumission.'
                      : 'ستظهر هنا طلبات النفايات غير القابلة لإعادة التدوير فور تقديمها.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ══════════════════════ TAB: REMPLISSAGE CONTENEURS ══════════════════════ */}
          {activeTab === 'remplissage' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--color-primary)' }}>
                  {lang === 'fr' ? 'Taux de remplissage des conteneurs' : 'مستوى تعبئة الحاويات'}
                </h1>
                <button
                  onClick={() => refreshAll(true)}
                  disabled={refreshing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                    padding: '10px 18px', background: '#fff', cursor: 'pointer',
                    fontWeight: 600, color: 'var(--color-text)', fontFamily: 'inherit',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <RefreshCw size={15} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
                  {lang === 'fr' ? 'Actualiser' : 'تحديث'}
                </button>
              </div>

              {conteneurs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                  <Package size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{lang === 'fr' ? 'Aucun conteneur trouvé' : 'لم يتم العثور على حاويات'}</h3>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {conteneurs.map((c) => {
                    const fillLevel = (c.capacite && Number(c.capacite) > 0) ? Math.min(100, Math.round(((Number(c.statut) || 0) / Number(c.capacite)) * 100)) : 0;
                    let color = '#10B981'; // Green
                    if (fillLevel > 50) color = '#F59E0B'; // Yellow/Orange
                    if (fillLevel > 80) color = '#EF4444'; // Red

                    return (
                      <div key={c.id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: 4, fontWeight: 700 }}>
                              {c.nom || (lang === 'fr' ? 'Conteneur' : 'حاوية')}
                            </h3>
                          </div>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BatteryMedium size={20} color={color} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{lang === 'fr' ? 'Remplissage' : 'التعبئة'}</span>
                            <span style={{ color }}>{fillLevel}%</span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${fillLevel}%`, height: '100%', background: color, transition: 'width 0.5s ease-out' }} />
                          </div>
                          {fillLevel > 80 && (
                            <p style={{ marginTop: 12, fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                              <AlertTriangle size={14} />
                              {lang === 'fr' ? 'Collecte urgente requise' : 'يتطلب جمع عاجل'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ TAB: SIGNALEMENTS ══════════════════════ */}
          {activeTab === 'signalements' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {lang === 'fr'
                    ? `${signalements.length} signalement(s) de conteneurs enregistré(s)`
                    : `${signalements.length} بلاغ(بلاغات) مسجل(ة) حول الحاويات`}
                </p>
              </div>

              {signalements.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '64px 20px',
                  background: '#fff', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)', maxWidth: 480, margin: '20px auto 0',
                }}>
                  <AlertTriangle size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: 6 }}>
                    {lang === 'fr' ? 'Aucun signalement pour le moment' : 'لا توجد بلاغات حالياً'}
                  </h3>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                  {signalements.map((s) => {
                    if (!s) return null;
                    const clientNom = s.profiles?.nom || (lang === 'fr' ? 'Citoyen' : 'مواطن');
                    const resolu = s.statut === 'resolu';

                    return (
                      <div
                        key={s.id}
                        style={{
                          background: '#fff',
                          border: `1px solid ${resolu ? 'var(--color-border)' : '#fee2e2'}`,
                          borderRadius: 'var(--radius-lg)', padding: 24,
                          boxShadow: resolu ? '0 2px 8px rgba(0,0,0,0.02)' : '0 2px 8px rgba(220,38,38,0.05)',
                        }}
                        className="card-hover"
                      >
                        {/* Header */}
                        <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: resolu ? '#dcfce7' : '#fee2e2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {resolu ? <CheckCircle2 size={20} color="#15803d" /> : <AlertTriangle size={20} color="#dc2626" />}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 3, fontSize: 15 }}>
                              {clientNom}
                            </p>
                            <span style={{
                              fontSize: 10, padding: '3px 10px', borderRadius: 99,
                              background: resolu ? '#dcfce7' : '#fee2e2',
                              color: resolu ? '#15803d' : '#dc2626',
                              fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                              {resolu
                                ? (lang === 'fr' ? 'Résolu' : 'تم الحل')
                                : (lang === 'fr' ? 'En attente' : 'في الانتظار')}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {s.description && (
                          <p style={{
                            fontSize: 13, color: 'var(--color-text-secondary)',
                            lineHeight: 1.65, marginBottom: s.photo_url ? 10 : 14,
                            background: '#fafafa', padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                          }}>
                            {s.description}
                          </p>
                        )}
                        
                        {/* Photo */}
                        {s.photo_url && (
                          <div style={{ marginBottom: 14 }}>
                            <a href={s.photo_url} target="_blank" rel="noopener noreferrer">
                              <img src={s.photo_url} alt="Signalement" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                            </a>
                          </div>
                        )}

                        {/* Meta */}
                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={13} /> {formatTimeAgo(s.created_at, lang)}
                          </span>
                          {s.profiles?.telephone && (
                            <a
                              href={`tel:${s.profiles.telephone}`}
                              style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}
                            >
                              <Phone size={14} /> {s.profiles.telephone}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}

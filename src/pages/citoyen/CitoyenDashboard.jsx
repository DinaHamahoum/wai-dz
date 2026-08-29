import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, ClipboardList, Gift, User,
  AlertTriangle, Recycle, Star, ChevronRight, Clock,
  LogOut, Package, Plus, Menu, X, MapPin, Phone,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { REWARDS, REWARD_DESCRIPTIONS } from '../../constants/rewards';
import { TYPE_TO_LABEL_KEY } from '../../constants/establishmentTypes';
import ContainersMap from '../../components/Map/ContainersMap';
import RequestCollectionModal from '../../components/RequestCollectionModal';
import ReportModal from '../../components/ReportModal';

/* ── DB statut → UI key mapping ── */
const DB_STATUS_MAP = {
  en_attente: 'pending',
  nouveau: 'pending',
  confirmee: 'confirmed',
  acceptee: 'confirmed',
  en_collecte: 'confirmed',
  valide: 'confirmed',
  terminee: 'done',
  resolu: 'done',
  annulee: 'cancelled',
  rejete: 'cancelled',
};

const statusColors = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  done: 'status-done',
  reported: 'status-done',
  cancelled: 'status-cancelled',
};

function getContainerFill(statut, capacite) {
  const fill = Number(statut) || 0;
  const cap = Number(capacite) || 1;
  const ratio = fill / cap;
  const pct = Math.min(100, Math.round(ratio * 100));
  let dot = 'var(--color-primary)';
  let bg = 'var(--color-accent-light)';
  if (ratio >= 0.85) {
    dot = '#dc2626';
    bg = '#fef2f2';
  } else if (ratio >= 0.35) {
    dot = 'var(--color-accent)';
    bg = '#f3ece4';
  }
  return { fill, cap, ratio, pct, dot, bg };
}

/* ── Distance haversine en mètres ── */
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/* ── Carte au style "crescent" de la Home : bordure fine + lift discret au survol ── */
function HauteCard({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        transition: 'transform var(--transition), box-shadow var(--transition)',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Eyebrow + titre serif italique, cohérent avec les entêtes de section de la Home ── */
function PageHeading({ eyebrow, title, subtitle, isRTL, align = 'left' }) {
  return (
    <div style={{ textAlign: isRTL ? 'right' : align }}>
      {eyebrow && <span className="section-haute-eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</span>}
      <h1 style={{
        fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
        fontStyle: isRTL ? 'normal' : 'italic',
        fontWeight: isRTL ? 800 : 400,
        fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)',
        color: 'var(--color-primary)',
        marginBottom: subtitle ? 6 : 0,
        lineHeight: 1.2,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Retrouve le libellé d'une action de récompense à partir du nb de points gagnés ── */
function getRewardActionLabel(points, lang) {
  const entry = Object.entries(REWARD_DESCRIPTIONS).find(
    ([, desc]) => Number(desc.pts_display) === Number(points)
  );
  if (!entry) return lang === 'fr' ? 'Points gagnés' : 'نقاط مكتسبة';
  const [, desc] = entry;
  return lang === 'fr' ? desc.label_fr : desc.label_ar;
}

export default function CitoyenDashboard() {
  const { t, lang } = useLanguage();
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isRTL = lang === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen]  = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const NEXT_REWARD = { pts: REWARDS.THRESHOLD, label: lang === 'fr' ? 'Un cadeau surprise' : 'هدية مفاجئة' };

  const [stats, setStats] = useState({ points: 0, totalRequests: 0, totalReports: 0, totalCollectes: 0 });
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [nearbyContainers, setNearbyContainers] = useState([]);
  const [rewardsHistory, setRewardsHistory] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

  /* Géolocalisation de l'utilisateur */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationEnabled(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationEnabled(true);
      },
      () => {
        setLocationEnabled(false);
        setUserLocation(null);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  /* Redirection si le compte connecté est une commune */
  useEffect(() => {
    const isCommune =
      profile?.role === 'commune' ||
      profile?.type_etablissement === 'commune' ||
      session?.user?.user_metadata?.type_etablissement === 'commune' ||
      session?.user?.user_metadata?.role === 'commune';

    if (isCommune) {
      navigate('/commune/dashboard', { replace: true });
    }
  }, [profile, session, navigate]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    async function fetchDashboardData() {
      try {
        const [
          reqAllRes,
          reportsCountRes,
          reqDoneRes,
          reqListRes,
          reportsListRes,
          containersRes,
          rewardsRes,
        ] = await Promise.all([
          supabase.from('demandes_collecte').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('reclamations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('demandes_collecte').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('statut', 'terminee'),
          supabase.from('demandes_collecte').select('id, type_dechet, quantite, statut, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
          supabase.from('reclamations').select('id, description, statut, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
          supabase.from('containers_with_coords').select('id, nom, statut, capacite, latitude, longitude'),
          supabase.from('recompenses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        ]);

        const allRewards = rewardsRes.data ?? [];
        const totalPoints = allRewards.reduce((sum, reward) => sum + (Number(reward.points) || 0), 0);

        setStats({
          points: totalPoints,
          totalRequests: reqAllRes.count ?? 0,
          totalReports: reportsCountRes.count ?? 0,
          totalCollectes: reqDoneRes.count ?? 0,
        });
        setRequests(reqListRes.data ?? []);
        setReports(reportsListRes.data ?? []);
        setNearbyContainers(containersRes.data || []);
        setRewardsHistory(allRewards.slice(0, 10));
      } catch (err) {
        console.error('Erreur de chargement du dashboard:', err);
      }
    }

    fetchDashboardData();
  }, [session]);

  /* Calcul des conteneurs affichés : triés par proximité si GPS actif, sinon 5 premiers non triés */
  const displayedContainers = useMemo(() => {
    if (!nearbyContainers || nearbyContainers.length === 0) return [];

    if (locationEnabled && userLocation) {
      return nearbyContainers
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => ({
          ...c,
          distance: distanceMeters(userLocation.lat, userLocation.lng, c.latitude, c.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
    }

    return nearbyContainers.slice(0, 5).map((c) => ({
      ...c,
      distance: null,
    }));
  }, [nearbyContainers, locationEnabled, userLocation]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const refreshRequestsData = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    try {
      const [reqAllRes, reqDoneRes, reqListRes, repAllRes, repListRes, rewardsRes] = await Promise.all([
        supabase.from('demandes_collecte').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('demandes_collecte').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('statut', 'terminee'),
        supabase.from('demandes_collecte').select('id, type_dechet, quantite, statut, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('reclamations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('reclamations').select('id, description, statut, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('recompenses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);
      const allRewards = rewardsRes.data ?? [];
      const totalPoints = allRewards.reduce((sum, reward) => sum + (Number(reward.points) || 0), 0);
      setStats(prev => ({ ...prev, points: totalPoints, totalRequests: reqAllRes.count || 0, totalCollectes: reqDoneRes.count || 0, totalReports: repAllRes.count || 0 }));
      setRequests(reqListRes.data || []);
      setReports(repListRes.data || []);
      setRewardsHistory(allRewards.slice(0, 10));
    } catch (err) {
      console.error(err);
    }
  };

  const userName = profile?.nom || session?.user?.email?.split('@')[0] || '—';
  const userWilaya = null;

  const c = t('citoyen');
  const progressToNext = Math.min((stats.points / NEXT_REWARD.pts) * 100, 100);
  const ptsToNext = Math.max(NEXT_REWARD.pts - stats.points, 0);



  const navItems = [
    { key: 'dashboard', label: c.nav.dashboard, icon: LayoutDashboard },
    { key: 'map', label: c.nav.map, icon: Map },
    { key: 'requests', label: c.nav.requests, icon: ClipboardList },
    { key: 'rewards', label: c.nav.rewards, icon: Gift },
    { key: 'profile', label: c.nav.profile, icon: User },
  ];

  const getStatusClass = (dbStatut) => statusColors[DB_STATUS_MAP[dbStatut] ?? 'pending'];
  const getStatusLabel = (dbStatut) => t(`citoyen.status.${DB_STATUS_MAP[dbStatut] ?? 'pending'}`);
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const getContainerColors = (statut) => containerColors[statut] ?? containerColors.vide;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Mobile hamburger — visible uniquement sur mobile */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(s => !s)}
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

      <div className="dash-layout">
        {/* Sidebar — inchangée par rapport à la version d'origine (blanche) */}
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
          {/* Brand / user header */}
          <div style={{ padding: '4px 8px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 12 }}>
              {lang === 'fr' ? 'Espace Citoyen' : 'مساحة المواطن'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--color-accent-light)',
                border: '1px solid var(--color-border-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={17} strokeWidth={1.5} color="var(--color-accent)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName}
                </p>
                {userWilaya && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{userWilaya}</p>}
              </div>
            </div>
          </div>

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
                  transition: 'all var(--transition)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-primary)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              >
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </button>
            );
          })}

          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '11px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 400,
              color: '#b45252', marginTop: 'auto',
              borderTop: '1px solid var(--color-border)',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              textAlign: isRTL ? 'right' : 'left',
            }}
            onClick={signOut}
          >
            <LogOut size={16} strokeWidth={1.5} />
            {t('nav.logout')}
          </button>
        </aside>

        {/* Overlay mobile */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,18,0.5)', zIndex: 30, backdropFilter: 'blur(2px)' }}
          />
        )}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile ? '72px 18px 40px' : '48px 52px',
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >

          {/* ── HOME CITIZEN (TABLEAU DE BORD) ── */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* En-tête — sobre, pas de gros bandeau. Le seul "moment fort" en couleur reste plus bas. */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 20,
                direction: isRTL ? 'rtl' : 'ltr',
              }}>
                <PageHeading
                  isRTL={isRTL}
                  eyebrow={lang === 'fr' ? 'Espace Citoyen' : 'مساحة المواطن'}
                  title={<>{c.dashboard.welcome}, <span style={{ fontStyle: isRTL ? 'normal' : 'italic', color: 'var(--color-accent)' }}>{userName.split(' ')[0]}</span></>}
                  subtitle={c.dashboard.welcomeSub}
                />
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--color-accent-light)',
                  border: '1px solid var(--color-border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User size={24} color="var(--color-accent)" strokeWidth={1.5} />
                </div>
              </div>

              {/* 4 Stat Cards — sobres, icônes en simple cercle bordé */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 18,
                direction: isRTL ? 'rtl' : 'ltr',
              }}>
                {[
                  { label: c.dashboard.stats.requests, value: stats.totalRequests, icon: Package },
                  { label: c.dashboard.stats.collectes, value: stats.totalCollectes, icon: Recycle },
                  { label: c.dashboard.stats.reports, value: stats.totalReports, icon: AlertTriangle },
                  { label: c.dashboard.stats.totalPts, value: stats.points, icon: Star },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <HauteCard key={i} style={{
                      padding: '22px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: isRTL ? 'right' : 'left',
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={19} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p style={{
                          fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                          fontSize: '1.7rem', fontWeight: isRTL ? 700 : 400,
                          color: 'var(--color-primary)', lineHeight: 1, marginBottom: 4,
                        }}>{s.value}</p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</p>
                      </div>
                    </HauteCard>
                  );
                })}
              </div>

              {/* Quick Actions — cartes cliquables façon "3 overlapping cards" de la Home */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 18,
                direction: isRTL ? 'rtl' : 'ltr',
              }}>
                {[
                  {
                    icon: Plus,
                    title: c.dashboard.request,
                    desc: lang === 'fr' ? 'Planifiez un ramassage à votre adresse.' : 'خطط لعملية جمع في عنوانك.',
                    onClick: () => setIsRequestModalOpen(true),
                  },
                  {
                    icon: AlertTriangle,
                    title: c.dashboard.report,
                    desc: lang === 'fr' ? 'Un conteneur plein ou endommagé ?' : 'حاوية ممتلئة أو تالفة؟',
                    onClick: () => setIsReportModalOpen(true),
                  },
                  {
                    icon: Map,
                    title: c.dashboard.viewMap,
                    desc: lang === 'fr' ? 'Repérez les points de collecte proches.' : 'حدد نقاط الجمع القريبة.',
                    onClick: () => setActiveTab('map'),
                  },
                ].map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <HauteCard
                      key={i}
                      onClick={action.onClick}
                      style={{
                        padding: '22px 22px',
                        cursor: 'pointer',
                        textAlign: isRTL ? 'right' : 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                    >
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        border: '1px solid var(--color-border-gold)',
                        color: 'var(--color-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={19} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p style={{
                          fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                          fontWeight: isRTL ? 700 : 400,
                          fontSize: '1.05rem', color: 'var(--color-primary)', marginBottom: 6,
                        }}>
                          {action.title}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                          {action.desc}
                        </p>
                      </div>
                    </HauteCard>
                  );
                })}
              </div>

              {/* Activité — demandes + signalements sur une ligne, points en pleine largeur en dessous */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 22,
                direction: isRTL ? 'rtl' : 'ltr',
                alignItems: 'start',
              }}>

                {/* Card 1: Recent Requests */}
                <HauteCard style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <h3 style={{
                      fontSize: '1.05rem', fontWeight: isRTL ? 700 : 400, fontStyle: isRTL ? 'normal' : 'italic',
                      color: 'var(--color-primary)', margin: 0,
                      fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    }}>
                      {c.dashboard.myRequests}
                    </h3>
                    <button
                      onClick={() => setActiveTab('requests')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.04em', cursor: 'pointer' }}
                    >
                      {c.dashboard.seeAll}
                    </button>
                  </div>
                  <div>
                    {requests.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
                        {c.dashboard.noActivity}
                      </p>
                    ) : (
                      requests.slice(0, 4).map((req, idx) => (
                        <div key={req.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '13px 0',
                          borderBottom: idx < Math.min(requests.length, 4) - 1 ? '1px dashed var(--color-border)' : 'none',
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row', minWidth: 0 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <Package size={15} strokeWidth={1.5} />
                            </div>
                            <div style={{ textAlign: isRTL ? 'right' : 'left', minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.type_dechet || 'Déchets'}
                              </p>
                              <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>{formatDate(req.created_at)}</p>
                            </div>
                          </div>
                          <span className={`status-chip ${getStatusClass(req.statut)}`} style={{ flexShrink: 0 }}>
                            {getStatusLabel(req.statut)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </HauteCard>

                {/* Card 2: Recent Reports */}
                <HauteCard style={{ padding: 24 }}>
                  <h3 style={{
                    fontSize: '1.05rem', fontWeight: isRTL ? 700 : 400, fontStyle: isRTL ? 'normal' : 'italic',
                    color: 'var(--color-primary)', margin: '0 0 18px 0',
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                    {c.dashboard.myReports}
                  </h3>
                  <div>
                    {reports.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                        {c.dashboard.noActivity}
                      </p>
                    ) : (
                      reports.slice(0, 4).map((rep, idx) => (
                        <div key={rep.id} style={{
                          padding: '13px 0',
                          borderBottom: idx < Math.min(reports.length, 4) - 1 ? '1px dashed var(--color-border)' : 'none',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                        }}>
                          <div style={{ textAlign: isRTL ? 'right' : 'left', minWidth: 0, flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                            {rep.photo_url && (
                              <img src={rep.photo_url} alt="photo" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <p style={{
                                fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {rep.description?.split('\n')[0] || 'Signalement'}
                              </p>
                              <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{formatDate(rep.created_at)}</p>
                            </div>
                          </div>
                          <span className={`status-chip ${getStatusClass(rep.statut)}`} style={{ flexShrink: 0 }}>
                            {getStatusLabel(rep.statut)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </HauteCard>

              </div>

              {/* Points — pleine largeur, disposition horizontale */}
              <HauteCard style={{
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 28,
                flexWrap: 'wrap',
                direction: isRTL ? 'rtl' : 'ltr',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    border: '1px solid var(--color-border-gold)',
                    color: 'var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Star size={20} strokeWidth={1.5} fill="var(--color-accent)" />
                  </div>
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: 4 }}>
                      {c.dashboard.nextReward}
                    </p>
                    <p style={{
                      fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                      fontStyle: isRTL ? 'normal' : 'italic',
                      fontSize: '1.15rem', color: 'var(--color-primary)',
                    }}>{NEXT_REWARD.label}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 240, maxWidth: 480, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <span style={{
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    fontStyle: isRTL ? 'normal' : 'italic',
                    fontSize: '1.6rem', color: 'var(--color-primary)', lineHeight: 1, flexShrink: 0,
                  }}>{stats.points} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'normal' }}>/ {NEXT_REWARD.pts}</span></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progressToNext}%`, background: 'var(--color-accent)', borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 6, textAlign: isRTL ? 'right' : 'left' }}>
                      {ptsToNext} {c.dashboard.pointsToNext}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('rewards')}
                  style={{
                    background: 'none', border: 'none', color: 'var(--color-accent)',
                    fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.04em', cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {c.dashboard.seeAll}
                </button>
              </HauteCard>

              </div>

            </div>
          )}

          {/* ── REQUESTS TAB ── */}
          {activeTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <PageHeading
                  isRTL={isRTL}
                  eyebrow={lang === 'fr' ? 'Suivi' : 'المتابعة'}
                  title={c.dashboard.myRequests}
                  subtitle={lang === 'fr' ? 'Historique et suivi de vos demandes de collecte.' : 'سجل ومتابعة طلبات الجمع الخاصة بك.'}
                />
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="btn btn-forest"
                  style={{ padding: '12px 22px', fontSize: '0.85rem' }}
                >
                  <Plus size={16} />
                  <span>{lang === 'fr' ? 'Nouvelle demande' : 'طلب جديد'}</span>
                </button>
              </div>

              <HauteCard style={{ padding: 26 }}>
                {requests.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>
                    {c.dashboard.noActivity}
                  </p>
                ) : (
                  requests.map((req, idx) => (
                    <div key={req.id} style={{
                      padding: '16px 0',
                      borderBottom: idx < requests.length - 1 ? '1px dashed var(--color-border)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Package size={18} strokeWidth={1.5} />
                        </div>
                        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-primary)' }}>
                            {req.type_dechet || '—'}
                          </p>
                          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {req.quantite ? `${req.quantite} · ` : ''}{formatDate(req.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`status-chip ${getStatusClass(req.statut)}`}>
                        {getStatusLabel(req.statut)}
                      </span>
                    </div>
                  ))
                )}
              </HauteCard>
            </div>
          )}

          {/* ── REWARDS TAB ── */}
          {activeTab === 'rewards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <PageHeading
                isRTL={isRTL}
                eyebrow={lang === 'fr' ? 'Récompenses' : 'المكافآت'}
                title={c.points.title}
                subtitle={lang === 'fr' ? 'Cumulez des points à chaque collecte effectuée.' : 'اجمع النقاط مع كل عملية جمع مكتملة.'}
              />

              {/* Total points card — carte blanche sobre */}
              <HauteCard style={{
                padding: '28px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 20, direction: isRTL ? 'rtl' : 'ltr',
              }}>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: 8 }}>
                    {c.points.current}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <Star size={22} color="var(--color-accent)" fill="var(--color-accent)" />
                    <span style={{
                      fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                      fontStyle: isRTL ? 'normal' : 'italic', fontSize: '2.6rem',
                      color: 'var(--color-primary)', lineHeight: 1,
                    }}>
                      {stats.points}
                    </span>
                    <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                      {lang === 'fr' ? 'points' : 'نقطة'}
                    </span>
                  </div>
                </div>

                <div style={{ minWidth: 220, flex: 1, maxWidth: 360 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                    <span>{lang === 'fr' ? 'Prochain palier' : 'المستوى القادم'}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{NEXT_REWARD.pts} pts</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressToNext}%`, background: 'var(--color-accent)', borderRadius: 99, transition: 'width 1s ease' }} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, textAlign: isRTL ? 'right' : 'left' }}>
                    {ptsToNext} {c.dashboard.pointsToNext}
                  </p>
                </div>
              </HauteCard>

              {/* Historique des points */}
              <HauteCard style={{ padding: 26 }}>
                <h3 style={{
                  fontSize: '1.1rem', fontWeight: isRTL ? 700 : 400, fontStyle: isRTL ? 'normal' : 'italic', color: 'var(--color-primary)', marginBottom: 20,
                  fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                  textAlign: isRTL ? 'right' : 'left',
                }}>
                  {lang === 'fr' ? 'Historique des points' : 'سجل النقاط'}
                </h3>
                {rewardsHistory.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: isRTL ? 'right' : 'left' }}>
                    {lang === 'fr' ? 'Aucun point gagné pour le moment. Signalez un conteneur ou demandez une collecte pour commencer.' : 'لا توجد نقاط مكتسبة بعد. أبلغ عن حاوية أو اطلب عملية جمع للبدء.'}
                  </p>
                ) : (
                  rewardsHistory.map((entry, i) => (
                    <div key={entry.id ?? i} style={{
                      padding: '14px 0',
                      borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Clock size={15} strokeWidth={1.5} />
                        </div>
                        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-primary)' }}>
                            {getRewardActionLabel(entry.points, lang)}
                          </p>
                          {entry.created_at && (
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                              {new Date(entry.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>
                        +{entry.points} {lang === 'fr' ? 'pts' : 'نقطة'}
                      </span>
                    </div>
                  ))
                )}
              </HauteCard>
            </div>
          )}

          {/* ── MAP TAB ── */}
          {activeTab === 'map' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <PageHeading
                isRTL={isRTL}
                eyebrow={lang === 'fr' ? 'Localisation' : 'الموقع'}
                title={c.nav.map}
                subtitle={lang === 'fr' ? 'Localisez les conteneurs de tri à proximité.' : 'حدد موقع حاويات الفرز القريبة.'}
              />

              <HauteCard style={{ overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '550px' }}>
                  <ContainersMap />
                </div>
              </HauteCard>

              <HauteCard style={{ padding: 24 }}>
                <div style={{ marginBottom: 18 }}>
                  <h3 style={{
                    fontSize: '1.05rem', fontWeight: isRTL ? 700 : 400, fontStyle: isRTL ? 'normal' : 'italic', color: 'var(--color-primary)', margin: '0 0 6px 0',
                    fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                    {locationEnabled
                      ? (lang === 'fr' ? 'Conteneurs les plus proches' : 'أقرب الحاويات إليك')
                      : (lang === 'fr' ? 'Conteneurs à proximité' : 'الحاويات القريبة')}
                  </h3>

                  <p style={{
                    fontSize: 12,
                    color: locationEnabled ? '#16a34a' : 'var(--color-text-muted)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: locationEnabled ? '#16a34a' : '#9ca3af',
                      flexShrink: 0,
                    }} />
                    {locationEnabled
                      ? (lang === 'fr' ? 'Position GPS activée — Conteneurs triés par proximité' : 'الموقع الجغرافي مفعّل — الحاويات مرتبة حسب الأقرب إليك')
                      : (lang === 'fr' ? 'Position GPS désactivée — Affichage des 5 premiers conteneurs (non triés par distance)' : 'الموقع الجغرافي غير مفعّل — عرض الحاويات الـ 5 الأولى (غير مرتبة حسب المسافة)')}
                  </p>
                </div>

                {displayedContainers.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: isRTL ? 'right' : 'left' }}>
                    {t('common.noData')}
                  </p>
                ) : (
                  displayedContainers.map((ct, idx) => {
                    const info = getContainerFill(ct.statut, ct.capacite);
                    return (
                      <div key={ct.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 0',
                        borderTop: idx > 0 ? '1px dashed var(--color-border)' : 'none',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: info.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                            {ct.nom || (isRTL ? 'حاوية' : 'Conteneur')}
                          </p>
                          {ct.distance != null && (
                            <span style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 700, marginTop: 2, display: 'inline-block' }}>
                              📍 {formatDistance(ct.distance)}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
                          {info.fill} / {ct.capacite ? `${ct.capacite} kg` : '?'} ({info.pct}%)
                        </p>
                      </div>
                    );
                  })
                )}
              </HauteCard>
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <PageHeading
                isRTL={isRTL}
                eyebrow={lang === 'fr' ? 'Compte' : 'الحساب'}
                title={c.nav.profile}
                subtitle={lang === 'fr' ? 'Informations de votre compte citoyen.' : 'معلومات حساب المواطن الخاص بك.'}
              />

              <HauteCard style={{ padding: 32 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 28,
                  borderBottom: '1px solid var(--color-border)',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                    border: '1px solid var(--color-border-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={28} strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <p style={{
                      fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
                      fontStyle: isRTL ? 'normal' : 'italic',
                      fontWeight: isRTL ? 700 : 400, fontSize: '1.4rem', color: 'var(--color-primary)',
                    }}>{userName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <Star size={14} color="var(--color-accent)" fill="var(--color-accent)" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>
                        {stats.points} {lang === 'fr' ? 'points' : 'نقطة'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    {
                      label: lang === 'fr' ? 'Type de compte' : 'نوع الحساب',
                      value: profile?.role === 'citoyen'
                        ? (lang === 'fr' ? 'Citoyen' : 'مواطن')
                        : profile?.role === 'etablissement'
                          ? (() => {
                              const t_labels = t('auth.register.types');
                              return t_labels?.[profile.type_etablissement]?.label || (lang === 'fr' ? 'Établissement' : 'مؤسسة');
                            })()
                          : (profile?.role || '—'),
                    },
                    {
                      label: lang === 'fr' ? 'Email' : 'البريد الإلكتروني',
                      value: session?.user?.email || '—',
                    },
                    {
                      label: lang === 'fr' ? 'Téléphone' : 'الهاتف',
                      value: profile?.telephone || '—',
                    },
                  ].map((field, i) => (
                    <div key={i} style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      textAlign: isRTL ? 'right' : 'left',
                    }}>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</p>
                      <p style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: 600 }}>{field.value}</p>
                    </div>
                  ))}
                </div>
              </HauteCard>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <RequestCollectionModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        userId={session?.user?.id}
        onSuccess={refreshRequestsData}
      />
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userId={session?.user?.id}
        onSuccess={refreshRequestsData}
      />
    </div>
  );
}
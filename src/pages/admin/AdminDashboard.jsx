import { useState, useEffect } from 'react';
import {
  Users, AlertTriangle, Recycle, Plus, Package, Building,
  Loader2, LayoutDashboard, LogOut, Menu, X, Shield, RefreshCw,
  CheckCircle2, Clock, Landmark, Check, ShoppingCart, Edit3, Trash2,
  MapPin, Phone, Mail, Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
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

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const { profile, session, signOut } = useAuth();
  const isRTL = lang === 'ar';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [communes, setCommunes] = useState([]);
  const [containers, setContainers] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [containerRequests, setContainerRequests] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);

  // Modal ajout commune
  const [communeModal, setCommuneModal] = useState(false);
  const [newCommune, setNewCommune] = useState({ name: '', email: '', password: '', wilaya: '19 - Sétif', telephone: '' });
  const [communeLoading, setCommuneLoading] = useState(false);

  // Modal réponse admin
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminStatut, setAdminStatut] = useState('en_etude');
  const [adminDevis, setAdminDevis] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);

  // Modal ajout au catalogue
  const [catalogModal, setCatalogModal] = useState(false);
  const [newCatalogItem, setNewCatalogItem] = useState({ titre: '', description: '', imageFile: null, capacite: '', disponible_achat: true, disponible_location: true });
  const [catalogSaving, setCatalogSaving] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setLoading(true);
    try {
      const [communesRes, containersRes, sigRes, reqRes, catRes] = await Promise.all([
        supabase.from('profiles').select('*').or('role.eq.commune,type_etablissement.eq.commune').order('created_at', { ascending: false }),
        supabase.from('containers_with_coords').select('*'),
        supabase.from('reclamations').select('*').order('created_at', { ascending: false }),
        containerRequestsService.getAllRequests(),
        supabase.from('catalogue_conteneurs').select('*').order('created_at', { ascending: false }),
      ]);
      setCommunes(communesRes.data || []);
      setContainers(containersRes.data || []);
      setSignalements(sigRes.data || []);
      setContainerRequests(reqRes || []);
      setCatalogItems(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCommune = async (e) => {
    e.preventDefault();
    setCommuneLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newCommune.email,
        password: newCommune.password,
        options: { data: { nom: newCommune.name, role: 'etablissement', type_etablissement: 'commune', wilaya: newCommune.wilaya } },
      });
      if (authError) throw new Error(authError.message);
      if (authData.user?.id) {
        await supabase.from('profiles').upsert({
          id: authData.user.id, nom: newCommune.name, role: 'etablissement',
          type_etablissement: 'commune', wilaya: newCommune.wilaya, telephone: newCommune.telephone, statut_compte: 'actif',
        });
      }
      alert(isRTL ? 'تمت إضافة البلدية بنجاح!' : 'Commune ajoutée avec succès !');
      setNewCommune({ name: '', email: '', password: '', wilaya: '19 - Sétif', telephone: '' });
      setCommuneModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCommuneLoading(false);
    }
  };

  const handleUpdateSignalement = async (id, statut) => {
    await supabase.from('reclamations').update({ statut }).eq('id', id);
    setSignalements(prev => prev.map(s => s.id === id ? { ...s, statut } : s));
  };

  const handleOpenReq = (req) => {
    setSelectedReq(req);
    setAdminStatut(req.statut || 'en_etude');
    setAdminDevis(req.devis_montant || '');
    setAdminNote(req.reponse_admin || '');
  };

  const handleSaveReq = async (e) => {
    e.preventDefault();
    setAdminSaving(true);
    try {
      const updated = await containerRequestsService.updateStatus(selectedReq.id, adminStatut, adminNote, adminDevis);
      setContainerRequests(prev => prev.map(r => r.id === selectedReq.id ? updated : r));
      setSelectedReq(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleDeleteReq = async (id) => {
    if (!window.confirm(isRTL ? 'حذف الطلب؟' : 'Supprimer cette demande ?')) return;
    await containerRequestsService.deleteRequest(id);
    setContainerRequests(prev => prev.filter(r => r.id !== id));
  };

  const getStatusBadge = (st) => {
    const map = {
      en_attente:   { label: isRTL ? 'في الانتظار' : 'En attente',  bg: '#fef3c7', color: '#d97706' },
      en_etude:     { label: isRTL ? 'قيد الدراسة' : 'En étude',    bg: '#e0e7ff', color: '#4338ca' },
      devis_envoye: { label: isRTL ? 'عرض أُرسل' : 'Devis envoyé', bg: '#fef9c3', color: '#ca8a04' },
      valide:       { label: isRTL ? 'مقبول' : 'Validée',           bg: '#dcfce7', color: '#15803d' },
      livre:        { label: isRTL ? 'تم التسليم' : 'Livré',        bg: '#d1fae5', color: '#047857' },
      rejete:       { label: isRTL ? 'مرفوض' : 'Refusée',           bg: '#fee2e2', color: '#b91c1c' },
    };
    return map[st] || { label: isRTL ? 'معالجة' : 'En cours', bg: '#f3f4f6', color: '#6b7280' };
  };

  const pendingReqs = containerRequests.filter(r => r.statut === 'en_attente' || r.statut === 'en_etude').length;
  const userName = profile?.nom || session?.user?.email || 'Admin';

  const handleAddCatalogItem = async (e) => {
    e.preventDefault();
    setCatalogSaving(true);
    try {
      let finalImageUrl = '';

      if (newCatalogItem.imageFile) {
        const fileExt = newCatalogItem.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `catalog/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('conteneurs')
          .upload(filePath, newCatalogItem.imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('conteneurs')
          .getPublicUrl(filePath);

        finalImageUrl = urlData.publicUrl;
      }

      const itemToInsert = {
        titre: newCatalogItem.titre,
        description: newCatalogItem.description,
        capacite: newCatalogItem.capacite,
        disponible_achat: newCatalogItem.disponible_achat,
        disponible_location: newCatalogItem.disponible_location,
        image_url: finalImageUrl
      };

      const { data, error } = await supabase.from('catalogue_conteneurs').insert([itemToInsert]).select().single();
      if (error) throw error;
      setCatalogItems(prev => [data, ...prev]);
      setCatalogModal(false);
      setNewCatalogItem({ titre: '', description: '', imageFile: null, capacite: '', disponible_achat: true, disponible_location: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setCatalogSaving(false);
    }
  };

  const handleDeleteCatalogItem = async (id) => {
    if (!window.confirm(isRTL ? 'حذف هذا العنصر؟' : 'Supprimer cet élément du catalogue ?')) return;
    try {
      const { error } = await supabase.from('catalogue_conteneurs').delete().eq('id', id);
      if (error) throw error;
      setCatalogItems(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const navItems = [
    { key: 'dashboard',          label: isRTL ? 'لوحة التحكم' : 'Tableau de bord',         icon: LayoutDashboard },
    { key: 'container_requests', label: isRTL ? 'طلبات الحاويات' : 'Demandes de Conteneurs', icon: ShoppingCart, badge: pendingReqs || null },
    { key: 'communes',           label: isRTL ? 'البلديات' : 'Communes',                    icon: Building, badge: communes.length || null },
    { key: 'containers',         label: isRTL ? 'الحاويات' : 'Conteneurs',                  icon: Package },
    { key: 'catalogue',          label: isRTL ? 'الكتالوج' : 'Catalogue',                   icon: ShoppingCart },
    { key: 'signalements',       label: isRTL ? 'البلاغات' : 'Signalements',                icon: AlertTriangle },
  ];

  const statCards = [
    { title: isRTL ? 'البلديات' : 'Communes', value: communes.length, icon: Landmark, color: 'var(--color-primary)' },
    { title: isRTL ? 'الحاويات' : 'Conteneurs', value: containers.length, icon: Package, color: 'var(--color-accent)' },
    { title: isRTL ? 'طلبات الحاويات' : 'Demandes conteneurs', value: containerRequests.length, icon: ShoppingCart, color: '#c8974f' },
    { title: isRTL ? 'البلاغات' : 'Signalements', value: signalements.length, icon: AlertTriangle, color: '#ef4444' },
  ];

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>
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
          width: 240, flexShrink: 0, background: '#fff',
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
          <div style={{ padding: '4px 8px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#dc2626', marginBottom: 10 }}>
              {isRTL ? 'مساحة الإدارة' : 'Administration'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <Shield size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{userName}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>Super Admin</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {navItems.map(({ key, label, icon: Icon, badge }) => {
              const active = activeTab === key;
              const isReqTab = key === 'container_requests';
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
                    <span style={{ background: isReqTab ? '#c8974f' : 'var(--color-primary)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>
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

          {/* ══ DASHBOARD ══ */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  {isRTL ? 'لوحة الإدارة' : 'Administration Wai DZ'}
                </h1>
                <button onClick={() => fetchData(true)} disabled={refreshing} className="btn btn-outline-dark" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <RefreshCw size={14} style={{ animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
                  {isRTL ? 'تحديث' : 'Actualiser'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
                {statCards.map((st, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>{st.title}</p>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${st.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <st.icon size={15} color={st.color} />
                      </div>
                    </div>
                    <p style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : st.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Demandes en attente rapides */}
              {containerRequests.filter(r => r.statut === 'en_attente').length > 0 && (
                <div style={{ background: '#fff', border: '2px solid #c8974f', borderRadius: 'var(--radius-sm)', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bell size={17} color="#c8974f" />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                        {isRTL ? 'طلبات تحتاج تدخلاً' : 'Demandes à traiter'}
                      </h3>
                    </div>
                    <button onClick={() => setActiveTab('container_requests')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      {isRTL ? 'عرض الكل' : 'Voir tout →'}
                    </button>
                  </div>
                  {containerRequests.filter(r => r.statut === 'en_attente').slice(0, 3).map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 2px 0' }}>{req.commune_nom}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{req.titre_modele} • {req.quantite} unités</p>
                      </div>
                      <button onClick={() => handleOpenReq(req)} className="btn btn-forest" style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit3 size={13} />
                        {isRTL ? 'رد' : 'Traiter'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ DEMANDES DE CONTENEURS ══ */}
          {activeTab === 'container_requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'طلبات الحاويات' : 'Demandes de Conteneurs'}
              </h1>

              {containerRequests.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0', fontSize: 13 }}>
                  {isRTL ? 'لا توجد طلبات' : 'Aucune demande pour le moment.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {containerRequests.map(req => {
                    const badge = getStatusBadge(req.statut);
                    return (
                      <div key={req.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>{req.commune_nom}</span>
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '1px 6px', borderRadius: 4 }}>{req.commune_wilaya}</span>
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatTimeAgo(req.created_at, lang)}</span>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px 0' }}>
                              {req.titre_modele} — <strong style={{ color: 'var(--color-accent)' }}>{req.quantite} unités</strong>
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>
                              {req.mode_acquisition === 'location' ? (isRTL ? 'طلب كراء' : 'Demande de location') : req.type_demande === 'personnalise' ? (isRTL ? 'طلب مخصص' : 'Demande sur-mesure') : (isRTL ? 'طلب شراء' : "Demande d'achat")}
                            </p>
                            {req.cahier_charges && (
                              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic' }}>
                                {req.cahier_charges.length > 120 ? req.cahier_charges.slice(0, 120) + '…' : req.cahier_charges}
                              </p>
                            )}
                            {req.reponse_admin && (
                              <p style={{ fontSize: 12, color: 'var(--color-accent)', marginTop: 6, fontWeight: 600 }}>
                                ↳ {req.reponse_admin.length > 80 ? req.reponse_admin.slice(0, 80) + '…' : req.reponse_admin}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 4, background: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                            {req.devis_montant && (
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-accent)' }}>{req.devis_montant}</span>
                            )}
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleOpenReq(req)} className="btn btn-forest" style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Edit3 size={13} />
                                {isRTL ? 'رد' : 'Répondre'}
                              </button>
                              <button onClick={() => handleDeleteReq(req.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 5 }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ COMMUNES ══ */}
          {activeTab === 'communes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  {isRTL ? 'البلديات' : 'Communes'}
                </h1>
                <button onClick={() => setCommuneModal(true)} className="btn btn-forest" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Plus size={15} /> {isRTL ? 'إضافة' : 'Ajouter'}
                </button>
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {communes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px 0', fontSize: 13 }}>
                    {isRTL ? 'لا توجد بلديات' : 'Aucune commune enregistrée.'}
                  </p>
                ) : communes.map((c, i) => (
                  <div key={c.id} style={{ padding: '14px 20px', borderBottom: i < communes.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>{c.nom || c.commune}</p>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} color="var(--color-text-muted)" />
                          {c.wilaya}
                        </span>
                        {(c.telephone || c.phone) && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--color-primary)' }}>
                            <Phone size={13} color="var(--color-primary)" />
                            {c.telephone || c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={13} color="var(--color-text-muted)" />
                            {c.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={async () => {
                      if (window.confirm(isRTL ? 'حذف البلدية؟' : 'Supprimer ?')) {
                        await supabase.from('profiles').delete().eq('id', c.id);
                        setCommunes(prev => prev.filter(x => x.id !== c.id));
                      }
                    }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CONTENEURS ══ */}
          {activeTab === 'containers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'الحاويات' : 'Conteneurs'}
              </h1>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 480 }}>
                <ContainersMap />
              </div>
            </div>
          )}

          {/* ══ TAB: CATALOGUE ══ */}
          {activeTab === 'catalogue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  {isRTL ? 'إدارة الكتالوج' : 'Gestion du Catalogue'}
                </h1>
                <button onClick={() => setCatalogModal(true)} className="btn btn-forest" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Plus size={16} />
                  {isRTL ? 'إضافة عنصر' : 'Ajouter un modèle'}
                </button>
              </div>

              {catalogItems.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '40px 20px', textAlign: 'center' }}>
                  <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                    {isRTL ? 'لا توجد عناصر في الكتالوج.' : 'Aucun conteneur dans le catalogue.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {catalogItems.map(item => (
                    <div key={item.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: 240, background: '#ffffff', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
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
                            <Package size={48} color="var(--color-text-muted)" />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{item.titre}</h3>
                        <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--color-text-secondary)', flex: 1 }}>{item.description || (isRTL ? 'بدون وصف' : 'Aucune description')}</p>
                        
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                          {item.disponible_achat && <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{isRTL ? 'شراء' : 'Achat'}</span>}
                          {item.disponible_location && <span style={{ fontSize: 11, background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{isRTL ? 'كراء' : 'Location'}</span>}
                          {item.capacite && <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{item.capacite}</span>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleDeleteCatalogItem(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 6 }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: SIGNALEMENTS ══ */}
          {activeTab === 'signalements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'البلاغات' : 'Signalements'}
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {signalements.map(sig => {
                  const isPending = !sig.statut || sig.statut === 'en_attente' || sig.statut === 'nouveau';
                  return (
                    <div key={sig.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px 0' }}>{sig.description || 'Signalement'}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{formatTimeAgo(sig.created_at, lang)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: isPending ? '#fee2e2' : '#dcfce7', color: isPending ? '#dc2626' : '#16a34a' }}>
                          {isPending ? (isRTL ? 'قيد المعالجة' : 'En attente') : (isRTL ? 'تم الحل' : 'Résolu')}
                        </span>
                        {isPending && (
                          <button onClick={() => handleUpdateSignalement(sig.id, 'resolu')} className="btn btn-forest" style={{ fontSize: 12, padding: '5px 10px' }}>
                            {isRTL ? '✓ حل' : '✓ Résolu'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL RÉPONSE ADMIN ── */}
      {selectedReq && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: 2 }}>
                  {isRTL ? 'معالجة الطلب' : 'Traitement de la demande'}
                </p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  {selectedReq.commune_nom}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                  {selectedReq.titre_modele} • {selectedReq.quantite} unités
                </p>
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {selectedReq.cahier_charges && (
              <div style={{ background: 'var(--color-surface)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 18, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <strong>{isRTL ? 'طلب البلدية:' : 'Demande :'}</strong> {selectedReq.cahier_charges}
              </div>
            )}

            <form onSubmit={handleSaveReq} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  {isRTL ? 'الحالة' : 'Statut'}
                </label>
                <select value={adminStatut} onChange={e => setAdminStatut(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13, background: '#fff' }}>
                  <option value="en_attente">{isRTL ? 'في الانتظار' : 'En attente'}</option>
                  <option value="en_etude">{isRTL ? 'قيد الدراسة' : 'En cours d\'étude'}</option>
                  <option value="devis_envoye">{isRTL ? 'تم إرسال العرض' : 'Devis envoyé'}</option>
                  <option value="valide">{isRTL ? 'مقبول' : 'Validée'}</option>
                  <option value="livre">{isRTL ? 'تم التسليم' : 'Livré'}</option>
                  <option value="rejete">{isRTL ? 'مرفوض' : 'Refusée'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  {isRTL ? 'عرض السعر (اختياري)' : 'Montant du devis (optionnel)'}
                </label>
                <input type="text" value={adminDevis} onChange={e => setAdminDevis(e.target.value)}
                  placeholder="ex: 450 000 DZD"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  {isRTL ? 'ملاحظة للبلدية' : 'Message pour la commune'}
                </label>
                <textarea rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder={isRTL ? 'رد أو توجيهات للبلدية...' : 'Informations, délai, conditions...'}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setSelectedReq(null)} className="btn btn-outline-dark">
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" disabled={adminSaving} className="btn btn-forest">
                  {adminSaving ? <Loader2 size={15} className="animate-spin" /> : (isRTL ? 'حفظ' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL AJOUT COMMUNE ── */}
      {communeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'إضافة بلدية' : 'Ajouter une Commune'}
              </h3>
              <button onClick={() => setCommuneModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCommune} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'name', label: isRTL ? 'الاسم' : 'Nom', placeholder: 'APC Sétif' },
                { key: 'wilaya', label: isRTL ? 'الولاية' : 'Wilaya', placeholder: '19 - Sétif' },
                { key: 'telephone', label: isRTL ? 'رقم الهاتف' : 'Téléphone', placeholder: '0550 12 34 56' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'commune@dz.gov' },
                { key: 'password', label: isRTL ? 'كلمة المرور' : 'Mot de passe', type: 'password', placeholder: '••••••••' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    required
                    value={newCommune[field.key]}
                    onChange={e => setNewCommune(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13 }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setCommuneModal(false)} className="btn btn-outline-dark">{isRTL ? 'إلغاء' : 'Annuler'}</button>
                <button type="submit" disabled={communeLoading} className="btn btn-forest">
                  {communeLoading ? <Loader2 size={15} className="animate-spin" /> : (isRTL ? 'إضافة' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL AJOUT CATALOGUE ── */}
      {catalogModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                {isRTL ? 'إضافة للكتالوج' : 'Ajouter au Catalogue'}
              </h3>
              <button onClick={() => setCatalogModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddCatalogItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{isRTL ? 'اسم الحاوية' : 'Titre du conteneur'} *</label>
                <input required value={newCatalogItem.titre} onChange={e => setNewCatalogItem(p => ({ ...p, titre: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13 }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{isRTL ? 'الوصف' : 'Description'}</label>
                <textarea rows={3} value={newCatalogItem.description} onChange={e => setNewCatalogItem(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{isRTL ? 'صورة الحاوية' : 'Image du conteneur'}</label>
                <input type="file" accept="image/*" onChange={e => setNewCatalogItem(p => ({ ...p, imageFile: e.target.files[0] }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newCatalogItem.disponible_achat} onChange={e => setNewCatalogItem(p => ({ ...p, disponible_achat: e.target.checked }))} />
                  {isRTL ? 'متاح للشراء' : 'Disponible à l\'achat'}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newCatalogItem.disponible_location} onChange={e => setNewCatalogItem(p => ({ ...p, disponible_location: e.target.checked }))} />
                  {isRTL ? 'متاح للكراء' : 'Disponible à la location'}
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setCatalogModal(false)} className="btn btn-outline-dark">{isRTL ? 'إلغاء' : 'Annuler'}</button>
                <button type="submit" disabled={catalogSaving} className="btn btn-forest">
                  {catalogSaving ? <Loader2 size={15} className="animate-spin" /> : (isRTL ? 'حفظ' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

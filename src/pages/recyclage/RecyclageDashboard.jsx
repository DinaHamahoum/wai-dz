import { useState, useEffect } from "react";
import {
  Building, Dumbbell, User, Phone, Check, MapPin, Clock,
  RefreshCw, Package, CheckCircle2, AlertCircle, Recycle, Plus,
  LogOut, Menu, X, TrendingUp
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

/* Helper format relative time */
function formatTimeAgo(isoString, lang) {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return lang === "fr" ? "À l'instant" : "الآن";
    if (diffInMinutes < 60) return lang === "fr" ? `il y a ${diffInMinutes} min` : `منذ ${diffInMinutes} دقيقة`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return lang === "fr" ? `il y a ${diffInHours} h` : `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    return lang === "fr" ? `il y a ${diffInDays} j` : `منذ ${diffInDays} يوم`;
  } catch {
    return "—";
  }
}

/* Helper waste icon selection */
function getWasteIcon(typeDechet) {
  const lower = (typeDechet || "").toLowerCase();
  if (lower.includes("papier") || lower.includes("carton")) return Building;
  if (lower.includes("plastique")) return Dumbbell;
  if (lower.includes("électronique") || lower.includes("d3e")) return Package;
  return User;
}

export default function RecyclageDashboard() {
  const { lang } = useLanguage();
  const { profile, session, signOut } = useAuth();
  const isRTL = lang === "ar";

  const [activeTab, setActiveTab] = useState("demandes");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'en_attente', 'confirmee', 'terminee'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Fetch Real Data from Supabase ── */
  const fetchDemandes = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    try {
      const { data: demandesData, error: demandesErr } = await supabase
        .from("demandes_collecte")
        .select("*")
        .or("categorie_dechet.eq.recyclable,categorie_dechet.is.null")
        .order("created_at", { ascending: false });

      if (demandesErr) {
        console.error("Erreur fetch demandes:", demandesErr);
        setDemandes([]);
        return;
      }

      if (!demandesData || demandesData.length === 0) {
        setDemandes([]);
        return;
      }

      const userIds = [...new Set(demandesData.map((d) => d.user_id).filter(Boolean))];
      let profilesMap = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, nom, telephone, wilaya, role")
          .in("id", userIds);

        if (profilesData) {
          profilesData.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      const combined = demandesData.map((d) => ({
        ...d,
        profiles: profilesMap[d.user_id] || null,
      }));

      setDemandes(combined);
    } catch (err) {
      console.error("Erreur fetch:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleUpdateStatus = async (demandeId, newStatut) => {
    setActionLoadingId(demandeId);
    try {
      // Payload de base
      const updatePayload = { statut: newStatut };

      // Si la société confirme la demande, on enregistre son identité et la date
      if (newStatut === "confirmee") {
        updatePayload.confirmed_by_id = session?.user?.id || null;
        updatePayload.confirmed_by_nom = userSocieteNom || null;
        updatePayload.confirmed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("demandes_collecte")
        .update(updatePayload)
        .eq("id", demandeId)
        .select();

      if (error) {
        alert(lang === "fr" ? `Erreur: ${error.message}` : `خطأ: ${error.message}`);
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

      setDemandes((prev) =>
        prev.map((d) =>
          d.id === demandeId
            ? {
                ...d,
                statut: newStatut,
                ...(newStatut === "confirmee" && {
                  confirmed_by_id: session?.user?.id || null,
                  confirmed_by_nom: userSocieteNom || null,
                  confirmed_at: new Date().toISOString(),
                }),
              }
            : d
        )
      );
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const demandesFiltrees = demandes.filter((d) => {
    if (!d) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "en_attente") return d.statut === "en_attente" || d.statut === "nouveau";
    if (statusFilter === "confirmee") return d.statut === "confirmee" || d.statut === "acceptee" || d.statut === "en_collecte";
    if (statusFilter === "terminee") return d.statut === "terminee";
    return true;
  });

  const countEnAttente = demandes.filter((d) => d && (d.statut === "en_attente" || d.statut === "nouveau")).length;
  const countConfirmees = demandes.filter((d) => d && (d.statut === "confirmee" || d.statut === "acceptee" || d.statut === "en_collecte")).length;
  const countTerminees = demandes.filter((d) => d && d.statut === "terminee").length;

  const userSocieteNom = profile?.nom || session?.user?.user_metadata?.nom || (lang === "fr" ? "Espace Recyclage" : "مساحة التدوير");

  const navItems = [
    { key: "demandes", label: lang === "fr" ? "Demandes de collecte" : "طلبات الجمع", icon: Recycle },
    { key: "stats", label: lang === "fr" ? "Statistiques & Impact" : "الإحصائيات والأثر", icon: TrendingUp },
    { key: "profile", label: lang === "fr" ? "Profil" : "حسابي", icon: User },
  ];

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh", direction: isRTL ? "rtl" : "ltr" }}>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          style={{
            position: "fixed",
            top: 16,
            ...(isRTL ? { right: 16 } : { left: 16 }),
            zIndex: 50,
            background: "var(--color-primary)",
            border: "none",
            borderRadius: "50%",
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#ffffff",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            background: "#ffffff",
            borderRight: isRTL ? "none" : "1px solid var(--color-border)",
            borderLeft: isRTL ? "1px solid var(--color-border)" : "none",
            display: isMobile ? (sidebarOpen ? "flex" : "none") : "flex",
            flexDirection: "column",
            padding: "24px 12px 16px",
            gap: 2,
            position: isMobile && sidebarOpen ? "fixed" : "sticky",
            top: 0,
            left: isRTL ? "auto" : 0,
            right: isRTL ? 0 : "auto",
            height: "100vh",
            zIndex: isMobile && sidebarOpen ? 40 : "auto",
            boxShadow: isMobile && sidebarOpen ? "var(--shadow-lg)" : "none",
            overflowY: "auto",
          }}
        >
          {/* Profile header */}
          <div style={{ padding: "4px 8px 16px", borderBottom: "1px solid var(--color-border)", marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>
              {lang === "fr" ? "Espace Recyclage" : "مساحة التدوير"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexDirection: isRTL ? "row-reverse" : "row" }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "var(--color-accent-light)",
                border: "1px solid var(--color-border-gold)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Recycle size={18} strokeWidth={1.5} color="var(--color-accent)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userSocieteNom}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>
                  {lang === "fr" ? "Société Agréée" : "شركة معتمدة"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          {navItems.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "11px 14px",
                  background: active ? "var(--color-accent-light)" : "transparent",
                  border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                  borderLeft: !isRTL ? `2px solid ${active ? "var(--color-accent)" : "transparent"}` : "none",
                  borderRight: isRTL ? `2px solid ${active ? "var(--color-accent)" : "transparent"}` : "none",
                  flexDirection: isRTL ? "row-reverse" : "row",
                  textAlign: isRTL ? "right" : "left",
                  borderRadius: `0 var(--radius-sm) var(--radius-sm) 0`,
                }}
              >
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </button>
            );
          })}

          {/* Sign Out */}
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
            <button
              onClick={signOut}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "11px 14px",
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, color: "#dc2626",
                flexDirection: isRTL ? "row-reverse" : "row",
                textAlign: isRTL ? "right" : "left",
              }}
            >
              <LogOut size={16} strokeWidth={1.5} />
              {lang === "fr" ? "Déconnexion" : "تسجيل الخروج"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: isMobile ? "70px 16px 40px" : "40px 48px", minWidth: 0 }}>
          {/* TAB 2: STATS & IMPACT */}
          {activeTab === "stats" && (
            <div>
              <h1 style={{ fontSize: "1.8rem", marginBottom: "24px", color: "var(--color-primary)" }}>
                {lang === "fr" ? "Statistiques & Impact Écologique" : "الإحصائيات والأثر البيئي"}
              </h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
                <div style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 4 }}>{lang === "fr" ? "Total demandes" : "إجمالي الطلبات"}</p>
                  <h3 style={{ fontSize: "1.6rem", margin: 0, fontWeight: 700, color: "var(--color-primary)" }}>{demandes.length}</h3>
                </div>
                <div style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 4 }}>{lang === "fr" ? "En attente" : "في الانتظار"}</p>
                  <h3 style={{ fontSize: "1.6rem", margin: 0, fontWeight: 700, color: "#d97706" }}>{countEnAttente}</h3>
                </div>
                <div style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 4 }}>{lang === "fr" ? "Prises en charge" : "تم التكفل بها"}</p>
                  <h3 style={{ fontSize: "1.6rem", margin: 0, fontWeight: 700, color: "#2563eb" }}>{countConfirmees}</h3>
                </div>
                <div style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 4 }}>{lang === "fr" ? "Terminées" : "مكتملة"}</p>
                  <h3 style={{ fontSize: "1.6rem", margin: 0, fontWeight: 700, color: "#059669" }}>{countTerminees}</h3>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DEMANDES */}
          {activeTab === "demandes" && (
            <>
              <div style={{
                display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                marginBottom: 32, flexWrap: "wrap", gap: 16
              }}>
                <div>
                  <span className="section-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Recycle size={14} color="var(--color-accent)" />
                    {userSocieteNom}
                  </span>
                  <h1 style={{
                    fontFamily: isRTL ? "var(--font-arabic-display)" : "var(--font-serif)",
                    fontSize: "2.2rem", fontWeight: 700, color: "var(--color-primary)",
                    lineHeight: 1.1, marginTop: 4
                  }}>
                    {lang === "fr" ? "Demandes de collecte en temps réel" : "طلبات الجمع في الوقت الفعلي"}
                  </h1>
                  <p style={{ color: "var(--color-text-secondary)", marginTop: 6, fontSize: 15 }}>
                    {countEnAttente} {lang === "fr" ? "demande(s) en attente de prise en charge" : "طلب(طلبات) في انتظار المعالجة"}
                  </p>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => fetchDemandes(true)}
                    disabled={refreshing}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                      border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                      padding: "10px 16px", background: "#ffffff",
                      cursor: "pointer", fontWeight: 600,
                      color: "var(--color-text)", fontFamily: "inherit",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <RefreshCw size={15} style={{ animation: refreshing ? "spin-slow 1s linear infinite" : "none" }} />
                    {lang === "fr" ? "Actualiser" : "تحديث"}
                  </button>
                </div>
              </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { key: "all", label: lang === "fr" ? "Toutes les demandes" : "جميع الطلبات", count: demandes.length },
              { key: "en_attente", label: lang === "fr" ? "En attente" : "في الانتظار", count: countEnAttente },
              { key: "confirmee", label: lang === "fr" ? "Prises en charge" : "تم التكفل بها", count: countConfirmees },
              { key: "terminee", label: lang === "fr" ? "Terminées" : "مكتملة", count: demandes.filter((d) => d && d.statut === "terminee").length },
            ].map(({ key, label, count }) => {
              const active = statusFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  style={{
                    padding: "8px 18px", borderRadius: 99,
                    fontSize: 13, fontWeight: 600,
                    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                    background: active ? "var(--color-accent-light)" : "#ffffff",
                    color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s ease",
                  }}
                >
                  {label}
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 99,
                    background: active ? "var(--color-accent)" : "var(--color-bg)",
                    color: active ? "#ffffff" : "var(--color-text-muted)",
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{
                width: 36, height: 36, border: "3px solid var(--color-accent-light)",
                borderTopColor: "var(--color-accent)", borderRadius: "50%",
              animation: "spin-slow 0.7s linear infinite", margin: "0 auto 16px"
              }} />
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                {lang === "fr" ? "Chargement des demandes..." : "جاري التحميل..."}
              </p>
            </div>
          )}

          {/* Cards Grid */}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {demandesFiltrees.map((d) => {
                if (!d) return null;
                const Icone = getWasteIcon(d.type_dechet);
                const isNew = d.statut === "en_attente" || d.statut === "nouveau";
                const isConfirmee = d.statut === "confirmee" || d.statut === "acceptee" || d.statut === "en_collecte";
                const isTerminee = d.statut === "terminee";
                const isActionLoading = actionLoadingId === d.id;

                const clientNom = d.profiles?.nom || (lang === "fr" ? "Demande de collecte" : "طلب جمع");
                const clientTel = d.profiles?.telephone || "";
                const clientWilaya = d.profiles?.wilaya || "";

                return (
                  <div
                    key={d.id}
                    style={{
                      background: "#ffffff",
                      border: isNew ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)",
                      padding: 24,
                      position: "relative",
                      boxShadow: isNew ? "0 4px 16px rgba(58, 160, 110, 0.08)" : "0 2px 8px rgba(0,0,0,0.02)",
                      transition: "transform var(--transition), box-shadow var(--transition)",
                    }}
                    className="card-hover"
                  >
                    {/* Badge statut */}
                    <span style={{
                      position: "absolute", top: 20, ...(isRTL ? { left: 20 } : { right: 20 }),
                      fontSize: 10,
                      background: isNew
                        ? "var(--color-accent-light)"
                        : isConfirmee
                        ? "#eef2ff"
                        : "#ecfdf5",
                      color: isNew
                        ? "var(--color-accent)"
                        : isConfirmee
                        ? "#4f46e5"
                        : "#059669",
                      padding: "4px 12px", borderRadius: 99,
                      fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    }}>
                      {isNew
                        ? (lang === "fr" ? "Nouvelle" : "جديد")
                        : isConfirmee
                        ? (lang === "fr" ? "Prise en charge" : "قيد المعالجة")
                        : (lang === "fr" ? "Terminée" : "مكتملة")}
                    </span>

                    {/* Content Header */}
                    <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "var(--color-accent-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, color: "var(--color-accent)",
                      }}>
                        <Icone size={20} strokeWidth={1.5} />
                      </div>
                      <div style={{ minWidth: 0, paddingRight: isRTL ? 0 : 70, paddingLeft: isRTL ? 70 : 0 }}>
                        <p style={{ fontWeight: 700, color: "var(--color-primary)", marginBottom: 3, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {clientNom}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                          {(() => {
                            const t = {
                              'Plastique': 'بلاستيك', 'Carton/Papier': 'كرتون / ورق', 'Verre': 'زجاج',
                              'Métal': 'معدن', 'Électronique': 'إلكترونيات',
                              'Organique': 'عضوي', 'Encombrant': 'مخلفات ضخمة (أثاث، أجهزة)',
                              'Ménager': 'نفايات منزلية', 'Médical': 'نفايات طبية', 'Chimique': 'نفايات كيميائية / خطرة',
                              'BTP': 'نفايات البناء والأنقاض', 'Autre': 'آخر'
                            };
                            const type = d.type_dechet;
                            if (!type) return (lang === 'fr' ? 'Déchets' : 'نفايات');
                            return lang === 'fr' ? type : (t[type] || type);
                          })()} · <strong>{d.quantite || "—"}</strong>
                        </p>
                        {d.description && (
                          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-accent)' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-accent)', display: 'block', marginBottom: 3 }}>
                              {lang === 'fr' ? 'Description' : 'الوصف'}
                            </span>
                            {d.description}
                          </div>
                        )}
                        {/* Société confirmante — visible par toutes les sociétés */}
                        {(isConfirmee || isTerminee) && d.confirmed_by_nom && (
                          <div style={{
                            marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                            color: '#4f46e5', fontWeight: 600,
                          }}>
                            <Check size={13} />
                            {lang === 'fr'
                              ? `Pris en charge par : ${d.confirmed_by_nom}`
                              : `تم التكفل من قِبَل : ${d.confirmed_by_nom}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 16,
                      paddingTop: 14, borderTop: "1px solid var(--color-border)",
                      fontSize: 12, color: "var(--color-text-muted)",
                      marginBottom: 18, flexWrap: "wrap",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={14} color="var(--color-accent)" />
                        {d.localisation?.type === 'Point' 
                          ? `GPS: ${d.localisation.coordinates[1].toFixed(4)}, ${d.localisation.coordinates[0].toFixed(4)}` 
                          : (typeof d.localisation === 'string' ? d.localisation : clientWilaya || (lang === "fr" ? "Localisation fournie" : "موقع محدد"))}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={14} /> {formatTimeAgo(d.created_at, lang)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                      {clientTel && (
                        <a
                          href={`tel:${clientTel}`}
                          style={{
                            flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                            padding: "10px 14px", fontSize: 13, color: "var(--color-text)",
                            textDecoration: "none", fontWeight: 600, fontFamily: "inherit",
                            background: "#ffffff", transition: "all 0.2s ease",
                          }}
                          title={clientTel}
                        >
                          <Phone size={14} /> {lang === "fr" ? "Appeler" : "اتصال"}
                        </a>
                      )}

                      {isNew && (
                        <button
                          onClick={() => handleUpdateStatus(d.id, "confirmee")}
                          disabled={isActionLoading}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            background: "var(--color-primary)", color: "#ffffff",
                            border: "none", borderRadius: "var(--radius-lg)",
                            padding: "10px 16px", fontSize: 13, fontWeight: 600,
                            cursor: isActionLoading ? "not-allowed" : "pointer",
                            opacity: isActionLoading ? 0.7 : 1, transition: "all 0.2s ease",
                          }}
                        >
                          <Check size={14} />
                          {lang === "fr" ? "Confirmer la collecte" : "تأكيد الجمع"}
                        </button>
                      )}

                      {isConfirmee && (
                        <button
                          onClick={() => handleUpdateStatus(d.id, "terminee")}
                          disabled={isActionLoading}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            background: "var(--color-accent)", color: "#ffffff",
                            border: "none", borderRadius: "var(--radius-lg)",
                            padding: "10px 16px", fontSize: 13, fontWeight: 600,
                            cursor: isActionLoading ? "not-allowed" : "pointer",
                            opacity: isActionLoading ? 0.7 : 1, transition: "all 0.2s ease",
                          }}
                        >
                          <CheckCircle2 size={14} />
                          {lang === "fr" ? "Marquer terminée" : "تحديد كمكتمل"}
                        </button>
                      )}

                      {isTerminee && (
                        <span style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          background: "#ecfdf5", color: "#059669",
                          borderRadius: "var(--radius-lg)", padding: "10px 16px",
                          fontSize: 12, fontWeight: 700,
                        }}>
                          <CheckCircle2 size={14} />
                          {lang === "fr" ? "Collecte effectuée" : "تم الجمع"}
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
              textAlign: "center", padding: "64px 20px",
              background: "#ffffff", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
              maxWidth: 500, margin: "20px auto 0",
            }}>
              <AlertCircle size={40} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--color-primary)", marginBottom: 6 }}>
                {lang === "fr" ? "Aucune demande pour le moment" : "لا توجد طلبات حالياً"}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                {lang === "fr"
                  ? "Les citoyens n'ont pas encore créé de demandes de collecte."
                  : "لم يقم المواطنون بإنشاء أي طلبات جمع بعد."}
              </p>
            </div>
          )}
          </>
        )}

          {/* ══ TAB: PROFILE ══ */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
                  {isRTL ? 'الحساب' : 'Compte'}
                </p>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  {isRTL ? 'الملف الشخصي' : 'Profil'}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {isRTL ? 'معلومات حسابك كشركة إعادة تدوير.' : 'Informations de votre compte entreprise de recyclage.'}
                </p>
              </div>

              <div style={{
                background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                padding: 32, boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 28,
                  borderBottom: '1px solid var(--color-border)',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                    border: '1px solid var(--color-border-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <User size={28} strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <p style={{
                      fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-primary)', margin: 0
                    }}>{userSocieteNom}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      {isRTL ? 'شركة إعادة تدوير معتمدة' : 'Société de recyclage agréée'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: isRTL ? 'نوع الحساب' : 'Type de compte', value: isRTL ? 'شركة إعادة تدوير' : 'Entreprise de recyclage' },
                    { label: isRTL ? 'رقم الاعتماد' : 'Numéro d\'agrément', value: profile?.numero_agrement || session?.user?.user_metadata?.numero_agrement || '—' },
                    { label: isRTL ? 'البريد الإلكتروني' : 'Email', value: session?.user?.email || '—' },
                    { label: isRTL ? 'الهاتف' : 'Téléphone', value: profile?.telephone || session?.user?.user_metadata?.telephone || '—' },
                    { label: isRTL ? 'الولاية' : 'Wilaya', value: profile?.wilaya || session?.user?.user_metadata?.wilaya || '—' },
                  ].map((field, i) => (
                    <div key={i} style={{
                      padding: '14px 18px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                      textAlign: isRTL ? 'right' : 'left',
                    }}>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</p>
                      <p style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: 600, margin: 0 }}>{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

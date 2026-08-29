import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Trash2, LocateFixed, AlertTriangle, Recycle, ChevronRight } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { supabase } from "../../lib/supabase"; // ⚠️ adaptez ce chemin si votre client Supabase est ailleurs

const statutConfig = {
  vide:  { bg: 'var(--color-accent-light)', dot: 'var(--color-primary)', hex: '#2f6b4f', label: { fr: 'Vide',  ar: 'فارغة' } },
  moyen: { bg: '#f3ece4',                    dot: 'var(--color-accent)', hex: '#c8974f', label: { fr: 'Moyen', ar: 'متوسطة' } },
  plein: { bg: '#fef2f2',                    dot: '#dc2626',              hex: '#dc2626', label: { fr: 'Plein', ar: 'ممتلئة' } },
  endommage: { bg: '#f3f4f6',                dot: '#6b7280',              hex: '#6b7280', label: { fr: 'Endommagé', ar: 'تالفة' } },
};

// Icône Leaflet en forme de "goutte" colorée selon le statut du conteneur
function buildIcon(hex) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${hex};
        border: 2px solid #ffffff;
        border-radius: 50% 50% 0 50%;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="transform: rotate(45deg); width: 14px; height: 14px; background: #fff; mask: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><path d=%22M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z%22/></svg>') center/contain no-repeat;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
}

// Recentre la carte quand les données arrivent
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 15);
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

// Force Leaflet à recalculer la taille de son conteneur après montage
// (nécessaire quand la carte est dans un layout flex/grid dont la taille
// se stabilise après le premier rendu)
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 0);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    window.addEventListener('resize', () => map.invalidateSize());
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

// Déduit le statut textuel (vide/moyen/plein) à partir du remplissage et de la capacité
function deriveStatut(remplissage, capacite) {
  const fill = Number(remplissage) || 0;
  const cap = Number(capacite) || 1;
  const ratio = fill / cap;
  if (ratio >= 0.85) return 'plein';
  if (ratio >= 0.35) return 'moyen';
  return 'vide';
}

// Distance haversine en mètres
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CitoyenHome() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [search, setSearch] = useState("");

  // Récupère les conteneurs depuis la vue Supabase (lat/lng déjà extraits du geometry)
  useEffect(() => {
    async function fetchContainers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('containers_with_coords')
        .select('*');

      if (error) {
        setError(error.message);
      } else {
        setContainers(data || []);
      }
      setLoading(false);
    }
    fetchContainers();
  }, []);

  // Position de l'utilisateur (pour le bouton "me localiser" et les distances)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silencieux si refusé
    );
  }, []);

  const filteredContainers = useMemo(() => {
    if (!search.trim()) return containers;
    const q = search.trim().toLowerCase();
    return containers.filter(c =>
      (c.nom || '').toLowerCase().includes(q) ||
      (deriveStatut(c.statut, c.capacite)).toLowerCase().includes(q)
    );
  }, [containers, search]);

  const defaultCenter = [36.19, 5.41]; // Sétif — utilisé le temps que les données chargent

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <style>{`
        .citoyen-map-layout {
          display: flex;
          flex-direction: column;
          height: auto;
        }
        .citoyen-map-sidebar { max-height: 460px; }
        .citoyen-map-area { height: 360px; }
        @media (min-width: 900px) {
          .citoyen-map-layout {
            display: grid;
            grid-template-columns: 360px 1fr;
            grid-template-rows: 1fr;
            height: 100vh;
          }
          .citoyen-map-sidebar { max-height: none; }
          .citoyen-map-area { height: 100%; min-height: 0; }
        }
        .leaflet-container { width: 100%; height: 100%; font-family: inherit; }
        .citoyen-list-item {
          transition: transform var(--transition), border-color var(--transition), background var(--transition);
        }
        .citoyen-list-item:hover {
          border-color: var(--color-accent) !important;
          background: var(--color-accent-light) !important;
          transform: translateX(2px);
        }
      `}</style>

      <div
        className="citoyen-map-layout"
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >

        {/* ── Sidebar Panel — même traitement que le bandeau hero de la Home ── */}
        <div className="citoyen-map-sidebar" style={{
          borderRight: isRTL ? 'none' : '1px solid var(--color-border)',
          borderLeft: isRTL ? '1px solid var(--color-border)' : 'none',
          borderBottom: '1px solid var(--color-border)',
          background: '#ffffff',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
          textAlign: isRTL ? 'right' : 'left',
        }}>
          <div>
            <span className="section-haute-eyebrow" style={{ marginBottom: 10 }}>
              {isRTL ? 'خريطة المواطن' : 'Carte citoyenne'}
            </span>
            <h1 style={{
              fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
              fontStyle: isRTL ? 'normal' : 'italic',
              fontWeight: isRTL ? 700 : 400,
              fontSize: '1.7rem',
              color: 'var(--color-primary)',
              lineHeight: 1.22,
            }}>
              {isRTL ? 'الحاويات القريبة' : 'Conteneurs à proximité'}
            </h1>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
            padding: '11px 14px', border: '1px solid var(--color-border)',
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}>
            <Search size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRTL ? 'ابحث (نوع، حالة)...' : 'Rechercher (type, statut)...'}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, flex: 1, color: 'var(--color-text)',
                textAlign: isRTL ? 'right' : 'left',
              }}
            />
          </div>

          {/* Container List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {loading && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {isRTL ? 'جارٍ التحميل...' : 'Chargement des conteneurs...'}
              </p>
            )}
            {error && (
              <p style={{ fontSize: 13, color: '#dc2626' }}>
                {isRTL ? 'خطأ في التحميل' : 'Erreur de chargement'}: {error}
              </p>
            )}
            {!loading && !error && filteredContainers.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {isRTL ? 'لا توجد حاويات' : 'Aucun conteneur trouvé'}
              </p>
            )}
            {filteredContainers.map((c) => {
              const derivedStatus = deriveStatut(c.statut, c.capacite);
              const cfg = statutConfig[derivedStatus] || statutConfig.vide;
              const dist = userPos
                ? Math.round(distanceMeters(userPos.lat, userPos.lng, c.latitude, c.longitude))
                : null;
              return (
                <button
                  key={c.id}
                  className="citoyen-list-item"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'transparent', border: '1px solid var(--color-border)',
                    padding: '14px 16px', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left',
                    fontFamily: 'inherit',
                    borderRadius: 'var(--radius-sm)',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Trash2 size={16} style={{ color: cfg.dot }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                      {c.nom || (isRTL ? 'حاوية' : 'Conteneur')}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {dist !== null ? `${dist} m · ` : ''}{cfg.label[lang] || cfg.label.fr}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0, transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 18, borderTop: '1px solid var(--color-border-gold)' }}>
            <button
              onClick={() => alert(isRTL ? 'الإبلاغ عن حاوية ممتلئة' : 'Signaler un conteneur plein')}
              className="btn btn-outline-dark"
              style={{ width: '100%', borderColor: '#dc2626', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <AlertTriangle size={14} />
              {isRTL ? 'الإبلاغ عن مشكلة' : 'Signaler un problème'}
            </button>
            <button
              onClick={() => alert(isRTL ? 'طلب جمع' : 'Demander une collecte')}
              className="btn btn-forest"
              style={{ width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Recycle size={14} />
              {isRTL ? 'طلب جمع' : 'Demander une collecte'}
            </button>
          </div>
        </div>

        {/* ── Map Area ── */}
        <div className="citoyen-map-area" style={{ position: 'relative', background: 'var(--color-primary-50)' }}>
          <MapContainer
            center={defaultCenter}
            zoom={14}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <InvalidateOnMount />
            <FitBounds points={filteredContainers} />

            {filteredContainers.map((c) => {
              const derivedStatus = deriveStatut(c.statut, c.capacite);
              const cfg = statutConfig[derivedStatus] || statutConfig.vide;
              return (
                <Marker
                  key={c.id}
                  position={[c.latitude, c.longitude]}
                  icon={buildIcon(cfg.hex)}
                >
                  <Popup>
                    <div style={{ fontFamily: 'inherit', fontSize: 13, textTransform: 'capitalize' }}>
                      <strong>{c.nom || (isRTL ? 'حاوية' : 'Conteneur')}</strong><br />
                      {cfg.label[lang] || cfg.label.fr}
                      {c.capacite ? <><br />{isRTL ? 'السعة' : 'Capacité'}: {c.capacite}</> : null}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {userPos && (
              <Marker
                position={[userPos.lat, userPos.lng]}
                icon={L.divIcon({
                  className: "",
                  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb;"></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })}
              />
            )}
          </MapContainer>

          {/* Locate Button */}
          <button
            onClick={() => {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition(
                (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
              );
            }}
            style={{
              position: 'absolute', ...(isRTL ? { left: 16 } : { right: 16 }), top: 16,
              width: 40, height: 40, background: 'var(--color-primary-dark)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: 'var(--shadow-md)',
              color: 'var(--color-accent)',
              zIndex: 1000,
            }}>
            <LocateFixed size={16} />
          </button>

          {/* Legend */}
          <div style={{
            position: 'absolute', ...(isRTL ? { right: 16 } : { left: 16 }), bottom: 16,
            background: '#ffffff', borderRadius: 'var(--radius-sm)',
            padding: '12px 18px', display: 'flex', gap: 20, flexWrap: 'wrap',
            boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)',
            zIndex: 1000,
          }}>
            {Object.entries(statutConfig).map(([key, cfg]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                {cfg.label[lang] || cfg.label.fr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
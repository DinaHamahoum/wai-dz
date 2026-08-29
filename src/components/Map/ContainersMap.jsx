import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../i18n/LanguageContext';
import { useContainers } from '../../hooks/useContainers';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Custom map marker using brand colors
const brandIcon = L.divIcon({
  className: 'custom-brand-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background-color: var(--color-accent);
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 3px 8px rgba(10, 25, 18, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 50%;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Component to handle auto-centering based on markers
function MapBounds({ containers }) {
  const map = useMap();

  useEffect(() => {
    if (containers && containers.length > 0) {
      const bounds = L.latLngBounds(containers.map(c => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [containers, map]);

  return null;
}

export default function ContainersMap() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const { containers, loading, error } = useContainers();

  if (loading) {
    return (
      <div style={{
        width: '100%', height: '100%', minHeight: 400,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-primary-50)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)'
      }}>
        <Loader2 size={32} className="animate-spin" color="var(--color-primary)" style={{ animation: 'spin-slow 2s linear infinite' }} />
        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {lang === 'fr' ? 'Chargement de la carte...' : 'جاري تحميل الخريطة...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: '100%', height: '100%', minHeight: 400,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#fef2f2', border: '1px solid #f87171', borderRadius: 'var(--radius-sm)', padding: 24, textAlign: 'center'
      }}>
        <AlertTriangle size={32} color="#dc2626" />
        <p style={{ marginTop: 16, fontSize: 14, color: '#991b1b', fontWeight: 600 }}>
          {lang === 'fr' ? 'Erreur lors du chargement des données.' : 'حدث خطأ أثناء تحميل البيانات.'}
        </p>
        <p style={{ marginTop: 8, fontSize: 13, color: '#b91c1c' }}>{error.message}</p>
      </div>
    );
  }

  if (!containers || containers.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%', minHeight: 400,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)'
      }}>
        <p style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {lang === 'fr' ? 'Aucun conteneur disponible sur la carte.' : 'لا توجد حاويات متاحة على الخريطة.'}
        </p>
      </div>
    );
  }

  // Fallback center for Algeria if fitBounds doesn't fire instantly
  const defaultCenter = [36.7538, 3.0588];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 500, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)', direction: 'ltr' }}>
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        {/* Standard OpenStreetMap: 100% gratuit sans clé d'API requise */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="brand-map-tiles"
        />
        
        {containers.map((c) => {
          const fill = Number(c.statut) || 0;
          const cap = Number(c.capacite) || 1;
          const ratio = fill / cap;
          const fillColor = ratio >= 0.85 ? '#dc2626' : ratio >= 0.35 ? '#c8974f' : 'var(--color-primary)';
          
          return (
          <Marker key={c.id} position={[c.latitude, c.longitude]} icon={brandIcon}>
            <Popup>
              <div style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ID: {c.id.substring(0, 8)}
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--color-primary)', fontWeight: 700 }}>
                  {c.nom || (lang === 'fr' ? 'Conteneur' : 'حاوية')}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 13 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{lang === 'fr' ? 'Remplissage:' : 'التعبئة:'}</span>
                  <span style={{ fontWeight: 600, color: fillColor }}>
                    {fill} / {c.capacite != null ? c.capacite : '?'} kg ({Math.round(ratio * 100)}%)
                  </span>
                </div>

                {/* Fill bar */}
                <div style={{ marginTop: 8, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(ratio * 100, 100)}%`, height: '100%', background: fillColor, borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            </Popup>
          </Marker>
          );
        })}

        <MapBounds containers={containers} />
      </MapContainer>

      {/* Subtle filter to make the map match the warm cream aesthetic without losing any sharpness */}
      <style>{`
        .brand-map-tiles {
          filter: sepia(0.12) contrast(1.02);
        }
      `}</style>
    </div>
  );
}

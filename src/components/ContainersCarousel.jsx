import { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';

export default function ContainersCarousel() {
  const { t, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Vitesse de défilement automatique : 2.5 secondes par image
  const SLIDE_DURATION = 2500;
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // ── CHARGEMENT DE TOUTES LES IMAGES DES CONTENEURS ──
  const fetchContainers = useCallback(async () => {
    try {
      const imagesMap = new Map();

      // 1. Table catalogue_conteneurs
      try {
        const { data: dbData } = await supabase
          .from('catalogue_conteneurs')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbData && dbData.length > 0) {
          dbData.forEach(item => {
            if (item.image_url && item.image_url.trim()) {
              imagesMap.set(item.image_url.trim(), {
                id: item.id,
                image_url: item.image_url.trim(),
                titre: item.titre || null,
                description: item.description || null,
                capacite: item.capacite || null,
              });
            }
          });
        }
      } catch (errDb) {
        console.warn('catalogue_conteneurs:', errDb);
      }

      // 2. Dossier catalog dans le bucket conteneurs
      try {
        const { data: storageFiles, error: storageErr } = await supabase.storage
          .from('conteneurs')
          .list('catalog', { sortBy: { column: 'created_at', order: 'desc' } });

        if (!storageErr && storageFiles && storageFiles.length > 0) {
          storageFiles
            .filter(f => f.name && !f.name.startsWith('.'))
            .forEach(f => {
              const { data: urlData } = supabase.storage
                .from('conteneurs')
                .getPublicUrl(`catalog/${f.name}`);

              if (urlData?.publicUrl && !imagesMap.has(urlData.publicUrl)) {
                imagesMap.set(urlData.publicUrl, {
                  id: f.id || f.name,
                  image_url: urlData.publicUrl,
                  titre: null,
                });
              }
            });
        }
      } catch (errStorage) {
        console.warn('Storage list catalog:', errStorage);
      }

      setItems(Array.from(imagesMap.values()));
    } catch (err) {
      console.error('Erreur chargement images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainers();

    const channel = supabase
      .channel('catalogue_conteneurs_home_smooth')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalogue_conteneurs' },
        () => fetchContainers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContainers]);

  useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(0);
    }
  }, [items.length, currentIndex]);

  // ── DÉFILEMENT AUTOMATIQUE SOUPLE ET FLUIDE SANS FLÈCHES ──
  useEffect(() => {
    if (items.length <= 1 || lightboxImage) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [items.length, lightboxImage, SLIDE_DURATION]);

  // Touch swipe mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const deltaX = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
      } else {
        setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
      }
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <section
      id="nos-conteneurs"
      className="section"
      style={{
        background: '#ffffff',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '60px 0 70px',
      }}
      aria-label={isRTL ? 'حاوياتنا ومنتجاتنا' : 'Nos conteneurs et produits'}
    >
      <div className="container" style={{ maxWidth: 1060 }}>
        {/* ── EN-TÊTE DE LA SECTION (IDENTIQUE AUX AUTRES SECTIONS) ── */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
          <span className="section-haute-eyebrow">
            {t('home.containersSection.eyebrow') || (isRTL ? 'حاوياتنا' : 'Nos Conteneurs')}
          </span>

          <h2
            className="section-title"
            style={{ fontStyle: isRTL ? 'normal' : 'italic' }}
          >
            {t('home.containersSection.title') || (isRTL ? 'حاوياتنا' : 'Nos Conteneurs')}
          </h2>
        </div>

        {/* ── ZONE DE DÉFILEMENT PAR GLISSEMENT LATÉRAL FLUIDE (SLIDE) ── */}
        <div
          dir="ltr"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 820,
            margin: '0 auto',
            overflow: 'hidden',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            style={{
              display: 'flex',
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
            }}
          >
            {items.map((item, idx) => (
              <div
                key={item.image_url || idx}
                style={{
                  minWidth: '100%',
                  flexShrink: 0,
                  height: 'clamp(280px, 46vw, 460px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '10px 0',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
                onClick={() => setLightboxImage(item)}
              >
                <img
                  src={item.image_url}
                  alt={item.titre || (isRTL ? 'حاوية' : 'Conteneur')}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 20,
                    userSelect: 'none',
                    filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.06))',
                  }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── POINTS DE NAVIGATION DISCRETS ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 7,
            marginTop: 16,
          }}
        >
          {items.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`${isRTL ? 'الصورة' : 'Photo'} ${idx + 1}`}
                style={{
                  width: isActive ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: isActive ? 'var(--color-primary)' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── MODAL AGRANDISSEMENT (LIGHTBOX) ── */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: -42,
                right: isRTL ? 'auto' : 0,
                left: isRTL ? 0 : 'auto',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <img
              src={lightboxImage.image_url}
              alt="Conteneur"
              style={{
                maxWidth: '85vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: 4,
                background: '#ffffff',
                padding: 10,
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

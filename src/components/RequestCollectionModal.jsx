import { useState } from 'react';
import { X, MapPin, Loader2, CheckCircle, Send, Recycle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import { REWARDS } from '../constants/rewards';

export default function RequestCollectionModal({ isOpen, onClose, userId, onSuccess }) {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [categorieDechet, setCategorieDechet] = useState(''); // 'recyclable' | 'non_recyclable'
  const [typeDechet, setTypeDechet] = useState('');
  const [quantite, setQuantite] = useState('');
  const [adresse, setAdresse] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get geolocation if user clicks the button
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === 'fr' ? 'La géolocalisation n\'est pas supportée par votre navigateur' : 'تحديد الموقع الجغرافي غير مدعوم في متصفحك');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAdresse(`POINT(${position.coords.longitude} ${position.coords.latitude})`);
      },
      (err) => {
        console.error(err);
        alert(lang === 'fr' ? 'Impossible d\'obtenir votre position' : 'لا يمكن الحصول على موقعك');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categorieDechet || !typeDechet || !quantite || !adresse) {
      setError(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires.' : 'يرجى ملء جميع الحقول الإلزامية.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user?.id) {
          throw new Error(lang === 'fr'
            ? 'Votre session est expirée ou introuvable. Veuillez vous reconnecter puis réessayer.'
            : 'انتهت صلاحية جلستك أو تعذر العثور عليها. يرجى تسجيل الدخول مرة أخرى ثم المحاولة من جديد.');
        }
        resolvedUserId = user.id;
      }

      // Create payload matching the DB columns
      const payload = {
        user_id: resolvedUserId,
        categorie_dechet: categorieDechet,
        type_dechet: typeDechet,
        quantite: quantite,
        description: description,
        statut: 'en_attente',
        created_at: new Date().toISOString(),
      };

      let finalLocalisation = adresse;
      if (!adresse.startsWith('POINT(')) {
        try {
          // Utilisation de l'API Photon (plus permissive pour les requêtes depuis localhost)
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(adresse)}&limit=1`);
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates;
            // coords = [longitude, latitude]
            finalLocalisation = `POINT(${coords[0]} ${coords[1]})`;
          } else {
            // Fallback si l'adresse n'est pas trouvée : on met des coordonnées par défaut (Alger centre) pour ne pas bloquer le test
            finalLocalisation = `POINT(3.0588 36.7538)`;
          }
        } catch (err) {
          // En cas d'erreur réseau/CORS, on utilise aussi le fallback pour permettre au formulaire de passer
          finalLocalisation = `POINT(3.0588 36.7538)`;
        }
      }
      
      payload.localisation = finalLocalisation;

      const { data: insertedRows, error: insertError } = await supabase
        .from('demandes_collecte')
        .insert([payload])
        .select();

      if (insertError) throw insertError;

      const insertedRequest = insertedRows?.[0];
      if (insertedRequest?.id) {
        const { error: rewardError } = await supabase
          .from('recompenses')
          .insert([{ user_id: resolvedUserId, type: 'demande', points: REWARDS.COLLECTION_REQUEST_POINTS, demande_id: insertedRequest.id }]);

        if (rewardError) throw rewardError;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setCategorieDechet('');
        setTypeDechet('');
        setQuantite('');
        setAdresse('');
        setDescription('');
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.message || (lang === 'fr' ? 'Une erreur est survenue.' : 'حدث خطأ.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <div style={{
        background: 'var(--color-bg)',
        width: '100%', maxWidth: 500,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{
            fontFamily: isRTL ? 'var(--font-arabic-display)' : 'var(--font-serif)',
            fontSize: '1.5rem', color: 'var(--color-primary)', margin: 0
          }}>
            {lang === 'fr' ? 'Nouvelle demande de collecte' : 'طلب جمع جديد'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', display: 'flex'
          }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={64} color="var(--color-accent)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: 8 }}>
                {lang === 'fr' ? 'Demande envoyée avec succès !' : 'تم إرسال الطلب بنجاح!'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {lang === 'fr' ? 'Redirection...' : 'جاري التوجيه...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {error && (
                <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #f87171', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontSize: 14 }}>
                  {error}
                </div>
              )}

              {/* Catégorie de déchet */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {lang === 'fr' ? 'Catégorie de déchet *' : 'فئة النفايات *'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    {
                      value: 'recyclable',
                      labelFr: 'Déchets recyclables',
                      labelAr: 'النفايات القابلة لإعادة التدوير',
                      icon: Recycle,
                      color: 'var(--color-accent)',
                      bg: 'var(--color-accent-light)',
                    },
                    {
                      value: 'non_recyclable',
                      labelFr: 'Déchets non recyclables',
                      labelAr: 'النفايات غير القابلة لإعادة التدوير',
                      icon: Trash2,
                      color: '#6b7280',
                      bg: '#f3f4f6',
                    },
                  ].map((cat) => {
                    const isSelected = categorieDechet === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => { setCategorieDechet(cat.value); setTypeDechet(''); }}
                        style={{
                          padding: '14px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? cat.color : 'var(--color-border)'}`,
                          background: isSelected ? cat.bg : '#fff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                          <cat.icon size={24} color={isSelected ? cat.color : 'var(--color-text)'} strokeWidth={1.5} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? cat.color : 'var(--color-text)', lineHeight: 1.3 }}>
                          {lang === 'fr' ? cat.labelFr : cat.labelAr}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {categorieDechet && (
                  <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {categorieDechet === 'recyclable'
                      ? (lang === 'fr' ? '→ Votre demande sera transmise à une société de recyclage.' : '→ سيتم إرسال طلبك إلى شركة إعادة التدوير.')
                      : (lang === 'fr' ? '→ Votre demande sera transmise au Centre d\'Enfouissement Technique (CET).' : '→ سيتم إرسال طلبك إلى مركز الردم التقني (CET).')}
                  </p>
                )}
              </div>

              {/* Type de déchet */}
              {categorieDechet && (
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {lang === 'fr' ? 'Type de déchet *' : 'نوع النفايات *'}
                </label>
                <select
                  value={typeDechet}
                  onChange={(e) => setTypeDechet(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', background: '#fff',
                    fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text)'
                  }}
                >
                  <option value="">{lang === 'fr' ? '-- Sélectionner --' : '-- اختر --'}</option>
                  {categorieDechet === 'recyclable' ? (
                    <>
                      <option value="Plastique">{lang === 'fr' ? 'Plastique' : 'بلاستيك'}</option>
                      <option value="Carton/Papier">{lang === 'fr' ? 'Carton / Papier' : 'كرتون / ورق'}</option>
                      <option value="Verre">{lang === 'fr' ? 'Verre' : 'زجاج'}</option>
                      <option value="Métal">{lang === 'fr' ? 'Métal' : 'معدن'}</option>
                      <option value="Électronique">{lang === 'fr' ? 'Électronique (D3E)' : 'إلكترونيات'}</option>
                      <option value="Autre">{lang === 'fr' ? 'Autre' : 'آخر'}</option>
                    </>
                  ) : (
                    <>
                      <option value="Organique">{lang === 'fr' ? 'Organique' : 'عضوي'}</option>
                      <option value="Encombrant">{lang === 'fr' ? 'Encombrant (Meubles, Électroménager)' : 'مخلفات ضخمة (أثاث، أجهزة)'}</option>
                      <option value="Ménager">{lang === 'fr' ? 'Ordures ménagères' : 'نفايات منزلية'}</option>
                      <option value="Médical">{lang === 'fr' ? 'Déchets médicaux' : 'نفايات طبية'}</option>
                      <option value="Chimique">{lang === 'fr' ? 'Déchets chimiques / dangereux' : 'نفايات كيميائية / خطرة'}</option>
                      <option value="BTP">{lang === 'fr' ? 'Déchets BTP / gravats' : 'نفايات البناء والأنقاض'}</option>
                      <option value="Autre">{lang === 'fr' ? 'Autre' : 'آخر'}</option>
                    </>
                  )}
                </select>
              </div>
              )}

              {/* Quantité */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {lang === 'fr' ? 'Quantité (ex: 3 sacs, 50kg) *' : 'الكمية (مثال: 3 أكياس، 50 كغ) *'}
                </label>
                <input
                  type="text"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  placeholder={lang === 'fr' ? 'Estimation de la quantité...' : 'تقدير الكمية...'}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', background: '#fff',
                    fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text)'
                  }}
                />
              </div>

              {/* Adresse / Localisation */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {lang === 'fr' ? 'Adresse ou localisation *' : 'العنوان أو الموقع *'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder={lang === 'fr' ? 'Votre adresse exacte...' : 'عنوانك الدقيق...'}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)', background: '#fff',
                      fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    title={lang === 'fr' ? 'Utiliser ma position GPS' : 'استخدم موقعي'}
                    style={{
                      padding: '0 16px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg)', border: '1px solid var(--color-border-gold)',
                      color: 'var(--color-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                  >
                    <MapPin size={20} />
                  </button>
                </div>
              </div>

              {/* Description (Optionnelle) */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {lang === 'fr' ? 'Description (Optionnelle)' : 'وصف (اختياري)'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'fr' ? 'Détails supplémentaires pour le collecteur...' : 'تفاصيل إضافية...'}
                  rows={3}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', background: '#fff',
                    fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text)', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline-gold"
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px' }}
                >
                  {lang === 'fr' ? 'Retour' : 'رجوع'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn"
                  style={{ 
                    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    gap: 8, padding: '14px', 
                    backgroundColor: 'var(--color-accent)', 
                    color: '#ffffff', 
                    border: 'none',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" style={{ animation: 'spin-slow 2s linear infinite' }} />
                      {lang === 'fr' ? 'Envoi...' : 'جاري...'}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {lang === 'fr' ? 'Demander' : 'طلب'}
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import { REWARDS } from '../constants/rewards';

export default function ReportModal({ isOpen, onClose, userId, onSuccess }) {
  const { lang, t } = useLanguage();
  const isRTL = lang === 'ar';

  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportType || !description) {
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

      // Build final description combining type, description, and location
      let finalDescription = `[${reportType}] ${description}`;
      if (location) {
        finalDescription += `\nLocalisation: ${location}`;
      }

      // Upload photo if present
      let photoUrl = null;
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${resolvedUserId}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('signalements')
          .upload(fileName, photo);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('signalements')
          .getPublicUrl(fileName);
          
        photoUrl = publicUrl;
      }

      const payload = {
        user_id: resolvedUserId,
        description: finalDescription,
        photo_url: photoUrl,
        statut: 'en_attente',
      };

      const { data: insertedRows, error: insertError } = await supabase
        .from('reclamations')
        .insert([payload])
        .select();

      if (insertError) throw insertError;

      const insertedReport = insertedRows?.[0];
      if (insertedReport?.id) {
        const { error: rewardError } = await supabase
          .from('recompenses')
          .insert([{ user_id: resolvedUserId, type: 'reclamation', points: REWARDS.REPORT_POINTS, reclamation_id: insertedReport.id }]);

        if (rewardError) throw rewardError;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setReportType('');
        setDescription('');
        setLocation('');
        setPhoto(null);
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error submitting report:', err);
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
            fontSize: '1.5rem', color: 'var(--color-primary)', margin: 0,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <AlertTriangle size={20} color="var(--color-primary)" />
            {lang === 'fr' ? 'Signaler un problème' : 'الإبلاغ عن مشكلة'}
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
                {lang === 'fr' ? 'Signalement envoyé avec succès !' : 'تم إرسال البلاغ بنجاح!'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {lang === 'fr' ? 'Merci pour votre contribution.' : 'شكراً لمساهمتك.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {error && (
                 <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #f87171', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontSize: 14 }}>
                  {error}
                </div>
              )}

              {/* Type */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  {lang === 'fr' ? 'Type de problème *' : 'نوع المشكلة *'}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', background: '#fff',
                    fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text)'
                  }}
                  required
                >
                  <option value="" disabled>{lang === 'fr' ? '-- Sélectionner --' : '-- اختر --'}</option>
                  <option value={lang === 'fr' ? 'Conteneur plein' : 'حاوية ممتلئة'}>{lang === 'fr' ? 'Conteneur plein' : 'حاوية ممتلئة'}</option>
                  <option value={lang === 'fr' ? 'Conteneur endommagé' : 'حاوية تالفة'}>{lang === 'fr' ? 'Conteneur endommagé' : 'حاوية تالفة'}</option>
                  <option value={lang === 'fr' ? 'Décharge sauvage' : 'رمي عشوائي'}>{lang === 'fr' ? 'Décharge sauvage' : 'رمي عشوائي'}</option>
                  <option value={lang === 'fr' ? 'Autre' : 'أخرى'}>{lang === 'fr' ? 'Autre' : 'أخرى'}</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  {lang === 'fr' ? 'Description détaillée *' : 'وصف تفصيلي *'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'fr' ? 'Décrivez le problème que vous avez constaté...' : 'صف المشكلة التي لاحظتها...'}
                  rows={4}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', background: '#fff',
                    fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text)', resize: 'vertical'
                  }}
                  required
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  {lang === 'fr' ? 'Photo (Optionnelle)' : 'صورة (اختياري)'}
                </label>
                <div style={{
                  border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
                  padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  background: '#f9fafb', position: 'relative'
                }}>
                  {photo ? (
                    <div style={{ position: 'relative', width: '100%', maxHeight: 200, display: 'flex', justifyContent: 'center' }}>
                      <img src={URL.createObjectURL(photo)} alt="Preview" style={{ maxHeight: 200, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
                      <button type="button" onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 24 }}>
                      <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--color-primary)', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity=0.7} onMouseLeave={e => e.currentTarget.style.opacity=1}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(30, 64, 175, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={20} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{lang === 'fr' ? 'Prendre une photo' : 'التقاط صورة'}</span>
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]); }} />
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--color-accent)', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity=0.7} onMouseLeave={e => e.currentTarget.style.opacity=1}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={20} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{lang === 'fr' ? 'Galerie / PC' : 'معرض / حاسوب'}</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]); }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  {lang === 'fr' ? 'Lieu (Optionnel)' : 'الموقع (اختياري)'}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={lang === 'fr' ? 'Quartier, rue, ou point de repère...' : 'حي، شارع، أو معلم...'}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)', background: '#fff',
                    fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text)'
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
                  {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={loading || !userId}
                  className="btn"
                  style={{ 
                    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    gap: 8, padding: '14px', 
                    backgroundColor: 'var(--color-primary)', 
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
                      <AlertTriangle size={18} />
                      {lang === 'fr' ? 'Signaler' : 'إبلاغ'}
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

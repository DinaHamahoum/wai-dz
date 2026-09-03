import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { supabase } from '../../lib/supabase';

export default function UpdatePassword() {
  const { lang, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionInfo(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSessionInfo(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      alert(lang === 'fr' ? 'Mot de passe mis à jour avec succès !' : 'تم تحديث كلمة المرور بنجاح!');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {lang === 'fr' ? "Vérification en cours... Si vous n'êtes pas redirigé, le lien est peut-être expiré." : 'جاري التحقق... إذا لم يتم إعادة توجيهك، فقد يكون الرابط منتهي الصلاحية.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)', padding: 16, direction: isRTL ? 'rtl' : 'ltr' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: 400, width: '100%' }}>
        <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>
          {lang === 'fr' ? 'Nouveau mot de passe' : 'كلمة مرور جديدة'}
        </h2>
        <p style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
          {lang === 'fr' ? 'Veuillez saisir votre nouveau mot de passe.' : 'يرجى إدخال كلمة المرور الجديدة.'}
        </p>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              ...(isRTL ? { right: 14 } : { left: 14 }),
              color: 'var(--color-accent)', pointerEvents: 'none',
            }} />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={lang === 'fr' ? 'Nouveau mot de passe' : 'كلمة مرور جديدة'}
              className="input"
              style={{
                paddingLeft: isRTL ? 44 : 44,
                paddingRight: isRTL ? 44 : 44,
                textAlign: isRTL ? 'right' : 'left',
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                ...(isRTL ? { left: 12 } : { right: 12 }),
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: 4,
              }}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-forest"
            disabled={loading || password.length < 6}
            style={{ marginTop: 8 }}
          >
            {loading ? '...' : (lang === 'fr' ? 'Mettre à jour' : 'تحديث')}
          </button>
        </form>
      </div>
    </div>
  );
}

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,        setSession]        = useState(undefined); // undefined = initialisation
  const [profile,        setProfile]        = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);      // true jusqu'au premier chargement

  /* ── Chargement du profil ── */
  /* signal : { cancelled: false } passé depuis l'effet pour éviter les mises à jour obsolètes */
  const fetchProfile = async (userId, userMetadata = null, signal = null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (signal?.cancelled) return; // effet nettoyé avant la réponse → ne rien faire

      if (!error && data) {
        let role = data.role || userMetadata?.role || 'citoyen';
        let typeEtablissement = data.type_etablissement || userMetadata?.type_etablissement;
        let nom = (data.nom && data.nom !== 'User') ? data.nom : (userMetadata?.nom || userMetadata?.full_name || data.nom || 'User');
        let telephone = data.telephone || userMetadata?.telephone || userMetadata?.phone || '';
        let wilaya = data.wilaya || userMetadata?.wilaya || '';
        let commune = data.commune || userMetadata?.commune || '';
        let adresse = data.adresse || userMetadata?.adresse || userMetadata?.address || '';

        const isCommune =
          typeEtablissement === 'commune' ||
          userMetadata?.type_etablissement === 'commune' ||
          role === 'commune' ||
          userMetadata?.role === 'commune';

        if (isCommune) {
          role = 'commune';
          typeEtablissement = 'commune';
        }

        // Si le profil en DB avait des données par défaut mais que userMetadata contient les vraies infos
        if (isCommune && (data.type_etablissement !== 'commune' || data.nom === 'User')) {
          supabase.from('profiles').update({
            nom,
            telephone,
            role: 'etablissement',
            type_etablissement: 'commune',
            wilaya,
            commune,
            adresse,
          }).eq('id', userId).then(() => {});
        }

        setProfile({
          ...data,
          nom,
          telephone,
          wilaya,
          commune,
          adresse,
          role,
          type_etablissement: typeEtablissement,
        });
      } else {
        /* Fallback sur les métadonnées du token */
        let role = userMetadata?.role || 'citoyen';
        let typeEtablissement = userMetadata?.type_etablissement || null;
        if (typeEtablissement === 'commune' || role === 'commune') {
          role = 'commune';
          typeEtablissement = 'commune';
        }
        setProfile({
          id:              userId,
          role,
          type_etablissement: typeEtablissement,
          nom:             userMetadata?.nom             || userMetadata?.full_name || '',
          telephone:       userMetadata?.telephone       || userMetadata?.phone || '',
          wilaya:          userMetadata?.wilaya          || '',
          commune:         userMetadata?.commune         || '',
          adresse:         userMetadata?.adresse         || userMetadata?.address || '',
          statut_compte:   userMetadata?.statut_compte   || 'actif',
          type_abonnement: userMetadata?.type_abonnement || 'essai',
        });
      }
    } catch {
      if (signal?.cancelled) return;
      /* Erreur réseau : fallback fiable sur les métadonnées */
      if (userMetadata?.role || userMetadata?.type_etablissement) {
        let role = userMetadata?.role || 'citoyen';
        let typeEtablissement = userMetadata?.type_etablissement || null;
        if (typeEtablissement === 'commune' || role === 'commune') {
          role = 'commune';
          typeEtablissement = 'commune';
        }
        setProfile({
          id:              userId,
          role,
          type_etablissement: typeEtablissement,
          nom:             userMetadata?.nom             || userMetadata?.full_name || '',
          telephone:       userMetadata?.telephone       || userMetadata?.phone || '',
          wilaya:          userMetadata?.wilaya          || '',
          commune:         userMetadata?.commune         || '',
          adresse:         userMetadata?.adresse         || userMetadata?.address || '',
          statut_compte:   userMetadata?.statut_compte   || 'actif',
          type_abonnement: userMetadata?.type_abonnement || 'essai',
        });
      } else {
        setProfile(null);
      }
    } finally {
      /* Ne pas toucher à l'état si l'effet a été nettoyé (StrictMode / démontage) */
      if (!signal?.cancelled) {
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    /* Ce signal est partagé entre getSession, onAuthStateChange et fetchProfile.
     * Quand le cleanup le met à cancelled = true, fetchProfile arrête de modifier l'état. */
    const signal = { cancelled: false };

    /* ── Session initiale ── */
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (signal.cancelled) return;
      setSession(session ?? null);
      if (session?.user) {
        setProfileLoading(true);
        fetchProfile(session.user.id, session.user.user_metadata, signal);
      } else {
        setProfileLoading(false);
      }
    });

    /* ── Changements d'état d'authentification ── */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (signal.cancelled) return;

      /* Le refresh de token ne nécessite pas de recharger le profil */
      if (event === 'TOKEN_REFRESHED') {
        setSession(session ?? null);
        return;
      }

      setSession(session ?? null);
      if (session?.user) {
        setProfileLoading(true);
        fetchProfile(session.user.id, session.user.user_metadata, signal);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => {
      signal.cancelled = true;   // annule toutes les opérations en cours
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileLoading(false);
  };

  /* Redirection selon le rôle et le type d'établissement */
  const getRoleRoute = (role, typeEtablissement = null) => {
    const effectiveType = typeEtablissement || profile?.type_etablissement;
    if (role === 'commune' || effectiveType === 'commune') {
      return '/commune/dashboard';
    }
    const routes = {
      citoyen:           '/citoyen',
      etablissement:     '/citoyen',
      societe_recyclage: '/recyclage',
      cet:               '/cet',
      mobilier_urbain:   '/mobilier',
      admin:             '/admin/dashboard',
      commune:           '/commune/dashboard',
    };
    return routes[role] ?? '/';
  };

  /*
   * loading = true tant que :
   *   - la session initiale n'est pas encore connue  (session === undefined)
   *   - OU la session est active ET le profil est en cours de chargement
   */
  const loading = session === undefined || (session !== null && profileLoading);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, getRoleRoute }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

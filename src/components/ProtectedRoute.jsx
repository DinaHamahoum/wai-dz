import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* Spinner simple pendant le chargement de la session */
function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--color-primary-light)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin-slow 0.7s linear infinite',
      }} />
    </div>
  );
}

/**
 * Protège une route.
 * @param {string[]} allowedRoles  - Rôles autorisés (ex: ['citoyen','etablissement'])
 * @param {React.ReactNode} children
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, profile, loading, getRoleRoute } = useAuth();

  /* Attendre la fin du chargement (session + profil) */
  if (loading) return <Spinner />;

  /* Pas de session → page de connexion */
  if (!session) return <Navigate to="/login" replace />;

  /* Rôle : priorité au profil DB, sinon user_metadata du token */
  let userRole = profile?.role || session?.user?.user_metadata?.role;
  if (profile?.type_etablissement === 'commune' || session?.user?.user_metadata?.type_etablissement === 'commune') {
    userRole = 'commune';
  }

  /* Rôle non encore résolu (edge case) → attendre */
  if (!userRole) return <Spinner />;

  /* Rôle autorisé → afficher la page */
  if (allowedRoles.includes(userRole)) {
    return children;
  }

  /* Rôle non autorisé pour cette route → rediriger vers la bonne route */
  return <Navigate to={getRoleRoute(userRole)} replace />;
}

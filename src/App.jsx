import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UpdatePassword from './pages/auth/UpdatePassword';
import CitoyenDashboard from './pages/citoyen/CitoyenDashboard';
import RecyclageDashboard from './pages/recyclage/RecyclageDashboard';
import RecyclageRegister from './pages/recyclage/RecyclageRegister';
import CETDashboard from './pages/cet/CETDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CommuneDashboard from './pages/commune/CommuneDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"                        element={<Home />} />
            <Route path="/login"                   element={<Login />} />
            <Route path="/register"                element={<Register />} />
            <Route path="/update-password"         element={<UpdatePassword />} />
            <Route path="/confidentialite"         element={<PrivacyPolicy />} />
            <Route path="/conditions-utilisation"  element={<TermsOfUse />} />

            {/* Inscription société de recyclage (publique) */}
            <Route path="/recyclage/inscription"   element={<RecyclageRegister />} />

            {/* Routes protégées */}
            <Route path="/citoyen" element={
              <ProtectedRoute allowedRoles={['citoyen', 'etablissement']}>
                <CitoyenDashboard />
              </ProtectedRoute>
            } />

            <Route path="/recyclage" element={
              <ProtectedRoute allowedRoles={['societe_recyclage']}>
                <RecyclageDashboard />
              </ProtectedRoute>
            } />

            <Route path="/cet" element={
              <ProtectedRoute allowedRoles={['cet']}>
                <CETDashboard />
              </ProtectedRoute>
            } />

            {/* Future routes */}
            {/* <Route path="/mobilier" element={<ProtectedRoute allowedRoles={['mobilier_urbain']}><MobilierDashboard /></ProtectedRoute>} /> */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/commune/dashboard" element={<ProtectedRoute allowedRoles={['commune']}><CommuneDashboard /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import BikeManagement from './pages/BikeManagement';
import ActiveRentals from './pages/ActiveRentals';
import DepositManagement from './pages/DepositManagement';
import StoreUsers from './pages/StoreUsers';
import './index.css';

function ProtectedRoute({ children }) {
  const { employee, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  return employee ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { employee, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  return employee ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/customers" element={<StoreUsers />} />
        <Route path="/bikes" element={<BikeManagement />} />
        <Route path="/rentals" element={<ActiveRentals />} />
        <Route path="/deposits" element={<DepositManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' },
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

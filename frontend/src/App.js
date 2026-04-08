import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupPIN from './pages/SetupPIN';
import ForgotPassword from './pages/ForgotPassword';
import DashboardV2 from './pages/DashboardV2';
import Profile from './pages/Profile';
import Transactions from './pages/Transactions';
import Referrals from './pages/Referrals';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import '@/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/setup-pin"
            element={
              <ProtectedRoute>
                <SetupPIN />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardV2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute requirePin>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <Referrals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

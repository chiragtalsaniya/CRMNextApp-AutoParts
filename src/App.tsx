import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/Auth/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { Stores } from './pages/Stores';
import { Users } from './pages/Users';
import { Retailers } from './pages/Retailers';
import { Regions } from './pages/Regions';
import { Parts } from './pages/Parts';
import { Orders } from './pages/Orders';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Unauthorized } from './pages/Unauthorized';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
      />
      
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Navigate to="/dashboard" replace />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'storeman']}>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/companies" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <DashboardLayout>
            <Companies />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/stores" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
          <DashboardLayout>
            <Stores />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/retailers" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
          <DashboardLayout>
            <Retailers />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/regions" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
          <DashboardLayout>
            <Regions />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/parts" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'storeman']}>
          <DashboardLayout>
            <Parts />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'storeman']}>
          <DashboardLayout>
            <Orders />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'storeman']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
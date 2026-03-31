import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TodoProvider } from './context/TodoContext';
import { KpiProvider } from './context/KpiContext';
import { CoupleProvider } from './context/CoupleContext';
import { VendorProvider } from './context/VendorContext';
import { FinanceProvider } from './context/FinanceContext';
import { NotificationsProvider } from './context/NotificationsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CoupleList from './pages/CoupleList';
import TodoList from './pages/TodoList';
import VendorPartners from './pages/VendorPartners';
import Budget from './pages/Budget';
import Notifications from './pages/Notifications';

export default function App() {
  const bypassDashboard =
    import.meta.env.VITE_BYPASS_DASHBOARD === 'true' ||
    (typeof window !== 'undefined' &&
      localStorage.getItem('BYPASS_DASHBOARD') === 'true');

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <TodoProvider>
            <KpiProvider>
              <CoupleProvider>
                <VendorProvider>
                  <FinanceProvider>
                    <BrowserRouter>
              {bypassDashboard ? (
                <Routes>
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              ) : (
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="couples" element={<CoupleList />} />
                    <Route path="todos" element={<TodoList />} />
                    <Route path="vendors" element={<VendorPartners />} />
                    <Route path="budget" element={<Budget />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              )}
            </BrowserRouter>
                  </FinanceProvider>
                </VendorProvider>
              </CoupleProvider>
            </KpiProvider>
          </TodoProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
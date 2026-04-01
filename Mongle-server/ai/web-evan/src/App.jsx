import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TodoProvider } from './context/TodoContext';
import { NotificationsProvider } from './context/NotificationsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoupleList = lazy(() => import('./pages/CoupleList'));
const TodoList = lazy(() => import('./pages/TodoList'));
const VendorPartners = lazy(() => import('./pages/VendorPartners'));
const Budget = lazy(() => import('./pages/Budget'));
const Notifications = lazy(() => import('./pages/Notifications'));

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg-color)',
        color: 'var(--text-muted)',
      }}
    >
      페이지를 불러오는 중입니다.
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <TodoProvider>
            <Suspense fallback={<RouteFallback />}>
              <BrowserRouter>
                <Routes>
                  {/* Public auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Protected admin routes */}
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
              </BrowserRouter>
            </Suspense>
          </TodoProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

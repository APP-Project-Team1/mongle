import React, { createContext, useContext, useState, useCallback } from 'react';

// 더미 사용자 DB (localStorage 기반)
const USERS_KEY = 'mongle_users';
const SESSION_KEY = 'mongle_session';

const defaultUsers = [
  { id: '1', email: 'admin@mongle.com', password: 'admin1234', name: '수진' },
];

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : defaultUsers;
  } catch {
    return defaultUsers;
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((email, password) => {
    const users = loadUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    const session = { id: found.id, email: found.email, name: found.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true };
  }, []);

  const register = useCallback((email, password, name) => {
    const users = loadUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, error: '이미 사용 중인 이메일입니다.' };
    }
    const newUser = { id: String(Date.now()), email, password, name };
    const updated = [...users, newUser];
    saveUsers(updated);
    return { ok: true };
  }, []);

  const resetPassword = useCallback((email, newPassword) => {
    const users = loadUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) return { ok: false, error: '사용자를 찾을 수 없습니다.' };
    users[idx] = { ...users[idx], password: newPassword };
    saveUsers(users);
    return { ok: true };
  }, []);

  const findUserByEmail = useCallback((email) => {
    const users = loadUsers();
    return users.find(u => u.email === email) || null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  // 개발용 임시 로그인
  const devLogin = useCallback(() => {
    const session = { id: '1', email: 'admin@mongle.com', name: '수진' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, resetPassword, findUserByEmail, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
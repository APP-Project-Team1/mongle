import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  IoBriefcaseOutline,
  IoCheckboxOutline,
  IoGridOutline,
  IoLogOutOutline,
  IoMoonOutline,
  IoNotificationsOutline,
  IoPeopleOutline,
  IoSunnyOutline,
  IoWalletOutline,
} from 'react-icons/io5';
import Seo from '../components/common/Seo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useTheme } from '../context/ThemeContext';
import './AdminLayout.css';

const NAV_ITEMS = [
  { path: '/', label: '대시보드', icon: <IoGridOutline size={20} /> },
  { path: '/couples', label: '커플 목록', icon: <IoPeopleOutline size={20} /> },
  { path: '/todos', label: '오늘 할 일', icon: <IoCheckboxOutline size={20} /> },
  { path: '/vendors', label: '협력 업체', icon: <IoBriefcaseOutline size={20} /> },
  { path: '/budget', label: '비용 현황', icon: <IoWalletOutline size={20} /> },
];

export default function AdminLayout() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-container">
      <Seo title="몽글 플래너 관리자" />

      <aside className="sidebar" aria-label="관리자 사이드바">
        <div className="sidebar-header">
          <h1 className="logo">Mongle</h1>
          <div className="planner-badge">
            <IoBriefcaseOutline size={12} color="var(--text-muted)" />
            <span>{user?.name ?? '플래너'} 님</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          aria-label="로그아웃"
          type="button"
        >
          <IoLogOutOutline size={18} />
          <span>로그아웃</span>
        </button>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left" />
          <div className="topbar-right">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
              type="button"
            >
              {isDarkMode ? (
                <IoSunnyOutline size={20} color="var(--text-main)" />
              ) : (
                <IoMoonOutline size={20} color="var(--text-main)" />
              )}
            </button>

            <button
              className="icon-btn"
              onClick={() => navigate('/notifications')}
              aria-label={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '알림'}
              type="button"
            >
              <IoNotificationsOutline size={20} color="var(--text-main)" />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
          </div>
        </header>

        <main className="main-content scroll-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { 
  IoGridOutline, 
  IoPeopleOutline, 
  IoNotificationsOutline, 
  IoCheckboxOutline, 
  IoWalletOutline,
  IoBriefcaseOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoLogOutOutline,
} from 'react-icons/io5';
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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">Mongle</h1>
          <div className="planner-badge">
            <IoBriefcaseOutline size={12} color="var(--text-muted)" />
            <span>{user?.name ?? '플래너'} 님</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              end={item.path === '/'}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout-btn" onClick={handleLogout} title="로그아웃">
          <IoLogOutOutline size={18} />
          <span>로그아웃</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            {/* Breadcrumbs or title */}
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={toggleTheme} title="다크 모드 전환">
              {isDarkMode ? <IoSunnyOutline size={20} color="var(--text-main)" /> : <IoMoonOutline size={20} color="var(--text-main)" />}
            </button>
            
            <button className="icon-btn" onClick={() => navigate('/notifications')} title="알림">
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
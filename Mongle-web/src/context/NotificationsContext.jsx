import React, { createContext, useContext, useState } from 'react';

const NOTIF_DATA = [
  {
    id: '1',
    iconType: 'doc',
    iconBg: 'var(--stage-4-bg)',
    title: '새로운 예약 확정',
    body: '이수아·한재원 커플의 스튜디오 예약이 확정되었습니다.',
    time: '방금 전',
    isRead: false,
  },
  {
    id: '2',
    iconType: 'bell',
    iconBg: 'var(--stage-2-bg)',
    title: '잔금 안내',
    body: '박지수·이현우 커플의 웨딩홀 잔금 결제일이 3일 남았습니다.',
    time: '2시간 전',
    isRead: false,
  },
  {
    id: '3',
    iconType: 'check',
    iconBg: 'var(--bg-tertiary)',
    title: '투어 완료',
    body: '최민정·강태준 커플의 롯데호텔 잠실 웨딩홀 투어가 완료되었습니다.',
    time: '어제',
    isRead: true,
  },
];

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(NOTIF_DATA);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteNotif }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationsProvider>');
  return ctx;
}

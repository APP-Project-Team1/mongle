import React, { createContext, useContext, useState, useEffect } from 'react';

// ── 임시 데이터 (서버 연동 전까지 사용) ──────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    icon: 'alert-circle-outline',
    iconColor: '#c97b6e',
    iconBg: '#f9eeee',
    title: '드레스 피팅 일정 오늘 마감',
    body: '최민정·강태준 커플의 드레스 피팅 일정 조율이 아직 완료되지 않았어요.',
    time: '방금 전',
    isRead: false,
    ref: { type: 'todo', id: '2' },
  },
  {
    id: '2',
    icon: 'alert-circle-outline',
    iconColor: '#c97b6e',
    iconBg: '#f9eeee',
    title: '스튜디오 계약서 검토 오늘 마감',
    body: '윤서연·오민석 커플의 스튜디오 계약서 검토가 필요합니다.',
    time: '10분 전',
    isRead: false,
    ref: { type: 'todo', id: '3' },
  },
  {
    id: '3',
    icon: 'cash-outline',
    iconColor: '#b07840',
    iconBg: '#fdf6ee',
    title: '웨딩홀 잔금 납부 D-10',
    body: '박지수·이현우 커플의 더채플 청담 잔금 납부 기한이 4월 1일입니다.',
    time: '1시간 전',
    isRead: false,
    ref: { type: 'finance', id: '1' },
  },
  {
    id: '4',
    icon: 'calendar-outline',
    iconColor: '#7a9a5a',
    iconBg: '#eef4e8',
    title: '박지수·이현우 D-11',
    body: '결혼식이 11일 앞으로 다가왔어요. 최종 점검을 진행해 주세요.',
    time: '오늘 오전 9:00',
    isRead: true,
    ref: { type: 'couple', id: '1' },
  },
  {
    id: '5',
    icon: 'checkmark-circle-outline',
    iconColor: '#7a9a5a',
    iconBg: '#eef4e8',
    title: '청첩장 시안 확인 완료',
    body: '박지수·이현우 커플의 청첩장 시안이 최종 확인 처리되었습니다.',
    time: '어제',
    isRead: true,
    ref: { type: 'couple', id: '1' },
  },
  {
    id: '6',
    icon: 'person-add-outline',
    iconColor: '#917878',
    iconBg: '#f5f0f0',
    title: '새 커플 등록: 정하린·김도윤',
    body: '새 커플이 등록되었습니다. 진행 현황을 업데이트해 주세요.',
    time: '2일 전',
    isRead: true,
    ref: { type: 'couple', id: '4' },
  },
];
// ──────────────────────────────────────────────────────────

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // userId가 바뀔 때마다 해당 유저의 알림을 불러옴
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    fetchNotifications(userId);
  }, [userId]);

  const fetchNotifications = async (id) => {
    setLoading(true);
    try {
      // ── 서버 연동 시 아래 주석을 해제하고 MOCK 라인을 제거 ──
      // const res = await fetch(`/api/notifications?userId=${id}`);
      // const data = await res.json();
      // setNotifications(data.notifications);

      // 임시: mock 데이터 사용
      setNotifications(MOCK_NOTIFICATIONS);
    } catch (e) {
      console.error('알림 fetch 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    // 서버 연동 시:
    // await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    // 서버 연동 시:
    // await fetch('/api/notifications/read-all', { method: 'PATCH', body: JSON.stringify({ userId }) });
  };

  const deleteNotif = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // 서버 연동 시:
    // await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        setUserId, // 로그인 시 호출
        markAsRead,
        markAllRead,
        deleteNotif,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications는 NotificationProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. 서버에서 알림 목록 가져오기 (초기 로드)
  const fetchNotifications = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      console.error('알림 fetch 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. 실시간 새 알림 추가 함수 (app/_layout.jsx에서 호출됨)
  const addRealtimeNotification = useCallback((newNoti) => {
    setNotifications((prev) => [newNoti, ...prev]);
  }, []);

  // 3. 알림 읽음 처리 (DB 업데이트 + 로컬 상태 반영)
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // 로컬 상태에서도 읽음 처리 반영
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error('읽음 처리 실패:', e);
    }
  };

  // 4. 모든 알림 읽음 처리
  const markAllRead = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error('전체 읽음 처리 실패:', e);
    }
  };

  // 5. 알림 삭제
  const deleteNotif = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (e) {
      console.error('알림 삭제 실패:', e);
    }
  };

  // 유저 ID가 설정되면 알림 데이터를 불러옴
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    } else {
      setNotifications([]);
    }
  }, [userId, fetchNotifications]);

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        setUserId,
        addRealtimeNotification,
        markAsRead,
        markAllRead,
        deleteNotif,
        refresh: () => fetchNotifications(userId),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications는 NotificationProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
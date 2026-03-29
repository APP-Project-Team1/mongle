// app/_layout.jsx
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { fetchUserRole } from '../lib/auth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';



// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 10, // 10분
    },
  },
});

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setUserId, addRealtimeNotification } = useNotifications();

  // 1. 역할 로드 로직 (기존 동일)
  const loadRole = async (userId) => {
    try {
      const profile = await fetchUserRole(userId);
      setRole(profile.role);
    } catch (e) {
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  // 2. 세션 감지 (기존 동일)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadRole(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadRole(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. 실시간 알림 구독 전용 useEffect
  useEffect(() => {
    let channel;
    if (session?.user?.id) {
      channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('새 알림 수신:', payload.new);
            addRealtimeNotification(payload.new);
          }
        ).subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [session?.user?.id]); // session.user.id가 바뀔 때만 재구독

  // 3. 경로 리다이렉트 로직 (최적화)
  useEffect(() => {
    if (loading) return;

    const rootSegment = segments[0] || '';
    const inAuthGroup = rootSegment === '(auth)';
    const inPlannerGroup = rootSegment === '(planner)';
    const inCoupleGroup = rootSegment === '(couple)';
    const inVendorsGroup = rootSegment === 'vendors';
    const inPlannersGroup = rootSegment === 'planners';

    // 비로그인 상태
    if (!session) {
      if (!inCoupleGroup && !inAuthGroup && !inVendorsGroup && !inPlannersGroup) {
        router.replace('/(couple)');
      }
    }
    // 로그인 상태
    else {
      if (role === 'planner') {
        if (!inPlannerGroup && !inCoupleGroup && !inVendorsGroup && !inPlannersGroup)
          router.replace('/(couple)');
      } else {
        // 일반 유저 혹은 역할 로딩 대기 중일 때 (기본은 couple)
        if (!inCoupleGroup && !inVendorsGroup && !inPlannersGroup) router.replace('/(couple)');
      }
    }
  }, [session, role, loading, segments]);


  // 로딩 중일 때 보여줄 화면
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        {/* 서비스 메인 컬러에 맞게 색상을 조절하세요 */}
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, role }}>
      <Slot />
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NotificationProvider>
          <StatusBar style="dark" />
          <AuthGate />
        </NotificationProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // 앱 배경색과 맞추면 더 자연스럽습니다.
  },
});

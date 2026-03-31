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
  const [isReady, setIsReady] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const { setUserId } = useNotifications();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. 세션 가져오기
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          // 2. 로그인된 경우 역할 확인
          const profile = await fetchUserRole(session.user.id);
          setRole(profile?.role || null);
          setUserId(session.user.id);
          setProfile(profile);
        }
      } catch (e) {
        console.error('초기화 에러:', e);
      } finally {
        setIsReady(true);
      }
    };

    initialize();

    // 인증 상태 변경 감시
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      try {
        if (session) {
          const profile = await fetchUserRole(session.user.id);
          setProfile(profile);
          setRole(profile?.role || null);
          setUserId(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
          setUserId(null);
        }
      } catch (e) {
        console.error('onAuthStateChange fetchUserRole 에러:', e);
        setRole(null);
      } finally {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (registrationPending) return;

    const rootSegment = segments[0] || '';
    const inAuthGroup = rootSegment === '(auth)';
    const inPlannerGroup = rootSegment === '(planner)';
    const inCoupleGroup = rootSegment === '(couple)';
    const inSettingsGroup = rootSegment === 'settings';

    // A. 비로그인 상태
    if (!session) {
      if (!inAuthGroup && !inCoupleGroup) {
        router.replace('/(couple)');
      }
    }
    // B. 로그인 상태
    else {
      // 프로필이 없으면(회원가입 OTP 인증 중 임시 세션 등) 리디렉션하지 않음
      if (role === null) return;
      // 설정 화면(이용약관, 개인정보 처리방침 등)은 리디렉션하지 않음
      if (inSettingsGroup) return;

      if (role === 'planner') {
        // 플래너인데 플래너 그룹에 없으면 대시보드로!
        if (!inPlannerGroup) {
          router.replace('/(planner)/dashboard');
        }
      } else {
        // 커플인데 커플 그룹에 없으면 커플 메인으로!
        if (!inCoupleGroup) {
          router.replace('/(couple)');
        }
      }
    }
  }, [session, role, isReady, segments, registrationPending]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        registrationPending,
        setRegistrationPending,
        planner_id: profile?.planner_id ?? null,
        couple_id: profile?.couple_id ?? null,
      }}
    >
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
    backgroundColor: '#FFFFFF',
  },
});

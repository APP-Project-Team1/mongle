import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { fetchUserRole } from '../lib/auth';
import { resolveCoupleContext } from '../lib/coupleIdentity';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

async function resolveProfileWithFallback(sessionUserId) {
  const profile = await fetchUserRole(sessionUserId);
  if (!profile || profile.role !== 'couple') return profile;

  const coupleContext = await resolveCoupleContext(sessionUserId, profile.couple_id ?? null);
  return {
    ...profile,
    couple_id: coupleContext.coupleId ?? profile.couple_id ?? null,
    planner_id: profile.planner_id ?? coupleContext.plannerId ?? null,
  };
}

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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          const resolvedProfile = await resolveProfileWithFallback(session.user.id);
          setRole(resolvedProfile?.role || null);
          setUserId(session.user.id);
          setProfile(resolvedProfile);
        }
      } catch (e) {
        console.error('초기화 오류:', e);
      } finally {
        setIsReady(true);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      try {
        if (session) {
          const resolvedProfile = await resolveProfileWithFallback(session.user.id);
          setProfile(resolvedProfile);
          setRole(resolvedProfile?.role || null);
          setUserId(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
          setUserId(null);
        }
      } catch (e) {
        console.error('onAuthStateChange fetchUserRole 오류:', e);
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

    if (!session) {
      if (!inAuthGroup && !inCoupleGroup) {
        router.replace('/(couple)');
      }
    } else {
      if (role === null) return;
      if (inSettingsGroup) return;

      if (role === 'planner') {
        if (!inPlannerGroup) {
          router.replace('/(planner)/dashboard');
        }
      } else if (!inCoupleGroup) {
        router.replace('/(couple)');
      }
    }
  }, [session, role, isReady, segments, registrationPending]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
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

// lib/auth.js
import { supabase } from './supabase';

// 이메일 중복 확인 (Supabase RPC: check_email_available)
export const checkEmailAvailable = async (email) => {
  const { data, error } = await supabase.rpc('check_email_available', {
    check_email: email.toLowerCase(),
  });
  if (error) throw error;
  return data; // true = 사용 가능, false = 이미 사용 중
};

// 회원가입 후 이메일 인증 코드 검증
export const verifySignupOtp = async (email, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });
  if (error) throw error;
  if (!data?.user) throw new Error('인증번호가 올바르지 않거나 만료되었습니다.');
  return data;
};

// 플래너로 가입
export const signUpPlanner = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'planner' },
    },
  });
  if (error) throw error;
  return data;
};

// 커플로 가입
export const signUpCouple = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'couple' },
    },
  });
  if (error) throw error;
  return data;
};

// 로그인
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

// 로그아웃
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getPostAuthRoute = (role) => {
  if (role === 'planner') return '/(planner)/dashboard';
  return '/(couple)';
};

// 로그인 유저의 역할 조회
export const fetchUserRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, planner_id, couple_id')
      .eq('id', userId)
      .limit(1);
    if (error) {
      // PGRST116: 0 rows - not an error for us
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    if (err?.code === 'PGRST116') return null;
    throw err;
  }
};

export const resolveAuthRole = async (session, fallbackRole = null) => {
  const metadataRole = session?.user?.user_metadata?.role ?? fallbackRole ?? null;
  const userId = session?.user?.id;

  if (!userId) {
    return metadataRole;
  }

  try {
    const profile = await fetchUserRole(userId);
    return profile?.role ?? metadataRole;
  } catch (_error) {
    return metadataRole;
  }
};

export const waitForResolvedAuth = async ({ expectedRole = null, timeoutMs = 3000, pollMs = 150 } = {}) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const resolvedRole = await resolveAuthRole(session, expectedRole);

    if (session && resolvedRole) {
      return {
        session,
        role: resolvedRole,
        route: getPostAuthRoute(resolvedRole),
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const resolvedRole = await resolveAuthRole(session, expectedRole);

  return {
    session,
    role: resolvedRole,
    route: getPostAuthRoute(resolvedRole ?? expectedRole),
  };
};

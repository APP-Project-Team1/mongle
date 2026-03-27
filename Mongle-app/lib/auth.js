// lib/auth.js
import { supabase } from './supabase';

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

// 로그인 유저의 역할 조회
export const fetchUserRole = async (userId) => {
  // 1. 프로필 테이블에서 기본 정보(닉네임 등) 조회
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nickname, avatar_url')
    .eq('id', userId)
    .single();
  
  // 2. Auth 메타데이터에서 역할 조회 ( profiles 테이블에 role이 없을 경우 대비 )
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || 'couple';

  if (profileError && profileError.code !== 'PGRST116') throw profileError;
  
  return {
    ...profile,
    role: role
  };
};

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
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role, planner_id, couple_id')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

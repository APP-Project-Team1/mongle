import { supabase } from './supabase';

export async function resolveCoupleContext(sessionUserId, profileCoupleId = null) {
  if (!sessionUserId) {
    return { coupleId: null, plannerId: null, couple: null };
  }

  if (profileCoupleId) {
    const { data, error } = await supabase
      .from('couples')
      .select('id, planner_id, groom_name, bride_name, wedding_date, user_id')
      .eq('id', profileCoupleId)
      .maybeSingle();

    if (error) throw error;

    return {
      coupleId: data?.id ?? profileCoupleId,
      plannerId: data?.planner_id ?? null,
      couple: data ?? null,
    };
  }

  const { data, error } = await supabase
    .from('couples')
    .select('id, planner_id, groom_name, bride_name, wedding_date, user_id')
    .eq('user_id', sessionUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return {
    coupleId: data?.id ?? null,
    plannerId: data?.planner_id ?? null,
    couple: data ?? null,
  };
}

import { supabase } from './supabase';

export async function resolveCoupleContext(sessionUserId, profileCoupleId = null, userEmail = null) {
  if (!sessionUserId) {
    return { coupleId: null, plannerId: null, couple: null };
  }

  let profileCouple = null;
  if (profileCoupleId) {
    const { data: profileData, error: profileError } = await supabase
      .from('couples')
      .select('id, planner_id, groom_name, bride_name, wedding_date, user_id, email, total_amount, created_at')
      .eq('id', profileCoupleId)
      .maybeSingle();

    if (profileError) throw profileError;
    profileCouple = profileData ?? null;
  }

  const { data, error } = await supabase
    .from('couples')
    .select('id, planner_id, groom_name, bride_name, wedding_date, user_id, email, total_amount, created_at')
    .eq('user_id', sessionUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data?.id) {
    return {
      coupleId: data.id,
      plannerId: data.planner_id ?? null,
      couple: data,
    };
  }

  if (userEmail) {
    const { data: emailData, error: emailError } = await supabase
      .from('couples')
      .select('id, planner_id, groom_name, bride_name, wedding_date, user_id, email, total_amount, created_at')
      .eq('email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emailError) throw emailError;

    if (emailData?.id) {
      return {
        coupleId: emailData.id,
        plannerId: emailData.planner_id ?? null,
        couple: emailData,
      };
    }
  }

  return {
    coupleId: profileCouple?.id ?? profileCoupleId ?? null,
    plannerId: profileCouple?.planner_id ?? null,
    couple: profileCouple ?? null,
  };
}

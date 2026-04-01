import { supabase } from '../lib/supabase';

export function initAuthListener(onChange) {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (onChange) {
        onChange({ event, session });
      }
    }
  );

  return () => {
    listener?.subscription?.unsubscribe();
  };
}
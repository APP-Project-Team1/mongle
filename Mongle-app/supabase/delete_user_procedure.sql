CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  -- auth.uid() 함수를 통해 현재 로그인한 사용자의 ID를 가져와서 삭제합니다.
  -- Supabase에서는 auth.users 에서 사용자를 삭제하면 연결된 다른 데이터(ON DELETE CASCADE 설정된 경우)도 자동으로 삭제될 수 있습니다.
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

from app.db.supabase import supabase

# Projects 테이블 생성 SQL
create_projects_table_sql = """
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
"""

try:
    # 테이블 존재 여부 확인
    result = supabase.table("projects").select("*").limit(1).execute()
    print("Projects 테이블이 이미 존재합니다.")
except Exception as e:
    print(f"테이블 확인 오류: {e}")
    print("Supabase 대시보드에서 다음 SQL을 실행하세요:")
    print(create_projects_table_sql)
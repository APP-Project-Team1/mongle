from app.db.supabase import supabase

# Vendors 테이블 생성 SQL (모든 필드 포함)
create_table_sql = """
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    kakao_id TEXT UNIQUE,
    name TEXT,
    category TEXT,
    region TEXT,
    phone TEXT,
    url TEXT,
    lat FLOAT,
    lng FLOAT,
    raw_category TEXT,
    style TEXT[],  -- PostgreSQL array
    district TEXT,
    price_min INTEGER,
    price_max INTEGER,
    description TEXT,
    rating FLOAT,
    review_count INTEGER
);
"""

try:
    result = supabase.table("vendors").select("*").limit(1).execute()
    print("Vendors 테이블이 이미 존재합니다.")
    print("필요 시 Supabase 대시보드에서 테이블을 드롭하고 다시 생성하세요.")
    print("SQL:")
    print(create_table_sql)
except Exception as e:
    print(f"테이블 확인 오류: {e}")
    print("Supabase 대시보드에서 다음 SQL을 실행하세요:")
    print(create_table_sql)
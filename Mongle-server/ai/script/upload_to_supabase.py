from supabase import create_client
import json
import os
from dotenv import load_dotenv
from pathlib import Path

# .env 경로 명시
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# labeled_vendors.json 경로 명시
labeled_path = Path(__file__).parent.parent.parent / "labeled_vendors.json"

with open(labeled_path, encoding="utf-8") as f:
    vendors = json.load(f)

print(f"총 {len(vendors)}개 업로드 시작")

chunk_size = 100
for i in range(0, len(vendors), chunk_size):
    chunk = vendors[i:i+chunk_size]
    result = supabase.table("vendors").insert(chunk).execute()
    print(f"{min(i+chunk_size, len(vendors))}/{len(vendors)}개 업로드 완료")

print("전체 업로드 완료")
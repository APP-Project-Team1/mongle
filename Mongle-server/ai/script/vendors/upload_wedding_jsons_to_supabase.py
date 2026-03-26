# upload_wedding_jsons_to_supabase.py
import json
import os
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL 또는 SUPABASE_KEY가 .env에 없습니다.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE_DIR = Path("./vendors")

FILE_TABLE_MAP = {
    "hall_vendors.json": "hall_vendors",
    "studio_vendors.json": "studio_vendors",
    "dress_vendors.json": "dress_vendors",
    "makeup_vendors.json": "makeup_vendors",
    "package_vendors.json": "package_vendors",
    "video_snap_vendors.json": "video_snap_vendors",
    "wedding_planners.json": "wedding_planners",
}

BATCH_SIZE = 200


def load_json_file(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"{path.name} 파일은 JSON 배열이어야 합니다.")
    return data


def build_search_text_for_planner(row: Dict[str, Any]) -> str:
    specialties = ", ".join(row.get("specialties", []))
    styles = ", ".join(row.get("style_keywords", []))
    regions = ", ".join(row.get("activity_regions", []))
    included = ", ".join(row.get("service_scope", {}).get("included", []))

    return (
        f"{row.get('name', '')}은/는 {row.get('brand_name', '')} 소속 {row.get('title', '')}입니다. "
        f"한 줄 소개는 '{row.get('one_liner', '')}'이며, 전문 분야는 {specialties}입니다. "
        f"스타일 키워드는 {styles}, 활동 지역은 {regions}, "
        f"기본 가격은 {row.get('base_price_krw', 0)}원입니다. "
        f"제공 범위에는 {included}가 포함됩니다."
    ).strip()


def transform_vendor_row(row: Dict[str, Any]) -> Dict[str, Any]:
    basic_info = row.get("basic_info", {})
    search_filters = row.get("search_filters", {})
    content = row.get("content", {})

    return {
        "vendor_id": basic_info.get("vendor_id"),
        "source": basic_info.get("source"),
        "source_id": basic_info.get("source_id"),
        "name": basic_info.get("name"),
        "category": basic_info.get("category"),
        "raw_category": basic_info.get("raw_category"),
        "region": basic_info.get("region"),
        "district": basic_info.get("district"),
        "neighborhood": basic_info.get("neighborhood"),
        "address": basic_info.get("address"),
        "road_address": basic_info.get("road_address"),
        "phone": basic_info.get("phone"),
        "website_url": basic_info.get("website_url"),
        "source_url": basic_info.get("source_url"),
        "lat": basic_info.get("lat"),
        "lng": basic_info.get("lng"),
        "status": basic_info.get("status"),
        "price_level": search_filters.get("price_level"),
        "rating_avg": content.get("rating_avg"),
        "review_count": content.get("review_count", 0),
        "search_text": content.get("search_text"),
        "basic_info": basic_info,
        "search_filters": search_filters,
        "details": row.get("details", {}),
        "pricing": row.get("pricing", {}),
        "content": content,
        "quality_control": row.get("quality_control", {}),
    }


def transform_planner_row(row: Dict[str, Any], idx: int) -> Dict[str, Any]:
    planner_key = f"{row.get('name', '').strip()}::{row.get('brand_name', '').strip()}::{idx}"

    return {
        "planner_key": planner_key,
        "name": row.get("name"),
        "brand_name": row.get("brand_name"),
        "title": row.get("title"),
        "profile_image_url": row.get("profile_image_url"),
        "one_liner": row.get("one_liner"),
        "career_years": row.get("career_years"),
        "weddings_completed": row.get("weddings_completed"),
        "rating": row.get("rating"),
        "base_price_krw": row.get("base_price_krw"),
        "cta": row.get("cta"),
        "created_at_source": row.get("created_at"),
        "search_text": build_search_text_for_planner(row),
        "specialties": row.get("specialties", []),
        "style_keywords": row.get("style_keywords", []),
        "major_experiences": row.get("major_experiences", []),
        "reviews": row.get("reviews", []),
        "service_scope": row.get("service_scope", {}),
        "portfolio_images": row.get("portfolio_images", []),
        "service_features": row.get("service_features", []),
        "activity_regions": row.get("activity_regions", []),
        "raw_data": row,
    }


def chunked(items: List[Dict[str, Any]], size: int) -> List[List[Dict[str, Any]]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


def upload_rows(table_name: str, rows: List[Dict[str, Any]], conflict_column: str) -> None:
    if not rows:
        print(f"[SKIP] {table_name}: 업로드할 데이터 없음")
        return

    batches = chunked(rows, BATCH_SIZE)
    for i, batch in enumerate(batches, start=1):
        # upsert: 기존 데이터 있으면 업데이트, 없으면 삽입
        supabase.table(table_name).upsert(batch, on_conflict=conflict_column).execute()
        print(f"[OK] {table_name}: batch {i}/{len(batches)} 업로드 완료 ({len(batch)} rows)")


def main() -> None:
    for filename, table_name in FILE_TABLE_MAP.items():
        file_path = BASE_DIR / filename
        if not file_path.exists():
            print(f"[WARN] 파일 없음: {filename}")
            continue

        raw_rows = load_json_file(file_path)

        if table_name == "wedding_planners":
            rows = [transform_planner_row(row, idx) for idx, row in enumerate(raw_rows)]
            conflict_column = "planner_key"
        else:
            rows = [transform_vendor_row(row) for row in raw_rows]
            conflict_column = "vendor_id"

        upload_rows(table_name, rows, conflict_column)

    print("모든 업로드 완료")


if __name__ == "__main__":
    main()
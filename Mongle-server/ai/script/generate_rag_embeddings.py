import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

load_dotenv()

# --- 설정 ---
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY"),
)

EMBED_MODEL = "text-embedding-3-small"
BATCH_SIZE = 50

SOURCE_TABLES = [
    "hall_vendors",
    "studio_vendors",
    "dress_vendors",
    "makeup_vendors",
    "package_vendors",
    "video_snap_vendors",
    "wedding_planners",
]


# --- 문서 생성 ---
def build_doc(row: Dict[str, Any], table: str) -> Dict[str, Any]:

    if table == "wedding_planners":
        return {
            "source_table": table,
            "source_id": row.get("planner_key"),
            "category": "planner",
            "title": row.get("name"),
            "content": f"""
플래너명: {row.get('name')}
브랜드: {row.get('brand_name')}
소개: {row.get('one_liner')}
경력: {row.get('career_years')}년
웨딩수: {row.get('weddings_completed')}
가격: {row.get('base_price_krw')}원
스타일: {', '.join(row.get('style_keywords', []) or [])}
지역: {', '.join(row.get('activity_regions', []) or [])}
            """,
            "metadata": {
                "category": "planner",
                "region": row.get("activity_regions"),
                "price": row.get("base_price_krw"),
            },
        }

    # 일반 vendor
    basic = row.get("basic_info", {})
    filters = row.get("search_filters", {})
    content = row.get("content", {})

    return {
        "source_table": table,
        "source_id": basic.get("vendor_id"),
        "category": basic.get("category"),
        "title": basic.get("name"),
        "content": f"""
업체명: {basic.get('name')}
카테고리: {basic.get('category')}
지역: {basic.get('district')} {basic.get('neighborhood')}
설명: {content.get('short_description')}
가격레벨: {filters.get('price_level')}
평점: {content.get('rating_avg')}
리뷰수: {content.get('review_count')}
특징: {content.get('tags')}
        """,
        "metadata": {
            "category": basic.get("category"),
            "district": basic.get("district"),
            "price_level": filters.get("price_level"),
        },
    }


# --- 임베딩 생성 ---
def get_embeddings(texts: List[str]) -> List[List[float]]:
    res = openai_client.embeddings.create(
        model=EMBED_MODEL,
        input=texts,
    )
    return [d.embedding for d in res.data]


# --- 데이터 가져오기 ---
def fetch_all(table: str) -> List[Dict[str, Any]]:
    result = supabase.table(table).select("*").execute()
    return result.data or []


# --- 업로드 ---
def upload_docs(docs: List[Dict[str, Any]]):

    for i in range(0, len(docs), BATCH_SIZE):
        batch = docs[i:i+BATCH_SIZE]

        texts = [d["content"] for d in batch]
        embeddings = get_embeddings(texts)

        payload = []
        for d, emb in zip(batch, embeddings):
            payload.append({
                "source_table": d["source_table"],
                "source_id": d["source_id"],
                "category": d["category"],
                "title": d["title"],
                "content": d["content"],
                "metadata": d["metadata"],
                "embedding": emb,
            })

        supabase.table("rag_documents").upsert(
            payload,
            on_conflict="source_table,source_id"
        ).execute()

        print(f"업로드 완료: {i} ~ {i+len(batch)}")


# --- 실행 ---
def main():

    all_docs = []

    for table in SOURCE_TABLES:
        rows = fetch_all(table)
        print(f"{table}: {len(rows)}개")

        for r in rows:
            doc = build_doc(r, table)
            if doc["source_id"]:
                all_docs.append(doc)

    print(f"총 문서 수: {len(all_docs)}")

    upload_docs(all_docs)

    print("RAG 임베딩 완료 🚀")


if __name__ == "__main__":
    main()
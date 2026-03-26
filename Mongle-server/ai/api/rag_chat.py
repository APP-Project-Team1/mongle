from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from supabase import create_client
import os
import json
import asyncio

router = APIRouter()

VENDOR_DELIMITER = '\n---VENDORS_JSON---\n'

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

DISTRICT_MAP = {
    "강남": "강남구",
    "서초": "서초구",
    "송파": "송파구",
    "마포": "마포구",
    "종로": "종로구",
    "용산": "용산구",
    "강서": "강서구",
    "영등포": "영등포구",
    "구로": "구로구",
    "성동": "성동구",
    "중구": "중구",
    "광진": "광진구",
    "동작": "동작구",
    "관악": "관악구",
    "은평": "은평구",
    "노원": "노원구",
    "강동": "강동구",
}

CATEGORY_ALIAS = {
    "웨딩홀": "wedding_hall",
    "예식장": "wedding_hall",
    "호텔 웨딩홀": "wedding_hall",
    "호텔식 웨딩홀": "wedding_hall",
    "호텔": "wedding_hall",
    "스튜디오": "studio",
    "드레스": "dress",
    "메이크업": "makeup",
    "스드메": "package",
    "패키지": "package",
    "영상": "video_snap",
    "스냅": "video_snap",
    "플래너": "planner",
}


async def extract_filters(message: str) -> dict:
    try:
        res = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """
사용자 질문에서 웨딩 검색 필터를 JSON으로 추출해라.

가능한 필드:
- district (예: 강남구)
- category (wedding_hall, studio, dress, makeup, package, video_snap, planner)
- price_level (low, mid, mid_high, high, premium)

규칙:
- JSON만 반환
- 값이 불명확하면 해당 키는 생략
- category는 질문에 명확히 드러날 때만 넣어라
"""
                },
                {"role": "user", "content": message}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        print(f"Filter extraction error: {e}")
        return {}


def normalize_filters(message: str, filter_dict: dict) -> dict:
    normalized = dict(filter_dict or {})

    for short, full in DISTRICT_MAP.items():
        if short in message:
            normalized["district"] = full
            break

    if "category" not in normalized:
        for keyword, category in CATEGORY_ALIAS.items():
            if keyword in message:
                normalized["category"] = category
                break

    return normalized


def build_context(docs: list) -> str:
    lines = []
    for i, d in enumerate(docs, start=1):
        md = d.get("metadata", {}) or {}
        lines.append(
            f"{i}. 업체명: {d.get('title', '')}\n"
            f"카테고리: {d.get('category', '')}\n"
            f"지역: {md.get('district', '')}\n"
            f"본문: {d.get('content', '')}\n"
        )
    return "\n\n".join(lines)


def build_search_filter(filter_dict: dict) -> dict:
    search_filter = {}
    category = filter_dict.get("category")
    if category:
        search_filter["category"] = category
    return search_filter


async def generate_rag_response(message: str):
    filter_dict = await extract_filters(message)
    filter_dict = normalize_filters(message, filter_dict)

    try:
        res_emb = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=message
        )
        embedding = res_emb.data[0].embedding
    except Exception as e:
        yield f"임베딩 생성 중 오류가 발생했습니다. ({str(e)})"
        return

    search_filter = build_search_filter(filter_dict)

    try:
        result = supabase.rpc(
            "match_documents",
            {
                "query_embedding": embedding,
                "match_threshold": 0,
                "match_count": 8,
                "filter": search_filter
            }
        ).execute()
        docs = result.data or []
    except Exception as e:
        print(f"Supabase RPC error: {e}")
        docs = []
    
    # 디버깅 로그
    print(f"RAW FILTER: {filter_dict}")
    print(f"SEARCH FILTER: {search_filter}")
    print(f"DOC COUNT: {len(docs)}")

    if docs:
        context = build_context(docs)
        system_content = """
너는 웨딩 업체 추천 AI다.
반드시 검색 결과에 포함된 업체만 추천해야 한다.
검색 결과가 있으면 "추천할 수 있는 업체가 없다", "정보가 없다" 같은 표현을 절대 쓰지 마라.

규칙:
1. 검색 결과에 있는 업체명만 사용한다.
2. 2~3개 업체를 추천하고, 각 업체의 지역/특징을 짧게 설명한다.
3. 마지막에 비교 포인트를 한 줄로 정리한다.
4. 검색 결과에 없는 실제 호텔명, 브랜드명, 일반 상식 업체명을 임의로 추가하지 마라.
5. 질문에 맞는 결과가 적으면 있는 범위 내에서만 추천하라.
6. 사용자가 지역을 말했으면 그 지역과 가까운 결과를 우선적으로 설명하라.
"""
        user_content = f"사용자 질문: {message}\n\n사용자 해석 필터: {json.dumps(filter_dict, ensure_ascii=False)}\n\n실제 검색에 사용한 필터: {json.dumps(search_filter, ensure_ascii=False)}\n\n검색 결과:\n{context}"
    else:
        system_content = """
너는 웨딩 업체 추천 AI다.
검색 결과가 없는 경우에만 추천 가능한 업체를 찾지 못했다고 짧게 말해라.
존재하지 않는 업체를 지어내지 마라.
그리고 지역, 예산, 스타일 중 하나를 더 알려달라고 안내해라.
"""
        user_content = f"사용자 질문: {message}\n\n사용자 해석 필터: {json.dumps(filter_dict, ensure_ascii=False)}\n\n실제 검색에 사용한 필터: {json.dumps(search_filter, ensure_ascii=False)}\n\n검색 결과: 없음"

    try:
        stream = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_content}
            ],
            stream=True
        )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        yield f"응답 생성 중 오류가 발생했습니다. ({str(e)})"

    # 앱에서 업체 목록을 렌더링할 수 있도록 JSON 구분자 추가
    if docs:
        yield VENDOR_DELIMITER
        yield json.dumps(docs, ensure_ascii=False)


@router.post("/chat")
async def rag_chat(req: dict):
    message = req.get("message", "")
    return StreamingResponse(generate_rag_response(message), media_type="text/event-stream")
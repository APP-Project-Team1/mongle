from openai import AsyncOpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()

VENDOR_DELIMITER = '\n---VENDORS_JSON---\n'

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_recommendation(message: str, vendors: list, history: list):
    """
    vendors 리스트를 받아서 스트리밍 응답 생성
    더미든 실제 DB든 상관없이 동일하게 작동
    """
    # history 항목을 안전하게 정제 (role/content 키가 있는 dict만 통과)
    safe_history = [
        {"role": str(m.get("role", "")), "content": str(m.get("content", ""))}
        for m in history
        if isinstance(m, dict)
        and m.get("role") in ("user", "assistant")
        and m.get("content", "").strip()
    ]

    messages = [
        {
            "role": "system",
            "content": (
                "너는 친절한 웨딩 플래너 AI야.\n"
                "아래 업체 목록에서 사용자에게 맞는 걸 추천해줘.\n"
                "없는 업체는 절대 만들어내지 마.\n\n"
                f"업체 목록:\n{json.dumps(vendors, ensure_ascii=False, indent=2)}"
            ),
        },
        *safe_history,
        {"role": "user", "content": message},
    ]

    try:
        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    except Exception as e:
        yield f"죄송합니다, 응답 생성 중 오류가 발생했습니다. ({type(e).__name__})"
        return

    if vendors:
        yield VENDOR_DELIMITER
        yield json.dumps(vendors, ensure_ascii=False)

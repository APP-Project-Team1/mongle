from openai import AsyncOpenAI
import json
import os

VENDOR_DELIMITER = '\n---VENDORS_JSON---\n'

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_recommendation(message: str, vendors: list, history: list):
    """
    vendors 리스트를 받아서 스트리밍 응답 생성
    더미든 실제 DB든 상관없이 동일하게 작동
    """
    messages = [
        {
            "role": "system",
            "content": f"""
너는 친절한 웨딩 플래너 AI야.
아래 업체 목록에서 사용자에게 맞는 걸 추천해줘.
없는 업체는 절대 만들어내지 마.

업체 목록:
{json.dumps(vendors, ensure_ascii=False, indent=2)}
"""
        },
        *history,
        {"role": "user", "content": message}
    ]

    stream = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

    if vendors:
        yield VENDOR_DELIMITER
        yield json.dumps(vendors, ensure_ascii=False)
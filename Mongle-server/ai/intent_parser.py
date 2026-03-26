from openai import AsyncOpenAI
import json
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def parse_intent(message: str) -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": """
사용자의 웨딩 메시지에서 검색 조건을 JSON으로 추출해.

반환 형식:
{
  "categories": ["studio", "dress", "makeup", "hall", "planner", "package", "video_snap"],
  "style": ["모던", "내추럴", "클래식", "럭셔리", "빈티지"],
  "region": null,
  "budget_max": null,
  "is_wedding_query": true
}

categories 설명:
- studio: 웨딩 스튜디오 (사진 촬영)
- dress: 웨딩 드레스
- makeup: 메이크업/헤어
- hall: 웨딩홀/예식장
- planner: 웨딩 플래너
- package: 스드메 패키지 (스튜디오+드레스+메이크업)
- video_snap: 본식스냅/영상 촬영
"""
            },
            {"role": "user", "content": message}
        ]
    )
    return json.loads(response.choices[0].message.content)
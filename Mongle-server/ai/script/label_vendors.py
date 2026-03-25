import os
os.environ["PYTHONIOENCODING"] = "utf-8"

from openai import OpenAI
import json
import time
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CATEGORY_MAP = {
    "서울 웨딩스튜디오": "studio",
    "서울 웨딩사진": "studio",
    "서울 스냅촬영": "studio",
    "서울 웨딩촬영": "studio",
    "서울 본식스냅": "studio",
    "서울 웨딩드레스": "dress",
    "서울 드레스샵": "dress",
    "서울 턱시도": "dress",
    "서울 한복대여": "dress",
    "서울 웨딩의상": "dress",
    "서울 웨딩메이크업": "makeup",
    "서울 웨딩헤어": "makeup",
    "서울 브라이덜샵": "makeup",
    "서울 신부화장": "makeup",
    "서울 웨딩뷰티": "makeup",
    "서울 웨딩홀": "hall",
    "서울 스몰웨딩": "hall",
    "서울 야외웨딩": "hall",
    "서울 호텔웨딩": "hall",
    "서울 하우스웨딩": "hall",
}

def label_vendor(vendor: dict) -> dict:
    prompt = f"""
아래 웨딩 업체 정보를 분석해서 JSON으로 반환해줘.

업체 정보:
- 이름: {vendor['name']}
- 카테고리: {vendor['raw_category']}
- 주소: {vendor['region']}

반환 형식:
{{
  "style": ["모던", "내추럴", "클래식", "럭셔리", "빈티지", "로맨틱"] 중 해당하는 것들,
  "district": "강남구" 처럼 구 이름만,
  "price_min": 예상 최소 가격 (만원, 모르면 null),
  "price_max": 예상 최대 가격 (만원, 모르면 null),
  "description": 업체 특징 한 줄 요약
}}

카테고리별 가격 참고:
- studio: 100~300만원
- dress: 50~200만원
- makeup: 20~80만원
- hall: 200~1000만원
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}]
    )

    labeled = json.loads(response.choices[0].message.content)

    return {
        **vendor,
        "style": labeled.get("style", []),
        "district": labeled.get("district", ""),
        "price_min": labeled.get("price_min"),
        "price_max": labeled.get("price_max"),
        "description": labeled.get("description", ""),
        "rating": None,
        "review_count": 0,
    }


if __name__ == "__main__":
    raw_path = Path(__file__).parent.parent.parent / "raw_vendors.json"
    labeled_path = Path(__file__).parent.parent.parent / "labeled_vendors.json"
    errors_path = Path(__file__).parent.parent.parent / "label_errors.json"

    with open(raw_path, encoding="utf-8") as f:
        raw_vendors = json.load(f)

    # 처음부터 시작
    labeled_vendors = []
    errors = []

    print(f"총 {len(raw_vendors)}개 레이블링 시작")

    for i, vendor in enumerate(raw_vendors):
        try:
            print(f"레이블링 중... {i+1}/{len(raw_vendors)} — {vendor['name']}")
            labeled = label_vendor(vendor)
            labeled_vendors.append(labeled)

        except Exception as e:
            print(f"  오류 발생: {vendor['name']} — {e}")
            errors.append({"vendor": vendor['name'], "error": str(e)})

        # 10개마다 중간 저장
        if (i + 1) % 10 == 0:
            with open(labeled_path, "w", encoding="utf-8") as f:
                json.dump(labeled_vendors, f, ensure_ascii=False, indent=2)
            print(f"  ---- 중간 저장 완료 ({i+1}/{len(raw_vendors)}) ----")

        time.sleep(0.5)

    # 최종 저장
    with open(labeled_path, "w", encoding="utf-8") as f:
        json.dump(labeled_vendors, f, ensure_ascii=False, indent=2)

    print(f"\n레이블링 완료: {len(labeled_vendors)}개")

    if errors:
        print(f"오류 발생: {len(errors)}개")
        with open(errors_path, "w", encoding="utf-8") as f:
            json.dump(errors, f, ensure_ascii=False, indent=2)
        print("label_errors.json 저장 완료")

    print("labeled_vendors.json 저장 완료")
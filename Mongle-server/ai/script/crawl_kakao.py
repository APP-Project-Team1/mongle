# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")
print(f"API 키 확인: {KAKAO_API_KEY}")

# 검색할 키워드 목록
KEYWORDS = {
    "studio": ["서울 웨딩스튜디오", "서울 웨딩사진", "서울 스냅촬영",
              "서울 웨딩촬영", "서울 본식스냅"],          # 2개 추가
    "dress":  ["서울 웨딩드레스", "서울 드레스샵", "서울 턱시도",
              "서울 한복대여", "서울 웨딩의상"],
    "makeup": ["서울 웨딩메이크업", "서울 웨딩헤어", "서울 브라이덜샵", 
              "서울 신부화장", "서울 웨딩뷰티"],
    "hall":   ["서울 웨딩홀", "서울 스몰웨딩", "서울 야외웨딩",
              "서울 호텔웨딩", "서울 하우스웨딩"],
} 

# 서울 지역구 좌표 (위도, 경도)
SEOUL_DISTRICTS = [
    ("강남구", 37.5172, 127.0473),
    ("서초구", 37.4837, 127.0324),
    ("마포구", 37.5663, 126.9014),
    ("송파구", 37.5145, 127.1059),
    ("종로구", 37.5735, 126.9790),
    ("용산구", 37.5384, 126.9654),
    ("강서구", 37.5509, 126.8495),
    ("영등포구", 37.5263, 126.8963),
]

def search_places(keyword, x, y, radius=5000, page=1):
    """카카오 로컬 API로 장소 검색"""
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {
        "query": keyword,
        "x": x,           # 경도
        "y": y,           # 위도
        "radius": radius, # 반경 (미터)
        "page": page,
        "size": 15,       # 한 번에 최대 15개
    }

    response = requests.get(url, headers=headers, params=params)
    print(f"status code: {response.status_code}")
    print(f"응답 내용: {response.json()}")
    
    return response.json()

def collect_vendors():
    all_vendors = []
    seen_ids = set()  # 중복 제거용

    for category, keywords in KEYWORDS.items():
        print(f"\n===== {category} 수집 시작 =====")

        for keyword in keywords:
            for district_name, lat, lng in SEOUL_DISTRICTS:
                print(f"  검색 중: {keyword} / {district_name}")

                for page in range(1, 4):  # 페이지 1~3 (최대 45개)
                    result = search_places(keyword, lng, lat, page=page)
                    documents = result.get("documents", [])

                    if not documents:
                        break

                    for place in documents:
                        place_id = place["id"]

                        # 중복 제거
                        if place_id in seen_ids:
                            continue
                        seen_ids.add(place_id)

                        vendor = {
                            "kakao_id": place_id,
                            "name": place["place_name"],
                            "category": category,
                            "region": place["address_name"],  # 도로명 주소
                            "phone": place.get("phone", ""),
                            "url": place.get("place_url", ""),
                            "lat": float(place["y"]),
                            "lng": float(place["x"]),
                            "raw_category": place.get("category_name", ""),
                        }
                        all_vendors.append(vendor)

                    # API 부하 방지 (0.3초 대기)
                    time.sleep(0.3)

                    # 마지막 페이지면 중단
                    if result.get("meta", {}).get("is_end"):
                        break

    print(f"\n총 {len(all_vendors)}개 업체 수집 완료")
    return all_vendors


if __name__ == "__main__":
    vendors = collect_vendors()

    # JSON 파일로 저장
    with open("raw_vendors.json", "w", encoding="utf-8") as f:
        json.dump(vendors, f, ensure_ascii=False, indent=2)

    print("raw_vendors.json 저장 완료")
# 나중에 C가 이 파일을 Supabase 쿼리로 교체하면 됨
DUMMY_VENDORS = [
    {
        "id": "1",
        "name": "스튜디오 루나",
        "category": "studio",
        "region": "서울 강남",
        "style": ["모던", "내추럴"],
        "price_min": 120,
        "price_max": 200,
        "rating": 4.9,
    },
    {
        "id": "2",
        "name": "드레스 로즈",
        "category": "dress",
        "region": "서울 강남",
        "style": ["클래식", "럭셔리"],
        "price_min": 80,
        "price_max": 150,
        "rating": 4.8,
    },
    {
        "id": "3",
        "name": "메이크업 에클라",
        "category": "makeup",
        "region": "서울 서초",
        "style": ["내추럴", "웨딩"],
        "price_min": 25,
        "price_max": 50,
        "rating": 4.7,
    },
    {
        "id": "4",
        "name": "그랜드 웨딩홀",
        "category": "hall",
        "region": "서울 송파",
        "style": ["럭셔리", "클래식"],
        "price_min": 300,
        "price_max": 600,
        "rating": 4.6,
    },
]

def get_vendors_by_filter(categories=None, style=None, region=None, budget_max=None):
    """
    C가 나중에 이 함수 내부만 Supabase 쿼리로 바꾸면 됨
    함수 시그니처(입력/출력 형태)는 절대 바꾸지 말 것
    """
    results = DUMMY_VENDORS

    if categories:
        results = [v for v in results if v["category"] in categories]
    if style:
        results = [v for v in results if any(s in v["style"] for s in style)]
    if region:
        results = [v for v in results if region in v["region"]]
    if budget_max:
        results = [v for v in results if v["price_min"] <= budget_max]

    return sorted(results, key=lambda x: x["rating"], reverse=True)
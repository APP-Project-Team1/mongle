import json
import csv

INPUT_JSON = "labeled_vendors.json"
OUTPUT_CSV = "vendors_for_supabase.csv"

with open(INPUT_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

fieldnames = [
    "kakao_id",
    "name",
    "category",
    "region",
    "phone",
    "url",
    "lat",
    "lng",
    "raw_category",
    "style",
    "district",
    "price_min",
    "price_max",
    "description",
    "rating",
    "review_count",
]

rows = []

for item in data:
    styles = item.get("style") or []

    row = {
        "kakao_id": item.get("kakao_id"),
        "name": item.get("name"),
        "category": item.get("category"),
        "region": item.get("region"),
        "phone": item.get("phone"),
        "url": item.get("url"),
        "lat": item.get("lat"),
        "lng": item.get("lng"),
        "raw_category": item.get("raw_category"),
        "style": "{" + ",".join(f'"{s}"' for s in styles) + "}",
        "district": item.get("district"),
        "price_min": item.get("price_min"),
        "price_max": item.get("price_max"),
        "description": item.get("description"),
        "rating": item.get("rating"),
        "review_count": item.get("review_count", 0),
    }

    rows.append(row)

with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"완료: {OUTPUT_CSV}")
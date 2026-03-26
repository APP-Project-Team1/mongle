import os
from supabase import create_client, Client
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def test_search():
    message = "강남 호텔 웨딩홀 추천해줘"
    embedding = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=message
    ).data[0].embedding

    # 1. No filter
    print("--- Testing without filter ---")
    result = supabase.rpc(
        "match_documents",
        {
            "query_embedding": embedding,
            "match_threshold": 0,
            "match_count": 5,
            "filter": {}
        }
    ).execute()
    print(f"Results without filter: {len(result.data)}")
    for d in result.data:
        print(f"- {d.get('title')} ({d.get('metadata', {}).get('category')})")

    # 2. With category filter
    print("\n--- Testing with category filter: wedding_hall ---")
    result = supabase.rpc(
        "match_documents",
        {
            "query_embedding": embedding,
            "match_threshold": 0,
            "match_count": 5,
            "filter": {"category": "wedding_hall"}
        }
    ).execute()
    print(f"Results with category 'wedding_hall': {len(result.data)}")

    # 3. Check raw data
    print("\n--- Checking raw documents ---")
    raw = supabase.table("rag_documents").select("title, category, metadata").limit(5).execute()
    for r in raw.data:
        print(f"Doc: {r.get('title')} | Cat: {r.get('category')} | Metadata: {r.get('metadata')}")

if __name__ == "__main__":
    test_search()

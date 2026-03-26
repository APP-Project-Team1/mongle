from fastapi import APIRouter
from openai import OpenAI
from supabase import create_client
import os

router = APIRouter()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


@router.post("/chat")
def rag_chat(message: str):

    # 1. 질문 → embedding
    embedding = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=message
    ).data[0].embedding

    # 2. Supabase 벡터 검색
    result = supabase.rpc(
        "match_documents",
        {
            "query_embedding": embedding,
            "match_threshold": 0.6,
            "match_count": 5,
            "filter": {}
        }
    ).execute()

    docs = result.data

    # 3. context 만들기
    context = "\n\n".join([d["content"] for d in docs])

    # 4. LLM 답변 생성
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "너는 웨딩 전문가다. 추천을 구체적으로 해줘."
            },
            {
                "role": "user",
                "content": f"""
질문: {message}

참고 데이터:
{context}
"""
            }
        ]
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": docs
    }
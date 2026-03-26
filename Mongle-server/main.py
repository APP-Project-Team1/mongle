from fastapi import FastAPI
from fastapi.responses import StreamingResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai.intent_parser import parse_intent
from ai.responder import generate_recommendation
from ai.dummy_vendors import get_vendors_by_filter
from ai.api.rag_chat import router as rag_router

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(rag_router, prefix="/api/v2", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        intent = await parse_intent(req.message)
    except Exception as e:
        return PlainTextResponse(f"의도 분석 중 오류가 발생했습니다: {str(e)}", status_code=500)

    try:
        vendors = get_vendors_by_filter(
            categories=intent.get("categories"),
            style=intent.get("style"),
            region=intent.get("region"),
            budget_max=intent.get("budget_max"),
        )
    except Exception as e:
        return PlainTextResponse(f"업체 검색 중 오류가 발생했습니다: {str(e)}", status_code=500)

    return StreamingResponse(
        generate_recommendation(req.message, vendors, req.history),
        media_type="text/event-stream"
    )

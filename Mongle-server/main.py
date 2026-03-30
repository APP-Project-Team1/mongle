from fastapi import FastAPI
from fastapi.responses import StreamingResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.api.cron_jobs import run_daily_notification_job
from ai.intent_parser import parse_intent
from ai.responder import generate_recommendation
from ai.dummy_vendors import get_vendors_by_filter
from ai.api.rag_chat import router as rag_router
from ai.api.budget_api import router as budget_router
from ai.api.estimation_api import router as estimation_router
from app.api.routes import timelines, projects, budget, chat, vendors, messages

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 매일 오전 9시에 알림 스케줄러 실행
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_daily_notification_job, 
        CronTrigger(hour=9, minute=0), 
        id="daily_notification_job",
        replace_existing=True
    )
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── 알림(Cron Job) 즉시 테스트를 위한 임시 라우터 ──
@app.get("/test/trigger-daily-job")
async def manual_trigger_job():
    await run_daily_notification_job()
    return {"status": "success", "message": "알림 스케줄러가 즉시 수동 실행되었습니다! 설정하신 1일, 3일, 7일 후 날짜의 데이터가 알림으로 전송되었는지 앱에서 확인해보세요."}

# Standard Routers
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(timelines.router, prefix="/timelines", tags=["timelines"])
app.include_router(budget.router, prefix="/budgets", tags=["budgets"])
app.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
app.include_router(chat.router, prefix="/chats", tags=["chats"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])

# Compatibility for flat structure
app.include_router(budget.router, prefix="/budget-items", tags=["budgets"])

# AI Routers
app.include_router(rag_router, prefix="/api/v2", tags=["chat"])
app.include_router(budget_router, prefix="/api/v2", tags=["budget"])
app.include_router(estimation_router, prefix="/api/v2", tags=["estimation"])

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

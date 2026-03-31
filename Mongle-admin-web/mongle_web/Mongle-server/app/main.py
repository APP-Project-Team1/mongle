from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import dashboard, projects, timelines, budgets, vendors, chats

app = FastAPI(title=settings.APP_NAME)

origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(timelines.router, prefix="/timelines", tags=["timelines"])
app.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
app.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
app.include_router(chats.router, prefix="/chats", tags=["chats"])


@app.get("/")
def root():
    return {"message": "Mongle 서버 실행 성공 🚀"}

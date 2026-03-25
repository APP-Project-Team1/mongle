from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import timelines, projects, budget, chat, vendors

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(timelines.router, prefix="/timelines", tags=["timelines"])
app.include_router(budget.router, prefix="/budgets", tags=["budgets"])
app.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
app.include_router(chat.router, prefix="/chats", tags=["chats"])


@app.get("/")
def root():
    return {"message": "Mongle 서버 실행 성공 🚀"}
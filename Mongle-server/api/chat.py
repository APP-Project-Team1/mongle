from fastapi import APIRouter

router = APIRouter()

@router.post("/message")
def send_chat_message():
    pass

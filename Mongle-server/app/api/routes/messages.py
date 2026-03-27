from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase

router = APIRouter()

class ChatMessageCreate(BaseModel):
    chat_id: str
    sender: str
    content: str

import uuid

# 채팅방 메시지 조회 (query param: chat_id)
@router.get('/')
def get_messages(chat_id: Optional[str] = None):
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required")
    
    try:
        try:
            uuid.UUID(chat_id)
        except ValueError:
            return [] # Invalid UUID, return empty messages

        result = supabase.table('messages').select('*').eq('chat_id', chat_id).order('created_at', {'ascending': True}).execute()
        return result.data
    except Exception as e:
        print(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 채팅방에 메시지 추가
@router.post('/')
def create_message(data: ChatMessageCreate):
    try:
        chat_check = supabase.table('chats').select('*').eq('id', data.chat_id).execute()
        if not chat_check.data:
            raise HTTPException(status_code=404, detail='해당 채팅을 찾을 수 없습니다.')

        result = supabase.table('messages').insert({
            'chat_id': data.chat_id,
            'sender_id': data.sender if '-' in data.sender else None, # UUID check simple
            'content': data.content
        }).select().single().execute()

        return result.data
    except Exception as e:
        print(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

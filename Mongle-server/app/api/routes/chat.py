from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase

router = APIRouter()


class ChatCreate(BaseModel):
    project_id: str
    title: Optional[str] = '새 채팅'


class ChatUpdate(BaseModel):
    title: Optional[str] = None


class ChatMessageCreate(BaseModel):
    chat_id: str
    sender: str
    content: str


# DB 테스트
@router.get('/test')
def test_chat_db():
    result = supabase.table('chats').select('*').execute()
    return result.data


import uuid

# 프로젝트별 또는 전체 채팅 목록
@router.get('/')
def get_chats(project_id: Optional[str] = None):
    try:
        query = supabase.table('chats').select('*')
        if project_id:
            # UUID 형식 검증
            try:
                uuid.UUID(project_id)
                query = query.eq('project_id', project_id)
            except ValueError:
                # 유효하지 않은 UUID면 빈 결과 반환
                return []
        result = query.execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 프로젝트별 채팅
@router.get('/project/{project_id}')
def get_chats_by_project(project_id: str):
    result = (
        supabase
        .table('chats')
        .select('*')
        .eq('project_id', project_id)
        .execute()
    )
    return result.data


# 채팅 채널 단일 조회
@router.get('/{chat_id}')
def get_chat(chat_id: str):
    result = supabase.table('chats').select('*').eq('id', chat_id).single().execute()
    if result.error or not result.data:
        raise HTTPException(status_code=404, detail='해당 채팅을 찾을 수 없습니다.')
    return result.data


@router.post('/')
def create_chat(data: ChatCreate):
    # UUID 형식 검증
    try:
        uuid.UUID(data.project_id)
    except ValueError:
        raise HTTPException(status_code=404, detail='유효하지 않은 project_id 형식입니다.')

    project_check = supabase.table('projects').select('*').eq('id', data.project_id).execute()
    if not project_check.data:
        raise HTTPException(status_code=404, detail='해당 project_id의 프로젝트가 없습니다.')

    result = supabase.table('chats').insert({
        'project_id': data.project_id,
        'title': data.title
    }).select().single().execute()

    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))

    return result.data


# 채팅 수정
@router.put('/{chat_id}')
def update_chat(chat_id: str, data: ChatUpdate):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail='수정할 값이 없습니다.')

    check = supabase.table('chats').select('*').eq('id', chat_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail='해당 채팅을 찾을 수 없습니다.')

    result = supabase.table('chats').update(update_data).eq('id', chat_id).select().single().execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return result.data


# 채팅 삭제
@router.delete('/{chat_id}')
def delete_chat(chat_id: str):
    check = supabase.table('chats').select('*').eq('id', chat_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail='해당 채팅을 찾을 수 없습니다.')

    result = supabase.table('chats').delete().eq('id', chat_id).execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return {'deleted': True}


# 채팅방 메시지 조회
@router.get('/{chat_id}/messages')
def get_messages(chat_id: str):
    try:
        result = supabase.table('messages').select('*').eq('chat_id', chat_id).order('created_at', {'ascending': True}).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 채팅방에 메시지 추가
@router.post('/{chat_id}/messages')
def create_message(chat_id: str, data: ChatMessageCreate):
    try:
        if chat_id != data.chat_id:
            raise HTTPException(status_code=400, detail='chat_id mismatch')

        chat_check = supabase.table('chats').select('*').eq('id', chat_id).execute()
        if not chat_check.data:
            raise HTTPException(status_code=404, detail='해당 채팅을 찾을 수 없습니다.')

        result = supabase.table('messages').insert({
            'chat_id': data.chat_id,
            'sender_id': data.sender if '-' in data.sender else None,
            'content': data.content
        }).select().single().execute()

        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Depends, HTTPException, Header
from app.db.supabase import supabase
from typing import Optional

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="인증 헤더가 필요합니다.")
        
    try:
        # "Bearer <token>" 형식 확인
        token = authorization.split(" ")[1]
        
        # Supabase를 통해 토큰 확인
        # 주의: python-supabase 0.x vs 2.x API 차이가 있을 수 있음
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
            
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"인증 실패: {str(e)}")

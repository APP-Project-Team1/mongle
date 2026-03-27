from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from app.db.supabase import supabase
from app.api.deps import get_current_user

router = APIRouter()

class CoupleInviteRequest(BaseModel):
    partner_email: EmailStr
    project_id: Optional[str] = None

class CoupleAcceptRequest(BaseModel):
    invitation_id: str

@router.post("/invite")
def invite_partner(request: CoupleInviteRequest, user = Depends(get_current_user)):
    # 1. 파트너 이메일로 프로필 찾기
    partner_profile = supabase.table("profiles").select("id").eq("email", request.partner_email).execute()
    
    if not partner_profile.data:
        raise HTTPException(status_code=404, detail="해당 이메일을 가진 사용자를 찾을 수 없습니다.")
    
    partner_id = partner_profile.data[0]["id"]
    
    if partner_id == user.id:
        raise HTTPException(status_code=400, detail="자기 자신을 초대할 수 없습니다.")
    
    # 2. 이미 존재하는 커플/초대 확인
    existing = supabase.table("couples")\
        .select("*")\
        .or_(f"and(user1_id.eq.{user.id},user2_id.eq.{partner_id}),and(user1_id.eq.{partner_id},user2_id.eq.{user.id})")\
        .execute()
    
    if existing.data:
        # 이미 존재하면 해당 ID 사용
        couple_id = existing.data[0]["id"]
    else:
        # 새 초대 생성
        new_couple = supabase.table("couples").insert({
            "user1_id": user.id,
            "user2_id": partner_id,
            "status": "pending"
        }).execute()
        couple_id = new_couple.data[0]["id"]
    
    # 3. 프로젝트가 지정된 경우 링크
    if request.project_id:
        # 프로젝트 소유권 확인
        project = supabase.table("projects").select("owner_id").eq("id", request.project_id).execute()
        if not project.data or project.data[0]["owner_id"] != user.id:
            raise HTTPException(status_code=403, detail="프로젝트를 수정할 권한이 없습니다.")
            
        supabase.table("projects").update({"couple_id": couple_id}).eq("id", request.project_id).execute()
    
    return {"message": "초대가 전송되었습니다.", "couple_id": couple_id}

@router.get("/invitations")
def get_invitations(user = Depends(get_current_user)):
    # 사용자가 받은(user2_id) 펜딩 초대 목록
    result = supabase.table("couples")\
        .select("*, profiles!couples_user1_id_fkey(email, nickname)")\
        .eq("user2_id", user.id)\
        .eq("status", "pending")\
        .execute()
    return result.data

@router.post("/accept")
def accept_invitation(request: CoupleAcceptRequest, user = Depends(get_current_user)):
    # 본인에게 온 초대인지 확인
    check = supabase.table("couples").select("*").eq("id", request.invitation_id).eq("user2_id", user.id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="본인에게 온 유효한 초대를 찾을 수 없습니다.")
        
    result = supabase.table("couples").update({"status": "active"}).eq("id", request.invitation_id).execute()
    return result.data[0]

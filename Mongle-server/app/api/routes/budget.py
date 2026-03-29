from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase

router = APIRouter()


class BudgetCreate(BaseModel):
    project_id: str
    category: Optional[str] = None
    total_amount: float
    spent: float = 0.0
    notes: Optional[str] = None


class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    total_amount: Optional[float] = None
    spent: Optional[float] = None
    notes: Optional[str] = None


# DB 테스트
@router.get('/test')
def test_campaigns_db():
    result = supabase.table('budgets').select('*').execute()
    return result.data


# 전체 예산 조회 (프로젝트 필터링 지원)
@router.get('/')
def get_budgets(project_id: Optional[str] = None):
    query = supabase.table('budgets').select('*')
    if project_id:
        query = query.eq('project_id', project_id)
    result = query.execute()
    return result.data


# 프로젝트별 예산 조회
@router.get('/project/{project_id}')
def get_budgets_by_project(project_id: str):
    result = (
        supabase
        .table('budgets')
        .select('*')
        .eq('project_id', project_id)
        .execute()
    )
    return result.data


# 예산 단일 조회
@router.get('/{budget_id}')
def get_budget(budget_id: str):
    if not result.data:
        raise HTTPException(status_code=404, detail='해당 예산을 찾을 수 없습니다.')

    return result.data


# 예산 생성
@router.post('/')
def create_budget(data: BudgetCreate):
    project_check = supabase.table('projects').select('*').eq('id', data.project_id).execute()
    if not project_check.data:
        raise HTTPException(status_code=404, detail='해당 project_id의 프로젝트가 없습니다.')

    insert_data = {
        'project_id': data.project_id,
        'category': data.category,
        'total_amount': data.total_amount,
        'spent': data.spent,
        'notes': data.notes
    }

    result = supabase.table('budgets').insert(insert_data).execute()
    return result.data[0] if result.data else None


# 예산 수정
@router.put('/{budget_id}')
def update_budget(budget_id: str, data: BudgetUpdate):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail='수정할 값이 없습니다.')

    check = supabase.table('budgets').select('*').eq('id', budget_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail='해당 예산을 찾을 수 없습니다.')

    result = supabase.table('budgets').update(update_data).eq('id', budget_id).execute()
    return result.data[0] if result.data else None


# 예산 삭제
@router.delete('/{budget_id}')
def delete_budget(budget_id: str):
    check = supabase.table('budgets').select('*').eq('id', budget_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail='해당 예산을 찾을 수 없습니다.')

    supabase.table('budgets').delete().eq('id', budget_id).execute()
    return {'deleted': True}


import uuid

# 예산 항목 목록 조회 ( compatibility: GET /budget-items?budget_id=... )
@router.get('/items')
def get_budget_items(budget_id: Optional[str] = None):
    try:
        query = supabase.table('budget_items').select('*')
        if budget_id:
            try:
                uuid.UUID(budget_id)
                query = query.eq('budget_id', budget_id)
            except ValueError:
                return []
        result = query.execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 예산 항목 생성
@router.post('/items')
def create_budget_item(data: dict):
    result = supabase.table('budget_items').insert(data).execute()
    return result.data[0] if result.data else None


# 예산 항목 수정
@router.put('/items/{item_id}')
def update_budget_item(item_id: str, data: dict):
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='수정할 값이 없습니다.')
    existing = supabase.table('budget_items').select('*').eq('id', item_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail='해당 예산 항목을 찾을 수 없습니다.')
    result = supabase.table('budget_items').update(update_data).eq('id', item_id).execute()
    return result.data[0] if result.data else None


# 예산 항목 삭제
@router.delete('/items/{item_id}')
def delete_budget_item(item_id: str):
    existing = supabase.table('budget_items').select('*').eq('id', item_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail='해당 예산 항목을 찾을 수 없습니다.')
    supabase.table('budget_items').delete().eq('id', item_id).execute()
    return {'deleted': True}


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase

router = APIRouter()

class VendorCreate(BaseModel):
    name: str
    category: str
    region: str
    project_id: Optional[str] = None
    phone: Optional[str] = None
    url: Optional[str] = None

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    url: Optional[str] = None

@router.get('/')
def get_vendors(project_id: Optional[str] = None):
    query = supabase.table('vendors').select('*')
    if project_id:
        query = query.eq('project_id', project_id)
    result = query.execute()
    return result.data

@router.get('/{vendor_id}')
def get_vendor(vendor_id: str):
    result = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
    if result.error:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')
    return result.data

@router.post('/')
def create_vendor(data: VendorCreate):
    insert_data = data.dict(exclude_unset=True)
    result = supabase.table('vendors').insert(insert_data).select().single().execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return result.data

@router.put('/{vendor_id}')
def update_vendor(vendor_id: str, data: VendorUpdate):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail='수정할 값이 없습니다.')

    existing = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
    if existing.error or not existing.data:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')

    result = supabase.table('vendors').update(update_data).eq('id', vendor_id).select().single().execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return result.data

@router.delete('/{vendor_id}')
def delete_vendor(vendor_id: str):
    existing = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
    if existing.error or not existing.data:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')

    result = supabase.table('vendors').delete().eq('id', vendor_id).execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return {'deleted': True}

from supabase import create_client, Client
from app.core.config import settings

if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    raise ValueError("SUPABASE_URL 또는 SUPABASE_KEY 가 비어 있습니다.")

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

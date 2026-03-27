from app.db.supabase import supabase
import os

print(f"URL: {os.getenv('SUPABASE_URL')}")
try:
    # Try a simple select first
    res = supabase.table("projects").select("*").limit(1).execute()
    print(f"Select ok: {res.data}")
    
    # Try insert
    res = supabase.table("projects").insert({
        "title": "Debug Project",
        "description": "Created during debugging"
    }).execute()
    print(f"Insert ok: {res.data}")
except Exception as e:
    print(f"ERROR: {e}")
    if hasattr(e, 'message'):
        print(f"MSG: {e.message}")
    if hasattr(e, 'details'):
        print(f"DETAILS: {e.details}")

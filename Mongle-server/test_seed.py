from app.db.supabase import supabase

def try_seed():
    try:
        # Try inserting without ID to see if it works (default generation)
        res = supabase.table('projects').insert({
            'title': '몽글이 & 뭉글이의 결혼준비',
            'description': '행복한 결혼 준비'
        }).execute()
        print("Success:", res.data)
    except Exception as e:
        print("Failed:", str(e))

if __name__ == "__main__":
    try_seed()

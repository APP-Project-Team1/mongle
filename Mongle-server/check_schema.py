from app.db.supabase import supabase

def check_columns():
    try:
        # Try to insert a completely empty row to see the error/schema
        # Or better, use a select with a limit 0
        res = supabase.table('projects').select('*').limit(1).execute()
        print("Projects schema check:", res.data)
        
        # If projects is empty, try weddings
        res = supabase.table('weddings').select('*').limit(1).execute()
        print("Weddings schema check:", res.data)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()

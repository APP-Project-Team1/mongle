from app.db.supabase import supabase
import json

def inspect_tables():
    tables = ['projects', 'cost_items', 'weddings', 'vendor_costs']
    report = {}
    
    for table in tables:
        try:
            # Fetch one row to see columns
            result = supabase.table(table).select('*').limit(1).execute()
            if result.data:
                report[table] = list(result.data[0].keys())
            else:
                # If no data, we might need a different way to check headers
                # In some versions of supabase-py, we can check the response metadata or just assume it's empty
                report[table] = "No data to inspect columns"
        except Exception as e:
            report[table] = f"Error: {str(e)}"
            
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    inspect_tables()

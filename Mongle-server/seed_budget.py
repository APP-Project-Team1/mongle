from app.db.supabase import supabase
import uuid

def seed_budget():
    # 1. Get the existing project
    res = supabase.table('projects').select('id').limit(1).execute()
    if not res.data:
        print("No project found. Please run test_seed.py first.")
        return
    
    project_id = res.data[0]['id']
    print(f"Found project: {project_id}")

    # 2. Check if budget exists for this project
    res = supabase.table('budgets').select('*').eq('project_id', project_id).execute()
    if res.data:
        print(f"Budget already exists for project {project_id}")
    else:
        # Create a default budget
        # We MUST NOT provide 'id' manually to allow auto-generation
        budget_data = {
            'project_id': project_id,
            'total_amount': 3500.0, # 35,000,000 KRW
            'spent': 0.0,
            'category': 'Wedding'
        }
        try:
            res = supabase.table('budgets').insert(budget_data).execute()
            if res.data:
                print(f"Created default budget for project: {res.data[0]['id']}")
            else:
                print("Failed to create budget (no data returned)")
        except Exception as e:
            print(f"Error creating budget: {e}")

if __name__ == "__main__":
    seed_budget()

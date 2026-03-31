-- Legacy budget tables support
-- Use this for the existing budgets / budget_items CSV imports.

create index if not exists idx_budgets_project_id
  on public.budgets (project_id, created_at desc);

create index if not exists idx_budget_items_budget_id
  on public.budget_items (budget_id, created_at asc);

create index if not exists idx_budget_items_vendor_name
  on public.budget_items (vendor_name);

comment on table public.budgets is
  'Shared budget summary per project imported from budgets_rows.csv';

comment on table public.budget_items is
  'Shared budget line items imported from budget_items_rows.csv';

-- Import notes
-- 1. Import budgets_rows.csv into public.budgets.
-- 2. Import budget_items_rows.csv into public.budget_items.
-- 3. Ensure budgets.project_id points to an existing public.projects.id.
-- 4. Ensure budget_items.budget_id points to an existing public.budgets.id.
-- 5. If RLS is enabled on these tables, add SELECT policies so a couple user can read
--    the project rows tied to their couple_id, then the corresponding budget rows/items.

-- Personalized couple workspace support
-- Run this in Supabase SQL Editor before testing the updated couple budget/timeline screens.

alter table public.couple_schedules
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

alter table public.couple_payments
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

alter table public.couple_vendor_costs
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_couple_schedules_couple_owner
  on public.couple_schedules (couple_id, owner_user_id, scheduled_date);

create index if not exists idx_couple_payments_couple_owner
  on public.couple_payments (couple_id, owner_user_id, due_date);

create index if not exists idx_couple_vendor_costs_couple_owner
  on public.couple_vendor_costs (couple_id, owner_user_id, created_at);

comment on column public.couple_schedules.owner_user_id is
  'NULL means shared/planner-created item. Non-NULL means the item belongs to one logged-in couple user.';

comment on column public.couple_payments.owner_user_id is
  'NULL means shared/planner-created item. Non-NULL means the item belongs to one logged-in couple user.';

comment on column public.couple_vendor_costs.owner_user_id is
  'NULL means shared/planner-created item. Non-NULL means the item belongs to one logged-in couple user.';

-- Optional RLS examples.
-- Adjust or skip these if you already manage access with broader existing policies.
--
-- create policy "couple schedules read own or shared"
-- on public.couple_schedules
-- for select
-- using (
--   couple_id in (
--     select couple_id
--     from public.user_profiles
--     where id = auth.uid()
--   )
--   and (owner_user_id is null or owner_user_id = auth.uid())
-- );
--
-- create policy "couple schedules write own"
-- on public.couple_schedules
-- for all
-- using (owner_user_id = auth.uid())
-- with check (
--   owner_user_id = auth.uid()
--   and couple_id in (
--     select couple_id
--     from public.user_profiles
--     where id = auth.uid()
--   )
-- );

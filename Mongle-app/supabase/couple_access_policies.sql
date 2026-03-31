-- Couple / planner access policies
-- Apply this only after confirming these columns exist:
-- public.user_profiles(id, role, couple_id, planner_id)
-- public.couples(id, planner_id, user_id)
-- public.projects(id, user_id)
-- public.budgets(id, project_id)
-- public.budget_items(id, budget_id)
-- public.couple_schedules(couple_id, planner_id, owner_user_id)
-- public.couple_payments(couple_id, owner_user_id)
-- public.couple_vendor_costs(couple_id, planner_id, owner_user_id)

alter table public.user_profiles enable row level security;
alter table public.couples enable row level security;
alter table public.projects enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;
alter table public.couple_schedules enable row level security;
alter table public.couple_payments enable row level security;
alter table public.couple_vendor_costs enable row level security;

drop policy if exists "user_profiles self read" on public.user_profiles;
create policy "user_profiles self read"
on public.user_profiles
for select
using (id = auth.uid());

drop policy if exists "couples read by linked couple or planner" on public.couples;
create policy "couples read by linked couple or planner"
on public.couples
for select
using (
  id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  or user_id = auth.uid()
  or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or planner_id in (
    select up.planner_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
);

drop policy if exists "projects read by linked couple or planner" on public.projects;
create policy "projects read by linked couple or planner"
on public.projects
for select
using (
  user_id = auth.uid()
  or user_id in (
    select c.user_id
    from public.couples c
    where c.user_id = auth.uid()
       or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  or user_id in (
    select c.user_id
    from public.couples c
    join public.user_profiles up on up.planner_id = c.planner_id
    where up.id = auth.uid()
      and c.user_id is not null
  )
);

drop policy if exists "budgets read through accessible project" on public.budgets;
create policy "budgets read through accessible project"
on public.budgets
for select
using (
  project_id in (
    select p.id
    from public.projects p
    where p.user_id = auth.uid()
    or p.user_id in (
      select c.user_id
      from public.couples c
      where c.user_id = auth.uid()
         or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    or p.user_id in (
      select c.user_id
      from public.couples c
      join public.user_profiles up on up.planner_id = c.planner_id
      where up.id = auth.uid()
        and c.user_id is not null
    )
  )
);

drop policy if exists "budget_items read through accessible budget" on public.budget_items;
create policy "budget_items read through accessible budget"
on public.budget_items
for select
using (
  budget_id in (
    select b.id
    from public.budgets b
    join public.projects p on p.id = b.project_id
    where p.user_id = auth.uid()
    or p.user_id in (
      select c.user_id
      from public.couples c
      where c.user_id = auth.uid()
         or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    or p.user_id in (
      select c.user_id
      from public.couples c
      join public.user_profiles up on up.planner_id = c.planner_id
      where up.id = auth.uid()
        and c.user_id is not null
    )
  )
);

drop policy if exists "couple_schedules read by linked couple or planner" on public.couple_schedules;
create policy "couple_schedules read by linked couple or planner"
on public.couple_schedules
for select
using (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  or couple_id in (
    select c.id
    from public.couples c
    where c.user_id = auth.uid()
       or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  or planner_id in (
    select up.planner_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
);

drop policy if exists "couple_schedules insert by linked couple" on public.couple_schedules;
create policy "couple_schedules insert by linked couple"
on public.couple_schedules
for insert
with check (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  or couple_id in (
    select c.id
    from public.couples c
    where c.user_id = auth.uid()
       or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "couple_schedules update by linked couple" on public.couple_schedules;
create policy "couple_schedules update by linked couple"
on public.couple_schedules
for update
using (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  or couple_id in (
    select c.id
    from public.couples c
    where c.user_id = auth.uid()
       or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  or planner_id in (
    select up.planner_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
)
with check (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  or couple_id in (
    select c.id
    from public.couples c
    where c.user_id = auth.uid()
       or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  or planner_id in (
    select up.planner_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
);

drop policy if exists "couple_schedules delete by linked couple" on public.couple_schedules;
create policy "couple_schedules delete by linked couple"
on public.couple_schedules
for delete
using (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  or couple_id in (
    select c.id
    from public.couples c
    where c.user_id = auth.uid()
       or lower(coalesce(c.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  or planner_id in (
    select up.planner_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
);

drop policy if exists "couple_payments read shared or own plus planner" on public.couple_payments;
create policy "couple_payments read shared or own plus planner"
on public.couple_payments
for select
using (
  (
    couple_id in (
      select up.couple_id
      from public.user_profiles up
      where up.id = auth.uid()
    )
    and (owner_user_id is null or owner_user_id = auth.uid())
  )
  or couple_id in (
    select c.id
    from public.couples c
    join public.user_profiles up on up.planner_id = c.planner_id
    where up.id = auth.uid()
  )
);

drop policy if exists "couple_payments write own couple rows" on public.couple_payments;
create policy "couple_payments write own couple rows"
on public.couple_payments
for insert
with check (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
);

drop policy if exists "couple_payments update own couple rows" on public.couple_payments;
create policy "couple_payments update own couple rows"
on public.couple_payments
for update
using (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
)
with check (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
);

drop policy if exists "couple_payments delete own couple rows" on public.couple_payments;
create policy "couple_payments delete own couple rows"
on public.couple_payments
for delete
using (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
);

drop policy if exists "couple_vendor_costs read shared or own plus planner" on public.couple_vendor_costs;
create policy "couple_vendor_costs read shared or own plus planner"
on public.couple_vendor_costs
for select
using (
  (
    couple_id in (
      select up.couple_id
      from public.user_profiles up
      where up.id = auth.uid()
    )
    and (owner_user_id is null or owner_user_id = auth.uid())
  )
  or planner_id in (
    select up.planner_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
);

drop policy if exists "couple_vendor_costs write own couple rows" on public.couple_vendor_costs;
create policy "couple_vendor_costs write own couple rows"
on public.couple_vendor_costs
for insert
with check (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
);

drop policy if exists "couple_vendor_costs update own couple rows" on public.couple_vendor_costs;
create policy "couple_vendor_costs update own couple rows"
on public.couple_vendor_costs
for update
using (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
)
with check (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
);

drop policy if exists "couple_vendor_costs delete own couple rows" on public.couple_vendor_costs;
create policy "couple_vendor_costs delete own couple rows"
on public.couple_vendor_costs
for delete
using (
  couple_id in (
    select up.couple_id
    from public.user_profiles up
    where up.id = auth.uid()
  )
  and owner_user_id = auth.uid()
);

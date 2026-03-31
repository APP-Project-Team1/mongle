-- Backfill planner_id on existing couple schedules.
-- Run this after personalized_couple_workspace.sql if some couple-created schedules
-- were already inserted without planner_id.

update public.couple_schedules cs
set planner_id = c.planner_id
from public.couples c
where cs.couple_id = c.id
  and cs.planner_id is null
  and c.planner_id is not null;

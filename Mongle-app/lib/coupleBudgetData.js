import { supabase } from './supabase';

export async function fetchLatestProjectForCouple(coupleId) {
  if (!coupleId) return null;

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('id, user_id')
    .eq('id', coupleId)
    .maybeSingle();

  if (coupleError) throw coupleError;
  if (!couple?.user_id) return null;

  const { data, error } = await supabase
    .from('projects')
    .select('id, title, name, user_id, created_at')
    .eq('user_id', couple.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchBudgetForProject(projectId) {
  if (!projectId) return null;

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchBudgetItemsForBudget(budgetId) {
  if (!budgetId) return [];

  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('budget_id', budgetId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchCoupleBudgetBundle(coupleId) {
  const project = await fetchLatestProjectForCouple(coupleId);
  const budget = await fetchBudgetForProject(project?.id);
  const items = await fetchBudgetItemsForBudget(budget?.id);

  return {
    project,
    budget,
    items,
  };
}

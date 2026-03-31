import { supabase } from './supabase';

const settle = async (promise, fallback) => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

export async function fetchCoupleById(coupleId) {
  if (!coupleId) return null;

  const { data, error } = await supabase
    .from('couples')
    .select('id, planner_id, user_id, total_amount')
    .eq('id', coupleId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchLatestProjectForCouple(coupleId) {
  if (!coupleId) return null;

  const couple = await fetchCoupleById(coupleId);
  if (!couple?.user_id) return null;

  const { data: budgetProject, error: budgetProjectError } = await supabase
    .from('projects')
    .select('id, title, name, user_id, created_at')
    .eq('user_id', couple.user_id)
    .or('title.ilike.%예산%,name.ilike.%예산%')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (budgetProjectError) throw budgetProjectError;
  if (budgetProject?.id) return budgetProject;

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

export async function fetchCouplePayments(coupleId) {
  if (!coupleId) return [];

  const { data, error } = await supabase
    .from('couple_payments')
    .select('*')
    .eq('couple_id', coupleId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchCoupleVendorCosts(coupleId) {
  if (!coupleId) return [];

  const { data, error } = await supabase
    .from('couple_vendor_costs')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchCoupleBudgetBundle(coupleId) {
  const couple = await settle(fetchCoupleById(coupleId), null);
  const paymentsPromise = settle(fetchCouplePayments(coupleId), []);
  const vendorCostsPromise = settle(fetchCoupleVendorCosts(coupleId), []);
  const project = await settle(fetchLatestProjectForCouple(coupleId), null);
  const budget = await settle(fetchBudgetForProject(project?.id), null);
  const itemsPromise = settle(fetchBudgetItemsForBudget(budget?.id), []);

  const [payments, vendorCosts, items] = await Promise.all([
    paymentsPromise,
    vendorCostsPromise,
    itemsPromise,
  ]);

  return {
    couple,
    project,
    budget,
    items,
    payments,
    vendorCosts,
  };
}

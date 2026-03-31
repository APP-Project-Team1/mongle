import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const FinanceContext = createContext();

export function useFinance() {
  return useContext(FinanceContext);
}

export function FinanceProvider({ children }) {
  const [finance, setFinance] = useState({ couples: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      setLoading(true);

      // Get budgets with project info
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select(`
          id,
          total_budget,
          project_id,
          projects (
            id,
            name,
            wedding_date
          )
        `);

      if (error) throw error;

      // Transform data to match expected format
      const transformedCouples = budgets?.map(budget => ({
        id: budget.project_id,
        name: budget.projects?.name || '이름 없음',
        total: budget.total_budget,
        received: Math.floor(budget.total_budget * 0.8), // Mock received amount (80% of total)
        due: null, // No due date in current schema
        vendorCosts: [] // No vendor cost details in current schema
      })) || [];

      setFinance({ couples: transformedCouples });
    } catch (error) {
      console.error('Error fetching finance:', error);
      // Fallback to empty data if Supabase fails
      setFinance({ couples: [] });
    } finally {
      setLoading(false);
    }
  };

  // Helper function for formatting money
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <FinanceContext.Provider value={{ finance, loading, formatMoney, refetchFinance: fetchFinance }}>
      {children}
    </FinanceContext.Provider>
  );
}
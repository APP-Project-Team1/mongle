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

      // budgets 테이블 실제 컬럼: id, project_id, total_amount, spent, category, notes
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select(`
          id,
          total_amount,
          spent,
          project_id
        `);

      if (error) throw error;

      // project 정보는 별도 조회
      const projectIds = [...new Set(budgets?.map((b) => b.project_id).filter(Boolean))];

      let projectMap = {};
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, event_date')
          .in('id', projectIds);

        projectMap = Object.fromEntries((projects || []).map((p) => [p.id, p]));
      }

      const transformedCouples = budgets?.map((budget) => {
        const project = projectMap[budget.project_id];
        return {
          id: budget.project_id,
          name: project?.title || '이름 없음',
          total: budget.total_amount || 0,
          received: budget.spent || 0,
          due: project?.event_date || null,
          vendorCosts: [],
        };
      }) || [];

      setFinance({ couples: transformedCouples });
    } catch (error) {
      console.error('Error fetching finance:', error);
      setFinance({ couples: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <FinanceContext.Provider value={{ finance, loading, formatMoney, refetchFinance: fetchFinance }}>
      {children}
    </FinanceContext.Provider>
  );
}

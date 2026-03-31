import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const KpiContext = createContext();

export function useKpi() {
  return useContext(KpiContext);
}

export function KpiProvider({ children }) {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      setLoading(true);

      // 전체 프로젝트 수
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id');

      if (projectsError) throw projectsError;

      const totalProjectsCount = projects?.length || 0;

      // 이번 달 결혼식 수
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data: weddings, error: weddingsError } = await supabase
        .from('projects')
        .select('event_date')
        .not('event_date', 'is', null);

      if (weddingsError) throw weddingsError;

      const currentMonthWeddings = weddings?.filter((project) => {
        if (!project.event_date) return false;
        const weddingDate = new Date(project.event_date);
        return (
          weddingDate.getMonth() + 1 === currentMonth &&
          weddingDate.getFullYear() === currentYear
        );
      }) || [];

      const weddingDates = currentMonthWeddings
        .map((project) => {
          const date = new Date(project.event_date);
          return `${date.getMonth() + 1}월 ${date.getDate()}일`;
        })
        .sort();

      const kpiData = [
        {
          label: '담당 커플',
          value: totalProjectsCount.toString(),
          sub: `진행 ${totalProjectsCount}`,
          color: 'var(--accent-secondary)',
          bg: 'var(--stage-1-bg)',
        },
        {
          label: '이번 달 결혼식',
          value: currentMonthWeddings.length.toString(),
          sub: weddingDates.length > 0 ? weddingDates.join('  ') : '없음',
          color: 'var(--accent-secondary)',
          bg: 'var(--stage-1-bg)',
        },
      ];

      setKpis(kpiData);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      setKpis([
        { label: '담당 커플', value: '0', sub: '진행 0', color: 'var(--accent-secondary)', bg: 'var(--stage-1-bg)' },
        { label: '이번 달 결혼식', value: '0', sub: '없음', color: 'var(--accent-secondary)', bg: 'var(--stage-1-bg)' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KpiContext.Provider value={{ kpis, loading, refetchKpis: fetchKpis }}>
      {children}
    </KpiContext.Provider>
  );
}

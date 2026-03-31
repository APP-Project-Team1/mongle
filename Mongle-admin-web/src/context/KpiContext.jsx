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

      // 담당 커플 수 (진행 중인 프로젝트 수)
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, status')
        .eq('status', 'active');

      if (projectsError) throw projectsError;

      const activeProjectsCount = projects?.length || 0;

      // 이번 달 결혼식 수
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data: weddings, error: weddingsError } = await supabase
        .from('projects')
        .select('wedding_date')
        .not('wedding_date', 'is', null);

      if (weddingsError) throw weddingsError;

      const currentMonthWeddings = weddings?.filter(project => {
        if (!project.wedding_date) return false;
        const weddingDate = new Date(project.wedding_date);
        return weddingDate.getMonth() + 1 === currentMonth && weddingDate.getFullYear() === currentYear;
      }) || [];

      const weddingDates = currentMonthWeddings
        .map(project => {
          const date = new Date(project.wedding_date);
          return `${date.getMonth() + 1}월 ${date.getDate()}일`;
        })
        .sort((a, b) => {
          const dateA = new Date(`${currentYear}-${a.replace('월 ', '-').replace('일', '')}`);
          const dateB = new Date(`${currentYear}-${b.replace('월 ', '-').replace('일', '')}`);
          return dateA - dateB;
        });

      const kpiData = [
        {
          label: '담당 커플',
          value: activeProjectsCount.toString(),
          sub: `진행 ${activeProjectsCount}`,
          color: 'var(--accent-secondary)',
          bg: 'var(--stage-1-bg)'
        },
        {
          label: '이번 달 결혼식',
          value: currentMonthWeddings.length.toString(),
          sub: weddingDates.length > 0 ? weddingDates.join(' · ') : '없음',
          color: 'var(--accent-secondary)',
          bg: 'var(--stage-1-bg)'
        }
      ];

      setKpis(kpiData);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      // Fallback to mock data if Supabase fails
      setKpis([
        { label: '담당 커플', value: '0', sub: '진행 0', color: 'var(--accent-secondary)', bg: 'var(--stage-1-bg)' },
        { label: '이번 달 결혼식', value: '0', sub: '없음', color: 'var(--accent-secondary)', bg: 'var(--stage-1-bg)' }
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
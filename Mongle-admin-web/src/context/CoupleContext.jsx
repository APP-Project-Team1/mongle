import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CoupleContext = createContext();

export function useCouples() {
  return useContext(CoupleContext);
}

export function CoupleProvider({ children }) {
  const [couples, setCouples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouples();
  }, []);

  const fetchCouples = async () => {
    try {
      setLoading(true);

      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          wedding_date,
          status,
          created_at
        `)
        .eq('status', 'active')
        .not('wedding_date', 'is', null)
        .order('wedding_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Transform data to match the expected format
      const transformedCouples = projects?.map((project, index) => {
        const weddingDate = new Date(project.wedding_date);
        const today = new Date();
        const dday = Math.ceil((weddingDate - today) / (1000 * 60 * 60 * 24));

        // Extract couple names from project name (assuming format "Name1 · Name2")
        const names = project.name.split(' · ');
        const initials = names.length >= 2 ? names[0].charAt(0) + names[1].charAt(0) : names[0].substring(0, 2);

        return {
          id: project.id,
          initials,
          name: project.name,
          date: `${weddingDate.getMonth() + 1}월 ${weddingDate.getDate()}일`,
          venue: '웨딩홀 정보 없음', // We don't have venue info in projects table
          dday: dday > 0 ? dday : 0,
          progress: Math.max(0, Math.min(100, 100 - (dday / 365) * 100)), // Simple progress calculation
          avatarBg: `var(--avatar-${index % 6}-bg)`,
          avatarColor: `var(--avatar-${index % 6}-color)`,
          barColor: `var(--stage-${Math.floor(index / 2) + 1}-bar)`,
          badgeBg: `var(--avatar-${index % 6}-bg)`,
          badgeColor: `var(--avatar-${index % 6}-color)`
        };
      }) || [];

      setCouples(transformedCouples);
    } catch (error) {
      console.error('Error fetching couples:', error);
      // Fallback to empty array if Supabase fails
      setCouples([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoupleContext.Provider value={{ couples, loading, refetchCouples: fetchCouples }}>
      {children}
    </CoupleContext.Provider>
  );
}
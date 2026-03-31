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
        .select('id, title, event_date, description, location')
        .not('event_date', 'is', null)
        .order('event_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      const transformedCouples = projects?.map((project, index) => {
        const weddingDate = new Date(project.event_date);
        const today = new Date();
        const dday = Math.ceil((weddingDate - today) / (1000 * 60 * 60 * 24));

        const names = (project.title || '').split(' & ');
        const initials =
          names.length >= 2
            ? names[0].charAt(0) + names[1].charAt(0)
            : (project.title || '??').substring(0, 2);

        return {
          id: project.id,
          initials,
          name: project.title || '이름 없음',
          date: `${weddingDate.getMonth() + 1}월 ${weddingDate.getDate()}일`,
          venue: project.location || '장소 미정',
          dday: dday > 0 ? dday : 0,
          progress: Math.max(0, Math.min(100, 100 - (dday / 365) * 100)),
          avatarBg: `var(--avatar-${index % 6}-bg)`,
          avatarColor: `var(--avatar-${index % 6}-color)`,
          barColor: `var(--stage-${Math.floor(index / 2) + 1}-bar)`,
          badgeBg: `var(--avatar-${index % 6}-bg)`,
          badgeColor: `var(--avatar-${index % 6}-color)`,
        };
      }) || [];

      setCouples(transformedCouples);
    } catch (error) {
      console.error('Error fetching couples:', error);
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

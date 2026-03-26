import { useState, useCallback } from 'react';
import { BASE_URL } from '../lib/api';

export const useBudgetOptimization = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const optimize = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/v2/budget/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      console.error('Optimization error:', err);
      setError('예산분석 도중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    optimize,
    loading,
    result,
    error,
    setResult
  };
};

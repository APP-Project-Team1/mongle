import { useState, useCallback } from 'react';
import { BASE_URL } from '../lib/api';

const REQUEST_TIMEOUT_MS = 12000;

const PRIORITY_WEIGHT = {
  low: 0,
  mid: 1,
  high: 2,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildFallbackPlan = ({
  type,
  title,
  explanation,
  targetBudget,
  selectedVendors,
  lockedCategories,
  categoryPriorities,
  ratio,
}) => {
  const entries = Object.entries(selectedVendors || {}).map(([category, vendor]) => ({
    category,
    currentPrice: Number(vendor?.price) || 0,
    locked: lockedCategories.includes(category),
    priority: categoryPriorities?.[category] || 'mid',
  }));

  const currentTotal = entries.reduce((sum, entry) => sum + entry.currentPrice, 0);
  const overflow = Math.max(0, currentTotal - targetBudget);

  if (overflow <= 0) {
    return {
      type,
      title,
      finalTotal: currentTotal,
      totalSaved: 0,
      explanation: '현재 예산 안에서 운영 가능해 큰 조정 없이 유지하는 안입니다.',
      changes: [],
    };
  }

  const adjustable = entries
    .filter((entry) => !entry.locked && entry.currentPrice > 0)
    .sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.currentPrice - a.currentPrice;
    });

  let remaining = overflow;
  const changes = [];

  for (const entry of adjustable) {
    if (remaining <= 0) break;

    const minRatio = entry.priority === 'high' ? 0.75 : entry.priority === 'mid' ? 0.55 : 0.25;
    const desiredCut = Math.round(entry.currentPrice * ratio);
    const maxCut = Math.max(0, entry.currentPrice - Math.round(entry.currentPrice * minRatio));
    const cut = clamp(Math.min(desiredCut, remaining), 0, maxCut);

    if (cut <= 0) continue;

    const nextPrice = Math.max(0, entry.currentPrice - cut);
    changes.push({
      category: entry.category,
      from: { price_min: entry.currentPrice },
      to: { price_min: nextPrice },
    });
    remaining -= cut;
  }

  if (remaining > 0) {
    for (const entry of adjustable) {
      if (remaining <= 0) break;

      const existingChange = changes.find((change) => change.category === entry.category);
      const currentPlannedPrice = existingChange ? existingChange.to.price_min : entry.currentPrice;
      const extraCut = Math.min(remaining, currentPlannedPrice);

      if (extraCut <= 0) continue;

      const nextPrice = currentPlannedPrice - extraCut;

      if (existingChange) {
        existingChange.to.price_min = nextPrice;
      } else {
        changes.push({
          category: entry.category,
          from: { price_min: entry.currentPrice },
          to: { price_min: nextPrice },
        });
      }

      remaining -= extraCut;
    }
  }

  const finalTotal = currentTotal - (overflow - remaining);
  const totalSaved = currentTotal - finalTotal;

  return {
    type,
    title,
    finalTotal,
    totalSaved,
    explanation: remaining > 0
      ? `${explanation} 잠금 항목과 우선순위를 최대한 반영했지만 ${remaining}만원은 추가 조정이 필요합니다.`
      : explanation,
    changes,
  };
};

const buildFallbackResult = (params) => {
  const selectedVendors = params?.selectedVendors || {};
  const targetBudget = Number(params?.totalBudget) || 0;
  const lockedCategories = params?.lockedCategories || [];
  const categoryPriorities = params?.categoryPriorities || {};
  const currentTotal = Object.values(selectedVendors).reduce(
    (sum, vendor) => sum + (Number(vendor?.price) || 0),
    0
  );

  return {
    overflow: Math.max(0, currentTotal - targetBudget),
    plans: [
      buildFallbackPlan({
        type: 'balanced',
        title: '균형 조정안',
        explanation: '우선순위가 낮은 항목부터 고르게 조정해 전체 예산을 맞추는 안입니다.',
        targetBudget,
        selectedVendors,
        lockedCategories,
        categoryPriorities,
        ratio: 0.18,
      }),
      buildFallbackPlan({
        type: 'max_savings',
        title: '절감 우선안',
        explanation: '절감 폭을 조금 더 크게 잡아 초과 예산을 빠르게 줄이는 안입니다.',
        targetBudget,
        selectedVendors,
        lockedCategories,
        categoryPriorities,
        ratio: 0.28,
      }),
      buildFallbackPlan({
        type: 'priority_protect',
        title: '우선순위 보호안',
        explanation: '중요도를 높게 둔 항목은 최대한 유지하고 다른 항목 위주로 조정하는 안입니다.',
        targetBudget,
        selectedVendors,
        lockedCategories,
        categoryPriorities,
        ratio: 0.14,
      }),
    ],
    fallback: true,
  };
};

export const useBudgetOptimization = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const optimize = useCallback(async (params) => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${BASE_URL}/api/v2/budget/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Optimization request failed with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const isTimeoutLike =
        err?.name === 'AbortError' ||
        /timed out/i.test(err?.message || '');

      if (!isTimeoutLike) {
        console.warn('Optimization fallback:', err);
      }

      const fallbackResult = buildFallbackResult(params);
      setResult(fallbackResult);
      setError('서버 연결이 지연되어 앱 내부 분석 결과를 표시합니다.');
      return fallbackResult;
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  return {
    optimize,
    loading,
    result,
    error,
    setResult,
  };
};

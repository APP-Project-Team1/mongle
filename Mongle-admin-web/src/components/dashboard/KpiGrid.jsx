import React from 'react';
import { useKpi } from '../../context/KpiContext';

export default function KpiGrid() {
  const { kpis, loading } = useKpi();

  if (loading) {
    return (
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">로딩 중...</div>
          <div className="kpi-label">담당 커플</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">로딩 중...</div>
          <div className="kpi-label">이번 달 결혼식</div>
        </div>
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {kpis.map((k, i) => (
        <div key={i} className="kpi-card" style={{ backgroundColor: k.bg }}>
          <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

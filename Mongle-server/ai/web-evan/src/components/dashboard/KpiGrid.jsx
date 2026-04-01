import React from 'react';
import { KPI_DATA } from '../../data/mockData';

export default function KpiGrid() {
  return (
    <div className="kpi-grid">
      {KPI_DATA.map((k, i) => (
        <div key={i} className="kpi-card" style={{ backgroundColor: k.bg }}>
          <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
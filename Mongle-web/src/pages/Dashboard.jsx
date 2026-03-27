import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAlertCircleOutline } from 'react-icons/io5';
import { PLANNER_NAME, TODAY, URGENT_TODO_COUNT } from '../data/mockData';
import KpiGrid from '../components/dashboard/KpiGrid';
import TodoWidget from '../components/dashboard/TodoWidget';
import CoupleWidget from '../components/dashboard/CoupleWidget';
import VendorWidget from '../components/dashboard/VendorWidget';
import FinanceWidget from '../components/dashboard/FinanceWidget';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="page-container dashboard-page">
      {/* Greeting */}
      <div className="greeting-block">
        <p className="greeting-date">{TODAY}</p>
        <h2 className="greeting-main">
          안녕하세요, <span className="greeting-name">{PLANNER_NAME}</span> 플래너님
        </h2>
        {URGENT_TODO_COUNT > 0 && (
          <div className="urgent-badge" onClick={() => navigate('/todos')} style={{ cursor: 'pointer' }}>
            <IoAlertCircleOutline size={14} />
            <span>오늘 마감 할 일 {URGENT_TODO_COUNT}건이 있어요</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <KpiGrid />

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-col">
          <TodoWidget />
          <CoupleWidget />
        </div>

        {/* Right Column */}
        <div className="dashboard-col">
          <VendorWidget />
          <FinanceWidget />
        </div>
      </div>
    </div>
  );
}

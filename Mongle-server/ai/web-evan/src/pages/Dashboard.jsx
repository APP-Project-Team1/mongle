import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAlertCircleOutline } from 'react-icons/io5';
import Seo from '../components/common/Seo';
import CoupleWidget from '../components/dashboard/CoupleWidget';
import FinanceWidget from '../components/dashboard/FinanceWidget';
import KpiGrid from '../components/dashboard/KpiGrid';
import TodoWidget from '../components/dashboard/TodoWidget';
import VendorWidget from '../components/dashboard/VendorWidget';
import { PLANNER_NAME, TODAY, URGENT_TODO_COUNT } from '../data/mockData';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page-container dashboard-page">
      <Seo
        title="대시보드 | 몽글 플래너 관리자"
        description="오늘 일정, KPI, 커플 현황, 협력 업체와 정산 현황을 한 화면에서 확인하세요."
      />

      <section className="greeting-block" aria-labelledby="dashboard-heading">
        <p className="greeting-date">{TODAY}</p>
        <h1 id="dashboard-heading" className="greeting-main">
          안녕하세요 <span className="greeting-name">{PLANNER_NAME}</span> 플래너님
        </h1>
        {URGENT_TODO_COUNT > 0 && (
          <button className="urgent-badge" onClick={() => navigate('/todos')} type="button">
            <IoAlertCircleOutline size={14} />
            <span>오늘 마감 할 일 {URGENT_TODO_COUNT}건이 있어요</span>
          </button>
        )}
      </section>

      <KpiGrid />

      <div className="dashboard-grid">
        <div className="dashboard-col">
          <TodoWidget />
          <CoupleWidget />
        </div>

        <div className="dashboard-col">
          <VendorWidget />
          <FinanceWidget />
        </div>
      </div>
    </div>
  );
}

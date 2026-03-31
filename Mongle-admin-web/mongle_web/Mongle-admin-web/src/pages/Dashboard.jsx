import { useEffect, useMemo, useState } from "react";
import { projectsApi } from "../lib/api";
import useDashboardData from "../hooks/useDashboardData";
import "./Dashboard.css";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");

  const { dashboard, loading, error, loadDashboard } = useDashboardData();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectsError("");
        const data = await projectsApi.getProjects();
        setProjects(data || []);

        if (data?.length > 0) {
          setCurrentProjectId(String(data[0].id));
        }
      } catch (err) {
        setProjectsError(err?.response?.data?.detail || err.message || "프로젝트 조회 실패");
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    if (currentProjectId) {
      loadDashboard(currentProjectId);
    }
  }, [currentProjectId, loadDashboard]);

  const summary = dashboard?.summary || {
    total_budget: 0,
    timeline_count: 0,
    vendor_count: 0,
    chat_count: 0,
  };

  const recentTimelines = useMemo(() => dashboard?.timelines?.slice(0, 5) || [], [dashboard]);
  const recentBudgets = useMemo(() => dashboard?.budgets?.slice(0, 5) || [], [dashboard]);
  const recentVendors = useMemo(() => dashboard?.vendors?.slice(0, 5) || [], [dashboard]);
  const recentChats = useMemo(() => dashboard?.chats?.slice(0, 5) || [], [dashboard]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>몽글 관리자 대시보드</h1>
          <p>웹 → FastAPI → Supabase 구조로 연결된 관리자 화면</p>
        </div>

        <div className="dashboard-select-wrap">
          <label htmlFor="projectSelect">현재 프로젝트</label>
          <select
            id="projectSelect"
            value={currentProjectId}
            onChange={(e) => setCurrentProjectId(e.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || project.title || `프로젝트 ${project.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(projectsLoading || loading) && <div className="state-box">불러오는 중...</div>}
      {(projectsError || error) && (
        <div className="state-box error">에러: {projectsError || error}</div>
      )}

      {!projectsLoading && !loading && !projectsError && !error && (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">총 예산</span>
              <strong>{Number(summary.total_budget || 0).toLocaleString()}원</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">일정 수</span>
              <strong>{summary.timeline_count || 0}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">업체 수</span>
              <strong>{summary.vendor_count || 0}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">채팅 수</span>
              <strong>{summary.chat_count || 0}</strong>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="panel">
              <h2>타임라인</h2>
              {recentTimelines.length === 0 ? (
                <p className="empty-text">일정이 없습니다.</p>
              ) : (
                <ul className="list">
                  {recentTimelines.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title || item.name || "제목 없음"}</strong>
                      <span>{item.date || item.event_date || "-"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2>예산</h2>
              {recentBudgets.length === 0 ? (
                <p className="empty-text">예산 항목이 없습니다.</p>
              ) : (
                <ul className="list">
                  {recentBudgets.map((item) => (
                    <li key={item.id}>
                      <strong>{item.category || item.title || "분류 없음"}</strong>
                      <span>{Number(item.amount || 0).toLocaleString()}원</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2>업체</h2>
              {recentVendors.length === 0 ? (
                <p className="empty-text">업체 정보가 없습니다.</p>
              ) : (
                <ul className="list">
                  {recentVendors.map((item) => (
                    <li key={item.id}>
                      <strong>{item.name || item.vendor_name || "업체명 없음"}</strong>
                      <span>{item.category || item.type || "-"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2>채팅</h2>
              {recentChats.length === 0 ? (
                <p className="empty-text">채팅 내역이 없습니다.</p>
              ) : (
                <ul className="list">
                  {recentChats.map((item) => (
                    <li key={item.id}>
                      <strong>{item.sender_name || item.role || "보낸 사람"}</strong>
                      <span>{item.message || item.content || "-"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

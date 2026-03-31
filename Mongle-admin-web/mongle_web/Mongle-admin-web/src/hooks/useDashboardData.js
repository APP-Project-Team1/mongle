import { useCallback, useState } from "react";
import { dashboardApi } from "../lib/api";

export default function useDashboardData() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");
      const data = await dashboardApi.getDashboard(projectId);
      setDashboard(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "대시보드 조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboard,
    loading,
    error,
    loadDashboard,
  };
}

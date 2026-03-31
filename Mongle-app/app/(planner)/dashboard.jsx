import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const fmt = (n) => (n / 10000).toLocaleString() + '만';

// 커플 이름 앞글자 2자 추출
const getInitials = (c) => (c.groom_name?.[0] ?? '') + (c.bride_name?.[0] ?? '');

// D-day 계산
const calcDday = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

// 이번 달 여부
const isThisMonth = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

const TODAY_LABEL = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

// 커플마다 색상 팔레트 순환
const PALETTES = [
  {
    avatarBg: '#fbeaf0',
    avatarColor: '#993556',
    barColor: '#d4537e',
    badgeBg: '#fbeaf0',
    badgeColor: '#993556',
  },
  {
    avatarBg: '#f5ede8',
    avatarColor: '#8b5e52',
    barColor: '#b07858',
    badgeBg: '#f5ede8',
    badgeColor: '#8b5e52',
  },
  {
    avatarBg: '#f0ede8',
    avatarColor: '#6e6058',
    barColor: '#a09080',
    badgeBg: '#f0ede8',
    badgeColor: '#6e6058',
  },
  {
    avatarBg: '#eeeae6',
    avatarColor: '#7a7068',
    barColor: '#c0b8b0',
    badgeBg: '#eeeae6',
    badgeColor: '#7a7068',
  },
];

export default function PlannerDashboard() {
  const { unreadCount } = useNotifications();
  const { planner_id } = useAuth(); // ← AuthContext에서 planner_id 꺼내기

  const [plannerName, setPlannerName] = useState('');
  const [couples, setCouples] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── 초기 로드 + Realtime 구독 ──────────────────────────
  useEffect(() => {
    if (!planner_id) return;

    fetchAll();

    const couplesChannel = supabase
      .channel(`dashboard-couples-${planner_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples',
          filter: `planner_id=eq.${planner_id}`,
        },
        fetchCouples,
      )
      .subscribe();

    const schedulesChannel = supabase
      .channel(`dashboard-schedules-${planner_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_schedules',
          filter: `planner_id=eq.${planner_id}`,
        },
        fetchTodos,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(couplesChannel);
      supabase.removeChannel(schedulesChannel);
    };
  }, [planner_id]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPlannerName(), fetchCouples(), fetchTodos()]);
    setLoading(false);
  };

  // 플래너 이름 조회
  const fetchPlannerName = async () => {
    const { data } = await supabase
      .from('wedding_planners')
      .select('name')
      .eq('id', planner_id)
      .single();
    if (data) setPlannerName(data.name);
  };

  // 담당 커플 목록 조회
  const fetchCouples = async () => {
    const { data, error } = await supabase
      .from('couples')
      .select(
        'id, groom_name, bride_name, wedding_date, venue, stage, progress, total_amount, received_amount, due_date',
      )
      .eq('planner_id', planner_id)
      .order('wedding_date', { ascending: true });
    if (!error && data) setCouples(data);
  };

  // 할 일(일정) 조회 — 커플 이름도 join
  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('couple_schedules')
      .select('id, title, done, scheduled_date, couples(groom_name, bride_name)')
      .eq('planner_id', planner_id)
      .order('scheduled_date', { ascending: true });
    if (!error && data) setTodos(data);
  };

  // 할 일 완료 토글 (낙관적 업데이트)
  const toggleTodo = async (id, currentDone) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !currentDone } : t)));
    const { error } = await supabase
      .from('couple_schedules')
      .update({ done: !currentDone })
      .eq('id', id);
    if (error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: currentDone } : t)));
    }
  };

  // ── 파생 계산 ───────────────────────────────────────────
  const activeCount = couples.filter((c) => c.stage !== '완료').length;
  const doneCount = couples.filter((c) => c.stage === '완료').length;
  const thisMonthCouples = couples.filter((c) => isThisMonth(c.wedding_date));

  const today = new Date().toISOString().split('T')[0];
  const urgentTodos = todos.filter((t) => !t.done && t.scheduled_date === today);
  const upcomingCouples = couples
    .filter((c) => c.wedding_date)
    .sort((a, b) => new Date(a.wedding_date) - new Date(b.wedding_date))
    .slice(0, 4);

  const totalRevenue = couples.reduce((s, c) => s + (c.received_amount ?? 0), 0);
  const totalUnpaid = couples.reduce(
    (s, c) => s + ((c.total_amount ?? 0) - (c.received_amount ?? 0)),
    0,
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#c97b6e" style={{ marginTop: 120 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf8f5" />

      {/* ── 헤더 ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#8b5e52" />
        </TouchableOpacity>
        <Text style={styles.logo}>Mongle</Text>
        <TouchableOpacity onPress={() => router.push('/(planner)/notifications')}>
          <Ionicons name="notifications-outline" size={20} color="#3a2e2a" />
          {unreadCount > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      {/* ── 플래너 뱃지 ── */}
      <View style={styles.plannerBadgeRow}>
        <View style={styles.plannerBadge}>
          <Ionicons name="briefcase-outline" size={12} color="#917878" />
          <Text style={styles.plannerBadgeText}>플래너 전용 화면</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── 인사말 ── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingDate}>{TODAY_LABEL}</Text>
          <Text style={styles.greetingMain}>
            안녕하세요, <Text style={styles.greetingName}>{plannerName}</Text> 플래너님
          </Text>
          {urgentTodos.length > 0 && (
            <View style={styles.urgentBadge}>
              <Ionicons name="alert-circle-outline" size={13} color="#ea806d" />
              <Text style={styles.urgentText}>오늘 마감 할 일 {urgentTodos.length}건이 있어요</Text>
            </View>
          )}
        </View>

        {/* ── KPI 카드 ── */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#f9f1ee' }]}>
            <Text style={[styles.kpiValue, { color: '#c39874' }]}>{activeCount + doneCount}</Text>
            <Text style={styles.kpiLabel}>담당 커플</Text>
            <Text style={styles.kpiSub}>
              진행 {activeCount} · 완료 {doneCount}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#f9eeee' }]}>
            <Text style={[styles.kpiValue, { color: '#c97b6e' }]}>{thisMonthCouples.length}</Text>
            <Text style={styles.kpiLabel}>이번 달 결혼식</Text>
            <Text style={styles.kpiSub}>
              {thisMonthCouples.map((c) => new Date(c.wedding_date).getDate() + '일').join(' · ')}
            </Text>
          </View>
        </View>

        {/* ── 구분선 ── */}
        <View style={styles.divider} />

        {/* ── 오늘 할 일 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>오늘 할 일</Text>
            <TouchableOpacity
              onPress={() => router.push('/(planner)/planner_todo_list')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMore}>전체 보기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.todoCard}>
            {todos.slice(0, 5).map((t, idx) => {
              const coupleName = t.couples
                ? `${t.couples.groom_name ?? ''}·${t.couples.bride_name ?? ''}`
                : '';
              const isUrgent = t.scheduled_date === today && !t.done;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.todoItem,
                    idx === Math.min(todos.length, 5) - 1 && { borderBottomWidth: 0 },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => toggleTodo(t.id, t.done)}
                >
                  <View style={[styles.checkbox, t.done && styles.checkboxDone]}>
                    {t.done && <Ionicons name="checkmark" size={11} color="#7aaa50" />}
                  </View>
                  <View style={styles.todoContent}>
                    <Text style={[styles.todoText, t.done && styles.todoTextDone]}>{t.title}</Text>
                    <Text style={[styles.todoTag, isUrgent && styles.todoTagUrgent]}>
                      {coupleName}
                      {isUrgent ? ' · 오늘 마감' : ''}
                    </Text>
                  </View>
                  {isUrgent && <View style={styles.urgentDot} />}
                </TouchableOpacity>
              );
            })}
            {todos.length === 0 && (
              <Text style={{ padding: 16, color: '#b8aca8', fontSize: 13 }}>할 일이 없어요 🎉</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 임박한 커플 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>임박한 커플</Text>
            <TouchableOpacity
              onPress={() => router.push('/(planner)/couple_list')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMore}>전체 보기</Text>
            </TouchableOpacity>
          </View>

          {upcomingCouples.map((c, i) => {
            const pal = PALETTES[i % PALETTES.length];
            const dday = calcDday(c.wedding_date);
            const wDate = c.wedding_date
              ? new Date(c.wedding_date).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                })
              : '날짜 미정';
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.coupleCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/(planner)/customer/${c.id}`)}
              >
                <View style={styles.coupleRow}>
                  <View style={[styles.avatar, { backgroundColor: pal.avatarBg }]}>
                    <Text style={[styles.avatarText, { color: pal.avatarColor }]}>
                      {getInitials(c)}
                    </Text>
                  </View>
                  <View style={styles.coupleInfo}>
                    <Text style={styles.coupleName}>
                      {c.groom_name} · {c.bride_name}
                    </Text>
                    <Text style={styles.coupleVenue}>
                      {wDate} · {c.venue ?? '장소 미정'}
                    </Text>
                  </View>
                  {dday !== null && (
                    <View style={[styles.ddayBadge, { backgroundColor: pal.badgeBg }]}>
                      <Text style={[styles.ddayText, { color: pal.badgeColor }]}>D-{dday}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${c.progress ?? 0}%`, backgroundColor: pal.barColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPct}>{c.progress ?? 0}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* ── 협력 업체 현황 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>협력 업체 현황</Text>
            <TouchableOpacity
              onPress={() => router.push('/(planner)/wedding_vendor_partners')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMore}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          {/* 업체 데이터는 별도 테이블 연동 시 추가 예정 */}
          <View style={[styles.vendorGrid, { paddingVertical: 12, alignItems: 'center' }]}>
            <Text style={{ color: '#b8aca8', fontSize: 13 }}>업체 현황을 불러오는 중...</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 비용 현황 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>비용 현황</Text>
            <TouchableOpacity
              onPress={() => router.push('/(planner)/planner_budget')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionMore}>상세 보기</Text>
            </TouchableOpacity>
          </View>

          {/* 요약 KPI */}
          <View style={styles.financeKpiRow}>
            <View style={styles.financeKpi}>
              <Text style={styles.financeKpiLabel}>수금 총액</Text>
              <Text style={styles.financeKpiValue}>{fmt(totalRevenue)}원</Text>
            </View>
            <View style={styles.financeKpiDivider} />
            <View style={styles.financeKpi}>
              <Text style={styles.financeKpiLabel}>미수금</Text>
              <Text style={[styles.financeKpiValue, { color: '#c97b6e' }]}>
                {fmt(totalUnpaid)}원
              </Text>
            </View>
          </View>

          {/* 미수금 커플 목록 */}
          <View style={styles.financeList}>
            {couples
              .filter((c) => (c.received_amount ?? 0) < (c.total_amount ?? 0))
              .map((c, idx, arr) => {
                const unpaid = (c.total_amount ?? 0) - (c.received_amount ?? 0);
                const p = c.total_amount
                  ? Math.round(((c.received_amount ?? 0) / c.total_amount) * 100)
                  : 0;
                return (
                  <View
                    key={c.id}
                    style={[styles.financeRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.financeRowTop}>
                        <Text style={styles.financeCoupleName}>
                          {c.groom_name} · {c.bride_name}
                        </Text>
                        <Text style={styles.financeUnpaid}>-{fmt(unpaid)}원</Text>
                      </View>
                      <View style={styles.financeProgWrap}>
                        <View style={styles.financeProgTrack}>
                          <View style={[styles.financeProgFill, { width: `${p}%` }]} />
                        </View>
                        <Text style={styles.financeProgPct}>{p}%</Text>
                      </View>
                      {c.due_date && (
                        <Text style={styles.financeDue}>
                          {new Date(c.due_date).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                          })}
                          까지
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 스타일 ────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#917878',
    letterSpacing: 1,
  },
  notifBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    backgroundColor: '#e87070',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#faf8f5',
  },

  // 플래너 뱃지
  plannerBadgeRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  plannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  plannerBadgeText: {
    fontSize: 11,
    color: '#917878',
    fontWeight: '500',
  },

  // 인사말
  greetingBlock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greetingDate: {
    fontSize: 11,
    color: '#a08880',
    marginBottom: 4,
  },
  greetingMain: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3a2e2a',
  },
  greetingName: {
    color: '#c97b6e',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: '#faebe9',
    borderWidth: 0.5,
    borderColor: '#ea806d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  urgentText: {
    fontSize: 12,
    color: '#ea806d',
  },

  // KPI 그리드
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 16,
  },
  kpiCard: {
    width: '47.5%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#d29b8d',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#776d6a',
  },
  kpiSub: {
    fontSize: 10,
    color: '#655f5d',
    marginTop: 2,
  },

  // 구분선
  divider: {
    height: 0.5,
    backgroundColor: '#ede5de',
    marginHorizontal: 20,
    marginBottom: 16,
  },

  // 섹션 공통
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  sectionMore: {
    fontSize: 12,
    color: '#c97b6e',
  },

  // 커플 카드
  coupleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    padding: 14,
    marginBottom: 10,
  },
  coupleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coupleInfo: {
    flex: 1,
  },
  coupleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  coupleVenue: {
    fontSize: 11,
    color: '#a08880',
    marginTop: 2,
  },
  ddayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ddayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0e8e3',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 11,
    color: '#a08880',
    minWidth: 28,
    textAlign: 'right',
  },

  // 할 일 카드
  todoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingHorizontal: 14,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f0eb',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d8ccc6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: '#e8f0e0',
    borderColor: '#9aba7a',
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 13,
    color: '#3a2e2a',
  },
  todoTextDone: {
    color: '#b8aca8',
    textDecorationLine: 'line-through',
  },
  todoTag: {
    fontSize: 11,
    color: '#a08880',
    marginTop: 2,
  },
  todoTagUrgent: {
    color: '#b07840',
    fontWeight: '500',
  },
  urgentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#e87070',
  },

  // 협력 업체 그리드
  vendorGrid: {
    gap: 8,
  },
  vendorCategoryBlock: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
  },
  vendorCategoryTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#a08880',
    marginBottom: 6,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f0eb',
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3a2e2a',
    flex: 1,
    marginRight: 8,
  },
  vendorStatus: {
    fontSize: 11,
    fontWeight: '500',
  },

  // 비용 현황
  financeKpiRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingVertical: 14,
    marginBottom: 10,
  },
  financeKpi: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  financeKpiDivider: {
    width: 0.5,
    backgroundColor: '#ede5de',
  },
  financeKpiLabel: {
    fontSize: 11,
    color: '#a08880',
  },
  financeKpiValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  financeList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingHorizontal: 14,
  },
  financeRow: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f0eb',
  },
  financeRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  financeCoupleName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3a2e2a',
  },
  financeUnpaid: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c97b6e',
  },
  financeProgWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  financeProgTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0e8e3',
    borderRadius: 2,
    overflow: 'hidden',
  },
  financeProgFill: {
    height: '100%',
    backgroundColor: '#c97b6e',
    borderRadius: 2,
  },
  financeProgPct: {
    fontSize: 11,
    color: '#a08880',
    minWidth: 28,
    textAlign: 'right',
  },
  financeDue: {
    fontSize: 11,
    color: '#b07840',
  },
  vendorCostSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#fdf6ee',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#f0dcc8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  vendorCostSummaryText: {
    fontSize: 12,
    color: '#b07840',
    fontWeight: '500',
  },
});

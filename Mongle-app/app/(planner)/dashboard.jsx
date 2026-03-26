import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';

// ── 임시 데이터 ──────────────────────────────────────────

const PLANNER_NAME = '수진';
const TODAY = '2026년 3월 26일 목요일';
const URGENT_TODO_COUNT = 2;

const KPI_DATA = [
  { label: '담당 커플', value: '12', sub: '진행 8 · 완료 4', color: '#c39874', bg: '#f9f1ee' },
  {
    label: '이번 달 결혼식',
    value: '3',
    sub: '4월 5 · 12 · 26일',
    color: '#c97b6e',
    bg: '#f9eeee',
  },
];

const COUPLES = [
  {
    id: '1',
    initials: '박이',
    name: '박지수 · 이현우',
    date: '4월 5일',
    venue: '더채플 청담',
    dday: 11,
    progress: 92,
    avatarBg: '#fbeaf0',
    avatarColor: '#993556',
    barColor: '#d4537e',
    badgeBg: '#fbeaf0',
    badgeColor: '#993556',
  },
  {
    id: '2',
    initials: '최강',
    name: '최민정 · 강태준',
    date: '4월 12일',
    venue: '롯데호텔 잠실',
    dday: 18,
    progress: 78,
    avatarBg: '#f5ede8',
    avatarColor: '#8b5e52',
    barColor: '#b07858',
    badgeBg: '#f5ede8',
    badgeColor: '#8b5e52',
  },
  {
    id: '3',
    initials: '윤오',
    name: '윤서연 · 오민석',
    date: '4월 26일',
    venue: '그랜드 인터컨티',
    dday: 32,
    progress: 55,
    avatarBg: '#f0ede8',
    avatarColor: '#6e6058',
    barColor: '#a09080',
    badgeBg: '#f0ede8',
    badgeColor: '#6e6058',
  },
  {
    id: '4',
    initials: '정김',
    name: '정하린 · 김도윤',
    date: '5월 31일',
    venue: '더베뉴 한남',
    dday: 67,
    progress: 30,
    avatarBg: '#eeeae6',
    avatarColor: '#7a7068',
    barColor: '#c0b8b0',
    badgeBg: '#eeeae6',
    badgeColor: '#7a7068',
  },
];

const TODOS = [
  { id: '1', text: '청첩장 시안 최종 확인', couple: '박지수·이현우', done: true, urgent: false },
  { id: '2', text: '드레스 피팅 일정 조율', couple: '최민정·강태준', done: false, urgent: true },
  { id: '3', text: '스튜디오 계약서 검토', couple: '윤서연·오민석', done: false, urgent: true },
  { id: '4', text: '웨딩홀 잔금 납부 확인', couple: '박지수·이현우', done: false, urgent: false },
  { id: '5', text: '메이크업 미팅 메모 정리', couple: '최민정·강태준', done: true, urgent: false },
];

const VENDORS = [
  { id: '1', type: '스튜디오', name: '일다스튜디오', status: '계약 완료', statusColor: '#5a8c3a' },
  { id: '2', type: '드레스', name: '르블랑 웨딩', status: '피팅 조율', statusColor: '#b07840' },
  { id: '3', type: '메이크업', name: '뷰티스튜디오K', status: '계약 완료', statusColor: '#5a8c3a' },
  { id: '4', type: '웨딩홀', name: '더채플 청담', status: '잔금 미납', statusColor: '#c97b6e' },
  { id: '5', type: '허니문', name: '제이여행사', status: '견적 협의', statusColor: '#8b7060' },
  { id: '6', type: '청첩장', name: '페이퍼가든', status: '발주 완료', statusColor: '#5a8c3a' },
];

const VENDOR_CATEGORIES = [
  '스튜디오',
  '드레스',
  '메이크업',
  '웨딩홀',
  '허니문',
  '청첩장',
  '영상·스냅',
];

const FINANCE = {
  couples: [
    {
      id: '1',
      name: '박지수 · 이현우',
      total: 38000000,
      received: 31500000,
      due: '4월 1일',
      vendorCosts: [
        { vendor: '일다스튜디오', amount: 5000000, paid: true },
        { vendor: '르블랑 웨딩', amount: 8000000, paid: false },
        { vendor: '더채플 청담', amount: 9000000, paid: false },
      ],
    },
    {
      id: '2',
      name: '최민정 · 강태준',
      total: 42000000,
      received: 21000000,
      due: '4월 8일',
      vendorCosts: [
        { vendor: '일다스튜디오', amount: 5500000, paid: true },
        { vendor: '뷰티스튜디오K', amount: 3000000, paid: false },
        { vendor: '롯데호텔 잠실', amount: 12000000, paid: false },
      ],
    },
    {
      id: '3',
      name: '윤서연 · 오민석',
      total: 35000000,
      received: 35000000,
      due: null,
      vendorCosts: [
        { vendor: '모먼트 스냅', amount: 4000000, paid: true },
        { vendor: '그랜드 인터컨티', amount: 10000000, paid: true },
      ],
    },
    {
      id: '4',
      name: '정하린 · 김도윤',
      total: 28000000,
      received: 7000000,
      due: '5월 10일',
      vendorCosts: [
        { vendor: '페이퍼가든', amount: 800000, paid: false },
        { vendor: '더베뉴 한남', amount: 8000000, paid: false },
      ],
    },
  ],
};

// 파생 계산
const totalRevenue = FINANCE.couples.reduce((s, c) => s + c.received, 0);
const totalUnpaid = FINANCE.couples.reduce((s, c) => s + (c.total - c.received), 0);
const unpaidVendorAmt = FINANCE.couples.reduce(
  (s, c) => s + c.vendorCosts.filter((v) => !v.paid).reduce((a, v) => a + v.amount, 0),
  0,
);
const unpaidVendorCnt = FINANCE.couples.reduce(
  (s, c) => s + c.vendorCosts.filter((v) => !v.paid).length,
  0,
);
const fmt = (n) => (n / 10000).toLocaleString() + '만';
// ──────────────────────────────────────────────────────────

export default function PlannerDashboard() {
  const { unreadCount } = useNotifications();
  const [todos, setTodos] = useState(TODOS);

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

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
          <Text style={styles.greetingDate}>{TODAY}</Text>
          <Text style={styles.greetingMain}>
            안녕하세요, <Text style={styles.greetingName}>{PLANNER_NAME}</Text> 플래너님
          </Text>
          {URGENT_TODO_COUNT > 0 && (
            <View style={styles.urgentBadge}>
              <Ionicons name="alert-circle-outline" size={13} color="#ea806d" />
              <Text style={styles.urgentText}>오늘 마감 할 일 {URGENT_TODO_COUNT}건이 있어요</Text>
            </View>
          )}
        </View>

        {/* ── KPI 카드 ── */}
        <View style={styles.kpiGrid}>
          {KPI_DATA.map((k) => (
            <View key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg }]}>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiSub}>{k.sub}</Text>
            </View>
          ))}
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
            {todos.map((t, idx) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.todoItem, idx === todos.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => toggleTodo(t.id)}
              >
                <View style={[styles.checkbox, t.done && styles.checkboxDone]}>
                  {t.done && <Ionicons name="checkmark" size={11} color="#7aaa50" />}
                </View>
                <View style={styles.todoContent}>
                  <Text style={[styles.todoText, t.done && styles.todoTextDone]}>{t.text}</Text>
                  <Text style={[styles.todoTag, t.urgent && !t.done && styles.todoTagUrgent]}>
                    {t.couple}
                    {t.urgent && !t.done ? ' · 오늘 마감' : ''}
                  </Text>
                </View>
                {t.urgent && !t.done && <View style={styles.urgentDot} />}
              </TouchableOpacity>
            ))}
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

          {COUPLES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.coupleCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/(planner)/customer/${c.id}`)}
            >
              <View style={styles.coupleRow}>
                <View style={[styles.avatar, { backgroundColor: c.avatarBg }]}>
                  <Text style={[styles.avatarText, { color: c.avatarColor }]}>{c.initials}</Text>
                </View>
                <View style={styles.coupleInfo}>
                  <Text style={styles.coupleName}>{c.name}</Text>
                  <Text style={styles.coupleVenue}>
                    {c.date} · {c.venue}
                  </Text>
                </View>
                <View style={[styles.ddayBadge, { backgroundColor: c.badgeBg }]}>
                  <Text style={[styles.ddayText, { color: c.badgeColor }]}>D-{c.dday}</Text>
                </View>
              </View>
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${c.progress}%`, backgroundColor: c.barColor },
                    ]}
                  />
                </View>
                <Text style={styles.progressPct}>{c.progress}%</Text>
              </View>
            </TouchableOpacity>
          ))}
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

          <View style={styles.vendorGrid}>
            {VENDOR_CATEGORIES.map((category) => ({
              category,
              items: VENDORS.filter((v) => v.type === category),
            }))
              .filter(({ items }) => items.length > 0)
              .slice(0, 3)
              .map(({ category, items }) => (
                <View key={category} style={styles.vendorCategoryBlock}>
                  <Text style={styles.vendorCategoryTitle}>{category}</Text>
                  {items.slice(0, 3).map((v, idx, arr) => (
                    <View
                      key={v.id}
                      style={[styles.vendorRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                    >
                      <Text style={styles.vendorName} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <Text style={[styles.vendorStatus, { color: v.statusColor }]}>
                        {v.status}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
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

          {/* 요약 KPI 3칸 */}
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
            <View style={styles.financeKpiDivider} />
            <View style={styles.financeKpi}>
              <Text style={styles.financeKpiLabel}>미지급 업체</Text>
              <Text style={[styles.financeKpiValue, { color: '#b07840' }]}>
                {unpaidVendorCnt}건
              </Text>
            </View>
          </View>

          {/* 커플별 수금 현황 */}
          <View style={styles.financeList}>
            {FINANCE.couples
              .filter((c) => c.received < c.total)
              .map((c, idx, arr) => {
                const unpaid = c.total - c.received;
                const p = Math.round((c.received / c.total) * 100);
                return (
                  <View
                    key={c.id}
                    style={[styles.financeRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.financeRowTop}>
                        <Text style={styles.financeCoupleName}>{c.name}</Text>
                        <Text style={styles.financeUnpaid}>-{fmt(unpaid)}원</Text>
                      </View>
                      <View style={styles.financeProgWrap}>
                        <View style={styles.financeProgTrack}>
                          <View style={[styles.financeProgFill, { width: `${p}%` }]} />
                        </View>
                        <Text style={styles.financeProgPct}>{p}%</Text>
                      </View>
                      {c.due && <Text style={styles.financeDue}>{c.due}까지</Text>}
                    </View>
                  </View>
                );
              })}
          </View>

          {/* 미지급 업체 요약 */}
          {unpaidVendorCnt > 0 && (
            <View style={styles.vendorCostSummary}>
              <Ionicons name="alert-circle-outline" size={14} color="#b07840" />
              <Text style={styles.vendorCostSummaryText}>
                미지급 업체 {unpaidVendorCnt}건 · 총 {fmt(unpaidVendorAmt)}원
              </Text>
            </View>
          )}
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

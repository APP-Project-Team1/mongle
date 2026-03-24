import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

// ── 데이터 ──────────────────────────────────────────────
const TIMELINE_ITEMS = [
  { id: 1, label: '웨딩홀 계약 완료', date: '2025년 10월 5일', status: 'done' },
  { id: 2, label: '스튜디오 계약 완료', date: '2025년 10월 20일', status: 'done' },
  { id: 3, label: '드레스 1차 시착', date: '2025년 11월 8일', status: 'done' },
  { id: 4, label: '드레스 2차 시착 — 진행 중', date: '2026년 1월 15일 · D-15', status: 'active' },
  { id: 5, label: '본식 스냅 촬영', date: '2026년 3월 10일', status: 'next' },
  { id: 6, label: '본식', date: '2026년 7월 25일', status: 'future' },
];

const SCHEDULE_EVENTS = [
  {
    date: '2026-01-15',
    label: '1월 15일 — 드레스 2차 시착 · 오후 2시 (드레스 로즈)',
    color: 'rose',
  },
  { date: '2026-01-21', label: '1월 21일 — 웨딩홀 식순 미팅 · 오전 11시', color: 'sage' },
];

const COST_ITEMS = [
  { label: '웨딩홀 (계약)', value: '380만원', warn: false },
  { label: '스튜디오 (계약)', value: '160만원', warn: false },
  { label: '드레스', value: '95만원', warn: false },
  { label: '메이크업', value: '28만원', warn: false },
  { label: '헤어 (추가 옵션)', value: '+8만원', warn: true },
  { label: '예상 추가 비용', value: '미정', warn: false, gray: true },
];

const BALANCE_ITEMS = [
  { label: '드레스 잔금', sub: '2월 1일 마감 · D-32', amount: '72만원', urgent: true },
  { label: '스튜디오 잔금', sub: '3월 10일 마감 · D-69', amount: '80만원', urgent: false },
  { label: '웨딩홀 잔금', sub: '6월 25일 마감 · D-176', amount: '190만원', urgent: false },
];

const MARKED_DATES = {
  '2026-01-15': { selected: true, selectedColor: '#C9716A' },
  '2026-01-21': { marked: true, dotColor: '#7A9E8E', selectedColor: '#EBF2EE', selected: true },
};
// ────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* ── ① 플래너 정보 배너 ── */}
        <View style={styles.bannerCard}>
          {/* 플래너 */}
          <View style={styles.plannerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>박</Text>
            </View>
            <View>
              <Text style={styles.plannerLabel}>담당 플래너</Text>
              <Text style={styles.plannerName}>박지현 플래너</Text>
              <Text style={styles.onlineText}>● 온라인</Text>
            </View>
          </View>

          {/* D-day */}
          <View style={styles.ddayWrap}>
            <Text style={styles.ddayText}>D-127</Text>
            <Text style={styles.ddaySub}>2026년 7월 25일 (토)</Text>
          </View>

          {/* 통계 */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValueRose}>73%</Text>
              <Text style={styles.statLabel}>준비 완료</Text>
            </View>
            <View style={[styles.statBox, { marginLeft: 8 }]}>
              <Text style={styles.statValueInk}>3</Text>
              <Text style={styles.statLabel}>미확인 알림</Text>
            </View>
          </View>
        </View>

        {/* ── ② 결혼 준비 타임라인 ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>결혼 준비 타임라인</Text>
          <View style={styles.timelineWrap}>
            {/* 세로선 */}
            <View style={styles.timelineLine} />
            {TIMELINE_ITEMS.map((item) => (
              <View key={item.id} style={styles.tlItem}>
                <View style={[styles.tlDot, styles[`dot_${item.status}`]]} />
                <View>
                  <Text
                    style={[
                      styles.tlLabel,
                      item.status === 'active' && { color: '#C9716A' },
                      item.status === 'future' && { color: '#B8A9A5' },
                      item.status === 'next' && { color: '#6B5B55' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.tlDate, item.status === 'active' && { color: '#C9716A' }]}>
                    {item.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── ③ 일정 관리 달력 ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>일정 관리</Text>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={MARKED_DATES}
            theme={{
              selectedDayBackgroundColor: '#C9716A',
              todayTextColor: '#C9716A',
              arrowColor: '#C9716A',
              dotColor: '#7A9E8E',
              textDayFontSize: 13,
              textMonthFontSize: 14,
              textDayHeaderFontSize: 11,
              calendarBackground: '#fff',
            }}
            style={{ borderRadius: 10 }}
          />
          <View style={{ marginTop: 12, gap: 6 }}>
            {SCHEDULE_EVENTS.map((ev, i) => (
              <View
                key={i}
                style={[
                  styles.eventBadge,
                  ev.color === 'rose' ? styles.eventRose : styles.eventSage,
                ]}
              >
                <Text
                  style={[
                    styles.eventText,
                    ev.color === 'rose' ? { color: '#C9716A' } : { color: '#7A9E8E' },
                  ]}
                >
                  {ev.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── ④ 비용 관리 ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>비용 관리</Text>
            <View style={styles.badgeRose}>
              <Text style={styles.badgeRoseText}>투명 공개</Text>
            </View>
          </View>
          {COST_ITEMS.map((item, i) => (
            <View key={i} style={styles.costRow}>
              <Text style={styles.costLabel}>{item.label}</Text>
              <Text
                style={[
                  styles.costValue,
                  item.warn && { color: '#C9716A' },
                  item.gray && { color: '#B8A9A5' },
                ]}
              >
                {item.warn && '⚠ '}
                {item.value}
              </Text>
            </View>
          ))}
          <View style={styles.costTotalRow}>
            <Text style={styles.costTotalLabel}>현재 합계</Text>
            <Text style={styles.costTotalValue}>671만원</Text>
          </View>
          {/* 프로그레스 바 */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '67%' }]} />
          </View>
          <Text style={styles.progressSub}>예산 1,000만원 중 671만원 사용</Text>
        </View>

        {/* ── ⑤ 잔금 일정 ── */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>잔금 일정</Text>
            <Text style={styles.annoText}>자동 알림</Text>
          </View>
          {BALANCE_ITEMS.map((item, i) => (
            <View key={i} style={styles.balanceRow}>
              <View style={[styles.balanceDot, item.urgent && { backgroundColor: '#C9716A' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>{item.label}</Text>
                <Text style={styles.balanceSub}>{item.sub}</Text>
              </View>
              <Text style={[styles.balanceAmount, item.urgent && { color: '#C9716A' }]}>
                {item.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 스타일 ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2EDE8' },
  container: { padding: 16, gap: 14 },

  // 배너 카드
  bannerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  plannerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8C5C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '500', color: '#C9716A' },
  plannerLabel: { fontSize: 10, color: '#6B5B55', marginBottom: 2 },
  plannerName: { fontSize: 13, fontWeight: '500', color: '#2C2420' },
  onlineText: { fontSize: 10, color: '#7A9E8E', marginTop: 1 },

  ddayWrap: { alignItems: 'center' },
  ddayText: { fontFamily: 'serif', fontSize: 30, fontWeight: '700', color: '#C9716A' },
  ddaySub: { fontSize: 10, color: '#6B5B55', marginTop: 2 },

  statsRow: { flexDirection: 'row' },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE5E2',
  },
  statValueRose: { fontSize: 16, fontWeight: '700', color: '#C9716A' },
  statValueInk: { fontSize: 16, fontWeight: '700', color: '#2C2420' },
  statLabel: { fontSize: 10, color: '#6B5B55', marginTop: 2 },

  // 공통 카드
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#2C2420', marginBottom: 14 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // 타임라인
  timelineWrap: { paddingLeft: 20, position: 'relative' },
  timelineLine: {
    position: 'absolute',
    left: 25,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: '#EDE5E2',
  },
  tlItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  tlDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#fff',
    marginTop: 2,
    flexShrink: 0,
  },
  dot_done: { backgroundColor: '#7A9E8E', borderColor: '#7A9E8E' },
  dot_active: { backgroundColor: '#C9716A', borderColor: '#C9716A' },
  dot_next: { backgroundColor: '#fff', borderColor: '#C9716A' },
  dot_future: { backgroundColor: '#fff', borderColor: '#EDE5E2' },
  tlLabel: { fontSize: 13, fontWeight: '500', color: '#2C2420' },
  tlDate: { fontSize: 11, color: '#B8A9A5', marginTop: 2 },

  // 일정 이벤트
  eventBadge: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  eventRose: { backgroundColor: '#F5EAE9', borderLeftColor: '#C9716A' },
  eventSage: { backgroundColor: '#EBF2EE', borderLeftColor: '#7A9E8E' },
  eventText: { fontSize: 12, fontWeight: '500' },

  // 비용
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E2',
  },
  costLabel: { fontSize: 12, color: '#6B5B55' },
  costValue: { fontSize: 12, fontWeight: '500', color: '#2C2420' },
  costTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  costTotalLabel: { fontSize: 13, fontWeight: '700', color: '#C9716A' },
  costTotalValue: { fontSize: 13, fontWeight: '700', color: '#C9716A' },
  progressBar: {
    height: 5,
    backgroundColor: '#EDE5E2',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#C9716A', borderRadius: 3 },
  progressSub: { fontSize: 10, color: '#B8A9A5', textAlign: 'right', marginTop: 4 },

  // 배지
  badgeRose: {
    backgroundColor: '#F5EAE9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeRoseText: { fontSize: 10, fontWeight: '500', color: '#C9716A' },
  annoText: {
    fontSize: 10,
    color: '#B8A9A5',
    borderWidth: 1,
    borderColor: '#B8A9A5',
    borderStyle: 'dashed',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // 잔금
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E2',
    gap: 10,
  },
  balanceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EDE5E2',
    flexShrink: 0,
  },
  balanceLabel: { fontSize: 13, fontWeight: '500', color: '#2C2420' },
  balanceSub: { fontSize: 10, color: '#B8A9A5', marginTop: 2 },
  balanceAmount: { fontSize: 13, fontWeight: '500', color: '#2C2420' },
});

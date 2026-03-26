import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useProjectStore } from '../../stores';
import { useTimelines, useBudget, useBudgetItems, useCreateTimeline, useUpdateTimeline, useDeleteTimeline } from '../../hooks';
import ProjectSelector from './components/ProjectSelector';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorView from '../../components/common/ErrorView';

const { width } = Dimensions.get('window');

const formatMoney = (amount) => {
  if (typeof amount !== 'number') return amount
  return `${amount.toLocaleString()}원`
}

const getStatus = (item, index) => {
  if (item.status) return item.status
  if (index < 2) return 'done'
  if (index === 2) return 'active'
  return 'future'
}

const getMarkedDates = (timelineItems) => {
  return timelineItems?.reduce((acc, item) => {
    if (item.date) {
      acc[item.date] = { marked: true, dotColor: '#7A9E8E' }
    }
    return acc
  }, {})
}

const selectEventItems = (timelineItems) => {
  return timelineItems?.slice(0, 2).map((item, index) => ({
    date: item.date || '',
    label: item.title || item.description || `진행 항목 ${index + 1}`,
    color: index === 0 ? 'rose' : 'sage',
  })) || []
}

const buildBudgetItems = (budgetItems) => {
  return budgetItems?.map((item) => ({
    label: item.category || '기타',
    value: `${item.amount?.toLocaleString() ?? '0'}원`,
    warn: item.spent > item.amount,
  })) || []
}

const buildBalanceItems = (budgetItems) => {
  return budgetItems?.map((item) => ({
    label: `${item.category || '기타'} 잔금`,
    sub: item.due_date ? `${item.due_date} 마감` : '마감일 미정',
    amount: formatMoney((item.amount ?? 0) - (item.spent ?? 0)),
    urgent: item.due_date ? new Date(item.due_date) <= new Date(new Date().setDate(new Date().getDate() + 30)) : false,
  })) || []
}

// ────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const projectId = useProjectStore((state) => state.currentProjectId) || '1';

  const { data: timelineItems = [], isLoading: timelineLoading, error: timelineError } = useTimelines(projectId);
  const { data: budget = { total_budget: 0, spent: 0 }, isLoading: budgetLoading, error: budgetError } = useBudget(projectId);
  const { data: budgetItems = [], isLoading: budgetItemsLoading, error: budgetItemsError } = useBudgetItems(projectId);

  const createTimelineMutation = useCreateTimeline();
  const updateTimelineMutation = useUpdateTimeline();
  const deleteTimelineMutation = useDeleteTimeline();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ step_name: '', due_date: '', status: 'pending' });

  const handleAddTimeline = async () => {
    if (!formData.step_name.trim()) return;
    
    try {
      await createTimelineMutation.mutateAsync({
        project_id: projectId,
        ...formData
      });
      setShowAddModal(false);
      setFormData({ step_name: '', due_date: '', status: 'pending' });
    } catch (error) {
      console.error('타임라인 추가 실패:', error);
    }
  };

  const handleEditTimeline = async () => {
    if (!formData.step_name.trim() || !editingItem) return;
    
    try {
      await updateTimelineMutation.mutateAsync({
        id: editingItem.id,
        updates: formData
      });
      setEditingItem(null);
      setFormData({ step_name: '', due_date: '', status: 'pending' });
    } catch (error) {
      console.error('타임라인 수정 실패:', error);
    }
  };

  const handleDeleteTimeline = async (id) => {
    try {
      await deleteTimelineMutation.mutateAsync(id);
    } catch (error) {
      console.error('타임라인 삭제 실패:', error);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      step_name: item.step_name || '',
      due_date: item.due_date || '',
      status: item.status || 'pending'
    });
  };

  const isLoading = timelineLoading || budgetLoading || budgetItemsLoading;
  const error = timelineError || budgetError || budgetItemsError;

  const scheduleEvents = selectEventItems(timelineItems);
  const markedDates = getMarkedDates(timelineItems);
  const costItems = buildBudgetItems(budgetItems);
  const balanceItems = buildBalanceItems(budgetItems);

  const progressPercent = budget.total_budget
    ? Math.min(100, Math.max(0, Math.round((budget.spent / budget.total_budget) * 100)))
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="타임라인을 로딩 중입니다..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView 
          message="타임라인을 불러올 수 없습니다" 
          subMessage={error?.message} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 프로젝트 선택기 */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <ProjectSelector />
      </View>

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
            {(timelineItems || []).map((item) => {
              const status = item.status || 'future';
              return (
                <View key={item.id} style={styles.tlItem}>
                  <View style={[styles.tlDot, styles[`dot_${status}`]]} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.tlLabel,
                        status === 'active' && { color: '#C9716A' },
                        status === 'future' && { color: '#B8A9A5' },
                        status === 'next' && { color: '#6B5B55' },
                      ]}
                    >
                      {item.step_name || item.title || item.label}
                    </Text>
                    <Text style={[styles.tlDate, status === 'active' && { color: '#C9716A' }]}>
                      {item.due_date || item.description || item.date}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="pencil" size={16} color="#7A9E8E" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert(
                        '삭제 확인',
                        '이 타임라인 항목을 삭제하시겠습니까?',
                        [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', onPress: () => handleDeleteTimeline(item.id) }
                        ]
                      )}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash" size={16} color="#C9716A" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── ③ 일정 관리 달력 ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>일정 관리</Text>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
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
            {scheduleEvents.length === 0 && (
              <Text style={{ color: '#6B5B55', fontSize: 12 }}>일정 항목이 없습니다.</Text>
            )}
            {scheduleEvents.map((ev, i) => (
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
          {costItems.length === 0 && (
            <Text style={{ color: '#6B5B55', fontSize: 12 }}>비용 데이터가 없습니다.</Text>
          )}
          {costItems.map((item, i) => (
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
            <Text style={styles.costTotalValue}>{formatMoney(budget.spent || 0)}</Text>
          </View>
          <View style={styles.costTotalRow}>
            <Text style={styles.costTotalLabel}>전체 예산</Text>
            <Text style={styles.costTotalValue}>{formatMoney(budget.total_budget || 0)}</Text>
          </View>
          {/* 프로그레스 바 */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressSub}>{`예산 ${formatMoney(budget.total_budget || 0)} 중 ${formatMoney(budget.spent || 0)} 사용 (${progressPercent}%)`}</Text>
        </View>

        {/* ── ⑤ 잔금 일정 ── */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>잔금 일정</Text>
            <Text style={styles.annoText}>자동 알림</Text>
          </View>
          {balanceItems.length === 0 && (
            <Text style={{ color: '#6B5B55', fontSize: 12 }}>잔금 정보가 없습니다.</Text>
          )}
          {balanceItems.map((item, i) => (
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

      {/* 플로팅 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 추가/수정 모달 */}
      <Modal
        visible={showAddModal || !!editingItem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
          setFormData({ step_name: '', due_date: '', status: 'pending' });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? '타임라인 수정' : '타임라인 추가'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="단계 이름"
              value={formData.step_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, step_name: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="마감일 (YYYY-MM-DD)"
              value={formData.due_date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, due_date: text }))}
            />
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={editingItem ? handleEditTimeline : handleAddTimeline}
              disabled={createTimelineMutation.isPending || updateTimelineMutation.isPending}
            >
              <Text style={styles.saveButtonText}>
                {createTimelineMutation.isPending || updateTimelineMutation.isPending ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddModal(false);
                setEditingItem(null);
                setFormData({ step_name: '', due_date: '', status: 'pending' });
              }}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C9716A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2420',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#C9716A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F2EDE8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B5B55',
    fontSize: 16,
  },

  // Action buttons
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F2EDE8',
  },});

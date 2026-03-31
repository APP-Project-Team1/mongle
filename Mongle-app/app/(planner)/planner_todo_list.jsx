import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ── 유틸 ──────────────────────────────────────────────────
// DB: YYYY-MM-DD  /  입력 폼: YYYYMMDD 8자리
const todayDb = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const todayStr = todayDb.replace(/-/g, ''); // YYYYMMDD (폼용)

const sanitizeDateInput = (raw) => raw.replace(/\D/g, '').slice(0, 8);

// YYYYMMDD → YYYY-MM-DD
const formToDb = (raw) => {
  if (!raw || raw.length !== 8) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};
// YYYY-MM-DD → YYYYMMDD (폼 표시용)
const dbToForm = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '');
};
// YYYYMMDD → "YYYY년 M월 D일까지" 표시
const formatDueDate = (raw) => {
  if (!raw || raw.length !== 8) return '';
  return `${raw.slice(0, 4)}년 ${parseInt(raw.slice(4, 6))}월 ${parseInt(raw.slice(6, 8))}일까지`;
};

const dueSortKey = (todo) => {
  if (todo.scheduled_date === todayDb) return 0;
  if (!todo.scheduled_date) return 99999999;
  return parseInt(todo.scheduled_date.replace(/-/g, ''), 10);
};

const FILTER_TABS = ['전체', '미완료', '완료'];
const EMPTY_FORM = { text: '', couple_id: null, dueDate: '', urgent: false };

export default function PlannerTodoList() {
  const { planner_id } = useAuth();

  const [todos, setTodos] = useState([]);
  const [couples, setCouples] = useState([]); // 담당 커플 목록 (동적)
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const [coupleFilter, setCoupleFilter] = useState(0); // 0 = 전체

  // 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── 데이터 로드 + Realtime ─────────────────────────────
  useEffect(() => {
    if (!planner_id) return;
    fetchAll();

    const todoChannel = supabase
      .channel(`todo-list-${planner_id}`)
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

    return () => supabase.removeChannel(todoChannel);
  }, [planner_id]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchTodos(), fetchCouples()]);
    setLoading(false);
  };

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('couple_schedules')
      .select('*, couples(id, groom_name, bride_name)')
      .eq('planner_id', planner_id)
      .order('scheduled_date', { ascending: true });
    if (!error && data) setTodos(data);
  };

  const fetchCouples = async () => {
    const { data, error } = await supabase
      .from('couples')
      .select('id, groom_name, bride_name')
      .eq('planner_id', planner_id)
      .order('wedding_date', { ascending: true });
    if (!error && data) setCouples(data);
  };

  // 커플 표시명 헬퍼
  const coupleName = (t) => {
    const c = t.couples;
    if (!c) return '';
    return `${c.groom_name ?? ''}·${c.bride_name ?? ''}`;
  };

  // ── 모달 열기/닫기 ──
  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, couple_id: couples[0]?.id ?? null });
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      text: item.title,
      couple_id: item.couple_id,
      dueDate: dbToForm(item.scheduled_date),
      urgent: item.scheduled_date === todayDb && !item.done,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditTarget(null);
  };

  // ── CRUD ──
  const handleSave = async () => {
    if (!form.text.trim()) return;
    const row = {
      planner_id,
      couple_id: form.couple_id,
      title: form.text.trim(),
      scheduled_date: formToDb(form.dueDate) ?? null,
      done: false,
    };
    if (editTarget) {
      await supabase.from('couple_schedules').update(row).eq('id', editTarget.id);
    } else {
      await supabase.from('couple_schedules').insert(row);
    }
    closeModal(); // Realtime이 자동 갱신
  };

  const handleDelete = () => {
    Alert.alert('삭제 확인', '이 할 일을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('couple_schedules').delete().eq('id', editTarget.id);
          closeModal();
        },
      },
    ]);
  };

  const toggleTodo = async (id, currentDone) => {
    // 낙관적 업데이트
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !currentDone } : t)));
    const { error } = await supabase
      .from('couple_schedules')
      .update({ done: !currentDone })
      .eq('id', id);
    if (error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: currentDone } : t)));
    }
  };

  // ── 필터링 ──
  const coupleFilters = ['전체 커플', ...couples.map((c) => `${c.groom_name}·${c.bride_name}`)];
  const selectedCoupleId = coupleFilter === 0 ? null : couples[coupleFilter - 1]?.id;

  const filtered = todos.filter((t) => {
    const matchStatus = activeFilter === 0 ? true : activeFilter === 1 ? !t.done : t.done;
    const matchCouple = !selectedCoupleId || t.couple_id === selectedCoupleId;
    return matchStatus && matchCouple;
  });

  const urgent = filtered.filter((t) => !t.done && t.scheduled_date === todayDb);
  const inProgress = filtered
    .filter((t) => !t.done && t.scheduled_date !== todayDb)
    .sort((a, b) => dueSortKey(a) - dueSortKey(b));
  const done = filtered.filter((t) => t.done);
  const undoneCount = todos.filter((t) => !t.done).length;
  const urgentCount = urgent.length;

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
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#8b5e52" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>할 일 목록</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#8b5e52" />
        </TouchableOpacity>
      </View>

      {/* ── 요약 뱃지 ── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryNum}>{undoneCount}</Text>
          <Text style={styles.summaryLabel}>미완료</Text>
        </View>
        {urgentCount > 0 && (
          <View style={[styles.summaryBadge, styles.summaryBadgeUrgent]}>
            <Ionicons name="alert-circle-outline" size={13} color="#ea806d" />
            <Text style={styles.summaryNumUrgent}>{urgentCount}</Text>
            <Text style={styles.summaryLabelUrgent}>오늘 마감</Text>
          </View>
        )}
      </View>

      {/* ── 상태 필터 탭 ── */}
      <View style={styles.filterTabRow}>
        {FILTER_TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, i === activeFilter && styles.filterTabActive]}
            onPress={() => setActiveFilter(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, i === activeFilter && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 커플 필터 칩 ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.coupleFilterRow}
      >
        {coupleFilters.map((name, i) => (
          <TouchableOpacity
            key={name}
            style={[styles.coupleChip, i === coupleFilter && styles.coupleChipActive]}
            onPress={() => setCoupleFilter(i)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.coupleChipText, i === coupleFilter && styles.coupleChipTextActive]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── 목록 ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listArea}>
        {urgent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.urgentDotLabel} />
              <Text style={styles.sectionLabelUrgent}>오늘 마감</Text>
            </View>
            <View style={styles.todoCard}>
              {urgent.map((t, idx) => (
                <TodoItem
                  key={t.id}
                  item={t}
                  coupleName={coupleName(t)}
                  isLast={idx === urgent.length - 1}
                  onToggle={() => toggleTodo(t.id, t.done)}
                  onEdit={() => openEdit(t)}
                />
              ))}
            </View>
          </View>
        )}

        {inProgress.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>진행 중</Text>
            </View>
            <View style={styles.todoCard}>
              {inProgress.map((t, idx) => (
                <TodoItem
                  key={t.id}
                  item={t}
                  coupleName={coupleName(t)}
                  isLast={idx === inProgress.length - 1}
                  onToggle={() => toggleTodo(t.id, t.done)}
                  onEdit={() => openEdit(t)}
                />
              ))}
            </View>
          </View>
        )}

        {done.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>완료</Text>
            </View>
            <View style={styles.todoCard}>
              {done.map((t, idx) => (
                <TodoItem
                  key={t.id}
                  item={t}
                  coupleName={coupleName(t)}
                  isLast={idx === done.length - 1}
                  onToggle={() => toggleTodo(t.id, t.done)}
                  onEdit={() => openEdit(t)}
                />
              ))}
            </View>
          </View>
        )}

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#d8ccc6" />
            <Text style={styles.emptyText}>할 일이 없어요</Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── 추가 / 수정 모달 ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* 배경 탭 → 닫기 */}
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />

          <View style={styles.modalSheet}>
            {/* 핸들 바 */}
            <View style={styles.modalHandle} />

            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editTarget ? '할 일 수정' : '할 일 추가'}</Text>
              {editTarget && (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.7}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#e87070" />
                  <Text style={styles.deleteBtnText}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 할 일 내용 */}
            <Text style={styles.fieldLabel}>할 일</Text>
            <TextInput
              style={styles.textInput}
              placeholder="할 일을 입력해주세요"
              placeholderTextColor="#c8bdb8"
              value={form.text}
              onChangeText={(v) => setForm((f) => ({ ...f, text: v }))}
              multiline
            />

            {/* 커플 선택 */}
            <Text style={styles.fieldLabel}>커플</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.coupleSelectRow}
            >
              {couples.map((c) => {
                const name = `${c.groom_name}·${c.bride_name}`;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.coupleChip, form.couple_id === c.id && styles.coupleChipActive]}
                    onPress={() => setForm((f) => ({ ...f, couple_id: c.id }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.coupleChipText,
                        form.couple_id === c.id && styles.coupleChipTextActive,
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 마감일 */}
            <Text style={styles.fieldLabel}>마감일</Text>
            <View style={styles.dateInputWrap}>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYYMMDD"
                placeholderTextColor="#c8bdb8"
                value={form.dueDate}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, dueDate: sanitizeDateInput(v), urgent: false }))
                }
                keyboardType="number-pad"
                maxLength={8}
              />
              <Text style={styles.datePreview}>
                {form.dueDate.length === 8 ? formatDueDate(form.dueDate) : '예) 20260415'}
              </Text>
            </View>

            {/* 오늘 마감 토글 */}
            <TouchableOpacity
              style={styles.urgentToggleRow}
              activeOpacity={0.7}
              onPress={() =>
                setForm((f) => ({
                  ...f,
                  urgent: !f.urgent,
                  dueDate: !f.urgent ? todayStr : '',
                }))
              }
            >
              <View style={[styles.toggleBox, form.urgent && styles.toggleBoxOn]}>
                {form.urgent && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.urgentToggleText}>오늘 마감으로 설정</Text>
              {form.urgent && (
                <View style={styles.urgentPill}>
                  <Text style={styles.urgentPillText}>긴급</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 저장 버튼 */}
            <TouchableOpacity
              style={[styles.saveBtn, !form.text.trim() && styles.saveBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={!form.text.trim()}
            >
              <Text style={styles.saveBtnText}>{editTarget ? '수정 완료' : '추가하기'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── 할 일 아이템 컴포넌트 ────────────────────────────────
function TodoItem({ item, coupleName, isLast, onToggle, onEdit }) {
  return (
    <TouchableOpacity
      style={[styles.todoItem, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={0.7}
      onPress={onToggle}
    >
      <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
        {item.done && <Ionicons name="checkmark" size={11} color="#7aaa50" />}
      </View>
      <View style={styles.todoContent}>
        <Text style={[styles.todoText, item.done && styles.todoTextDone]}>{item.title}</Text>
        <View style={styles.todoMeta}>
          <Text style={styles.todoCouple}>{coupleName}</Text>
          {!item.done && (item.scheduled_date === todayDb || item.scheduled_date) && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text
                style={[styles.todoDue, item.scheduled_date === todayDb && styles.todoDueUrgent]}
              >
                {item.scheduled_date === todayDb
                  ? '오늘 마감'
                  : formatDueDate(dbToForm(item.scheduled_date))}
              </Text>
            </>
          )}
        </View>
      </View>
      {/* 수정 버튼 */}
      <TouchableOpacity
        onPress={onEdit}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
      >
        <Ionicons name="ellipsis-horizontal" size={16} color="#c8bdb8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── 스타일 ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf8f5' },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#3a2e2a' },

  // 요약 뱃지
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f6f0f8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: '#b288c2',
  },
  summaryBadgeUrgent: { backgroundColor: '#fbf0ef', borderColor: '#ea806d' },
  summaryNum: { fontSize: 13, fontWeight: '600', color: '#45235c' },
  summaryNumUrgent: { fontSize: 13, fontWeight: '600', color: '#ea806d' },
  summaryLabel: { fontSize: 12, color: '#7f708a' },
  summaryLabelUrgent: { fontSize: 12, color: '#ea806d' },

  // 상태 필터
  filterTabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5F0F0',
  },
  filterTabActive: { backgroundColor: '#3a2e2a' },
  filterTabText: { fontSize: 13, color: '#8a7870', fontWeight: '500' },
  filterTabTextActive: { color: '#fff' },

  // 커플 필터 칩
  coupleFilterRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coupleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    backgroundColor: '#fff',
  },
  coupleChipActive: { backgroundColor: '#fbeaea', borderColor: '#f0c8c8' },
  coupleChipText: { fontSize: 12, color: '#8a7870' },
  coupleChipTextActive: { color: '#a74558', fontWeight: '500' },

  // 리스트
  listArea: { flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '500', color: '#a08880' },
  sectionLabelUrgent: { fontSize: 12, fontWeight: '600', color: '#c97b6e' },
  urgentDotLabel: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e87070' },

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
    paddingVertical: 13,
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
  checkboxDone: { backgroundColor: '#e8f0e0', borderColor: '#9aba7a' },
  todoContent: { flex: 1 },
  todoText: { fontSize: 13, color: '#3a2e2a', fontWeight: '500' },
  todoTextDone: { color: '#b8aca8', textDecorationLine: 'line-through', fontWeight: '400' },
  todoMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  todoCouple: { fontSize: 11, color: '#a08880' },
  metaDot: { fontSize: 11, color: '#c8bdb8' },
  todoDue: { fontSize: 11, color: '#a08880' },
  todoDueUrgent: { color: '#b07840', fontWeight: '500' },

  // 빈 상태
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: '#b8aca8' },

  // ── 모달 ──────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(58,46,42,0.4)',
  },
  modalSheet: {
    backgroundColor: '#faf8f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8ccc6',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#3a2e2a' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#f0cece',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteBtnText: { fontSize: 13, color: '#e87070', fontWeight: '500' },

  // 폼
  fieldLabel: { fontSize: 12, fontWeight: '500', color: '#a08880', marginBottom: 8 },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ede5de',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#3a2e2a',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputSingle: { minHeight: 46, textAlignVertical: 'center' },
  coupleSelectRow: { flexDirection: 'row', gap: 8, paddingBottom: 16 },

  // 날짜 입력
  dateInputWrap: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ede5de',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInput: {
    fontSize: 15,
    color: '#3a2e2a',
    fontWeight: '500',
    letterSpacing: 1,
    minWidth: 90,
  },
  datePreview: { fontSize: 12, color: '#a08880', flex: 1 },

  // 오늘 마감 토글
  urgentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  toggleBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8ccc6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleBoxOn: { backgroundColor: '#c97b6e', borderColor: '#c97b6e' },
  urgentToggleText: { fontSize: 14, color: '#3a2e2a', flex: 1 },
  urgentPill: {
    backgroundColor: '#fff5f3',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#f0d0c8',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  urgentPillText: { fontSize: 11, color: '#c97b6e', fontWeight: '500' },

  // 저장 버튼
  saveBtn: {
    backgroundColor: '#8e6f69',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#d8d1cd' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ── 유틸 ──────────────────────────────────────────────────
const formatDueDate = (raw) => {
  if (!raw || raw.length !== 8) return '';
  const y = raw.slice(0, 4);
  const m = parseInt(raw.slice(4, 6), 10);
  const d = parseInt(raw.slice(6, 8), 10);
  return `${y}년 ${m}월 ${d}일까지`;
};

const sanitizeDateInput = (raw) => raw.replace(/\D/g, '').slice(0, 8);

const dueSortKey = (todo) => {
  if (todo.urgent) return 0;
  if (!todo.dueDate || todo.dueDate.length !== 8) return 99999999;
  return parseInt(todo.dueDate, 10);
};

const todayStr = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
})();

// ── 임시 데이터 ──────────────────────────────────────────
const ALL_TODOS = [
  {
    id: '1',
    text: '드레스 피팅 일정 조율',
    couple: '최민정·강태준',
    done: false,
    urgent: true,
    dueDate: todayStr,
  },
  {
    id: '2',
    text: '스튜디오 계약서 검토',
    couple: '윤서연·오민석',
    done: false,
    urgent: true,
    dueDate: todayStr,
  },
  {
    id: '3',
    text: '웨딩홀 잔금 납부 확인',
    couple: '박지수·이현우',
    done: false,
    urgent: false,
    dueDate: '20260401',
  },
  {
    id: '4',
    text: '허니문 항공권 비교 견적 전달',
    couple: '정하린·김도윤',
    done: false,
    urgent: false,
    dueDate: '20260403',
  },
  {
    id: '5',
    text: '청첩장 봉투 주소 목록 취합',
    couple: '최민정·강태준',
    done: false,
    urgent: false,
    dueDate: '20260405',
  },
  {
    id: '6',
    text: '본식 스냅 작가 최종 확정',
    couple: '윤서연·오민석',
    done: false,
    urgent: false,
    dueDate: '20260407',
  },
  {
    id: '7',
    text: '메이크업 리허설 일정 조율',
    couple: '박지수·이현우',
    done: false,
    urgent: false,
    dueDate: '20260408',
  },
  {
    id: '8',
    text: '청첩장 시안 최종 확인',
    couple: '박지수·이현우',
    done: true,
    urgent: false,
    dueDate: '',
  },
  {
    id: '9',
    text: '메이크업 미팅 메모 정리',
    couple: '최민정·강태준',
    done: true,
    urgent: false,
    dueDate: '',
  },
  {
    id: '10',
    text: '웨딩홀 좌석 배치도 수령',
    couple: '박지수·이현우',
    done: true,
    urgent: false,
    dueDate: '',
  },
];

const FILTER_TABS = ['전체', '미완료', '완료'];
const COUPLE_OPTIONS = ['박지수·이현우', '최민정·강태준', '윤서연·오민석', '정하린·김도윤'];
const COUPLE_FILTERS = ['전체 커플', ...COUPLE_OPTIONS];
const EMPTY_FORM = { text: '', couple: COUPLE_OPTIONS[0], dueDate: '', urgent: false };
// ──────────────────────────────────────────────────────────

export default function PlannerTodoList() {
  const [todos, setTodos] = useState(ALL_TODOS);
  const [activeFilter, setActiveFilter] = useState(0);
  const [coupleFilter, setCoupleFilter] = useState(0);

  // 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null=추가, object=수정
  const [form, setForm] = useState(EMPTY_FORM);

  // ── 모달 열기/닫기 ──
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ text: item.text, couple: item.couple, dueDate: item.dueDate, urgent: item.urgent });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditTarget(null);
  };

  // ── CRUD ──
  const handleSave = () => {
    if (!form.text.trim()) return;
    if (editTarget) {
      setTodos((prev) =>
        prev.map((t) => (t.id === editTarget.id ? { ...t, ...form, text: form.text.trim() } : t)),
      );
    } else {
      setTodos((prev) => [
        { id: Date.now().toString(), ...form, text: form.text.trim(), done: false },
        ...prev,
      ]);
    }
    closeModal();
  };

  const handleDelete = () => {
    Alert.alert('삭제 확인', '이 할 일을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setTodos((prev) => prev.filter((t) => t.id !== editTarget.id));
          closeModal();
        },
      },
    ]);
  };

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // ── 필터링 ──
  const filtered = todos.filter((t) => {
    const matchStatus = activeFilter === 0 ? true : activeFilter === 1 ? !t.done : t.done;
    const matchCouple = coupleFilter === 0 ? true : t.couple === COUPLE_FILTERS[coupleFilter];
    return matchStatus && matchCouple;
  });

  const urgent = filtered.filter((t) => !t.done && t.urgent);
  const inProgress = filtered
    .filter((t) => !t.done && !t.urgent)
    .sort((a, b) => dueSortKey(a) - dueSortKey(b));
  const done = filtered.filter((t) => t.done);
  const undoneCount = todos.filter((t) => !t.done).length;
  const urgentCount = todos.filter((t) => !t.done && t.urgent).length;

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
        {COUPLE_FILTERS.map((name, i) => (
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
                  isLast={idx === urgent.length - 1}
                  onToggle={() => toggleTodo(t.id)}
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
                  isLast={idx === inProgress.length - 1}
                  onToggle={() => toggleTodo(t.id)}
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
                  isLast={idx === done.length - 1}
                  onToggle={() => toggleTodo(t.id)}
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
              {COUPLE_OPTIONS.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.coupleChip, form.couple === name && styles.coupleChipActive]}
                  onPress={() => setForm((f) => ({ ...f, couple: name }))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.coupleChipText,
                      form.couple === name && styles.coupleChipTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
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
function TodoItem({ item, isLast, onToggle, onEdit }) {
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
        <Text style={[styles.todoText, item.done && styles.todoTextDone]}>{item.text}</Text>
        <View style={styles.todoMeta}>
          <Text style={styles.todoCouple}>{item.couple}</Text>
          {!item.done && (item.urgent || (item.dueDate && item.dueDate.length === 8)) && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.todoDue, item.urgent && styles.todoDueUrgent]}>
                {item.urgent ? '오늘 마감' : formatDueDate(item.dueDate)}
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

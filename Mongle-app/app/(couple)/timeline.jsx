import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useProjectStore } from '../../stores/projectStore';
import { 
  useTimelines, 
  useCreateTimeline, 
  useUpdateTimeline, 
  useDeleteTimeline 
} from '../../hooks/useApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorView from '../components/common/ErrorView';

const { width } = Dimensions.get('window');

// ── 데이터 ──────────────────────────────────────────────
const INITIAL_TIMELINE_ITEMS = [
  {
    id: 1,
    category: '웨딩홀 계약 완료',
    dateYear: '2025',
    dateMonth: '10',
    dateDay: '05',
    status: 'done',
    color: 'sage',
  },
  {
    id: 2,
    category: '스튜디오 계약 완료',
    dateYear: '2025',
    dateMonth: '10',
    dateDay: '20',
    status: 'done',
    color: 'sage',
  },
  {
    id: 3,
    category: '드레스 1차 시착',
    dateYear: '2025',
    dateMonth: '10',
    dateDay: '08',
    status: 'done',
    color: 'rose',
  },
];

const formatDate = (item) => {
  if (!item.dateYear) return item.date ?? '';
  return `${item.dateYear}년 ${parseInt(item.dateMonth)}월 ${parseInt(item.dateDay)}일`;
};

const STATUS_OPTIONS = [
  { amount: 'done', category: '완료' },
  { amount: 'active', category: '진행 중' },
  { amount: 'next', category: '다음 예정' },
  { amount: 'future', category: '미래' },
];

const COLOR_OPTIONS = [
  { key: 'rose', category: '로즈', hex: '#C9716A', bg: '#F5EAE9', text: '#C9716A' },
  { key: 'sage', category: '세이지', hex: '#7A9E8E', bg: '#EBF2EE', text: '#7A9E8E' },
  { key: 'lavender', category: '라벤더', hex: '#9B8EC4', bg: '#F0EDF8', text: '#9B8EC4' },
  { key: 'sky', category: '스카이', hex: '#6A9EC9', bg: '#E9F2F8', text: '#6A9EC9' },
  { key: 'peach', category: '피치', hex: '#D4956A', bg: '#F8EFE9', text: '#D4956A' },
  { key: 'mint', category: '민트', hex: '#5BAD9A', bg: '#E6F4F1', text: '#5BAD9A' },
];

function TimelineEditModal({ visible, items, onClose, onSave }) {
  const [draft, setDraft] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    if (visible) {
      setDraft(items.map((i) => ({ ...i })));
      setOpenIdx(null);
    }
  }, [visible]);

  const updateField = (idx, field, value) => {
    setDraft((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const deleteItem = (idx) => {
    setDraft((prev) => prev.filter((_, i) => i !== idx));
    setOpenIdx(null);
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      step_name: '',
      date_year: '',
      date_month: '',
      date_day: '',
      status: 'future',
    };
    setDraft((prev) => {
      const next = [...prev, newItem];
      setOpenIdx(next.length - 1);
      return next;
    });
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.sheet}>
          {/* 헤더 */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>타임라인 수정</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#B8A9A5" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }}>
            {draft.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <View
                  key={item.id}
                  style={[modalStyles.itemBox, isOpen && { borderColor: '#C9716A' }]}
                >
                  {!isOpen ? (
                    /* 접힌 행 */
                    <TouchableOpacity
                      style={modalStyles.collapsedRow}
                      onPress={() => setOpenIdx(idx)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.tlDot, { backgroundColor: '#C9716A' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={modalStyles.collapsedLabel} numberOfLines={1}>
                          {item.step_name || '새 일정'}
                        </Text>
                      </View>
                      <Ionicons name="create-outline" size={15} color="#C9716A" />
                    </TouchableOpacity>
                  ) : (
                    /* 펼쳐진 편집 영역 */
                    <View style={modalStyles.editArea}>
                      <Text style={modalStyles.fieldLabel}>일정 이름</Text>
                      <TextInput
                        style={modalStyles.input}
                        value={item.step_name}
                        onChangeText={(v) => updateField(idx, 'step_name', v)}
                        placeholder="예: 드레스 시착"
                        placeholderTextColor="#C8BFBB"
                      />

                      {/* 날짜 */}
                      <Text style={[modalStyles.fieldLabel, { marginTop: 12 }]}>날짜</Text>
                      <View style={modalStyles.dateRow}>
                        <TextInput
                          style={[modalStyles.input, modalStyles.dateInput]}
                          value={item.date_year}
                          onChangeText={(v) =>
                            updateField(idx, 'date_year', v.replace(/\D/g, '').slice(0, 4))
                          }
                          placeholder="2026"
                          keyboardType="number-pad"
                          maxLength={4}
                        />
                        <Text style={modalStyles.dateSep}>년</Text>
                        <TextInput
                          style={[modalStyles.input, modalStyles.dateInputSm]}
                          value={item.date_month}
                          onChangeText={(v) =>
                            updateField(idx, 'date_month', v.replace(/\D/g, '').slice(0, 2))
                          }
                          placeholder="01"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <Text style={modalStyles.dateSep}>월</Text>
                        <TextInput
                          style={[modalStyles.input, modalStyles.dateInputSm]}
                          value={item.date_day}
                          onChangeText={(v) =>
                            updateField(idx, 'date_day', v.replace(/\D/g, '').slice(0, 2))
                          }
                          placeholder="01"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <Text style={modalStyles.dateSep}>일</Text>
                      </View>

                      {/* 색상 */}
                      <Text style={[modalStyles.fieldLabel, { marginTop: 12, marginBottom: 8 }]}>
                        색상
                      </Text>
                      <View style={scheduleModalStyles.swatchRow}>
                        {COLOR_OPTIONS.map((opt) => {
                          const isSelected = (item.color ?? 'rose') === opt.key;
                          return (
                            <TouchableOpacity
                              key={opt.key}
                              style={scheduleModalStyles.swatchWrap}
                              onPress={() => updateField(idx, 'color', opt.key)}
                              activeOpacity={0.8}
                            >
                              <View
                                style={[
                                  scheduleModalStyles.swatch,
                                  { backgroundColor: opt.hex },
                                  isSelected && scheduleModalStyles.swatchSelected,
                                ]}
                              >
                                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                              </View>
                              <Text
                                style={[
                                  scheduleModalStyles.swatchLabel,
                                  isSelected && { color: opt.hex, fontWeight: '600' },
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={modalStyles.editFooter}>
                        <TouchableOpacity onPress={() => deleteItem(idx)}>
                          <Text style={modalStyles.deleteText}>삭제</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={modalStyles.confirmBtn}
                          onPress={() => setOpenIdx(null)}
                        >
                          <Text style={modalStyles.confirmBtnText}>확인</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* 새 일정 추가 */}
            <TouchableOpacity style={modalStyles.addBtn} onPress={addItem}>
              <Text style={modalStyles.addBtnText}>+ 새 일정 추가</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* 하단 저장/취소 */}
          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}>
              <Text style={modalStyles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
// ────────────────────────────────────────────────────────

function ScheduleAddModal({ visible, preselectedDate, onClose, onSave }) {
  const [step_name, setStepName] = useState('');
  const [color, setColor] = useState('rose');
  const [status, setStatus] = useState('future');
  const [date_year, set_date_year] = useState('');
  const [date_month, set_date_month] = useState('');
  const [date_day, set_date_day] = useState('');

  useEffect(() => {
    if (visible && preselectedDate) {
      const [y, m, d] = preselectedDate.split('-');
      set_date_year(y ?? '');
      set_date_month(m ?? '');
      set_date_day(d ?? '');
    }
    if (visible) {
      setStepName('');
      setColor('rose');
      setStatus('future');
    }
    if (visible) {
      setLabel('');
      setColor('rose');
      setStatus('future');
    }
  }, [visible]);

  const handleSave = () => {
    if (!step_name.trim() || !date_year || !date_month || !date_day) return;
    onSave({
      date_year,
      date_month: String(parseInt(date_month)),
      date_day: String(parseInt(date_day)),
      step_name: step_name.trim(),
      color,
      status,
    });
    onClose();
  };

  const isValid = label.trim() && dateYear.length === 4 && dateMonth && dateDay;
  const selectedColorOpt = COLOR_OPTIONS.find((c) => c.key === color);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { maxHeight: '80%' }]}>
          {/* 헤더 */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>일정 추가</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#B8A9A5" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 일정 이름 */}
            <Text style={modalStyles.fieldLabel}>일정 이름</Text>
            <TextInput
              style={[modalStyles.input, { marginBottom: 16 }]}
              value={step_name}
              onChangeText={setStepName}
              placeholder="예: 부케 상담 · 오후 3시"
              placeholderTextColor="#C8BFBB"
            />
            <Text style={modalStyles.fieldLabel}>날짜</Text>
            <View style={[modalStyles.dateRow, { marginBottom: 16 }]}>
              <TextInput
                style={[modalStyles.input, modalStyles.dateInput]}
                value={date_year}
                onChangeText={(v) => set_date_year(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="2026"
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={modalStyles.dateSep}>년</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.dateInputSm]}
                value={date_month}
                onChangeText={(v) => set_date_month(v.replace(/\D/g, '').slice(0, 2))}
                placeholder="01"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={modalStyles.dateSep}>월</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.dateInputSm]}
                value={date_day}
                onChangeText={(v) => set_date_day(v.replace(/\D/g, '').slice(0, 2))}
                placeholder="01"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={modalStyles.dateSep}>일</Text>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={[modalStyles.footer, { marginTop: 16 }]}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.saveBtn, !isValid && { backgroundColor: '#E8C5C2' }]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={modalStyles.saveBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const scheduleModalStyles = StyleSheet.create({
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: 5,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.12 }],
  },
  swatchLabel: {
    fontSize: 10,
    color: '#B8A9A5',
    fontWeight: '400',
  },
  preview: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
// ────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const active_id = useProjectStore((state) => state.active_id);
  const projects = useProjectStore((state) => state.projects);
  const active = projects.find(p => p.id === active_id);

  const { data: timelines = [], isLoading: isTimelineLoading, isError: isTimelineError, refetch: refetchTimelines } = useTimelines(active_id);
  
  const createTimeline = useCreateTimeline();
  const updateTimeline = useUpdateTimeline();
  const deleteTimeline = useDeleteTimeline();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [visibleMonth, setVisibleMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [scheduleAddModalVisible, setScheduleAddModalVisible] = useState(false);

  if (isTimelineLoading) return <LoadingSpinner />;
  if (isTimelineError) return <ErrorView onRetry={refetchTimelines} />;

  const mappedTimelineItems = timelines.map(item => {
    const d = new Date(item.due_date);
    return {
      ...item,
      date_year: String(d.getFullYear()),
      date_month: String(d.getMonth() + 1),
      date_day: String(d.getDate()),
    };
  });

  const markedDates = mappedTimelineItems.reduce((acc, item) => {
    const pad = (v) => String(parseInt(v)).padStart(2, '0');
    const key = `${item.date_year}-${pad(item.date_month)}-${pad(item.date_day)}`;
    acc[key] = { selected: true, selectedColor: '#C9716A' };
    return acc;
  }, {});

  const handleAddSchedule = async (data) => {
    const dateStr = `${data.date_year}-${data.date_month.padStart(2, '0')}-${data.date_day.padStart(2, '0')}`;
    await createTimeline.mutateAsync({
      project_id: active_id,
      step_name: data.step_name,
      due_date: dateStr,
      status: data.status,
      color: data.color
    });
  };

  const handleSaveTimeline = async (nextItems) => {
    const nextIds = nextItems.map(n => n.id);
    const deletedItems = timelines.filter(t => !nextIds.includes(t.id));
    for (const d of deletedItems) {
      await deleteTimeline.mutateAsync(d.id);
    }
    for (const item of nextItems) {
      const dateStr = `${item.date_year}-${item.date_month.padStart(2, '0')}-${item.date_day.padStart(2, '0')}`;
      if (timelines.find(t => t.id === item.id)) {
        await updateTimeline.mutateAsync({ id: item.id, step_name: item.step_name, due_date: dateStr, status: item.status, color: item.color });
      } else {
        await createTimeline.mutateAsync({ project_id: active_id, step_name: item.step_name, due_date: dateStr, status: item.status, color: item.color });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* ── ① 플래너 정보 배너 ── */}
        <View style={styles.bannerCard}>
           <Text style={styles.cardTitle}>결혼 준비 진행도</Text>
        </View>

        <View style={styles.bannerCard}>
          <View style={styles.bottomRow}>
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
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push('/(couple)/chat/1')}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
              <Text style={styles.chatBtnText}>문의하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ② 결혼 준비 타임라인 ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>결혼 준비 타임라인</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}>
              <Text style={styles.editBtnText}>수정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineWrap}>
            {mappedTimelineItems.map((item) => (
              <View key={item.id} style={styles.tlItem}>
                <View style={[styles.tlDot, item.status === 'done' && { backgroundColor: '#7A9E8E' }]} />
                <View>
                  <Text style={styles.tlLabel}>{item.step_name}</Text>
                  <Text style={styles.tlDate}>{formatDate(item)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── ③ 일정 관리 달력 ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>일정 관리</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setScheduleAddModalVisible(true)}
            >
              <Text style={styles.editBtnText}>+ 일정 추가</Text>
            </TouchableOpacity>
          </View>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            onMonthChange={(month) =>
              setVisibleMonth(`${month.year}-${String(month.month).padStart(2, '0')}`)
            }
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
            {visibleEvents.length > 0 ? (
              visibleEvents.map((item) => {
                const colorOpt = COLOR_OPTIONS.find((c) => c.key === (item.color ?? 'rose'));
                const bgColor = colorOpt ? colorOpt.bg : '#F5EAE9';
                const borderColor = colorOpt ? colorOpt.hex : '#C9716A';
                const textColor = colorOpt ? colorOpt.text : '#C9716A';
                const pad = (v) => String(parseInt(v)).padStart(2, '0');
                const displayLabel = `${parseInt(item.dateMonth)}월 ${parseInt(item.dateDay)}일 — ${item.label}`;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.eventBadge,
                      { backgroundColor: bgColor, borderLeftColor: borderColor },
                    ]}
                  >
                    <Text style={[styles.eventText, { color: textColor }]}>{displayLabel}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyEvents}>
                <Text style={styles.emptyEventsText}>{monthLabel}에 등록된 일정이 없습니다</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      {/* 타임라인 수정 모달 */}
      <TimelineEditModal
        visible={editModalVisible}
        items={mappedTimelineItems}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveTimeline}
      />

      {/* 일정 추가 모달 */}
      <ScheduleAddModal
        visible={scheduleAddModalVisible}
        preselectedDate={selectedDate}
        onClose={() => setScheduleAddModalVisible(false)}
        onSave={handleAddSchedule}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F5' },
  container: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#2C2420', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { padding: 4 },
  editBtnText: { fontSize: 13, color: '#C9716A' },
  timelineWrap: { marginTop: 10 },
  tlItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DDD', marginRight: 12 },
  tlLabel: { fontSize: 15, fontWeight: '600', color: '#2C2420' },
  tlDate: { fontSize: 12, color: '#8A7870', marginTop: 2 },
  bannerCard: { backgroundColor: '#FDF0EF', borderRadius: 16, padding: 20, marginBottom: 16 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  itemBox: { borderWidth: 1, borderColor: '#EEE', borderRadius: 12, marginBottom: 10, padding: 12 },
  collapsedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collapsedLabel: { fontSize: 14, fontWeight: '500' },
  editArea: { gap: 10 },
  input: { borderBottomWidth: 1, borderColor: '#EEE', padding: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateInput: { flex: 2, textAlign: 'center' },
  dateInputSm: { flex: 1, textAlign: 'center' },
  dateSep: { fontSize: 12, color: '#666' },
  editFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  deleteText: { color: '#B8A9A5' },
  confirmBtn: { backgroundColor: '#C9716A', padding: 8, borderRadius: 4 },
  confirmBtnText: { color: '#fff' },
  addBtn: { alignItems: 'center', padding: 12 },
  addBtnText: { color: '#C9716A' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#EEE', borderRadius: 8 },
  cancelBtnText: { color: '#666' },
  saveBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#C9716A', borderRadius: 8 },
  saveBtnText: { color: '#fff' },
  fieldLabel: { fontSize: 12, color: '#888' },
});

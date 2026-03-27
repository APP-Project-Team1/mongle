import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { formatNumber } from '../../lib/utils';

const { width } = Dimensions.get('window');

// ── 데이터 ──────────────────────────────────────────────
const INITIAL_TIMELINE_ITEMS = [
  {
    id: 1,
    label: '웨딩홀 계약 완료',
    dateYear: '2025',
    dateMonth: '10',
    dateDay: '05',
    status: 'done',
    color: 'sage',
  },
  {
    id: 2,
    label: '스튜디오 계약 완료',
    dateYear: '2025',
    dateMonth: '10',
    dateDay: '20',
    status: 'done',
    color: 'sage',
  },
  {
    id: 3,
    label: '드레스 1차 시착',
    dateYear: '2025',
    dateMonth: '11',
    dateDay: '08',
    status: 'done',
    color: 'rose',
  },
  {
    id: 4,
    label: '드레스 2차 시착 — 진행 중',
    dateYear: '2026',
    dateMonth: '01',
    dateDay: '15',
    status: 'active',
    color: 'rose',
  },
  {
    id: 5,
    label: '웨딩홀 식순 미팅',
    dateYear: '2026',
    dateMonth: '01',
    dateDay: '21',
    status: 'active',
    color: 'sage',
  },
  {
    id: 6,
    label: '본식 스냅 촬영',
    dateYear: '2026',
    dateMonth: '03',
    dateDay: '10',
    status: 'next',
    color: 'sky',
  },
  {
    id: 7,
    label: '본식',
    dateYear: '2026',
    dateMonth: '07',
    dateDay: '25',
    status: 'future',
    color: 'peach',
  },
];

const formatDate = (item) => {
  if (!item.dateYear) return item.date ?? '';
  return `${item.dateYear}년 ${parseInt(item.dateMonth)}월 ${parseInt(item.dateDay)}일`;
};

const STATUS_OPTIONS = [
  { value: 'done', label: '완료' },
  { value: 'active', label: '진행 중' },
  { value: 'next', label: '다음 예정' },
  { value: 'future', label: '미래' },
];

// ── 타임라인 수정 모달 ──────────────────────────────────
function TimelineEditModal({ visible, items, onClose, onSave }) {
  const [draft, setDraft] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);

  React.useEffect(() => {
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
      label: '',
      dateYear: '',
      dateMonth: '',
      dateDay: '',
      status: 'future',
      color: 'rose',
    };
    setDraft((prev) => {
      const next = [...prev, newItem];
      setOpenIdx(next.length - 1);
      return next;
    });
  };

  const handleSave = () => {
    const sorted = [...draft].sort((a, b) => {
      const toMs = (i) =>
        new Date(
          parseInt(i.dateYear) || 0,
          (parseInt(i.dateMonth) || 1) - 1,
          parseInt(i.dateDay) || 1,
        ).getTime();
      return toMs(a) - toMs(b);
    });
    onSave(sorted);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.sheet}>
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
                    <TouchableOpacity
                      style={modalStyles.collapsedRow}
                      onPress={() => setOpenIdx(idx)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.tlDot, styles.dot_active, { marginTop: 0 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={modalStyles.collapsedLabel} numberOfLines={1}>
                          {item.label || '새 일정'}
                        </Text>
                        <Text style={modalStyles.collapsedDate}>
                          {formatDate(item) || '날짜 미입력'}
                        </Text>
                      </View>
                      <Ionicons name="create-outline" size={15} color="#C9716A" />
                    </TouchableOpacity>
                  ) : (
                    <View style={modalStyles.editArea}>
                      <Text style={modalStyles.fieldLabel}>일정 이름</Text>
                      <TextInput
                        style={modalStyles.input}
                        value={item.label}
                        onChangeText={(v) => updateField(idx, 'label', v)}
                        placeholder="예: 드레스 시착"
                        placeholderTextColor="#C8BFBB"
                      />
                      <Text style={[modalStyles.fieldLabel, { marginTop: 12 }]}>날짜</Text>
                      <View style={modalStyles.dateRow}>
                        <TextInput
                          style={[modalStyles.input, modalStyles.dateInput]}
                          value={item.dateYear}
                          onChangeText={(v) =>
                            updateField(idx, 'dateYear', v.replace(/\D/g, '').slice(0, 4))
                          }
                          placeholder="2026"
                          placeholderTextColor="#C8BFBB"
                          keyboardType="number-pad"
                          maxLength={4}
                        />
                        <Text style={modalStyles.dateSep}>년</Text>
                        <TextInput
                          style={[modalStyles.input, modalStyles.dateInputSm]}
                          value={item.dateMonth}
                          onChangeText={(v) =>
                            updateField(idx, 'dateMonth', v.replace(/\D/g, '').slice(0, 2))
                          }
                          placeholder="01"
                          placeholderTextColor="#C8BFBB"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <Text style={modalStyles.dateSep}>월</Text>
                        <TextInput
                          style={[modalStyles.input, modalStyles.dateInputSm]}
                          value={item.dateDay}
                          onChangeText={(v) =>
                            updateField(idx, 'dateDay', v.replace(/\D/g, '').slice(0, 2))
                          }
                          placeholder="01"
                          placeholderTextColor="#C8BFBB"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <Text style={modalStyles.dateSep}>일</Text>
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
            <TouchableOpacity style={modalStyles.addBtn} onPress={addItem}>
              <Text style={modalStyles.addBtnText}>+ 새 일정 추가</Text>
            </TouchableOpacity>
          </ScrollView>

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

// ── 일정 색상 팔레트 ─────────────────────────────────────
const COLOR_OPTIONS = [
  { key: 'rose', label: '로즈', hex: '#C9716A', bg: '#F5EAE9', text: '#C9716A' },
  { key: 'sage', label: '세이지', hex: '#7A9E8E', bg: '#EBF2EE', text: '#7A9E8E' },
  { key: 'lavender', label: '라벤더', hex: '#9B8EC4', bg: '#F0EDF8', text: '#9B8EC4' },
  { key: 'sky', label: '스카이', hex: '#6A9EC9', bg: '#E9F2F8', text: '#6A9EC9' },
  { key: 'peach', label: '피치', hex: '#D4956A', bg: '#F8EFE9', text: '#D4956A' },
  { key: 'mint', label: '민트', hex: '#5BAD9A', bg: '#E6F4F1', text: '#5BAD9A' },
];

function ScheduleAddModal({ visible, preselectedDate, onClose, onSave }) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('rose');
  const [status, setStatus] = useState('future');
  const [dateYear, setDateYear] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');

  React.useEffect(() => {
    if (visible && preselectedDate) {
      const [y, m, d] = preselectedDate.split('-');
      setDateYear(y ?? '');
      setDateMonth(m ?? '');
      setDateDay(d ?? '');
    }
  }, [visible]);

  const handleSave = () => {
    if (!label.trim() || !dateYear || !dateMonth || !dateDay) return;
    onSave({
      dateYear,
      dateMonth,
      dateDay,
      label: label.trim(),
      color,
      status,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>일정 추가</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#B8A9A5" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TextInput
              style={modalStyles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="일정 이름"
            />
            {/* ... simplified ... */}
          </ScrollView>
          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}>
              <Text style={modalStyles.saveBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TimelineScreen() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [visibleMonth, setVisibleMonth] = useState('2026-01');
  const [timelineItems, setTimelineItems] = useState(INITIAL_TIMELINE_ITEMS);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [scheduleAddModalVisible, setScheduleAddModalVisible] = useState(false);

  const markedDates = timelineItems.reduce((acc, item) => {
    if (!item.dateYear || !item.dateMonth || !item.dateDay) return acc;
    const pad = (v) => String(parseInt(v)).padStart(2, '0');
    const key = `${item.dateYear}-${pad(item.dateMonth)}-${pad(item.dateDay)}`;
    acc[key] = { selected: true, selectedColor: '#C9716A' };
    return acc;
  }, {});

  const visibleEvents = timelineItems.filter((item) => {
    if (!item.dateYear || !item.dateMonth || !item.dateDay) return false;
    const pad = (v) => String(parseInt(v)).padStart(2, '0');
    return `${item.dateYear}-${pad(item.dateMonth)}` === visibleMonth;
  });

  const handleAddSchedule = (item) => {
    setTimelineItems((prev) => [...prev, { ...item, id: Date.now() }]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.bannerCard}>
          <Text style={styles.cardTitle}>결혼 준비 진행도</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>결혼 준비 타임라인</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}>
              <Text style={styles.editBtnText}>수정</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timelineWrap}>
            {timelineItems.map((item) => (
              <View key={item.id} style={styles.tlItem}>
                <View
                  style={[styles.tlDot, item.status === 'done' && { backgroundColor: '#7A9E8E' }]}
                />
                <View>
                  <Text style={styles.tlLabel}>{item.label}</Text>
                  <Text style={styles.tlDate}>{formatDate(item)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>일정 관리</Text>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{ selectedDayBackgroundColor: '#C9716A' }}
          />
        </View>
      </ScrollView>

      <TimelineEditModal
        visible={editModalVisible}
        items={timelineItems}
        onClose={() => setEditModalVisible(false)}
        onSave={(updated) => setTimelineItems(updated)}
      />

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
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#2C2420' },
  editBtn: { padding: 4 },
  editBtnText: { color: '#C9716A', fontSize: 13 },
  timelineWrap: { paddingLeft: 10 },
  tlItem: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C9716A', marginTop: 4 },
  tlLabel: { fontSize: 15, fontWeight: '600', color: '#2C2420' },
  tlDate: { fontSize: 12, color: '#8A7870', marginTop: 2 },
  bannerCard: { backgroundColor: '#FDF0EF', borderRadius: 16, padding: 20, marginBottom: 20 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2420' },
  itemBox: {
    borderWidth: 1,
    borderColor: '#F0E8E4',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
  },
  collapsedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collapsedLabel: { fontSize: 14, fontWeight: '500', color: '#2C2420' },
  editArea: { gap: 10 },
  input: { backgroundColor: '#F9F7F6', borderRadius: 8, padding: 12, fontSize: 14 },
  editFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  deleteText: { fontSize: 13, color: '#B8A9A5' },
  confirmBtn: {
    backgroundColor: '#C9716A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  addBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 10 },
  addBtnText: { color: '#C9716A', fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F1EE',
  },
  cancelBtnText: { color: '#8A7870', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#C9716A',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateInput: { flex: 1, textAlign: 'center' },
  dateInputSm: { flex: 0.7, textAlign: 'center' },
  dateSep: { fontSize: 12, color: '#8A7870' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#8A7870', marginBottom: 4 },
});

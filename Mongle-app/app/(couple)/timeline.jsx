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
  },
  {
    id: 2,
    label: '스튜디오 계약 완료',
    dateYear: '2025',
    dateMonth: '10',
    dateDay: '20',
    status: 'done',
  },
  {
    id: 3,
    label: '드레스 1차 시착',
    dateYear: '2025',
    dateMonth: '11',
    dateDay: '08',
    status: 'done',
  },
  {
    id: 4,
    label: '드레스 2차 시착 — 진행 중',
    dateYear: '2026',
    dateMonth: '01',
    dateDay: '15',
    status: 'active',
  },
  {
    id: 5,
    label: '본식 스냅 촬영',
    dateYear: '2026',
    dateMonth: '03',
    dateDay: '10',
    status: 'next',
  },
  {
    id: 6,
    label: '본식',
    dateYear: '2026',
    dateMonth: '07',
    dateDay: '25',
    status: 'future',
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

const SCHEDULE_EVENTS = [
  {
    date: '2026-01-15',
    label: '1월 15일 — 드레스 2차 시착 · 오후 2시 (드레스 로즈)',
    color: 'rose',
  },
  {
    date: '2026-01-21',
    label: '1월 21일 — 웨딩홀 식순 미팅 · 오전 11시',
    color: 'sage',
  },
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
  {
    label: '드레스 잔금',
    sub: '2월 1일 마감 · D-32',
    amount: '72만원',
    urgent: true,
  },
  {
    label: '스튜디오 잔금',
    sub: '3월 10일 마감 · D-69',
    amount: '80만원',
    urgent: false,
  },
  {
    label: '웨딩홀 잔금',
    sub: '6월 25일 마감 · D-176',
    amount: '190만원',
    urgent: false,
  },
];

const MARKED_DATES = {
  '2026-01-15': { selected: true, selectedColor: '#C9716A' },
  '2026-01-21': {
    marked: true,
    dotColor: '#7A9E8E',
    selectedColor: '#EBF2EE',
    selected: true,
  },
};
// ────────────────────────────────────────────────────────

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
                      <View
                        style={[styles.tlDot, styles[`dot_${item.status}`], { marginTop: 0 }]}
                      />
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
                    /* 펼쳐진 편집 영역 */
                    <View style={modalStyles.editArea}>
                      <Text style={modalStyles.fieldLabel}>일정 이름</Text>
                      <TextInput
                        style={modalStyles.input}
                        value={item.label}
                        onChangeText={(v) => updateField(idx, 'label', v)}
                        placeholder="예: 드레스 시착"
                        placeholderTextColor="#C8BFBB"
                      />

                      {/* 날짜 */}
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

export default function TimelineScreen() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [timelineItems, setTimelineItems] = useState(INITIAL_TIMELINE_ITEMS);
  const [editModalVisible, setEditModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* ── ① 플래너 정보 배너 ── */}
        <View style={styles.bannerCard}>
          <View style={styles.topSection}>
            <View style={styles.ddayWrap}>
              <Text style={styles.ddayText}>D-127</Text>
              <Text style={styles.ddaySub}>2026년 7월 25일 (토)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValueRose}>73%</Text>
              <Text style={styles.statLabel}>준비 완료</Text>
            </View>
          </View>
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
            <View style={styles.timelineLine} />
            {timelineItems.map((item) => (
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
                    {formatDate(item)}
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

      {/* 타임라인 수정 모달 */}
      <TimelineEditModal
        visible={editModalVisible}
        items={timelineItems}
        onClose={() => setEditModalVisible(false)}
        onSave={(updated) => setTimelineItems(updated)}
      />
    </SafeAreaView>
  );
}

// ── 모달 스타일 ──────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44,36,32,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 32,
    maxHeight: '85%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2420',
  },
  itemBox: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  collapsedLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C2420',
  },
  collapsedDate: {
    fontSize: 11,
    color: '#B8A9A5',
    marginTop: 1,
  },
  editArea: {
    padding: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B5B55',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 13,
    color: '#2C2420',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 7,
    paddingVertical: 7,
    alignItems: 'center',
  },
  statusBtnActive: {
    backgroundColor: '#C9716A',
    borderColor: '#C9716A',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B5B55',
  },
  editFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDE5E2',
  },
  deleteText: {
    fontSize: 13,
    color: '#D0534A',
  },
  confirmBtn: {
    backgroundColor: '#C9716A',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: '#EDE5E2',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addBtnText: {
    fontSize: 13,
    color: '#B8A9A5',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#6B5B55',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#C9716A',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,

    justifyContent: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    backgroundColor: '#FBF8F7',
    borderRadius: 5,
    paddingVertical: 6,
    fontSize: 13,
    color: '#2C2420',
    minWidth: 0,
    paddingHorizontal: 10,
  },
  dateInput: {
    flex: 2.5,
    textAlign: 'center',
  },
  dateInputSm: {
    flex: 1.5,
    textAlign: 'center',
  },
  dateSep: {
    fontSize: 13,
    color: '#6B5B55',

    marginHorizontal: 5,
    marginRight: 20,
    width: 20,
    textAlign: 'center',
  },
});

// ── 화면 스타일 ──────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2EDE8' },
  container: { padding: 16, gap: 14 },

  bannerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'column',
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 5,
  },
  ddayWrap: {
    flexDirection: 'column',
  },
  ddayText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#C9716A',
  },
  ddaySub: {
    fontSize: 11,
    color: '#8A7870',
    marginTop: 2,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FBF8F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE5E2',
  },
  statValueRose: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C9716A',
  },
  statLabel: {
    fontSize: 9,
    color: '#6B5B55',
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8C5C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '500', color: '#C9716A' },
  plannerLabel: { fontSize: 10, color: '#6B5B55', marginBottom: 2 },
  plannerName: { fontSize: 13, fontWeight: '600', color: '#2C2420' },
  onlineText: { fontSize: 10, color: '#7A9E8E', marginTop: 1 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A98E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  chatBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

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
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C2420',
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // 수정 버튼
  editBtn: {
    backgroundColor: '#F5EAE9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C9716A',
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
  tlItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
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
  progressSub: {
    fontSize: 10,
    color: '#B8A9A5',
    textAlign: 'right',
    marginTop: 4,
  },

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

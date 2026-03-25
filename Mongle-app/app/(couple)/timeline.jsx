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

// ── 비용/잔금 통합 데이터 ────────────────────────────────
// hasBalance: true인 항목만 잔금 카드에 표시
const INITIAL_COST_ITEMS = [
  {
    id: 1,
    label: '웨딩홀',
    value: '380', // 만원 단위 숫자 문자열
    warn: false,
    hasBalance: true,
    balanceDue: '2026-06-25',
    balanceAmount: '190',
    urgent: false,
  },
  {
    id: 2,
    label: '스튜디오',
    value: '160',
    warn: false,
    hasBalance: true,
    balanceDue: '2026-03-10',
    balanceAmount: '80',
    urgent: false,
  },
  {
    id: 3,
    label: '드레스',
    value: '95',
    warn: false,
    hasBalance: true,
    balanceDue: '2026-02-01',
    balanceAmount: '72',
    urgent: true,
  },
  {
    id: 4,
    label: '메이크업',
    value: '28',
    warn: false,
    hasBalance: false,
    balanceDue: '',
    balanceAmount: '',
    urgent: false,
  },
  {
    id: 5,
    label: '헤어 (추가 옵션)',
    value: '8',
    warn: true,
    hasBalance: false,
    balanceDue: '',
    balanceAmount: '',
    urgent: false,
  },
  {
    id: 6,
    label: '예상 추가 비용',
    value: '', // 빈 문자열 = 미정
    warn: false,
    gray: true,
    hasBalance: false,
    balanceDue: '',
    balanceAmount: '',
    urgent: false,
  },
];

// 잔금 마감일 → "N월 N일 마감 · D-NN" 형식 계산
const formatBalanceSub = (dueDateStr) => {
  if (!dueDateStr) return '';
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  const m = due.getMonth() + 1;
  const d = due.getDate();
  return `${m}월 ${d}일 마감 · D-${diff}`;
};

// 숫자 문자열 합산 (빈 문자열은 0 취급)
const sumValues = (items) => items.reduce((acc, item) => acc + (parseInt(item.value) || 0), 0);
// ────────────────────────────────────────────────────────

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

// ── 일정 색상 팔레트 ─────────────────────────────────────
const COLOR_OPTIONS = [
  { key: 'rose', label: '로즈', hex: '#C9716A', bg: '#F5EAE9', text: '#C9716A' },
  { key: 'sage', label: '세이지', hex: '#7A9E8E', bg: '#EBF2EE', text: '#7A9E8E' },
  { key: 'lavender', label: '라벤더', hex: '#9B8EC4', bg: '#F0EDF8', text: '#9B8EC4' },
  { key: 'sky', label: '스카이', hex: '#6A9EC9', bg: '#E9F2F8', text: '#6A9EC9' },
  { key: 'peach', label: '피치', hex: '#D4956A', bg: '#F8EFE9', text: '#D4956A' },
  { key: 'mint', label: '민트', hex: '#5BAD9A', bg: '#E6F4F1', text: '#5BAD9A' },
];
// ────────────────────────────────────────────────────────

// ── 일정 추가 모달 ──────────────────────────────────────
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
    if (visible) {
      setLabel('');
      setColor('rose');
      setStatus('future');
    }
  }, [visible]);

  const handleSave = () => {
    if (!label.trim() || !dateYear || !dateMonth || !dateDay) return;
    onSave({
      dateYear,
      dateMonth: String(parseInt(dateMonth)),
      dateDay: String(parseInt(dateDay)),
      label: label.trim(),
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
              value={label}
              onChangeText={setLabel}
              placeholder="예: 부케 상담 · 오후 3시"
              placeholderTextColor="#C8BFBB"
            />

            {/* 날짜 */}
            <Text style={modalStyles.fieldLabel}>날짜</Text>
            <View style={[modalStyles.dateRow, { marginBottom: 16 }]}>
              <TextInput
                style={[modalStyles.input, modalStyles.dateInput]}
                value={dateYear}
                onChangeText={(v) => setDateYear(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="2026"
                placeholderTextColor="#C8BFBB"
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={modalStyles.dateSep}>년</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.dateInputSm]}
                value={dateMonth}
                onChangeText={(v) => setDateMonth(v.replace(/\D/g, '').slice(0, 2))}
                placeholder="01"
                placeholderTextColor="#C8BFBB"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={modalStyles.dateSep}>월</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.dateInputSm]}
                value={dateDay}
                onChangeText={(v) => setDateDay(v.replace(/\D/g, '').slice(0, 2))}
                placeholder="01"
                placeholderTextColor="#C8BFBB"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={modalStyles.dateSep}>일</Text>
            </View>

            {/* 상태 선택 */}
            <Text style={[modalStyles.fieldLabel, { marginBottom: 8 }]}>상태</Text>
            <View style={[modalStyles.statusRow, { marginBottom: 16 }]}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    modalStyles.statusBtn,
                    status === opt.value && modalStyles.statusBtnActive,
                  ]}
                  onPress={() => setStatus(opt.value)}
                >
                  <Text
                    style={[modalStyles.statusBtnText, status === opt.value && { color: '#fff' }]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 색상 선택 */}
            <Text style={[modalStyles.fieldLabel, { marginBottom: 10 }]}>색상</Text>
            <View style={scheduleModalStyles.swatchRow}>
              {COLOR_OPTIONS.map((opt) => {
                const isSelected = color === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={scheduleModalStyles.swatchWrap}
                    onPress={() => setColor(opt.key)}
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

            {/* 미리보기 */}
            {label.trim() ? (
              <View
                style={[
                  scheduleModalStyles.preview,
                  { backgroundColor: selectedColorOpt.bg, borderLeftColor: selectedColorOpt.hex },
                ]}
              >
                <Text style={[scheduleModalStyles.previewText, { color: selectedColorOpt.text }]}>
                  {`${parseInt(dateMonth) || 'MM'}월 ${parseInt(dateDay) || 'DD'}일 — ${label.trim()}`}
                </Text>
              </View>
            ) : null}
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

// ── 비용/잔금 수정 모달 ──────────────────────────────────
function CostEditModal({ visible, items, onClose, onSave }) {
  const [draft, setDraft] = useState([]);
  const [activeTab, setActiveTab] = useState('cost'); // 'cost' | 'balance'
  const [openIdx, setOpenIdx] = useState(null);
  const [budget, setBudget] = useState('1000');

  React.useEffect(() => {
    if (visible) {
      setDraft(items.map((i) => ({ ...i })));
      setActiveTab('cost');
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

  const addCostItem = () => {
    const newItem = {
      id: Date.now(),
      label: '',
      value: '',
      warn: false,
      gray: false,
      hasBalance: false,
      balanceDue: '',
      balanceAmount: '',
      urgent: false,
    };
    setDraft((prev) => {
      const next = [...prev, newItem];
      setOpenIdx(next.length - 1);
      return next;
    });
  };

  const balanceItems = draft.filter((item) => item.hasBalance);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.sheet}>
          {/* 헤더 */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>비용 · 잔금 관리</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#B8A9A5" />
            </TouchableOpacity>
          </View>

          {/* 탭 */}
          <View style={costModalStyles.tabRow}>
            <TouchableOpacity
              style={[costModalStyles.tab, activeTab === 'cost' && costModalStyles.tabActive]}
              onPress={() => {
                setActiveTab('cost');
                setOpenIdx(null);
              }}
            >
              <Text
                style={[
                  costModalStyles.tabText,
                  activeTab === 'cost' && costModalStyles.tabTextActive,
                ]}
              >
                비용 항목
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[costModalStyles.tab, activeTab === 'balance' && costModalStyles.tabActive]}
              onPress={() => {
                setActiveTab('balance');
                setOpenIdx(null);
              }}
            >
              <Text
                style={[
                  costModalStyles.tabText,
                  activeTab === 'balance' && costModalStyles.tabTextActive,
                ]}
              >
                잔금 일정
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {activeTab === 'cost' ? (
              <>
                {/* 예산 설정 */}
                <View style={costModalStyles.budgetRow}>
                  <Text style={costModalStyles.budgetLabel}>전체 예산</Text>
                  <View style={costModalStyles.budgetInputWrap}>
                    <TextInput
                      style={costModalStyles.budgetInput}
                      value={budget}
                      onChangeText={(v) => setBudget(v.replace(/\D/g, ''))}
                      keyboardType="number-pad"
                      placeholder="1000"
                      placeholderTextColor="#C8BFBB"
                    />
                    <Text style={costModalStyles.budgetUnit}>만원</Text>
                  </View>
                </View>

                {/* 비용 항목 목록 */}
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
                          <View style={{ flex: 1 }}>
                            <Text style={modalStyles.collapsedLabel} numberOfLines={1}>
                              {item.label || '새 항목'}
                            </Text>
                            <Text style={modalStyles.collapsedDate}>
                              {item.value ? `${item.value}만원` : '미정'}
                              {item.hasBalance ? ` · 잔금 ${item.balanceAmount}만원` : ''}
                            </Text>
                          </View>
                          {item.warn && (
                            <Ionicons
                              name="warning-outline"
                              size={14}
                              color="#C9716A"
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Ionicons name="create-outline" size={15} color="#C9716A" />
                        </TouchableOpacity>
                      ) : (
                        <View style={modalStyles.editArea}>
                          {/* 항목명 */}
                          <Text style={modalStyles.fieldLabel}>항목명</Text>
                          <TextInput
                            style={[modalStyles.input, { marginBottom: 12 }]}
                            value={item.label}
                            onChangeText={(v) => updateField(idx, 'label', v)}
                            placeholder="예: 웨딩홀"
                            placeholderTextColor="#C8BFBB"
                          />
                          {/* 금액 */}
                          <Text style={modalStyles.fieldLabel}>금액 (만원)</Text>
                          <View style={costModalStyles.amountRow}>
                            <TextInput
                              style={[modalStyles.input, { flex: 1 }]}
                              value={item.value}
                              onChangeText={(v) => updateField(idx, 'value', v.replace(/\D/g, ''))}
                              placeholder="미정이면 빈칸"
                              placeholderTextColor="#C8BFBB"
                              keyboardType="number-pad"
                            />
                            <Text style={costModalStyles.amountUnit}>만원</Text>
                          </View>
                          {/* 옵션 토글 */}
                          <View style={costModalStyles.toggleRow}>
                            <TouchableOpacity
                              style={[
                                costModalStyles.toggleBtn,
                                item.warn && costModalStyles.toggleBtnOn,
                              ]}
                              onPress={() => updateField(idx, 'warn', !item.warn)}
                            >
                              <Text
                                style={[
                                  costModalStyles.toggleText,
                                  item.warn && { color: '#C9716A' },
                                ]}
                              >
                                ⚠ 주의
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                costModalStyles.toggleBtn,
                                item.hasBalance && costModalStyles.toggleBtnOn,
                              ]}
                              onPress={() => updateField(idx, 'hasBalance', !item.hasBalance)}
                            >
                              <Text
                                style={[
                                  costModalStyles.toggleText,
                                  item.hasBalance && { color: '#C9716A' },
                                ]}
                              >
                                잔금 있음
                              </Text>
                            </TouchableOpacity>
                          </View>
                          {/* 잔금 세부 (hasBalance일 때만) */}
                          {item.hasBalance && (
                            <View style={costModalStyles.balanceSubSection}>
                              <Text style={[modalStyles.fieldLabel, { marginTop: 10 }]}>
                                잔금액 (만원)
                              </Text>
                              <View style={costModalStyles.amountRow}>
                                <TextInput
                                  style={[modalStyles.input, { flex: 1 }]}
                                  value={item.balanceAmount}
                                  onChangeText={(v) =>
                                    updateField(idx, 'balanceAmount', v.replace(/\D/g, ''))
                                  }
                                  placeholder="0"
                                  placeholderTextColor="#C8BFBB"
                                  keyboardType="number-pad"
                                />
                                <Text style={costModalStyles.amountUnit}>만원</Text>
                              </View>
                              <Text style={[modalStyles.fieldLabel, { marginTop: 10 }]}>
                                마감일
                              </Text>
                              <View style={modalStyles.dateRow}>
                                <TextInput
                                  style={[modalStyles.input, { flex: 2, textAlign: 'center' }]}
                                  value={item.balanceDue ? item.balanceDue.split('-')[0] : ''}
                                  onChangeText={(v) => {
                                    const parts = (item.balanceDue || '--').split('-');
                                    updateField(
                                      idx,
                                      'balanceDue',
                                      `${v.replace(/\D/g, '').slice(0, 4)}-${parts[1] || ''}-${parts[2] || ''}`,
                                    );
                                  }}
                                  placeholder="2026"
                                  placeholderTextColor="#C8BFBB"
                                  keyboardType="number-pad"
                                  maxLength={4}
                                />
                                <Text style={modalStyles.dateSep}>년</Text>
                                <TextInput
                                  style={[modalStyles.input, { flex: 1.5, textAlign: 'center' }]}
                                  value={item.balanceDue ? item.balanceDue.split('-')[1] : ''}
                                  onChangeText={(v) => {
                                    const parts = (item.balanceDue || '--').split('-');
                                    updateField(
                                      idx,
                                      'balanceDue',
                                      `${parts[0] || ''}-${v.replace(/\D/g, '').slice(0, 2)}-${parts[2] || ''}`,
                                    );
                                  }}
                                  placeholder="02"
                                  placeholderTextColor="#C8BFBB"
                                  keyboardType="number-pad"
                                  maxLength={2}
                                />
                                <Text style={modalStyles.dateSep}>월</Text>
                                <TextInput
                                  style={[modalStyles.input, { flex: 1.5, textAlign: 'center' }]}
                                  value={item.balanceDue ? item.balanceDue.split('-')[2] : ''}
                                  onChangeText={(v) => {
                                    const parts = (item.balanceDue || '--').split('-');
                                    updateField(
                                      idx,
                                      'balanceDue',
                                      `${parts[0] || ''}-${parts[1] || ''}-${v.replace(/\D/g, '').slice(0, 2)}`,
                                    );
                                  }}
                                  placeholder="01"
                                  placeholderTextColor="#C8BFBB"
                                  keyboardType="number-pad"
                                  maxLength={2}
                                />
                                <Text style={modalStyles.dateSep}>일</Text>
                              </View>
                              <View style={costModalStyles.urgentRow}>
                                <TouchableOpacity
                                  style={[
                                    costModalStyles.toggleBtn,
                                    item.urgent && costModalStyles.toggleBtnUrgent,
                                  ]}
                                  onPress={() => updateField(idx, 'urgent', !item.urgent)}
                                >
                                  <Text
                                    style={[
                                      costModalStyles.toggleText,
                                      item.urgent && { color: '#D0534A', fontWeight: '600' },
                                    ]}
                                  >
                                    🔴 긴급
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
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
                <TouchableOpacity style={modalStyles.addBtn} onPress={addCostItem}>
                  <Text style={modalStyles.addBtnText}>+ 비용 항목 추가</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* 잔금 탭 */
              <>
                {balanceItems.length === 0 ? (
                  <View style={costModalStyles.emptyBalance}>
                    <Text style={costModalStyles.emptyBalanceText}>
                      비용 항목에서 '잔금 있음'을 켜면{'\n'}여기에 표시됩니다
                    </Text>
                  </View>
                ) : (
                  balanceItems.map((item) => {
                    const draftIdx = draft.findIndex((d) => d.id === item.id);
                    return (
                      <View key={item.id} style={costModalStyles.balanceCard}>
                        <View style={costModalStyles.balanceCardLeft}>
                          <View
                            style={[
                              costModalStyles.balanceDot,
                              item.urgent && { backgroundColor: '#C9716A' },
                            ]}
                          />
                          <View>
                            <Text style={costModalStyles.balanceCardLabel}>{item.label} 잔금</Text>
                            <Text style={costModalStyles.balanceCardSub}>
                              {formatBalanceSub(item.balanceDue)}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={[
                              costModalStyles.balanceCardAmount,
                              item.urgent && { color: '#C9716A' },
                            ]}
                          >
                            {item.balanceAmount ? `${item.balanceAmount}만원` : '미정'}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setActiveTab('cost');
                              setOpenIdx(draftIdx);
                            }}
                          >
                            <Text style={costModalStyles.editLink}>수정</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>

          {/* 하단 저장/취소 */}
          <View style={[modalStyles.footer, { marginTop: 8 }]}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.saveBtn}
              onPress={() => {
                onSave(draft, budget);
                onClose();
              }}
            >
              <Text style={modalStyles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const costModalStyles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F0EE',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B8A9A5',
  },
  tabTextActive: {
    color: '#2C2420',
    fontWeight: '600',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF8F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE5E2',
  },
  budgetLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B5B55',
  },
  budgetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 14,
    fontWeight: '600',
    color: '#C9716A',
    minWidth: 70,
    textAlign: 'right',
    backgroundColor: '#fff',
  },
  budgetUnit: {
    fontSize: 13,
    color: '#6B5B55',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  amountUnit: {
    fontSize: 13,
    color: '#6B5B55',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FBF8F7',
  },
  toggleBtnOn: {
    borderColor: '#C9716A',
    backgroundColor: '#F5EAE9',
  },
  toggleBtnUrgent: {
    borderColor: '#D0534A',
    backgroundColor: '#FDF0EF',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B8A9A5',
  },
  balanceSubSection: {
    backgroundColor: '#FBF8F7',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EDE5E2',
  },
  urgentRow: {
    marginTop: 10,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EDE5E2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FDFAF9',
  },
  balanceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EDE5E2',
    flexShrink: 0,
  },
  balanceCardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C2420',
  },
  balanceCardSub: {
    fontSize: 11,
    color: '#B8A9A5',
    marginTop: 2,
  },
  balanceCardAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C2420',
  },
  editLink: {
    fontSize: 11,
    color: '#C9716A',
    marginTop: 4,
  },
  emptyBalance: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyBalanceText: {
    fontSize: 13,
    color: '#C8BFBB',
    textAlign: 'center',
    lineHeight: 20,
  },
});
// ────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [visibleMonth, setVisibleMonth] = useState('2026-01');
  const [timelineItems, setTimelineItems] = useState(INITIAL_TIMELINE_ITEMS);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [scheduleAddModalVisible, setScheduleAddModalVisible] = useState(false);
  const [costItems, setCostItems] = useState(INITIAL_COST_ITEMS);
  const [budget, setBudget] = useState('1000');
  const [costEditModalVisible, setCostEditModalVisible] = useState(false);

  // timelineItems에서 달력 마킹 파생
  const markedDates = timelineItems.reduce((acc, item) => {
    if (!item.dateYear || !item.dateMonth || !item.dateDay) return acc;
    const pad = (v) => String(parseInt(v)).padStart(2, '0');
    const key = `${item.dateYear}-${pad(item.dateMonth)}-${pad(item.dateDay)}`;
    const colorOpt = COLOR_OPTIONS.find((c) => c.key === (item.color ?? 'rose'));
    acc[key] = { selected: true, selectedColor: colorOpt ? colorOpt.hex : '#C9716A' };
    return acc;
  }, {});

  // 현재 달력에 보이는 월의 일정만 필터링 (날짜순)
  const visibleEvents = timelineItems
    .filter((item) => {
      if (!item.dateYear || !item.dateMonth || !item.dateDay) return false;
      const pad = (v) => String(parseInt(v)).padStart(2, '0');
      const dateStr = `${item.dateYear}-${pad(item.dateMonth)}-${pad(item.dateDay)}`;
      return dateStr.startsWith(visibleMonth);
    })
    .sort((a, b) => {
      const pad = (v) => String(parseInt(v)).padStart(2, '0');
      const da = `${a.dateYear}-${pad(a.dateMonth)}-${pad(a.dateDay)}`;
      const db = `${b.dateYear}-${pad(b.dateMonth)}-${pad(b.dateDay)}`;
      return da.localeCompare(db);
    });

  const [visibleYear, visibleMonthNum] = visibleMonth.split('-');
  const monthLabel = `${parseInt(visibleYear)}년 ${parseInt(visibleMonthNum)}월`;

  // 달력 일정 추가 → timelineItems에 직접 추가
  const handleAddSchedule = ({ dateYear, dateMonth, dateDay, label, color, status }) => {
    const newItem = {
      id: Date.now(),
      label,
      dateYear,
      dateMonth,
      dateDay,
      status: status ?? 'future',
      color: color ?? 'rose',
    };
    setTimelineItems((prev) =>
      [...prev, newItem].sort((a, b) => {
        const pad = (v) => String(parseInt(v)).padStart(2, '0');
        const da = `${a.dateYear}-${pad(a.dateMonth)}-${pad(a.dateDay)}`;
        const db = `${b.dateYear}-${pad(b.dateMonth)}-${pad(b.dateDay)}`;
        return da.localeCompare(db);
      }),
    );
  };

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
            {timelineItems.map((item) => {
              // 도트 색상: done=초록, active=로즈(채움), next=로즈(빈 원), future=회색(빈 원)
              const dotStyle =
                item.status === 'done'
                  ? { backgroundColor: '#7A9E8E', borderColor: '#7A9E8E' }
                  : item.status === 'active'
                    ? { backgroundColor: '#C9716A', borderColor: '#C9716A' }
                    : item.status === 'next'
                      ? { backgroundColor: '#fff', borderColor: '#C9716A' }
                      : { backgroundColor: '#fff', borderColor: '#D4C9C5' };
              return (
                <View key={item.id} style={styles.tlItem}>
                  <View style={[styles.tlDot, dotStyle]} />
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

        {/* ── ④ 비용 관리 ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>비용 관리</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setCostEditModalVisible(true)}>
              <Text style={styles.editBtnText}>수정</Text>
            </TouchableOpacity>
          </View>
          {costItems.map((item) => (
            <View key={item.id} style={styles.costRow}>
              <Text style={styles.costLabel}>{item.label}</Text>
              <Text
                style={[
                  styles.costValue,
                  item.warn && { color: '#C9716A' },
                  item.gray && { color: '#B8A9A5' },
                ]}
              >
                {item.warn ? '⚠ ' : ''}
                {item.value ? `${item.value}만원` : '미정'}
              </Text>
            </View>
          ))}
          <View style={styles.costTotalRow}>
            <Text style={styles.costTotalLabel}>현재 합계</Text>
            <Text style={styles.costTotalValue}>{sumValues(costItems)}만원</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.round((sumValues(costItems) / (parseInt(budget) || 1)) * 100))}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressSub}>
            예산 {budget}만원 중 {sumValues(costItems)}만원 사용
          </Text>
        </View>

        {/* ── ⑤ 잔금 일정 ── */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>잔금 일정</Text>
          </View>
          {costItems
            .filter((item) => item.hasBalance)
            .sort((a, b) => (a.balanceDue > b.balanceDue ? 1 : -1))
            .map((item) => (
              <View key={item.id} style={styles.balanceRow}>
                <View style={[styles.balanceDot, item.urgent && { backgroundColor: '#C9716A' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceLabel}>{item.label} 잔금</Text>
                  <Text style={styles.balanceSub}>{formatBalanceSub(item.balanceDue)}</Text>
                </View>
                <Text style={[styles.balanceAmount, item.urgent && { color: '#C9716A' }]}>
                  {item.balanceAmount ? `${item.balanceAmount}만원` : '미정'}
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

      {/* 일정 추가 모달 */}
      <ScheduleAddModal
        visible={scheduleAddModalVisible}
        preselectedDate={selectedDate}
        onClose={() => setScheduleAddModalVisible(false)}
        onSave={handleAddSchedule}
      />

      {/* 비용/잔금 수정 모달 */}
      <CostEditModal
        visible={costEditModalVisible}
        items={costItems}
        onClose={() => setCostEditModalVisible(false)}
        onSave={(updatedItems, updatedBudget) => {
          setCostItems(updatedItems);
          setBudget(updatedBudget);
        }}
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
  emptyEvents: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyEventsText: {
    fontSize: 12,
    color: '#C8BFBB',
  },

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

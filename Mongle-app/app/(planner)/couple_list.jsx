import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ── 상수 ─────────────────────────────────────────────────
const STAGE_STYLE = {
  '최종 점검': {
    stageColor: '#c97b6e',
    stageBg: '#fff5f3',
    barColor: '#d4537e',
    badgeBg: '#fbeaf0',
    badgeColor: '#993556',
  },
  '준비 중': {
    stageColor: '#b07840',
    stageBg: '#fdf6ee',
    barColor: '#b07858',
    badgeBg: '#f5ede8',
    badgeColor: '#8b5e52',
  },
  '초기 상담': {
    stageColor: '#8a7870',
    stageBg: '#f5f0f0',
    barColor: '#c0b8b0',
    badgeBg: '#eeeae6',
    badgeColor: '#7a7068',
  },
  '계약 완료': {
    stageColor: '#5a8c3a',
    stageBg: '#f0f8f2',
    barColor: '#6aaa80',
    badgeBg: '#eaf5ee',
    badgeColor: '#3a7a50',
  },
};
const AVATAR_POOL = [
  { bg: '#fbeaf0', color: '#993556' },
  { bg: '#f5ede8', color: '#8b5e52' },
  { bg: '#f0ede8', color: '#6e6058' },
  { bg: '#eeeae6', color: '#7a7068' },
  { bg: '#eaf0f8', color: '#4a6e94' },
  { bg: '#eaf5ee', color: '#3a7a50' },
];
const STAGE_FILTERS = ['전체', '최종 점검', '준비 중', '초기 상담', '계약 완료'];
const STAGE_OPTIONS = ['최종 점검', '준비 중', '초기 상담', '계약 완료'];
const CATEGORY_OPTIONS = [
  '웨딩홀',
  '드레스',
  '스튜디오',
  '메이크업',
  '청첩장',
  '예식',
  '상담',
  '계약',
  '기타',
];
const CATEGORY_COLOR = {
  웨딩홀: { bg: '#e6f1fb', color: '#185FA5' },
  드레스: { bg: '#fbeaf0', color: '#993556' },
  스튜디오: { bg: '#f5ede8', color: '#8b5e52' },
  메이크업: { bg: '#eeedfe', color: '#534AB7' },
  청첩장: { bg: '#faeeda', color: '#854F0B' },
  예식: { bg: '#fff5f3', color: '#c97b6e' },
  상담: { bg: '#eaf3de', color: '#3B6D11' },
  계약: { bg: '#eaf5ee', color: '#3a7a50' },
  기타: { bg: '#f5f0f0', color: '#8a7870' },
};
const EMPTY_FORM = {
  groom: '',
  bride: '',
  year: '',
  month: '',
  day: '',
  venue: '',
  stage: '초기 상담',
  phone: '',
};
const EMPTY_SCHED = { title: '', year: '', month: '', day: '', time: '', category: '예식' };

// ── 유틸 ─────────────────────────────────────────────────
const getInitials = (name) =>
  name
    .split('·')
    .map((s) => s.trim()[0] ?? '')
    .join('')
    .slice(0, 2);
const calcDday = (dateStr) => {
  const m = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (!m) return 999;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};
const formatPhone = (raw) => {
  const d = raw.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
};
const coupleToForm = (c) => {
  const parts = c.name.split('·').map((s) => s.trim());
  const dm = c.date.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  return {
    groom: parts[0] ?? '',
    bride: parts[1] ?? '',
    year: dm ? dm[1] : '',
    month: dm ? dm[2] : '',
    day: dm ? dm[3] : '',
    venue: c.venue,
    stage: c.stage,
    phone: c.phone.replace(/-/g, ''),
  };
};
const schedToForm = (s) => {
  const dm = s.date.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  return {
    title: s.title,
    year: dm ? dm[1] : '',
    month: dm ? dm[2] : '',
    day: dm ? dm[3] : '',
    time: s.time,
    category: s.category,
  };
};

// ── 임시 데이터 ──────────────────────────────────────────
const INITIAL_COUPLES = [
  {
    id: '1',
    name: '박지수 · 이현우',
    date: '2026년 4월 5일',
    venue: '더채플 청담',
    stage: '최종 점검',
    phone: '010-1234-5678',
    progress: 92,
    avatarIdx: 0,
  },
  {
    id: '2',
    name: '최민정 · 강태준',
    date: '2026년 4월 12일',
    venue: '롯데호텔 잠실',
    stage: '준비 중',
    phone: '010-2345-6789',
    progress: 78,
    avatarIdx: 1,
  },
  {
    id: '3',
    name: '윤서연 · 오민석',
    date: '2026년 4월 26일',
    venue: '그랜드 인터컨티',
    stage: '준비 중',
    phone: '010-3456-7890',
    progress: 55,
    avatarIdx: 2,
  },
  {
    id: '4',
    name: '정하린 · 김도윤',
    date: '2026년 5월 31일',
    venue: '더베뉴 한남',
    stage: '초기 상담',
    phone: '010-4567-8901',
    progress: 30,
    avatarIdx: 3,
  },
  {
    id: '5',
    name: '이수아 · 한재원',
    date: '2026년 6월 14일',
    venue: '파크하얏트 서울',
    stage: '초기 상담',
    phone: '010-5678-9012',
    progress: 20,
    avatarIdx: 4,
  },
  {
    id: '6',
    name: '강민준 · 서지영',
    date: '2026년 7월 4일',
    venue: '신라호텔',
    stage: '계약 완료',
    phone: '010-6789-0123',
    progress: 15,
    avatarIdx: 5,
  },
];
const INITIAL_SCHEDULES = {
  1: [
    {
      id: 's1',
      title: '웨딩홀 최종 미팅',
      date: '2026년 3월 28일',
      time: '14:00',
      category: '웨딩홀',
      done: true,
    },
    {
      id: 's2',
      title: '드레스 최종 피팅',
      date: '2026년 3월 30일',
      time: '11:00',
      category: '드레스',
      done: false,
    },
    {
      id: 's3',
      title: '청첩장 수령',
      date: '2026년 4월 1일',
      time: '10:00',
      category: '청첩장',
      done: false,
    },
    {
      id: 's4',
      title: '본식 리허설',
      date: '2026년 4월 4일',
      time: '15:00',
      category: '예식',
      done: false,
    },
    {
      id: 's5',
      title: '결혼식',
      date: '2026년 4월 5일',
      time: '12:00',
      category: '예식',
      done: false,
    },
  ],
  2: [
    {
      id: 's1',
      title: '스튜디오 촬영',
      date: '2026년 3월 29일',
      time: '10:00',
      category: '스튜디오',
      done: false,
    },
    {
      id: 's2',
      title: '드레스 피팅 2차',
      date: '2026년 4월 2일',
      time: '13:00',
      category: '드레스',
      done: false,
    },
    {
      id: 's3',
      title: '메이크업 리허설',
      date: '2026년 4월 8일',
      time: '10:00',
      category: '메이크업',
      done: false,
    },
    {
      id: 's4',
      title: '결혼식',
      date: '2026년 4월 12일',
      time: '13:00',
      category: '예식',
      done: false,
    },
  ],
  3: [
    {
      id: 's1',
      title: '스튜디오 계약',
      date: '2026년 3월 28일',
      time: '15:00',
      category: '스튜디오',
      done: false,
    },
    {
      id: 's2',
      title: '웨딩홀 미팅',
      date: '2026년 4월 5일',
      time: '11:00',
      category: '웨딩홀',
      done: false,
    },
    {
      id: 's3',
      title: '결혼식',
      date: '2026년 4월 26일',
      time: '11:00',
      category: '예식',
      done: false,
    },
  ],
  4: [
    {
      id: 's1',
      title: '초기 상담',
      date: '2026년 3월 30일',
      time: '14:00',
      category: '상담',
      done: false,
    },
    {
      id: 's2',
      title: '웨딩홀 투어',
      date: '2026년 4월 10일',
      time: '13:00',
      category: '웨딩홀',
      done: false,
    },
    {
      id: 's3',
      title: '결혼식',
      date: '2026년 5월 31일',
      time: '12:00',
      category: '예식',
      done: false,
    },
  ],
  5: [
    {
      id: 's1',
      title: '첫 상담',
      date: '2026년 4월 1일',
      time: '15:00',
      category: '상담',
      done: false,
    },
    {
      id: 's2',
      title: '결혼식',
      date: '2026년 6월 14일',
      time: '11:00',
      category: '예식',
      done: false,
    },
  ],
  6: [
    {
      id: 's1',
      title: '계약 체결',
      date: '2026년 3월 20일',
      time: '14:00',
      category: '계약',
      done: true,
    },
    {
      id: 's2',
      title: '스튜디오 미팅',
      date: '2026년 4월 15일',
      time: '11:00',
      category: '스튜디오',
      done: false,
    },
    {
      id: 's3',
      title: '결혼식',
      date: '2026년 7월 4일',
      time: '12:00',
      category: '예식',
      done: false,
    },
  ],
};

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function CoupleList() {
  const [couples, setCouples] = useState(INITIAL_COUPLES);
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [searchText, setSearchText] = useState('');
  const [activeStage, setActiveStage] = useState(0);

  // 추가 모달
  const [addVisible, setAddVisible] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState('');

  // 상세/수정 모달
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCouple, setSelectedCouple] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState('');
  const [editSchedules, setEditSchedules] = useState([]); // 수정 중 일정 사본

  // 일정 항목 추가 인라인 폼 표시 여부
  const [showSchedForm, setShowSchedForm] = useState(false);
  const [schedForm, setSchedForm] = useState(EMPTY_SCHED);
  const [editingSchedId, setEditingSchedId] = useState(null); // null=추가, id=수정

  // ── 추가 모달 ──
  const openAdd = () => {
    setAddForm(EMPTY_FORM);
    setAddError('');
    setAddVisible(true);
  };
  const closeAdd = () => {
    setAddVisible(false);
    setAddError('');
  };
  const handleAdd = () => {
    if (!addForm.groom.trim() && !addForm.bride.trim()) {
      setAddError('신랑 또는 신부 이름을 입력해주세요.');
      return;
    }
    if (!addForm.year || !addForm.month || !addForm.day) {
      setAddError('결혼 예정일을 모두 입력해주세요.');
      return;
    }
    if (!addForm.venue.trim()) {
      setAddError('웨딩홀을 입력해주세요.');
      return;
    }
    const newId = Date.now().toString();
    setCouples((prev) => [
      {
        id: newId,
        name: `${addForm.groom.trim()} · ${addForm.bride.trim()}`,
        date: `${addForm.year}년 ${addForm.month}월 ${addForm.day}일`,
        venue: addForm.venue.trim(),
        stage: addForm.stage,
        phone: formatPhone(addForm.phone),
        progress: 0,
        avatarIdx: prev.length % AVATAR_POOL.length,
      },
      ...prev,
    ]);
    setSchedules((prev) => ({ ...prev, [newId]: [] }));
    closeAdd();
  };

  // ── 상세 모달 ──
  const openDetail = (couple) => {
    setSelectedCouple(couple);
    setIsEditing(false);
    setDetailVisible(true);
  };
  const closeDetail = () => {
    setDetailVisible(false);
    setIsEditing(false);
    setEditError('');
    setShowSchedForm(false);
  };

  const startEdit = () => {
    setEditForm(coupleToForm(selectedCouple));
    setEditSchedules([...(schedules[selectedCouple.id] ?? [])]);
    setShowSchedForm(false);
    setEditingSchedId(null);
    setEditError('');
    setIsEditing(true);
  };

  const handleUpdate = () => {
    if (!editForm.groom.trim() && !editForm.bride.trim()) {
      setEditError('신랑 또는 신부 이름을 입력해주세요.');
      return;
    }
    if (!editForm.year || !editForm.month || !editForm.day) {
      setEditError('결혼 예정일을 모두 입력해주세요.');
      return;
    }
    if (!editForm.venue.trim()) {
      setEditError('웨딩홀을 입력해주세요.');
      return;
    }
    const updated = {
      ...selectedCouple,
      name: `${editForm.groom.trim()} · ${editForm.bride.trim()}`,
      date: `${editForm.year}년 ${editForm.month}월 ${editForm.day}일`,
      venue: editForm.venue.trim(),
      stage: editForm.stage,
      phone: formatPhone(editForm.phone),
    };
    setCouples((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSchedules((prev) => ({ ...prev, [updated.id]: editSchedules }));
    setSelectedCouple(updated);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert('커플 삭제', `${selectedCouple.name} 커플을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setCouples((p) => p.filter((c) => c.id !== selectedCouple.id));
          closeDetail();
        },
      },
    ]);
  };

  // ── 일정 편집 (수정 모드 내) ──
  const openSchedAdd = () => {
    setSchedForm(EMPTY_SCHED);
    setEditingSchedId(null);
    setShowSchedForm(true);
  };
  const openSchedEdit = (s) => {
    setSchedForm(schedToForm(s));
    setEditingSchedId(s.id);
    setShowSchedForm(true);
  };
  const closeSchedForm = () => {
    setShowSchedForm(false);
    setEditingSchedId(null);
  };

  const saveSchedForm = () => {
    if (!schedForm.title.trim()) return;
    const date =
      schedForm.year && schedForm.month && schedForm.day
        ? `${schedForm.year}년 ${schedForm.month}월 ${schedForm.day}일`
        : '';
    if (editingSchedId) {
      setEditSchedules((prev) =>
        prev.map((s) =>
          s.id === editingSchedId
            ? {
                ...s,
                title: schedForm.title.trim(),
                date,
                time: schedForm.time,
                category: schedForm.category,
              }
            : s,
        ),
      );
    } else {
      setEditSchedules((prev) => [
        ...prev,
        {
          id: `s${Date.now()}`,
          title: schedForm.title.trim(),
          date,
          time: schedForm.time,
          category: schedForm.category,
          done: false,
        },
      ]);
    }
    closeSchedForm();
  };

  const deleteSchedItem = (id) => {
    Alert.alert('일정 삭제', '이 일정을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => setEditSchedules((prev) => prev.filter((s) => s.id !== id)),
      },
    ]);
  };

  // ── 필터링 & 정렬 ──
  const filtered = couples.filter((c) => {
    const ms =
      searchText.trim() === '' ||
      c.name.replace(/\s/g, '').includes(searchText.replace(/\s/g, '')) ||
      c.venue.includes(searchText);
    const mst = activeStage === 0 ? true : c.stage === STAGE_FILTERS[activeStage];
    return ms && mst;
  });
  const sorted = [...filtered].sort((a, b) => calcDday(a.date) - calcDday(b.date));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf8f5" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#8b5e52" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>커플 목록</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#8b5e52" />
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="#c8bdb8" />
          <TextInput
            style={styles.searchInput}
            placeholder="커플 이름, 웨딩홀 검색"
            placeholderTextColor="#c8bdb8"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={15} color="#c8bdb8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 단계 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.stageFilterRow}
      >
        {STAGE_FILTERS.map((s, i) => (
          <TouchableOpacity
            key={s}
            style={[styles.stageChip, i === activeStage && styles.stageChipActive]}
            onPress={() => setActiveStage(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.stageChipText, i === activeStage && styles.stageChipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 정렬 안내 */}
      <View style={styles.sortRow}>
        <Ionicons name="swap-vertical-outline" size={13} color="#a08880" />
        <Text style={styles.sortText}>D-day 임박순</Text>
        <Text style={styles.resultCount}>{sorted.length}쌍</Text>
      </View>

      {/* 커플 리스트 */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listArea}>
        {sorted.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color="#d8ccc6" />
            <Text style={styles.emptyText}>검색 결과가 없어요</Text>
          </View>
        ) : (
          sorted.map((c) => {
            const av = AVATAR_POOL[c.avatarIdx % AVATAR_POOL.length];
            const st = STAGE_STYLE[c.stage] ?? STAGE_STYLE['초기 상담'];
            const dday = calcDday(c.date);
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.coupleCard}
                activeOpacity={0.85}
                onPress={() => openDetail(c)}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                    <Text style={[styles.avatarText, { color: av.color }]}>
                      {getInitials(c.name)}
                    </Text>
                  </View>
                  <View style={styles.coupleInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.coupleName}>{c.name}</Text>
                      <View style={[styles.ddayBadge, { backgroundColor: st.badgeBg }]}>
                        <Text style={[styles.ddayText, { color: st.badgeColor }]}>
                          {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day' : '완료'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.coupleDate}>{c.date}</Text>
                    <Text style={styles.coupleVenue}>{c.venue}</Text>
                  </View>
                </View>
                <View style={styles.cardMid}>
                  <View style={[styles.stagePill, { backgroundColor: st.stageBg }]}>
                    <Text style={[styles.stageText, { color: st.stageColor }]}>{c.stage}</Text>
                  </View>
                  <Text style={styles.progressPct}>{c.progress}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${c.progress}%`, backgroundColor: st.barColor },
                    ]}
                  />
                </View>
                <View style={styles.cardBottom}>
                  <Ionicons name="call-outline" size={12} color="#c8bdb8" />
                  <Text style={styles.phoneText}>{c.phone || '연락처 없음'}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#d8ccc6"
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ══════════ 추가 모달 ══════════ */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={closeAdd}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeAdd} />
          <View style={[styles.modalSheet, { flex: 1 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>새 커플 추가</Text>
              <TouchableOpacity onPress={closeAdd} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#a08880" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <CoupleForm form={addForm} setForm={setAddForm} setError={setAddError} />
              {addError !== '' && <ErrorBox msg={addError} />}
              <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>추가하기</Text>
              </TouchableOpacity>
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════ 상세/수정 모달 ══════════ */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={closeDetail}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeDetail} />
          <View style={[styles.modalSheet, { flex: 1 }]}>
            <View style={styles.modalHandle} />
            {selectedCouple &&
              (() => {
                const av = AVATAR_POOL[selectedCouple.avatarIdx % AVATAR_POOL.length];
                const st = STAGE_STYLE[selectedCouple.stage] ?? STAGE_STYLE['초기 상담'];
                const dday = calcDday(selectedCouple.date);
                const coupleScheds = schedules[selectedCouple.id] ?? [];
                return (
                  <>
                    {/* 모달 헤더 */}
                    <View style={styles.modalHeader}>
                      {isEditing ? (
                        <>
                          <TouchableOpacity onPress={() => setIsEditing(false)} activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={20} color="#a08880" />
                          </TouchableOpacity>
                          <Text style={styles.modalTitle}>정보 수정</Text>
                          <TouchableOpacity onPress={closeDetail} activeOpacity={0.7}>
                            <Ionicons name="close" size={20} color="#a08880" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <Text style={styles.modalTitle}>커플 상세</Text>
                          <View style={styles.detailHeaderBtns}>
                            <TouchableOpacity
                              style={styles.editBtn}
                              onPress={startEdit}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="pencil-outline" size={15} color="#8b5e52" />
                              <Text style={styles.editBtnText}>수정</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={handleDelete}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={15} color="#e87070" />
                              <Text style={styles.deleteBtnText}>삭제</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {isEditing ? (
                        /* ── 수정 모드 ── */
                        <>
                          <CoupleForm
                            form={editForm}
                            setForm={setEditForm}
                            setError={setEditError}
                          />

                          {/* 일정 수정 섹션 */}
                          <View style={styles.editSchedSection}>
                            <View style={styles.editSchedHeader}>
                              <Text style={styles.fieldLabel}>일정</Text>
                              <TouchableOpacity
                                style={styles.addSchedBtn}
                                onPress={openSchedAdd}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="add" size={14} color="#8b5e52" />
                                <Text style={styles.addSchedBtnText}>일정 추가</Text>
                              </TouchableOpacity>
                            </View>

                            {editSchedules.length === 0 && !showSchedForm && (
                              <View style={styles.scheduleEmpty}>
                                <Text style={styles.scheduleEmptyText}>등록된 일정이 없어요</Text>
                              </View>
                            )}

                            {/* 일정 항목 목록 */}
                            {editSchedules.map((s) => {
                              const cc = CATEGORY_COLOR[s.category] ?? CATEGORY_COLOR['기타'];
                              return (
                                <View key={s.id} style={styles.editSchedItem}>
                                  <View
                                    style={[
                                      styles.categoryPill,
                                      { backgroundColor: cc.bg, marginRight: 8 },
                                    ]}
                                  >
                                    <Text style={[styles.categoryText, { color: cc.color }]}>
                                      {s.category}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.editSchedTitle}>{s.title}</Text>
                                    <Text style={styles.editSchedDate}>
                                      {s.date}
                                      {s.time ? `  ${s.time}` : ''}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() => openSchedEdit(s)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                                    activeOpacity={0.6}
                                  >
                                    <Ionicons name="pencil-outline" size={15} color="#c8bdb8" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => deleteSchedItem(s.id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                                    activeOpacity={0.6}
                                    style={{ marginLeft: 10 }}
                                  >
                                    <Ionicons name="trash-outline" size={15} color="#e8a0a0" />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}

                            {/* 일정 추가/수정 인라인 폼 */}
                            {showSchedForm && (
                              <View style={styles.schedFormCard}>
                                <Text style={styles.schedFormTitle}>
                                  {editingSchedId ? '일정 수정' : '새 일정'}
                                </Text>

                                <Text style={styles.subLabel}>일정명</Text>
                                <TextInput
                                  style={styles.textInput}
                                  placeholder="예) 드레스 피팅"
                                  placeholderTextColor="#c8bdb8"
                                  value={schedForm.title}
                                  onChangeText={(v) => setSchedForm((f) => ({ ...f, title: v }))}
                                />

                                <Text style={styles.subLabel}>날짜</Text>
                                <View style={styles.dateRow}>
                                  <View style={{ flex: 2 }}>
                                    <TextInput
                                      style={styles.textInput}
                                      placeholder="2026"
                                      placeholderTextColor="#c8bdb8"
                                      value={schedForm.year}
                                      onChangeText={(v) =>
                                        setSchedForm((f) => ({
                                          ...f,
                                          year: v.replace(/\D/g, '').slice(0, 4),
                                        }))
                                      }
                                      keyboardType="number-pad"
                                      maxLength={4}
                                    />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <TextInput
                                      style={styles.textInput}
                                      placeholder="월"
                                      placeholderTextColor="#c8bdb8"
                                      value={schedForm.month}
                                      onChangeText={(v) =>
                                        setSchedForm((f) => ({
                                          ...f,
                                          month: v.replace(/\D/g, '').slice(0, 2),
                                        }))
                                      }
                                      keyboardType="number-pad"
                                      maxLength={2}
                                    />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <TextInput
                                      style={styles.textInput}
                                      placeholder="일"
                                      placeholderTextColor="#c8bdb8"
                                      value={schedForm.day}
                                      onChangeText={(v) =>
                                        setSchedForm((f) => ({
                                          ...f,
                                          day: v.replace(/\D/g, '').slice(0, 2),
                                        }))
                                      }
                                      keyboardType="number-pad"
                                      maxLength={2}
                                    />
                                  </View>
                                </View>

                                <Text style={styles.subLabel}>시간 (선택)</Text>
                                <TextInput
                                  style={styles.textInput}
                                  placeholder="예) 14:00"
                                  placeholderTextColor="#c8bdb8"
                                  value={schedForm.time}
                                  onChangeText={(v) => setSchedForm((f) => ({ ...f, time: v }))}
                                />

                                <Text style={styles.subLabel}>카테고리</Text>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  style={{ flexGrow: 0 }}
                                  contentContainerStyle={{
                                    flexDirection: 'row',
                                    gap: 6,
                                    paddingBottom: 14,
                                  }}
                                >
                                  {CATEGORY_OPTIONS.map((cat) => (
                                    <TouchableOpacity
                                      key={cat}
                                      style={[
                                        styles.stageSelectChip,
                                        schedForm.category === cat && styles.stageSelectChipActive,
                                      ]}
                                      onPress={() => setSchedForm((f) => ({ ...f, category: cat }))}
                                      activeOpacity={0.7}
                                    >
                                      <Text
                                        style={[
                                          styles.stageSelectText,
                                          schedForm.category === cat &&
                                            styles.stageSelectTextActive,
                                        ]}
                                      >
                                        {cat}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>

                                <View style={styles.schedFormBtns}>
                                  <TouchableOpacity
                                    style={styles.schedCancelBtn}
                                    onPress={closeSchedForm}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={styles.schedCancelBtnText}>취소</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.saveBtn, { flex: 1, marginTop: 0 }]}
                                    onPress={saveSchedForm}
                                    activeOpacity={0.8}
                                  >
                                    <Text style={styles.saveBtnText}>
                                      {editingSchedId ? '수정' : '추가'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                          </View>

                          {editError !== '' && <ErrorBox msg={editError} />}
                          <TouchableOpacity
                            style={styles.saveBtn}
                            activeOpacity={0.8}
                            onPress={handleUpdate}
                          >
                            <Text style={styles.saveBtnText}>수정 완료</Text>
                          </TouchableOpacity>
                          <View style={{ height: 16 }} />
                        </>
                      ) : (
                        /* ── 상세 보기 ── */
                        <>
                          <View style={styles.detailHero}>
                            <View style={[styles.detailAvatar, { backgroundColor: av.bg }]}>
                              <Text style={[styles.detailAvatarText, { color: av.color }]}>
                                {getInitials(selectedCouple.name)}
                              </Text>
                            </View>
                            <Text style={styles.detailName}>{selectedCouple.name}</Text>
                            <View
                              style={[
                                styles.ddayBadge,
                                { backgroundColor: st.badgeBg, marginTop: 6 },
                              ]}
                            >
                              <Text style={[styles.ddayText, { color: st.badgeColor }]}>
                                {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day' : '완료'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.detailCard}>
                            <DetailRow
                              icon="calendar-outline"
                              label="결혼 예정일"
                              value={selectedCouple.date}
                            />
                            <DetailRow
                              icon="location-outline"
                              label="웨딩홀"
                              value={selectedCouple.venue}
                            />
                            <DetailRow
                              icon="call-outline"
                              label="연락처"
                              value={selectedCouple.phone || '없음'}
                            />
                            <DetailRow
                              icon="flag-outline"
                              label="진행 단계"
                              value={selectedCouple.stage}
                              isLast
                            />
                          </View>
                          <View style={styles.detailProgressCard}>
                            <View style={styles.detailProgressHeader}>
                              <Text style={styles.detailProgressLabel}>준비율</Text>
                              <Text style={styles.detailProgressPct}>
                                {selectedCouple.progress}%
                              </Text>
                            </View>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${selectedCouple.progress}%`,
                                    backgroundColor: st.barColor,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                          <View style={styles.scheduleSection}>
                            <Text style={styles.scheduleSectionTitle}>일정</Text>
                            {coupleScheds.length === 0 ? (
                              <View style={styles.scheduleEmpty}>
                                <Ionicons name="calendar-outline" size={32} color="#d8ccc6" />
                                <Text style={styles.scheduleEmptyText}>등록된 일정이 없어요</Text>
                              </View>
                            ) : (
                              <View style={styles.scheduleList}>
                                {coupleScheds.map((s, idx, arr) => {
                                  const cc = CATEGORY_COLOR[s.category] ?? CATEGORY_COLOR['기타'];
                                  return (
                                    <View key={s.id} style={styles.scheduleItem}>
                                      <View style={styles.timelineCol}>
                                        <View
                                          style={[
                                            styles.timelineDot,
                                            s.done && styles.timelineDotDone,
                                          ]}
                                        />
                                        {idx < arr.length - 1 && (
                                          <View style={styles.timelineLine} />
                                        )}
                                      </View>
                                      <View style={styles.scheduleContent}>
                                        <View style={styles.scheduleTitleRow}>
                                          <Text
                                            style={[
                                              styles.scheduleTitle,
                                              s.done && styles.scheduleTitleDone,
                                            ]}
                                          >
                                            {s.title}
                                          </Text>
                                          <View
                                            style={[
                                              styles.categoryPill,
                                              { backgroundColor: cc.bg },
                                            ]}
                                          >
                                            <Text
                                              style={[styles.categoryText, { color: cc.color }]}
                                            >
                                              {s.category}
                                            </Text>
                                          </View>
                                        </View>
                                        <Text style={styles.scheduleDate}>
                                          {s.date}
                                          {s.time ? `  ${s.time}` : ''}
                                        </Text>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                          <View style={{ height: 16 }} />
                        </>
                      )}
                    </ScrollView>
                  </>
                );
              })()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── 공통 폼 컴포넌트 ─────────────────────────────────────
function CoupleForm({ form, setForm, setError }) {
  const f = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError('');
  };
  return (
    <>
      <Text style={styles.fieldLabel}>
        커플 이름 <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.rowInputs}>
        <View style={styles.rowInputWrap}>
          <Text style={styles.subLabel}>신랑</Text>
          <TextInput
            style={styles.textInput}
            placeholder="홍길동"
            placeholderTextColor="#c8bdb8"
            value={form.groom}
            onChangeText={(v) => f('groom', v)}
          />
        </View>
        <View style={styles.rowDividerWrap}>
          <Text style={styles.rowDividerText}>·</Text>
        </View>
        <View style={styles.rowInputWrap}>
          <Text style={styles.subLabel}>신부</Text>
          <TextInput
            style={styles.textInput}
            placeholder="김영희"
            placeholderTextColor="#c8bdb8"
            value={form.bride}
            onChangeText={(v) => f('bride', v)}
          />
        </View>
      </View>
      <Text style={styles.fieldLabel}>
        결혼 예정일 <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.dateRow}>
        <View style={{ flex: 2 }}>
          <Text style={styles.subLabel}>년</Text>
          <TextInput
            style={styles.textInput}
            placeholder="2026"
            placeholderTextColor="#c8bdb8"
            value={form.year}
            onChangeText={(v) => f('year', v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subLabel}>월</Text>
          <TextInput
            style={styles.textInput}
            placeholder="8"
            placeholderTextColor="#c8bdb8"
            value={form.month}
            onChangeText={(v) => f('month', v.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subLabel}>일</Text>
          <TextInput
            style={styles.textInput}
            placeholder="15"
            placeholderTextColor="#c8bdb8"
            value={form.day}
            onChangeText={(v) => f('day', v.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
      <Text style={styles.fieldLabel}>
        웨딩홀 <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="예) 더채플 청담"
        placeholderTextColor="#c8bdb8"
        value={form.venue}
        onChangeText={(v) => f('venue', v)}
      />
      <Text style={styles.fieldLabel}>연락처</Text>
      <TextInput
        style={styles.textInput}
        placeholder="숫자만 입력  예) 01012345678"
        placeholderTextColor="#c8bdb8"
        value={form.phone}
        onChangeText={(v) => f('phone', v.replace(/\D/g, '').slice(0, 11))}
        keyboardType="number-pad"
        maxLength={11}
      />
      <Text style={styles.fieldLabel}>진행 단계</Text>
      <View style={styles.stageSelectRow}>
        {STAGE_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.stageSelectChip, form.stage === s && styles.stageSelectChipActive]}
            onPress={() => f('stage', s)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.stageSelectText, form.stage === s && styles.stageSelectTextActive]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

function ErrorBox({ msg }) {
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={13} color="#e87070" />
      <Text style={styles.errorText}>{msg}</Text>
    </View>
  );
}
function DetailRow({ icon, label, value, isLast }) {
  return (
    <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={15} color="#c8bdb8" style={{ marginTop: 1 }} />
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value}</Text>
    </View>
  );
}

// ── 스타일 ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf8f5' },
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
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ede5de',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#3a2e2a', paddingVertical: 0 },
  stageFilterRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    backgroundColor: '#fff',
  },
  stageChipActive: { backgroundColor: '#3a2e2a', borderColor: '#3a2e2a' },
  stageChipText: { fontSize: 12, color: '#8a7870' },
  stageChipTextActive: { color: '#fff', fontWeight: '500' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sortText: { fontSize: 12, color: '#a08880', flex: 1 },
  resultCount: { fontSize: 12, color: '#a08880' },
  listArea: { flex: 1 },
  coupleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 12, fontWeight: '600' },
  coupleInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coupleName: { fontSize: 14, fontWeight: '600', color: '#3a2e2a', flex: 1, marginRight: 8 },
  ddayBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, flexShrink: 0 },
  ddayText: { fontSize: 11, fontWeight: '600' },
  coupleDate: { fontSize: 12, color: '#8a7870' },
  coupleVenue: { fontSize: 11, color: '#a08880' },
  cardMid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stagePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  stageText: { fontSize: 11, fontWeight: '500' },
  progressPct: { fontSize: 11, color: '#a08880' },
  progressTrack: {
    height: 4,
    backgroundColor: '#f0e8e3',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#f5f0eb',
    paddingTop: 10,
  },
  phoneText: { fontSize: 12, color: '#a08880' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: '#b8aca8' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(58,46,42,0.4)' },
  modalSheet: {
    backgroundColor: '#faf8f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '92%',
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
  detailHeaderBtns: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editBtnText: { fontSize: 13, color: '#8b5e52', fontWeight: '500' },
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
  detailHero: { alignItems: 'center', paddingVertical: 20 },
  detailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailAvatarText: { fontSize: 20, fontWeight: '600' },
  detailName: { fontSize: 18, fontWeight: '600', color: '#3a2e2a' },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f0eb',
  },
  detailRowLabel: { fontSize: 13, color: '#a08880', width: 72 },
  detailRowValue: { fontSize: 13, color: '#3a2e2a', fontWeight: '500', flex: 1 },
  detailProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    padding: 16,
    marginBottom: 12,
  },
  detailProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailProgressLabel: { fontSize: 13, color: '#a08880' },
  detailProgressPct: { fontSize: 13, fontWeight: '600', color: '#3a2e2a' },

  scheduleSection: { marginBottom: 4 },
  scheduleSectionTitle: { fontSize: 14, fontWeight: '600', color: '#3a2e2a', marginBottom: 12 },
  scheduleEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  scheduleEmptyText: { fontSize: 13, color: '#b8aca8' },
  scheduleList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  scheduleItem: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  timelineCol: { alignItems: 'center', width: 14, paddingTop: 3 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c97b6e',
    borderWidth: 2,
    borderColor: '#fbeaf0',
  },
  timelineDotDone: { backgroundColor: '#9aba7a', borderColor: '#e8f0e0' },
  timelineLine: { flex: 1, width: 1.5, backgroundColor: '#f0e8e3', marginTop: 4 },
  scheduleContent: { flex: 1, paddingBottom: 4 },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  scheduleTitle: { fontSize: 13, fontWeight: '500', color: '#3a2e2a', flex: 1 },
  scheduleTitleDone: { color: '#b8aca8', textDecorationLine: 'line-through' },
  scheduleDate: { fontSize: 11, color: '#a08880' },
  categoryPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, flexShrink: 0 },
  categoryText: { fontSize: 10, fontWeight: '500' },

  // 수정 모드 일정 섹션
  editSchedSection: { marginBottom: 16 },
  editSchedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addSchedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addSchedBtnText: { fontSize: 12, color: '#8b5e52', fontWeight: '500' },
  editSchedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    padding: 12,
    marginBottom: 8,
  },
  editSchedTitle: { fontSize: 13, fontWeight: '500', color: '#3a2e2a' },
  editSchedDate: { fontSize: 11, color: '#a08880', marginTop: 2 },

  // 일정 인라인 폼
  schedFormCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    padding: 14,
    marginBottom: 8,
  },
  schedFormTitle: { fontSize: 14, fontWeight: '600', color: '#3a2e2a', marginBottom: 14 },
  schedFormBtns: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  schedCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F0F0',
  },
  schedCancelBtnText: { fontSize: 14, color: '#8a7870', fontWeight: '500' },

  fieldLabel: { fontSize: 12, fontWeight: '500', color: '#a08880', marginBottom: 8 },
  required: { color: '#e87070' },
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
  },
  rowInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowInputWrap: { flex: 1 },
  rowDividerWrap: { paddingBottom: 28, justifyContent: 'center' },
  rowDividerText: { fontSize: 18, color: '#c8bdb8', fontWeight: '300' },
  dateRow: { flexDirection: 'row', gap: 8 },
  subLabel: { fontSize: 11, color: '#a08880', marginBottom: 5 },
  stageSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  stageSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#ede5de',
    backgroundColor: '#fff',
  },
  stageSelectChipActive: { backgroundColor: '#3a2e2a', borderColor: '#3a2e2a' },
  stageSelectText: { fontSize: 13, color: '#8a7870' },
  stageSelectTextActive: { color: '#fff', fontWeight: '500' },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#f0cece',
    padding: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 12, color: '#e87070' },
  saveBtn: {
    backgroundColor: '#3a2e2a',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

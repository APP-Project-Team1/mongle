import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { router } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { resolveCoupleContext } from '../../../lib/coupleIdentity';
import { formatKoreanDate, toDbDate } from '../../../lib/coupleWorkspace';

LocaleConfig.locales.ko = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

const COLOR_OPTIONS = [
  { key: 'rose', label: '로즈', hex: '#C9716A', bg: '#F5EAE9', text: '#C9716A' },
  { key: 'sage', label: '세이지', hex: '#7A9E8E', bg: '#EBF2EE', text: '#7A9E8E' },
  { key: 'sky', label: '스카이', hex: '#6A9EC9', bg: '#E9F2F8', text: '#6A9EC9' },
  { key: 'peach', label: '피치', hex: '#D4956A', bg: '#F8EFE9', text: '#D4956A' },
];

const STATUS_OPTIONS = [
  { value: 'done', label: '완료' },
  { value: 'active', label: '진행 중' },
  { value: 'next', label: '다음 예정' },
  { value: 'future', label: '미래' },
];

const COLOR_TO_CATEGORY = { rose: '드레스', sage: '웨딩홀', sky: '스튜디오', peach: '본식' };
const CATEGORY_TO_COLOR = { 웨딩홀: 'sage', 스튜디오: 'sky', 드레스: 'rose', 메이크업: 'rose', 본식: 'peach', 기타: 'rose' };

const formatDate = (item) => {
  if (!item.scheduled_date) return '';
  const [y, m, d] = item.scheduled_date.split('-');
  return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
};

const statusFromItem = (item) => {
  if (item.done) return 'done';
  if (!item.scheduled_date) return 'future';
  const target = new Date(`${item.scheduled_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff <= 7) return 'active';
  if (diff <= 30) return 'next';
  return 'future';
};

function TimelineEditModal({ visible, items, onClose, onSave, onDelete, onToggleDone }) {
  const [draft, setDraft] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setDraft(items.map((item) => ({ ...item, status: statusFromItem(item) })));
    setOpenIdx(null);
  }, [visible, items]);

  const updateField = (idx, field, value) => {
    setDraft((prev) => prev.map((item, index) => (index === idx ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    const now = new Date().toISOString().slice(0, 10);
    setDraft((prev) => {
      const next = [...prev, { id: `new-${Date.now()}`, title: '', scheduled_date: now, color: 'rose', status: 'future', done: false, isNew: true }];
      setOpenIdx(next.length - 1);
      return next;
    });
  };

  const handleSave = async () => {
    const normalized = draft
      .filter((item) => item.title?.trim() && toDbDate(item.scheduled_date))
      .sort((a, b) => `${a.scheduled_date}`.localeCompare(`${b.scheduled_date}`));

    const originalById = new Map(items.map((item) => [String(item.id), item]));
    const changedItems = normalized.filter((item) => {
      if (item.isNew || String(item.id).startsWith('new-')) return true;
      const original = originalById.get(String(item.id));
      if (!original) return true;
      const nextDate = toDbDate(item.scheduled_date);
      const nextTitle = item.title.trim();
      const nextDone = item.done ?? false;
      const nextCategory = item.category || COLOR_TO_CATEGORY[item.color] || '기타';
      return (
        original.title !== nextTitle ||
        original.scheduled_date !== nextDate ||
        (original.done ?? false) !== nextDone ||
        (original.category || '기타') !== nextCategory
      );
    });

    onClose();

    for (const item of changedItems) {
      await onSave({
        ...item,
        title: item.title.trim(),
        scheduled_date: toDbDate(item.scheduled_date),
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>타임라인 수정</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color="#B8A9A5" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }}>
            {draft.map((item, idx) => {
              const isOpen = openIdx === idx;
              const status = item.status || statusFromItem(item);
              const colorKey = item.color || CATEGORY_TO_COLOR[item.category] || 'rose';
              return (
                <View key={item.id} style={[modalStyles.itemBox, isOpen && { borderColor: '#C9716A' }]}>
                  {!isOpen ? (
                    <TouchableOpacity style={modalStyles.collapsedRow} onPress={() => setOpenIdx(idx)} activeOpacity={0.7}>
                      <View style={[styles.tlDot, styles[`dot_${status}`], { marginTop: 0 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={modalStyles.collapsedLabel} numberOfLines={1}>{item.title || '새 일정'}</Text>
                        <Text style={modalStyles.collapsedDate}>{formatDate(item) || '날짜 미입력'}</Text>
                      </View>
                      <Ionicons name="create-outline" size={15} color="#C9716A" />
                    </TouchableOpacity>
                  ) : (
                    <View style={modalStyles.editArea}>
                      <Text style={modalStyles.fieldLabel}>일정 이름</Text>
                      <TextInput style={modalStyles.input} value={item.title} onChangeText={(v) => updateField(idx, 'title', v)} placeholder="예: 드레스 시착" placeholderTextColor="#C8BFBB" />
                      <Text style={[modalStyles.fieldLabel, { marginTop: 12 }]}>날짜</Text>
                      <TextInput style={modalStyles.input} value={item.scheduled_date || ''} onChangeText={(v) => updateField(idx, 'scheduled_date', v)} placeholder="2026-07-25" placeholderTextColor="#C8BFBB" />
                      <Text style={[modalStyles.fieldLabel, { marginTop: 12, marginBottom: 8 }]}>상태</Text>
                      <View style={[modalStyles.statusRow, { marginBottom: 12 }]}>
                        {STATUS_OPTIONS.map((option) => (
                          <TouchableOpacity key={option.value} style={[modalStyles.statusBtn, status === option.value && modalStyles.statusBtnActive]} onPress={() => { updateField(idx, 'status', option.value); updateField(idx, 'done', option.value === 'done'); }}>
                            <Text style={[modalStyles.statusBtnText, status === option.value && { color: '#fff' }]}>{option.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={[modalStyles.fieldLabel, { marginBottom: 8 }]}>색상</Text>
                      <View style={scheduleModalStyles.swatchRow}>
                        {COLOR_OPTIONS.map((opt) => {
                          const selected = colorKey === opt.key;
                          return (
                            <TouchableOpacity key={opt.key} style={scheduleModalStyles.swatchWrap} onPress={() => { updateField(idx, 'color', opt.key); updateField(idx, 'category', COLOR_TO_CATEGORY[opt.key] || '기타'); }} activeOpacity={0.8}>
                              <View style={[scheduleModalStyles.swatch, { backgroundColor: opt.hex }, selected && scheduleModalStyles.swatchSelected]}>
                                {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                              </View>
                              <Text style={[scheduleModalStyles.swatchLabel, selected && { color: opt.hex, fontWeight: '600' }]}>{opt.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={modalStyles.editFooter}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          {!item.isNew && <TouchableOpacity onPress={() => onToggleDone(item.id, !item.done)}><Text style={modalStyles.toggleDoneText}>{item.done ? '미완료로' : '완료로'}</Text></TouchableOpacity>}
                          <TouchableOpacity onPress={async () => {
                            if (item.isNew) {
                              setDraft((prev) => prev.filter((_, index) => index !== idx));
                              setOpenIdx(null);
                              return;
                            }
                            await onDelete(item.id);
                            onClose();
                          }}><Text style={modalStyles.deleteText}>삭제</Text></TouchableOpacity>
                        </View>
                        <TouchableOpacity style={modalStyles.confirmBtn} onPress={() => setOpenIdx(null)}><Text style={modalStyles.confirmBtnText}>확인</Text></TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
            <TouchableOpacity style={modalStyles.addBtn} onPress={addItem}><Text style={modalStyles.addBtnText}>+ 새 일정 추가</Text></TouchableOpacity>
          </ScrollView>
          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>취소</Text></TouchableOpacity>
            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}><Text style={modalStyles.saveBtnText}>저장</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ScheduleAddModal({ visible, preselectedDate, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('rose');
  const [status, setStatus] = useState('future');
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setColor('rose');
    setStatus('future');
    setScheduledDate(preselectedDate || '');
  }, [visible, preselectedDate]);

  const selectedColor = COLOR_OPTIONS.find((item) => item.key === color) || COLOR_OPTIONS[0];
  const isValid = title.trim() && toDbDate(scheduledDate);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { maxHeight: '80%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>일정 추가</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color="#B8A9A5" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modalStyles.fieldLabel}>일정 이름</Text>
            <TextInput style={[modalStyles.input, { marginBottom: 16 }]} value={title} onChangeText={setTitle} placeholder="예: 부케 상담" placeholderTextColor="#C8BFBB" />
            <Text style={modalStyles.fieldLabel}>날짜</Text>
            <TextInput style={[modalStyles.input, { marginBottom: 16 }]} value={scheduledDate} onChangeText={setScheduledDate} placeholder="2026-07-25" placeholderTextColor="#C8BFBB" />
            <Text style={[modalStyles.fieldLabel, { marginBottom: 8 }]}>상태</Text>
            <View style={[modalStyles.statusRow, { marginBottom: 16 }]}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity key={option.value} style={[modalStyles.statusBtn, status === option.value && modalStyles.statusBtnActive]} onPress={() => setStatus(option.value)}>
                  <Text style={[modalStyles.statusBtnText, status === option.value && { color: '#fff' }]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[modalStyles.fieldLabel, { marginBottom: 10 }]}>색상</Text>
            <View style={scheduleModalStyles.swatchRow}>
              {COLOR_OPTIONS.map((opt) => {
                const selected = color === opt.key;
                return (
                  <TouchableOpacity key={opt.key} style={scheduleModalStyles.swatchWrap} onPress={() => setColor(opt.key)} activeOpacity={0.8}>
                    <View style={[scheduleModalStyles.swatch, { backgroundColor: opt.hex }, selected && scheduleModalStyles.swatchSelected]}>
                      {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <Text style={[scheduleModalStyles.swatchLabel, selected && { color: opt.hex, fontWeight: '600' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {title.trim() ? <View style={[scheduleModalStyles.preview, { backgroundColor: selectedColor.bg, borderLeftColor: selectedColor.hex }]}><Text style={[scheduleModalStyles.previewText, { color: selectedColor.text }]}>{`${scheduledDate || '날짜 미지정'} — ${title.trim()}`}</Text></View> : null}
          </ScrollView>
          <View style={[modalStyles.footer, { marginTop: 16 }]}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>취소</Text></TouchableOpacity>
            <TouchableOpacity style={[modalStyles.saveBtn, !isValid && { backgroundColor: '#E8C5C2' }]} onPress={async () => {
              const date = toDbDate(scheduledDate);
              if (!title.trim() || !date) return;
              await onSave({ title: title.trim(), scheduled_date: date, done: status === 'done', color, category: COLOR_TO_CATEGORY[color] || '기타' });
              onClose();
            }} disabled={!isValid}><Text style={modalStyles.saveBtnText}>추가</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TimelineScreen() {
  const { couple_id, planner_id, session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [visibleMonth, setVisibleMonth] = useState(new Date().toISOString().slice(0, 7));
  const [timelineItems, setTimelineItems] = useState([]);
  const [resolvedCoupleId, setResolvedCoupleId] = useState(couple_id ?? null);
  const [resolvedPlannerId, setResolvedPlannerId] = useState(planner_id ?? null);
  const [couple, setCouple] = useState(null);
  const [plannerName, setPlannerName] = useState('플래너');
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [scheduleAddModalVisible, setScheduleAddModalVisible] = useState(false);

  useEffect(() => {
    let active = true;
    const hydrateContext = async () => {
      if (couple_id) {
        setResolvedCoupleId(couple_id);
        setResolvedPlannerId(planner_id ?? null);
        return;
      }
      if (!userId) {
        setResolvedCoupleId(null);
        setResolvedPlannerId(planner_id ?? null);
        return;
      }
      try {
        const resolved = await resolveCoupleContext(userId, couple_id ?? null, session?.user?.email ?? null);
        if (!active) return;
        setResolvedCoupleId(resolved.coupleId ?? null);
        setResolvedPlannerId(planner_id ?? resolved.plannerId ?? null);
        if (resolved.couple) setCouple(resolved.couple);
      } catch {
        if (!active) return;
        setResolvedCoupleId(null);
      }
    };
    hydrateContext();
    return () => {
      active = false;
    };
  }, [couple_id, planner_id, userId]);

  const fetchData = async (nextCoupleId = resolvedCoupleId, nextPlannerId = resolvedPlannerId) => {
    if (!nextCoupleId) {
      setTimelineItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [coupleRes, scheduleRes, plannerRes] = await Promise.all([
      supabase.from('couples').select('id, groom_name, bride_name, wedding_date').eq('id', nextCoupleId).maybeSingle(),
      supabase.from('couple_schedules').select('*').eq('couple_id', nextCoupleId).order('scheduled_date', { ascending: true }),
      nextPlannerId
        ? supabase.from('wedding_planners').select('name').eq('id', nextPlannerId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (!coupleRes.error && coupleRes.data) setCouple(coupleRes.data);
    if (!scheduleRes.error) setTimelineItems(scheduleRes.data || []);
    if (!plannerRes.error && plannerRes.data?.name) setPlannerName(plannerRes.data.name);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [resolvedCoupleId, resolvedPlannerId]);

  useEffect(() => {
    if (!resolvedCoupleId) return undefined;
    const channel = supabase
      .channel(`couple-schedules-${resolvedCoupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couple_schedules', filter: `couple_id=eq.${resolvedCoupleId}` },
        () => fetchData(resolvedCoupleId, resolvedPlannerId),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedCoupleId, resolvedPlannerId]);

  const markedDates = useMemo(() => timelineItems.reduce((acc, item) => {
    if (!item.scheduled_date) return acc;
    const colorKey = item.color || CATEGORY_TO_COLOR[item.category] || 'rose';
    const color = COLOR_OPTIONS.find((option) => option.key === colorKey) || COLOR_OPTIONS[0];
    acc[item.scheduled_date] = { selected: true, selectedColor: color.hex };
    return acc;
  }, {}), [timelineItems]);

  const visibleEvents = useMemo(() => timelineItems
    .filter((item) => item.scheduled_date?.startsWith(visibleMonth))
    .sort((a, b) => `${a.scheduled_date}`.localeCompare(`${b.scheduled_date}`)), [timelineItems, visibleMonth]);

  const monthLabel = useMemo(() => {
    const [year, month] = visibleMonth.split('-');
    return `${parseInt(year, 10)}년 ${parseInt(month, 10)}월`;
  }, [visibleMonth]);

  const completion = timelineItems.length ? Math.round((timelineItems.filter((item) => item.done).length / timelineItems.length) * 100) : 0;
  const dday = couple?.wedding_date ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(`${couple.wedding_date}T00:00:00`) - today) / (1000 * 60 * 60 * 24));
  })() : null;

  const ensureCoupleReady = () => {
    if (resolvedCoupleId) return true;
    Alert.alert('연결 정보 확인', '커플 연결 정보를 아직 찾지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return false;
  };

  const upsertSchedule = async (item) => {
    if (!ensureCoupleReady()) return;
    const payload = {
      couple_id: resolvedCoupleId,
      planner_id: resolvedPlannerId || null,
      owner_user_id: userId,
      title: item.title,
      scheduled_date: item.scheduled_date,
      done: item.done ?? false,
      category: item.category || COLOR_TO_CATEGORY[item.color] || '기타',
    };
    if (item.isNew || String(item.id).startsWith('new-')) {
      await supabase.from('couple_schedules').insert(payload);
      return;
    }
    await supabase.from('couple_schedules').update(payload).eq('id', item.id);
  };

  const handleDeleteTimelineItem = async (id) => {
    await supabase.from('couple_schedules').delete().eq('id', id);
  };

  const handleToggleDone = async (id, done) => {
    await supabase.from('couple_schedules').update({ done }).eq('id', id);
  };

  const handleAddSchedule = async (payload) => {
    if (!ensureCoupleReady()) return;
    await supabase.from('couple_schedules').insert({
      couple_id: resolvedCoupleId,
      planner_id: resolvedPlannerId || null,
      owner_user_id: userId,
      title: payload.title,
      scheduled_date: payload.scheduled_date,
      done: payload.done ?? false,
      category: payload.category || '기타',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#C9716A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.bannerCard}>
          <View style={styles.topSection}>
            <View style={styles.ddayWrap}>
              <Text style={styles.ddayText}>{dday == null ? '-' : `D-${dday}`}</Text>
              <Text style={styles.ddaySub}>{formatKoreanDate(couple?.wedding_date) || '예식일 미정'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValueRose}>{completion}%</Text>
              <Text style={styles.statLabel}>준비 완료</Text>
            </View>
          </View>
        </View>

        <View style={styles.bannerCard}>
          <View style={styles.bottomRow}>
            <View style={styles.plannerRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{plannerName?.[0] || '플'}</Text></View>
              <View>
                <Text style={styles.plannerLabel}>담당 플래너</Text>
                <Text style={styles.plannerName}>{plannerName}</Text>
                <Text style={styles.onlineText}>● 실시간 연동</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/(couple)/chat')}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
              <Text style={styles.chatBtnText}>문의하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>결혼 준비 타임라인</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}><Text style={styles.editBtnText}>수정</Text></TouchableOpacity>
          </View>
          <View style={styles.timelineWrap}>
            <View style={styles.timelineLine} />
            {timelineItems.length > 0 ? timelineItems.map((item) => {
              const status = statusFromItem(item);
              const dotStyle = status === 'done'
                ? { backgroundColor: '#7A9E8E', borderColor: '#7A9E8E' }
                : status === 'active'
                  ? { backgroundColor: '#C9716A', borderColor: '#C9716A' }
                  : status === 'next'
                    ? { backgroundColor: '#fff', borderColor: '#C9716A' }
                    : { backgroundColor: '#fff', borderColor: '#D4C9C5' };
              return (
                <View key={item.id} style={styles.tlItem}>
                  <View style={[styles.tlDot, dotStyle]} />
                  <View>
                    <Text style={[styles.tlLabel, status === 'active' && { color: '#C9716A' }, status === 'future' && { color: '#B8A9A5' }]}>{item.title}</Text>
                    <Text style={[styles.tlDate, status === 'active' && { color: '#C9716A' }]}>{formatDate(item)}</Text>
                  </View>
                </View>
              );
            }) : <View style={styles.emptyTimelineBox}><Text style={styles.emptyEventsText}>등록된 일정이 없습니다. 일정 추가로 시작하세요.</Text></View>}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>일정 관리</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setScheduleAddModalVisible(true)}><Text style={styles.editBtnText}>+ 일정 추가</Text></TouchableOpacity>
          </View>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            onMonthChange={(month) => setVisibleMonth(`${month.year}-${String(month.month).padStart(2, '0')}`)}
            markedDates={markedDates}
            theme={{ selectedDayBackgroundColor: '#C9716A', todayTextColor: '#C9716A', arrowColor: '#C9716A', dotColor: '#7A9E8E', textDayFontSize: 13, textMonthFontSize: 14, textDayHeaderFontSize: 11, calendarBackground: '#fff' }}
            style={{ borderRadius: 10 }}
          />
          <View style={{ marginTop: 12, gap: 6 }}>
            {visibleEvents.length > 0 ? visibleEvents.map((item) => {
              const colorKey = item.color || CATEGORY_TO_COLOR[item.category] || 'rose';
              const color = COLOR_OPTIONS.find((option) => option.key === colorKey) || COLOR_OPTIONS[0];
              return (
                <View key={item.id} style={[styles.eventBadge, { backgroundColor: color.bg, borderLeftColor: color.hex }]}>
                  <Text style={[styles.eventText, { color: color.text }]}>{`${parseInt(item.scheduled_date.slice(5, 7), 10)}월 ${parseInt(item.scheduled_date.slice(8, 10), 10)}일 — ${item.title}`}</Text>
                </View>
              );
            }) : <View style={styles.emptyEvents}><Text style={styles.emptyEventsText}>{monthLabel}에 등록된 일정이 없습니다</Text></View>}
          </View>
        </View>
      </ScrollView>

      <TimelineEditModal visible={editModalVisible} items={timelineItems} onClose={() => setEditModalVisible(false)} onSave={upsertSchedule} onDelete={handleDeleteTimelineItem} onToggleDone={handleToggleDone} />
      <ScheduleAddModal visible={scheduleAddModalVisible} preselectedDate={selectedDate} onClose={() => setScheduleAddModalVisible(false)} onSave={handleAddSchedule} />
    </SafeAreaView>
  );
}

const scheduleModalStyles = StyleSheet.create({
  swatchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 4, flexWrap: 'wrap', gap: 8 },
  swatchWrap: { alignItems: 'center', gap: 5 },
  swatch: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, transform: [{ scale: 1.12 }] },
  swatchLabel: { fontSize: 10, color: '#B8A9A5', fontWeight: '400' },
  preview: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 4 },
  previewText: { fontSize: 12, fontWeight: '500' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(44,36,32,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 32, maxHeight: '85%', flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 16, fontWeight: '600', color: '#2C2420' },
  itemBox: { borderWidth: 1, borderColor: '#EDE5E2', borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
  collapsedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  collapsedLabel: { fontSize: 13, fontWeight: '500', color: '#2C2420' },
  collapsedDate: { fontSize: 11, color: '#B8A9A5', marginTop: 1 },
  editArea: { padding: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '500', color: '#6B5B55', letterSpacing: 0.5, marginBottom: 6, paddingHorizontal: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#EDE5E2', backgroundColor: '#FBF8F7', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9, fontSize: 13, color: '#2C2420' },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusBtn: { flex: 1, borderWidth: 1, borderColor: '#EDE5E2', borderRadius: 7, paddingVertical: 7, alignItems: 'center' },
  statusBtnActive: { backgroundColor: '#C9716A', borderColor: '#C9716A' },
  statusBtnText: { fontSize: 11, fontWeight: '500', color: '#6B5B55' },
  editFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDE5E2' },
  deleteText: { fontSize: 13, color: '#D0534A' },
  toggleDoneText: { fontSize: 13, color: '#7A9E8E' },
  confirmBtn: { backgroundColor: '#C9716A', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 7 },
  confirmBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  addBtn: { borderWidth: 1.5, borderColor: '#EDE5E2', borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 20 },
  addBtnText: { fontSize: 13, color: '#B8A9A5' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#EDE5E2', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#6B5B55' },
  saveBtn: { flex: 2, backgroundColor: '#C9716A', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2EDE8' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, gap: 14 },
  bannerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, flexDirection: 'column', shadowColor: '#2C2420', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 5 },
  ddayWrap: { flexDirection: 'column' },
  ddayText: { fontSize: 28, fontWeight: '700', color: '#C9716A' },
  ddaySub: { fontSize: 11, color: '#8A7870', marginTop: 2 },
  statBox: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#FBF8F7', borderRadius: 10, borderWidth: 1, borderColor: '#EDE5E2' },
  statValueRose: { fontSize: 14, fontWeight: '700', color: '#C9716A' },
  statLabel: { fontSize: 9, color: '#6B5B55', marginTop: 1 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plannerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8C5C2', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '500', color: '#C9716A' },
  plannerLabel: { fontSize: 10, color: '#6B5B55', marginBottom: 2 },
  plannerName: { fontSize: 13, fontWeight: '600', color: '#2C2420' },
  onlineText: { fontSize: 10, color: '#7A9E8E', marginTop: 1 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9A98E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  chatBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, shadowColor: '#2C2420', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#2C2420', marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  editBtn: { backgroundColor: '#F5EAE9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  editBtnText: { fontSize: 12, fontWeight: '500', color: '#C9716A' },
  timelineWrap: { paddingLeft: 20, position: 'relative' },
  timelineLine: { position: 'absolute', left: 25, top: 6, bottom: 6, width: 2, backgroundColor: '#EDE5E2' },
  tlItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  tlDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, backgroundColor: '#fff', marginTop: 2, flexShrink: 0 },
  dot_done: { backgroundColor: '#7A9E8E', borderColor: '#7A9E8E' },
  dot_active: { backgroundColor: '#C9716A', borderColor: '#C9716A' },
  dot_next: { backgroundColor: '#fff', borderColor: '#C9716A' },
  dot_future: { backgroundColor: '#fff', borderColor: '#EDE5E2' },
  tlLabel: { fontSize: 13, fontWeight: '500', color: '#2C2420' },
  tlDate: { fontSize: 11, color: '#B8A9A5', marginTop: 2 },
  eventBadge: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  eventText: { fontSize: 12, fontWeight: '500' },
  emptyTimelineBox: { paddingVertical: 12 },
  emptyEvents: { paddingVertical: 12, alignItems: 'center' },
  emptyEventsText: { fontSize: 12, color: '#C8BFBB' },
});

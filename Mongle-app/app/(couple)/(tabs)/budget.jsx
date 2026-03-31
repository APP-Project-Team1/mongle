import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAuth } from '../../../context/AuthContext';
import { fetchCoupleBudgetBundle } from '../../../lib/coupleBudgetData';
import { resolveCoupleContext } from '../../../lib/coupleIdentity';
import { supabase } from '../../../lib/supabase';
import { formatNumber, CATEGORY_MAP } from '../../../lib/utils';
import BudgetOptimizationModal from '../../../components/budget/BudgetOptimizationModal';
import { PDFService } from '../../../lib/services/pdf/PDFService';

LocaleConfig.locales.ko = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

const PRESET_CATEGORIES = ['웨딩홀', '스튜디오', '드레스', '메이크업', '본식스냅'];

const createDraftItem = (label = '') => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  label,
  value: '',
  has_balance: false,
  balance_due: '',
  balance_amount: '',
  _isNew: true,
});

const formatBalanceSub = (dueDateStr) => {
  if (!dueDateStr) return '일정 미지정';
  const due = new Date(dueDateStr);
  if (Number.isNaN(due.getTime())) return '잘못된 날짜';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  const m = due.getMonth() + 1;
  const d = due.getDate();
  if (diff === 0) return `${m}월 ${d}일 마감 · D-Day`;
  if (diff < 0) return `${m}월 ${d}일 마감 · 기한 경과`;
  return `${m}월 ${d}일 마감 · D-${diff}`;
};

const getCategoryIcon = (label) => {
  const code = CATEGORY_MAP[label] || 'other';
  switch (code) {
    case 'wedding_hall': return 'home-outline';
    case 'studio': return 'camera-outline';
    case 'dress': return 'shirt-outline';
    case 'makeup': return 'color-palette-outline';
    case 'snapshot': return 'images-outline';
    default: return 'receipt-outline';
  }
};

const checkUrgent = (dueDateStr) => {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= 10;
};

export default function BudgetHubScreen() {
  const queryClient = useQueryClient();
  const { couple_id, session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [effectiveCoupleId, setEffectiveCoupleId] = useState(couple_id ?? null);
  const [resolvedCouple, setResolvedCouple] = useState(null);
  const [costEditModalVisible, setCostEditModalVisible] = useState(false);
  const [optimizationModalVisible, setOptimizationModalVisible] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!userId) return;
      try {
        const resolved = await resolveCoupleContext(userId, couple_id ?? null, session?.user?.email ?? null);
        if (!active) return;
        setEffectiveCoupleId(resolved.coupleId ?? couple_id ?? null);
        setResolvedCouple(resolved.couple ?? null);
      } catch {
        if (active) setEffectiveCoupleId(couple_id ?? null);
      }
    };
    load();
    return () => { active = false; };
  }, [couple_id, userId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['couple-budget-bundle', effectiveCoupleId],
    queryFn: () => fetchCoupleBudgetBundle(effectiveCoupleId),
    enabled: !!effectiveCoupleId,
  });

  useEffect(() => {
    const channels = [
      supabase.channel('budgets-live').on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => refetch()).subscribe(),
      supabase.channel('budget-items-live').on('postgres_changes', { event: '*', schema: 'public', table: 'budget_items' }, () => refetch()).subscribe(),
      supabase.channel('projects-live').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => refetch()).subscribe(),
    ];
    return () => channels.forEach((channel) => supabase.removeChannel(channel));
  }, [refetch]);

  const activeProject = data?.project || null;
  const budgetData = data?.budget || null;
  const costItems = data?.items || [];
  const usedAmount = budgetData?.spent || 0;
  const budgetTotal = budgetData?.total_amount || 0;
  const progress = Math.min(100, Math.round((usedAmount / (budgetTotal || 1)) * 100));
  const balanceItems = useMemo(() => costItems.filter((item) => item.has_balance).map((item) => ({ ...item, isUrgent: checkUrgent(item.balance_due) })), [costItems]);

  const handleExportPDF = async () => {
    try {
      await PDFService.saveBudgetSummary({
        totalBudget: budgetTotal * 10000,
        spent: usedAmount * 10000,
        items: costItems.map((item) => ({ category: item.label || '기타', amount: (parseInt(item.value, 10) || 0) * 10000 })),
      });
    } catch {
      Alert.alert('오류', 'PDF 저장 중 문제가 발생했습니다.');
    }
  };

  if (isLoading && effectiveCoupleId) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#C9716A" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>비용 관리</Text>
          <Text style={styles.headerSub}>결혼 준비 예산을 한눈에 확인하세요</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>현재 총 지출</Text>
              <Text style={styles.summaryValue}>{formatNumber(usedAmount)}만원</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#EBF2EE' }]} onPress={handleExportPDF}>
                <Ionicons name="download-outline" size={14} color="#7A9E8E" />
                <Text style={[styles.detailBtnText, { color: '#7A9E8E', marginLeft: 4 }]}>PDF 저장</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailBtn} onPress={() => router.push('/(couple)/budget-dashboard')}>
                <Text style={styles.detailBtnText}>대시보드</Text>
                <Ionicons name="chevron-forward" size={14} color="#C9716A" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
          <View style={styles.progressLabelRow}><Text style={styles.progressSubText}>예산 {formatNumber(budgetTotal)}만원 중 {progress}% 사용</Text></View>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(couple)/estimate-comparison')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FDF0EF' }]}><Ionicons name="git-compare-outline" size={24} color="#C9716A" /></View>
            <Text style={styles.menuTitle}>견적 비교</Text>
            <Text style={styles.menuDesc}>업체별 견적서 합리적 비교</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(couple)/pdf-history')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#EBF2EE' }]}><Ionicons name="document-text-outline" size={24} color="#7A9E8E" /></View>
            <Text style={styles.menuTitle}>PDF 내역</Text>
            <Text style={styles.menuDesc}>저장된 견적 리포트 확인</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>상세 지출 내역</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.aiBtn} onPress={() => setOptimizationModalVisible(true)}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.aiBtnText}>AI 최적화</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={() => setCostEditModalVisible(true)}>
                <Text style={styles.editBtnText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.listCard}>
            {costItems.length > 0 ? costItems.map((item) => (
              <View key={item.id} style={styles.costRowWrapper}>
                <View style={styles.costRowIconBox}><Ionicons name={getCategoryIcon(item.label)} size={20} color="#8A7870" /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.costLabel}>{item.label || '미지정 항목'}</Text>
                </View>
                <Text style={styles.costValue}>{item.value ? `${formatNumber(item.value)}만원` : '미정'}</Text>
              </View>
            )) : (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={40} color="#F0E8E4" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>등록된 지출 내역이 없습니다.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setCostEditModalVisible(true)}>
                  <Ionicons name="add" size={16} color="#C9716A" />
                  <Text style={styles.emptyAddBtnText}>상세 지출 항목 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>잔금 결제 일정</Text></View>
          <View style={styles.listCard}>
            {balanceItems.length > 0 ? balanceItems.map((item, idx, arr) => (
              <View key={item.id} style={[styles.balanceRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.balanceDot, item.isUrgent && { backgroundColor: '#C9716A' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceMainTitle}>{item.label}</Text>
                  <Text style={styles.balanceSub}>{formatBalanceSub(item.balance_due)}</Text>
                </View>
                <Text style={[styles.balanceAmount, item.isUrgent && { color: '#C9716A' }]}>{item.balance_amount ? `${formatNumber(item.balance_amount)}만원` : '미정'}</Text>
              </View>
            )) : <View style={styles.emptyBox}><Text style={styles.emptyText}>등록된 잔금 일정이 없습니다</Text></View>}
          </View>
        </View>
      </ScrollView>

      <CostEditModal
        visible={costEditModalVisible}
        project={activeProject}
        budget={budgetData}
        items={costItems}
        couple={resolvedCouple}
        sessionUserId={userId}
        onClose={() => setCostEditModalVisible(false)}
        onSaved={async () => {
          setCostEditModalVisible(false);
          await refetch();
          queryClient.invalidateQueries({ queryKey: ['couple-budget-bundle', effectiveCoupleId] });
        }}
      />

      <BudgetOptimizationModal
        visible={optimizationModalVisible}
        onClose={() => setOptimizationModalVisible(false)}
        totalBudget={budgetTotal}
        costItems={costItems}
        onApplyPlan={async () => {
          setOptimizationModalVisible(false);
          await refetch();
        }}
      />
    </SafeAreaView>
  );
}

function CostEditModal({ visible, project, budget, items, couple, sessionUserId, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState('cost');
  const [draftBudget, setDraftBudget] = useState('0');
  const [draftItems, setDraftItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTargetId, setDatePickerTargetId] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setDraftBudget((budget?.total_amount || 0).toString());
    setDraftItems((items || []).map((item) => ({ ...item, value: String(item.value || ''), balance_amount: String(item.balance_amount || '') })));
    setActiveTab('cost');
  }, [visible, budget, items]);

  const updateField = (id, field, value) => setDraftItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const addCostItem = () => setDraftItems((prev) => [createDraftItem(), ...prev]);
  const addPresetItem = (label) => setDraftItems((prev) => [createDraftItem(label), ...prev]);
  const removeItem = (id) => setDraftItems((prev) => prev.filter((item) => item.id !== id));
  const balanceDraftItems = draftItems.filter((item) => item.has_balance);

  const handleSave = async () => {
    if (!sessionUserId) return Alert.alert('저장 불가', '로그인 정보를 확인해 주세요.');
    setSaving(true);
    try {
      let projectId = project?.id;
      if (!projectId) {
        const { data, error } = await supabase.from('projects').insert({ user_id: couple?.user_id || sessionUserId, title: '웨딩 예산', event_date: couple?.wedding_date || null }).select('id').maybeSingle();
        if (error) throw error;
        projectId = data?.id;
      }
      let budgetId = budget?.id;
      const spent = draftItems.reduce((sum, item) => sum + (parseInt(item.value, 10) || 0), 0);
      if (!budgetId) {
        const { data, error } = await supabase.from('budgets').insert({ project_id: projectId, total_amount: parseInt(draftBudget, 10) || 0, spent }).select('id').maybeSingle();
        if (error) throw error;
        budgetId = data?.id;
      } else {
        const { error } = await supabase.from('budgets').update({ total_amount: parseInt(draftBudget, 10) || 0, spent }).eq('id', budgetId);
        if (error) throw error;
      }
      const existingIds = new Set((items || []).map((item) => item.id));
      const nextIds = new Set(draftItems.filter((item) => !item._isNew && !String(item.id).startsWith('new-')).map((item) => item.id));
      for (const id of [...existingIds].filter((id) => !nextIds.has(id))) {
        const { error } = await supabase.from('budget_items').delete().eq('id', id);
        if (error) throw error;
      }
      for (const item of draftItems) {
        if (!item.label?.trim() && !item.value) continue;
        const payload = { budget_id: budgetId, label: item.label?.trim() || '기타', value: parseInt(item.value, 10) || 0, spent: parseInt(item.value, 10) || 0, has_balance: !!item.has_balance, balance_due: item.balance_due || null, balance_amount: parseInt(item.balance_amount, 10) || 0 };
        if (item._isNew || String(item.id).startsWith('new-')) {
          const { error } = await supabase.from('budget_items').insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('budget_items').update(payload).eq('id', item.id);
          if (error) throw error;
        }
      }
      await onSaved();
    } catch (error) {
      Alert.alert('저장 실패', error?.message || '데이터를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>비용 · 잔금 관리</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#B8A9A5" /></TouchableOpacity>
          </View>
          <View style={costModalStyles.tabRow}>
            {['cost', 'balance'].map((tab) => (
              <TouchableOpacity key={tab} style={[costModalStyles.tab, activeTab === tab && costModalStyles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[costModalStyles.tabText, activeTab === tab && costModalStyles.tabTextActive]}>{tab === 'cost' ? '비용 항목' : '잔금 일정'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {activeTab === 'cost' ? (
              <>
                <View style={costModalStyles.budgetRow}>
                  <Text style={costModalStyles.budgetLabel}>전체 예산</Text>
                  <View style={costModalStyles.budgetInputWrap}>
                    <TextInput style={costModalStyles.budgetInput} value={draftBudget} onChangeText={(v) => setDraftBudget(v.replace(/\D/g, ''))} keyboardType="number-pad" />
                    <Text style={costModalStyles.budgetUnit}>만원</Text>
                  </View>
                </View>
                <View style={costModalStyles.presetRow}>
                  {PRESET_CATEGORIES.map((category) => (
                    <TouchableOpacity key={category} style={costModalStyles.presetChip} onPress={() => addPresetItem(category)}>
                      <Text style={costModalStyles.presetChipText}>+ {category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={modalStyles.addBtn} onPress={addCostItem}>
                  <Ionicons name="add-circle-outline" size={20} color="#C9716A" />
                  <Text style={modalStyles.addBtnText}>기타 항목 추가하기</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
                {draftItems.map((item) => (
                  <View key={item.id} style={modalStyles.itemBoxExpanded}>
                    <View style={modalStyles.expandedHeader}>
                      <TextInput style={modalStyles.labelInput} value={item.label} onChangeText={(v) => updateField(item.id, 'label', v)} placeholder="항목명" placeholderTextColor="#B8A9A5" />
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={modalStyles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#B8A9A5" />
                      </TouchableOpacity>
                    </View>
                    <View style={modalStyles.amountInputRow}>
                      <TextInput style={modalStyles.amountInput} value={item.value} onChangeText={(v) => updateField(item.id, 'value', v.replace(/\D/g, ''))} placeholder="금액 입력" placeholderTextColor="#B8A9A5" keyboardType="number-pad" />
                      <Text style={modalStyles.amountUnitLabel}>만원</Text>
                    </View>
                    <TouchableOpacity style={[costModalStyles.toggleBtn, item.has_balance && costModalStyles.toggleBtnOn]} onPress={() => updateField(item.id, 'has_balance', !item.has_balance)}>
                      <Text style={[costModalStyles.toggleText, item.has_balance && { color: '#C9716A' }]}>잔금 설정함</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : (
              <View style={{ paddingBottom: 20 }}>
                {balanceDraftItems.length > 0 ? balanceDraftItems.map((item) => (
                  <View key={item.id} style={costModalStyles.balanceEditCard}>
                    <View style={costModalStyles.balanceEditHeader}>
                      <Text style={costModalStyles.balanceEditTitle}>{item.label}</Text>
                      <Text style={costModalStyles.dDayBadge}>{formatBalanceSub(item.balance_due)}</Text>
                    </View>
                    <View style={costModalStyles.balanceInputRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={costModalStyles.inputSubLabel}>잔금액 (만원)</Text>
                        <TextInput style={costModalStyles.balanceTextInput} value={item.balance_amount} onChangeText={(v) => updateField(item.id, 'balance_amount', v.replace(/\D/g, ''))} placeholder="금액" keyboardType="number-pad" />
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <Text style={costModalStyles.inputSubLabel}>예정일</Text>
                        <TouchableOpacity style={costModalStyles.balanceSubInput} onPress={() => { setDatePickerTargetId(item.id); setDatePickerVisible(true); }}>
                          <Text style={{ color: item.balance_due ? '#2C2420' : '#B8A9A5', fontSize: 13 }}>{item.balance_due || '날짜 선택'}</Text>
                          <Ionicons name="calendar-outline" size={14} color="#C9716A" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )) : <View style={modalStyles.emptyBox}><Text style={modalStyles.emptyText}>비용 탭에서 잔금 설정한 항목이 여기에 표시됩니다.</Text></View>}
              </View>
            )}
          </ScrollView>
          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>취소</Text></TouchableOpacity>
            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modalStyles.saveBtnText}>저장</Text>}
            </TouchableOpacity>
          </View>
          <Modal visible={datePickerVisible} transparent animationType="fade">
            <View style={costModalStyles.pickerOverlay}>
              <TouchableOpacity style={costModalStyles.pickerBackdrop} onPress={() => setDatePickerVisible(false)} />
              <View style={costModalStyles.pickerSheet}>
                <View style={costModalStyles.pickerHeader}>
                  <Text style={costModalStyles.pickerTitle}>날짜 선택</Text>
                  <TouchableOpacity onPress={() => setDatePickerVisible(false)}><Ionicons name="close" size={24} color="#B8A9A5" /></TouchableOpacity>
                </View>
                <Calendar onDayPress={(day) => { updateField(datePickerTargetId, 'balance_due', day.dateString); setDatePickerVisible(false); }} theme={{ todayTextColor: '#C9716A', arrowColor: '#C9716A', selectedDayBackgroundColor: '#C9716A', textMonthFontWeight: '800' }} />
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F5' }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F5' }, container: { padding: 20 }, header: { marginBottom: 20 }, headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C2420' }, headerSub: { fontSize: 14, color: '#8A7870', marginTop: 4 }, summaryCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 20, shadowColor: '#2C2420', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }, summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 }, summaryLabel: { fontSize: 13, color: '#8A7870', marginBottom: 5 }, summaryValue: { fontSize: 26, fontWeight: '800', color: '#2C2420' }, detailBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }, detailBtnText: { fontSize: 12, fontWeight: '600', color: '#C9716A', marginRight: 2 }, progressBar: { height: 8, backgroundColor: '#F5F1EE', borderRadius: 4, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#C9716A', borderRadius: 4 }, progressLabelRow: { marginTop: 10 }, progressSubText: { fontSize: 12, color: '#8A7870' }, menuGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 }, menuCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0E8E4' }, menuIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }, menuTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420', marginBottom: 4 }, menuDesc: { fontSize: 11, color: '#8A7870' }, section: { paddingBottom: 24 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2C2420' }, listCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F0E8E4' }, costRowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: '#F5F1EE', backgroundColor: '#fff' }, costRowIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FAF7F6', justifyContent: 'center', alignItems: 'center' }, costLabel: { fontSize: 16, fontWeight: '700', color: '#2C2420' }, costValue: { fontSize: 16, fontWeight: '800', color: '#2C2420' }, balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' }, balanceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAE2DF', marginRight: 12 }, balanceMainTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420' }, balanceSub: { fontSize: 12, color: '#8A7870', marginTop: 2 }, balanceAmount: { fontSize: 16, fontWeight: '800', color: '#2C2420' }, aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9716A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 }, aiBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' }, editBtn: { paddingHorizontal: 8, paddingVertical: 4 }, editBtnText: { fontSize: 12, color: '#B8A9A5' }, emptyBox: { paddingVertical: 40, alignItems: 'center' }, emptyText: { fontSize: 13, color: '#B8A9A5', textAlign: 'center' }, emptyAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#FADEDC' }, emptyAddBtnText: { color: '#C9716A', fontSize: 12, fontWeight: '700', marginLeft: 4 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject }, sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }, title: { fontSize: 18, fontWeight: '700', color: '#2C2420' }, itemBoxExpanded: { backgroundColor: '#F9F7F6', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0E8E4' }, expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, labelInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#2C2420', padding: 0 }, trashBtn: { padding: 4 }, amountInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }, amountInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C2420' }, amountUnitLabel: { fontSize: 13, color: '#8A7870', fontWeight: '500' }, addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 10, borderWidth: 1, borderColor: '#C9716A', backgroundColor: '#FDF0EF', borderRadius: 12, gap: 6 }, addBtnText: { color: '#C9716A', fontWeight: '700', fontSize: 14 }, footer: { flexDirection: 'row', gap: 12, marginTop: 20 }, cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F1EE' }, cancelBtnText: { color: '#8A7870', fontWeight: '600' }, saveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#C9716A' }, saveBtnText: { color: '#fff', fontWeight: '700' }, emptyBox: { paddingVertical: 40, alignItems: 'center' }, emptyText: { fontSize: 13, color: '#B8A9A5', textAlign: 'center' },
});

const costModalStyles = StyleSheet.create({
  tabRow: { flexDirection: 'row', backgroundColor: '#F5F1EE', borderRadius: 10, padding: 4, marginBottom: 16 }, tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, tabActive: { backgroundColor: '#fff' }, tabText: { fontSize: 13, color: '#8A7870' }, tabTextActive: { color: '#2C2420', fontWeight: '600' }, budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#FDF0EF', borderRadius: 10 }, budgetLabel: { fontSize: 14, color: '#2C2420' }, budgetInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 }, budgetInput: { borderBottomWidth: 1, borderColor: '#C9716A', fontSize: 16, fontWeight: '700', color: '#C9716A', minWidth: 50, textAlign: 'right' }, budgetUnit: { fontSize: 14, color: '#C9716A' }, toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#F0E8E4', backgroundColor: '#fff' }, toggleBtnOn: { borderColor: '#C9716A', backgroundColor: '#FDF0EF' }, toggleText: { fontSize: 12, color: '#8A7870' }, balanceEditCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F5F1EE' }, balanceEditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }, balanceEditTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420' }, dDayBadge: { fontSize: 11, color: '#C9716A', backgroundColor: '#FDF0EF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '600' }, balanceInputRow: { flexDirection: 'row', gap: 12 }, inputSubLabel: { fontSize: 11, color: '#A8928A', marginBottom: 6 }, balanceTextInput: { backgroundColor: '#F9F7F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#F0E8E4' }, balanceSubInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F7F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#F0E8E4' }, pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }, pickerBackdrop: { ...StyleSheet.absoluteFillObject }, pickerSheet: { backgroundColor: '#fff', borderRadius: 24, width: '90%', padding: 15, overflow: 'hidden' }, pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }, pickerTitle: { fontSize: 18, fontWeight: '700', color: '#2C2420' }, presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5, marginBottom: 5, paddingHorizontal: 4 }, presetChip: { backgroundColor: '#FDF0EF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FADEDC' }, presetChipText: { fontSize: 12, color: '#C9716A', fontWeight: '600' },
});

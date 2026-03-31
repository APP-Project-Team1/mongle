import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import hallData from '../../vendors/data/hall.json';
import studioData from '../../vendors/data/studio.json';
import dressData from '../../vendors/data/dress.json';
import makeupData from '../../vendors/data/makeup.json';
import videoSnapData from '../../vendors/data/video_snap.json';
import packageData from '../../vendors/data/package.json';

LocaleConfig.locales.ko = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

const PRESET_CATEGORIES = ['웨딩홀', '스튜디오', '드레스', '메이크업', '본식스냅'];

const mapLocalVendor = (vendor) => ({
  id: vendor.basic_info?.vendor_id,
  name: vendor.basic_info?.name || '업체명 없음',
  category: vendor.basic_info?.category || null,
  location:
    vendor.basic_info?.road_address ||
    vendor.basic_info?.address ||
    [vendor.basic_info?.region, vendor.basic_info?.district].filter(Boolean).join(' ') ||
    null,
});

const VENDOR_DATA_BY_CATEGORY = {
  wedding_hall: hallData,
  studio: studioData,
  dress: dressData,
  makeup: makeupData,
  video_snap: videoSnapData,
  snapshot: videoSnapData,
  package: packageData,
};

const ALL_LOCAL_VENDORS = [
  ...hallData,
  ...studioData,
  ...dressData,
  ...makeupData,
  ...videoSnapData,
  ...packageData,
];

const COUPLE_VENDOR_META_PREFIX = 'couple-vendor-meta:';

const getVendorMetaStorageKey = (coupleId) => `${COUPLE_VENDOR_META_PREFIX}${coupleId || 'unknown'}`;

const getVendorMetaEntryKey = (item) => {
  if (item?.id) return `id:${item.id}`;
  return `sig:${item?.vendor_name || ''}:${item?.amount ?? item?.value ?? ''}`;
};

const createDraftItem = (label = '') => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  label,
  value: '',
  has_balance: false,
  balance_due: '',
  balance_amount: '',
  _isNew: true,
});

const toManwon = (amount) => Math.round((Number(amount) || 0) / 10000);

const normalizeVendorCostItem = (item, vendorMetaMap = {}) => {
  const meta = vendorMetaMap[getVendorMetaEntryKey(item)] || {};
  return {
    id: item.id,
    label: meta.label || item.label || item.vendor_name || '',
    vendor_name: meta.vendor_name || item.vendor_name || '',
    value: toManwon(item.amount ?? item.value),
    paid: !!item.paid,
    owner_user_id: item.owner_user_id ?? null,
  };
};

const normalizePaymentItem = (item) => ({
  id: item.id,
  label: item.label || '',
  balance_due: item.due_date || item.balance_due || '',
  balance_amount: toManwon(item.amount ?? item.balance_amount),
  paid: !!item.paid,
  owner_user_id: item.owner_user_id ?? null,
  isUrgent: checkUrgent(item.due_date || item.balance_due),
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
  const [vendorMetaMap, setVendorMetaMap] = useState({});

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

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['couple-budget-bundle', effectiveCoupleId],
    queryFn: () => fetchCoupleBudgetBundle(effectiveCoupleId),
    enabled: !!effectiveCoupleId,
  });

  useEffect(() => {
    if (error) {
      console.error('커플 비용 탭 조회 오류:', error);
    }
  }, [error]);

  useEffect(() => {
    if (!effectiveCoupleId) return undefined;

    const channels = [
      supabase.channel(`couples-live-${effectiveCoupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${effectiveCoupleId}` }, () => refetch()).subscribe(),
      supabase.channel(`budgets-live-${effectiveCoupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => refetch()).subscribe(),
      supabase.channel(`budget-items-live-${effectiveCoupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'budget_items' }, () => refetch()).subscribe(),
      supabase.channel(`projects-live-${effectiveCoupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => refetch()).subscribe(),
      supabase.channel(`couple-payments-live-${effectiveCoupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'couple_payments', filter: `couple_id=eq.${effectiveCoupleId}` }, () => refetch()).subscribe(),
      supabase.channel(`vendor-costs-live-${effectiveCoupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'couple_vendor_costs', filter: `couple_id=eq.${effectiveCoupleId}` }, () => refetch()).subscribe(),
    ];
    return () => channels.forEach((channel) => supabase.removeChannel(channel));
  }, [effectiveCoupleId, refetch]);

  useEffect(() => {
    let active = true;

    const loadVendorMeta = async () => {
      if (!effectiveCoupleId) {
        if (active) setVendorMetaMap({});
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(getVendorMetaStorageKey(effectiveCoupleId));
        if (!active) return;
        setVendorMetaMap(stored ? JSON.parse(stored) : {});
      } catch (metaError) {
        console.error('업체 메타 로드 실패:', metaError);
        if (active) setVendorMetaMap({});
      }
    };

    loadVendorMeta();
    return () => { active = false; };
  }, [effectiveCoupleId, costEditModalVisible]);

  const activeProject = data?.project || null;
  const budgetData = data?.budget || null;
  const plannerCouple = data?.couple || null;
  const effectiveCouple = plannerCouple || resolvedCouple || null;
  const plannerPayments = useMemo(() => (data?.payments || []).map(normalizePaymentItem), [data?.payments]);
  const plannerVendorCosts = useMemo(
    () => (data?.vendorCosts || []).map((item) => normalizeVendorCostItem(item, vendorMetaMap)),
    [data?.vendorCosts, vendorMetaMap]
  );
  const hasPlannerBudgetData = plannerPayments.length > 0 || plannerVendorCosts.length > 0;
  const costItems = hasPlannerBudgetData ? plannerVendorCosts : (data?.items || []);
  const usedAmount = hasPlannerBudgetData
    ? plannerVendorCosts.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
    : (budgetData?.spent || 0);
  const coupleBudgetTotal = Number(effectiveCouple?.total_amount) || 0;
  const savedBudgetTotal = hasPlannerBudgetData
    ? (coupleBudgetTotal || Number(budgetData?.total_amount) || 0)
    : (Number(budgetData?.total_amount) || 0);
  const budgetTotal = hasPlannerBudgetData
    ? (
      savedBudgetTotal || Math.max(
      plannerPayments.reduce((sum, item) => sum + (Number(item.balance_amount) || 0), 0),
      usedAmount,
    ))
    : savedBudgetTotal;
  const progress = Math.min(100, Math.round((usedAmount / (budgetTotal || 1)) * 100));
  const balanceItems = useMemo(() => (
    hasPlannerBudgetData
      ? plannerPayments
      : costItems
        .filter((item) => item.has_balance)
        .map((item) => ({ ...item, isUrgent: checkUrgent(item.balance_due) }))
  ), [costItems, hasPlannerBudgetData, plannerPayments]);

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
                    {item.vendor_name && item.vendor_name !== item.label ? (
                      <Text style={styles.costVendorName}>{item.vendor_name}</Text>
                    ) : null}
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
        payments={plannerPayments}
        vendorCosts={plannerVendorCosts}
        couple={effectiveCouple}
        initialBudgetTotal={budgetTotal}
        effectiveCoupleId={effectiveCoupleId}
        usePlannerData={hasPlannerBudgetData}
        sessionUserId={userId}
        effectiveVendorMetaMap={vendorMetaMap}
        onVendorMetaSaved={setVendorMetaMap}
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
        onApplyPlan={async (plan) => {
          try {
            for (const change of plan.changes) {
              const item = costItems.find(
                (currentItem) => (CATEGORY_MAP[currentItem.label] || currentItem.label) === change.category
              );

              if (!item?.id) continue;

              if (hasPlannerBudgetData) {
                const { error: updateVendorCostError } = await supabase
                  .from('couple_vendor_costs')
                  .update({ amount: (Number(change.to.price_min) || 0) * 10000 })
                  .eq('id', item.id);

                if (updateVendorCostError) throw updateVendorCostError;
              } else {
                const { error: updateBudgetItemError } = await supabase
                  .from('budget_items')
                  .update({
                    value: Number(change.to.price_min) || 0,
                    spent: Number(change.to.price_min) || 0,
                  })
                  .eq('id', item.id);

                if (updateBudgetItemError) throw updateBudgetItemError;
              }
            }

            if (!hasPlannerBudgetData && budgetData?.id) {
              const changedValues = new Map(
                plan.changes.map((change) => [change.category, Number(change.to.price_min) || 0])
              );
              const nextSpent = costItems.reduce((sum, item) => {
                const categoryKey = CATEGORY_MAP[item.label] || item.label;
                const nextValue = changedValues.has(categoryKey)
                  ? changedValues.get(categoryKey)
                  : (Number(item.value) || 0);
                return sum + nextValue;
              }, 0);

              const { error: updateBudgetError } = await supabase
                .from('budgets')
                .update({ spent: nextSpent })
                .eq('id', budgetData.id);

              if (updateBudgetError) throw updateBudgetError;
            }

            setOptimizationModalVisible(false);
            await refetch();
            queryClient.invalidateQueries({ queryKey: ['couple-budget-bundle', effectiveCoupleId] });
            Alert.alert('적용 완료', `${plan.title} 플랜이 적용되었습니다.`);
          } catch (applyError) {
            console.error('예산 최적화 적용 실패:', applyError);
            Alert.alert('오류', '최적화 결과를 반영하는 중 문제가 발생했습니다.');
          }
        }}
      />
    </SafeAreaView>
  );
}

function CostEditModal({ visible, project, budget, items, payments, vendorCosts, couple, initialBudgetTotal, effectiveCoupleId, usePlannerData, sessionUserId, effectiveVendorMetaMap, onVendorMetaSaved, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState('cost');
  const [draftBudget, setDraftBudget] = useState('0');
  const [draftVendorCosts, setDraftVendorCosts] = useState([]);
  const [draftPayments, setDraftPayments] = useState([]);
  const [vendorSearchVisible, setVendorSearchVisible] = useState(false);
  const [vendorSearchResults, setVendorSearchResults] = useState([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorSearchCategory, setVendorSearchCategory] = useState('');
  const [vendorSearchTargetId, setVendorSearchTargetId] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTargetId, setDatePickerTargetId] = useState(null);

  useEffect(() => {
    if (!visible) return;
    const nextVendorCosts = (vendorCosts?.length ? vendorCosts : items || []).map((item) => ({
      ...item,
      value: String(item.value || ''),
      has_balance: !!item.paid,
      vendor_name: item.vendor_name || '',
    }));
    const nextPayments = (payments || []).map((item) => ({
      ...item,
      balance_amount: String(item.balance_amount || ''),
      balance_due: item.balance_due || '',
    }));
    const nextInitialBudgetTotal = initialBudgetTotal
      || (
        (usePlannerData || vendorCosts?.length || payments?.length)
          ? (couple?.total_amount || budget?.total_amount || nextPayments.reduce((sum, item) => sum + (parseInt(item.balance_amount, 10) || 0), 0) || 0)
          : (budget?.total_amount || nextPayments.reduce((sum, item) => sum + (parseInt(item.balance_amount, 10) || 0), 0) || 0)
      );
    setDraftBudget(String(
      nextInitialBudgetTotal,
    ));
    setDraftVendorCosts(nextVendorCosts);
    setDraftPayments(nextPayments);
    setActiveTab('cost');
    setVendorSearchVisible(false);
    setVendorSearchResults([]);
    setVendorSearchQuery('');
    setVendorSearchCategory('');
    setVendorSearchTargetId(null);
  }, [visible, budget, items, payments, vendorCosts, couple, initialBudgetTotal, usePlannerData]);

  const updateVendorField = (id, field, value) => setDraftVendorCosts((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const updatePaymentField = (id, field, value) => setDraftPayments((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const addCostItem = () => setDraftVendorCosts((prev) => [createDraftItem(), ...prev]);
  const addPresetItem = (label) => setDraftVendorCosts((prev) => [createDraftItem(label), ...prev]);
  const addPaymentItem = () => setDraftPayments((prev) => [createDraftItem(), ...prev]);
  const removeVendorItem = (id) => setDraftVendorCosts((prev) => prev.filter((item) => item.id !== id));
  const removePaymentItem = (id) => setDraftPayments((prev) => prev.filter((item) => item.id !== id));
  const updateField = (id, field, value) => {
    if (field === 'balance_amount' || field === 'balance_due') {
      updatePaymentField(id, field, value);
      return;
    }
    updateVendorField(id, field, value);
  };
  const removeItem = (id) => {
    removeVendorItem(id);
    removePaymentItem(id);
  };
  const balanceDraftItems = draftPayments;

  const findExistingBudgetProject = async () => {
    const userId = couple?.user_id || sessionUserId;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('title', '웨딩 예산')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
  };

  const findExistingBudgetId = async (projectId) => {
    if (!projectId) return null;

    const { data, error } = await supabase
      .from('budgets')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
  };

  const handleVendorSearch = async (query = '', categoryLabel = '') => {
    setSearchLoading(true);
    try {
      const dbCategory = CATEGORY_MAP[categoryLabel] || null;
      const source = dbCategory ? (VENDOR_DATA_BY_CATEGORY[dbCategory] || []) : ALL_LOCAL_VENDORS;
      const normalizedQuery = query.trim().toLowerCase();
      const results = source
        .map(mapLocalVendor)
        .filter((vendor) => {
          if (!normalizedQuery) return true;
          return (
            vendor.name.toLowerCase().includes(normalizedQuery) ||
            (vendor.location || '').toLowerCase().includes(normalizedQuery)
          );
        })
        .slice(0, 50);

      setVendorSearchResults(results);
    } catch (searchError) {
      console.error('업체 검색 실패:', searchError);
      Alert.alert('검색 오류', '업체 검색 중 문제가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const openVendorSearch = async (targetId, categoryLabel = '') => {
    setVendorSearchTargetId(targetId || null);
    setVendorSearchCategory(categoryLabel || '');
    setVendorSearchQuery('');
    setVendorSearchResults([]);
    setVendorSearchVisible(true);
    await handleVendorSearch('', categoryLabel || '');
  };

  const handleVendorSelect = (vendor) => {
    if (vendorSearchTargetId) {
      updateVendorField(vendorSearchTargetId, 'vendor_name', vendor.name);
    }
    setVendorSearchVisible(false);
    setVendorSearchTargetId(null);
  };

  const handleSave = async () => {
    if (!sessionUserId) return Alert.alert('저장 불가', '로그인 정보를 확인해 주세요.');
    if (!effectiveCoupleId) return Alert.alert('???遺덇?', '而ㅽ뵆 ?뺣낫瑜??뺤씤??二쇱꽭??');
    setSaving(true);
    try {
      const nextVendorMetaMap = { ...(effectiveVendorMetaMap || {}) };
      draftVendorCosts.forEach((item) => {
        nextVendorMetaMap[getVendorMetaEntryKey(item)] = {
          label: item.label?.trim() || '기타',
          vendor_name: item.vendor_name?.trim() || '',
        };
      });

        if (usePlannerData || vendorCosts?.length || payments?.length) {
          const nextBudgetTotal = parseInt(draftBudget, 10) || 0;

          const { error: updateCoupleBudgetError } = await supabase
            .from('couples')
            .update({ total_amount: nextBudgetTotal })
            .eq('id', effectiveCoupleId);

          if (updateCoupleBudgetError) throw updateCoupleBudgetError;

          let projectId = project?.id || await findExistingBudgetProject();
          if (!projectId) {
          const { data: createdProject, error: createProjectError } = await supabase
            .from('projects')
            .insert({
              user_id: couple?.user_id || sessionUserId,
              title: '웨딩 예산',
              event_date: couple?.wedding_date || null,
            })
            .select('id')
            .maybeSingle();

          if (createProjectError) throw createProjectError;
          projectId = createdProject?.id;
        }

        const spentTotal = draftVendorCosts.reduce((sum, item) => sum + (parseInt(item.value, 10) || 0), 0);
        let budgetId = budget?.id || await findExistingBudgetId(projectId);
        if (!budgetId) {
          const { data: createdBudget, error: createBudgetError } = await supabase
            .from('budgets')
            .insert({
              project_id: projectId,
              total_amount: parseInt(draftBudget, 10) || 0,
              spent: spentTotal,
            })
            .select('id')
            .maybeSingle();

          if (createBudgetError) throw createBudgetError;
          budgetId = createdBudget?.id;
        } else {
          const { error: updateBudgetError } = await supabase
            .from('budgets')
            .update({
              total_amount: parseInt(draftBudget, 10) || 0,
              spent: spentTotal,
            })
            .eq('id', budgetId);

          if (updateBudgetError) throw updateBudgetError;
        }

        const plannerId = couple?.planner_id || null;
        const existingVendorIds = new Set((vendorCosts || []).map((item) => item.id));
        const nextVendorIds = new Set(draftVendorCosts.filter((item) => !item._isNew && !String(item.id).startsWith('new-')).map((item) => item.id));
        for (const id of [...existingVendorIds].filter((itemId) => !nextVendorIds.has(itemId))) {
          const { error } = await supabase.from('couple_vendor_costs').delete().eq('id', id);
          if (error) throw error;
        }
        for (const item of draftVendorCosts) {
          if (!item.label?.trim() && !item.value) continue;
          const payload = {
            planner_id: plannerId,
            couple_id: effectiveCoupleId,
            vendor_name: item.vendor_name?.trim() || item.label?.trim() || '기타',
            amount: (parseInt(item.value, 10) || 0) * 10000,
            paid: !!item.has_balance,
            owner_user_id: sessionUserId,
          };
          if (item._isNew || String(item.id).startsWith('new-')) {
            const { error } = await supabase.from('couple_vendor_costs').insert(payload);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('couple_vendor_costs').update(payload).eq('id', item.id);
            if (error) throw error;
          }
        }

        await AsyncStorage.setItem(
          getVendorMetaStorageKey(effectiveCoupleId),
          JSON.stringify(nextVendorMetaMap)
        );
        onVendorMetaSaved(nextVendorMetaMap);

        const existingPaymentIds = new Set((payments || []).map((item) => item.id));
        const nextPaymentIds = new Set(draftPayments.filter((item) => !item._isNew && !String(item.id).startsWith('new-')).map((item) => item.id));
        for (const id of [...existingPaymentIds].filter((itemId) => !nextPaymentIds.has(itemId))) {
          const { error } = await supabase.from('couple_payments').delete().eq('id', id);
          if (error) throw error;
        }
        for (const item of draftPayments) {
          if (!item.label?.trim() && !item.balance_amount) continue;
          const payload = {
            couple_id: effectiveCoupleId,
            label: item.label?.trim() || '기타',
            amount: (parseInt(item.balance_amount, 10) || 0) * 10000,
            due_date: item.balance_due || null,
            paid: !!item.paid,
            owner_user_id: sessionUserId,
          };
          if (item._isNew || String(item.id).startsWith('new-')) {
            const { error } = await supabase.from('couple_payments').insert(payload);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('couple_payments').update(payload).eq('id', item.id);
            if (error) throw error;
          }
        }

        await onSaved();
        return;
      }
      let projectId = project?.id || await findExistingBudgetProject();
      if (!projectId) {
        const { data, error } = await supabase.from('projects').insert({ user_id: couple?.user_id || sessionUserId, title: '웨딩 예산', event_date: couple?.wedding_date || null }).select('id').maybeSingle();
        if (error) throw error;
        projectId = data?.id;
      }
      let budgetId = budget?.id || await findExistingBudgetId(projectId);
      const spent = draftVendorCosts.reduce((sum, item) => sum + (parseInt(item.value, 10) || 0), 0);
        if (!budgetId) {
          const { data, error } = await supabase.from('budgets').insert({ project_id: projectId, total_amount: parseInt(draftBudget, 10) || 0, spent }).select('id').maybeSingle();
          if (error) throw error;
          budgetId = data?.id;
        } else {
        const { error } = await supabase.from('budgets').update({ total_amount: parseInt(draftBudget, 10) || 0, spent }).eq('id', budgetId);
        if (error) throw error;
      }
      const existingIds = new Set((items || []).map((item) => item.id));
      const nextIds = new Set(draftVendorCosts.filter((item) => !item._isNew && !String(item.id).startsWith('new-')).map((item) => item.id));
      for (const id of [...existingIds].filter((id) => !nextIds.has(id))) {
        const { error } = await supabase.from('budget_items').delete().eq('id', id);
        if (error) throw error;
      }
      for (const item of draftVendorCosts) {
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
                <TouchableOpacity style={modalStyles.searchAssistBtn} onPress={() => openVendorSearch(null, '')}>
                  <Ionicons name="search-outline" size={18} color="#7A9E8E" />
                  <Text style={modalStyles.searchAssistBtnText}>업체 검색하기</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
                {draftVendorCosts.map((item) => (
                  <View key={item.id} style={modalStyles.itemBoxExpanded}>
                    <View style={modalStyles.expandedHeader}>
                      <TextInput style={modalStyles.labelInput} value={item.label} onChangeText={(v) => updateField(item.id, 'label', v)} placeholder="항목명" placeholderTextColor="#B8A9A5" />
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={modalStyles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#B8A9A5" />
                      </TouchableOpacity>
                    </View>
                    {item.vendor_name ? (
                      <View style={modalStyles.selectedVendorBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={modalStyles.selectedVendorLabel}>선택된 업체</Text>
                          <Text style={modalStyles.selectedVendorName}>{item.vendor_name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => updateVendorField(item.id, 'vendor_name', '')}>
                          <Text style={modalStyles.selectedVendorClear}>해제</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    <View style={modalStyles.amountInputRow}>
                      <TextInput style={modalStyles.amountInput} value={item.value} onChangeText={(v) => updateField(item.id, 'value', v.replace(/\D/g, ''))} placeholder="금액 입력" placeholderTextColor="#B8A9A5" keyboardType="number-pad" />
                      <Text style={modalStyles.amountUnitLabel}>만원</Text>
                    </View>
                    <TouchableOpacity style={modalStyles.vendorSearchRowBtn} onPress={() => openVendorSearch(item.id, item.label)}>
                      <Ionicons name="storefront-outline" size={16} color="#7A9E8E" />
                      <Text style={modalStyles.vendorSearchRowBtnText}>{item.vendor_name ? '업체 다시 찾기' : '이 항목으로 업체 검색'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[costModalStyles.toggleBtn, item.has_balance && costModalStyles.toggleBtnOn]} onPress={() => updateField(item.id, 'has_balance', !item.has_balance)}>
                      <Text style={[costModalStyles.toggleText, item.has_balance && { color: '#C9716A' }]}>잔금 설정함</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : (
              <View style={{ paddingBottom: 20 }}>
                <TouchableOpacity style={modalStyles.addBtn} onPress={addPaymentItem}>
                  <Ionicons name="add-circle-outline" size={20} color="#C9716A" />
                  <Text style={modalStyles.addBtnText}>잔금 일정 추가하기</Text>
                </TouchableOpacity>
                <View style={{ height: 12 }} />
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

          <VendorSearchModal
            visible={vendorSearchVisible}
            onClose={() => setVendorSearchVisible(false)}
            query={vendorSearchQuery}
            setQuery={setVendorSearchQuery}
            onSearch={handleVendorSearch}
            results={vendorSearchResults}
            loading={searchLoading}
            onSelect={handleVendorSelect}
            category={vendorSearchCategory}
          />
        </View>
      </View>
    </Modal>
  );
}

function VendorSearchModal({ visible, onClose, query, setQuery, onSearch, results, loading, onSelect, category }) {
  if (!visible) return null;

  return (
    <View style={searchModalStyles.fullOverlay}>
      <View style={searchModalStyles.overlayHeader}>
        <View>
          <Text style={modalStyles.title}>업체 검색</Text>
          {category ? <Text style={searchModalStyles.categoryHint}>{category} 기준 검색</Text> : null}
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color="#B8A9A5" />
        </TouchableOpacity>
      </View>

      <View style={searchModalStyles.searchBar}>
        <View style={searchModalStyles.searchInputWrap}>
          <Ionicons name="search" size={20} color="#7A9E8E" />
          <TextInput
            style={searchModalStyles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="업체명을 입력하세요"
            placeholderTextColor="#B8A9A5"
            returnKeyType="search"
            onSubmitEditing={() => onSearch(query, category)}
            autoFocus
          />
        </View>
        <TouchableOpacity style={searchModalStyles.searchSubmitBtn} onPress={() => onSearch(query, category)}>
          <Text style={searchModalStyles.searchSubmitBtnText}>검색</Text>
        </TouchableOpacity>
      </View>

      <Text style={searchModalStyles.helperText}>검색 결과를 누르면 현재 항목의 선택 업체로 반영됩니다.</Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#C9716A" size="large" style={{ marginTop: 40 }} />
        ) : results.length > 0 ? (
          results.map((vendor) => (
            <TouchableOpacity key={vendor.id} style={searchModalStyles.vendorResultItem} onPress={() => onSelect(vendor)}>
              <View style={{ flex: 1 }}>
                <Text style={searchModalStyles.vendorResultName}>{vendor.name}</Text>
                <Text style={searchModalStyles.vendorResultLoc}>{vendor.location || '지역 정보 없음'}</Text>
              </View>
              <View style={searchModalStyles.selectBadge}>
                <Text style={searchModalStyles.selectBadgeText}>보기</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={searchModalStyles.emptyResultBox}>
            <Text style={searchModalStyles.emptyResultText}>검색 결과가 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F5' }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F5' }, container: { padding: 20 }, header: { marginBottom: 20 }, headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C2420' }, headerSub: { fontSize: 14, color: '#8A7870', marginTop: 4 }, summaryCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 20, shadowColor: '#2C2420', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }, summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 }, summaryLabel: { fontSize: 13, color: '#8A7870', marginBottom: 5 }, summaryValue: { fontSize: 26, fontWeight: '800', color: '#2C2420' }, detailBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }, detailBtnText: { fontSize: 12, fontWeight: '600', color: '#C9716A', marginRight: 2 }, progressBar: { height: 8, backgroundColor: '#F5F1EE', borderRadius: 4, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#C9716A', borderRadius: 4 }, progressLabelRow: { marginTop: 10 }, progressSubText: { fontSize: 12, color: '#8A7870' }, menuGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 }, menuCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0E8E4' }, menuIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }, menuTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420', marginBottom: 4 }, menuDesc: { fontSize: 11, color: '#8A7870' }, section: { paddingBottom: 24 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2C2420' }, listCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F0E8E4' }, costRowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: '#F5F1EE', backgroundColor: '#fff' }, costRowIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FAF7F6', justifyContent: 'center', alignItems: 'center' }, costLabel: { fontSize: 16, fontWeight: '700', color: '#2C2420' }, costVendorName: { fontSize: 12, color: '#8A7870', marginTop: 4 }, costValue: { fontSize: 16, fontWeight: '800', color: '#2C2420' }, balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' }, balanceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAE2DF', marginRight: 12 }, balanceMainTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420' }, balanceSub: { fontSize: 12, color: '#8A7870', marginTop: 2 }, balanceAmount: { fontSize: 16, fontWeight: '800', color: '#2C2420' }, aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9716A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 }, aiBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' }, editBtn: { paddingHorizontal: 8, paddingVertical: 4 }, editBtnText: { fontSize: 12, color: '#B8A9A5' }, emptyBox: { paddingVertical: 40, alignItems: 'center' }, emptyText: { fontSize: 13, color: '#B8A9A5', textAlign: 'center' }, emptyAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#FADEDC' }, emptyAddBtnText: { color: '#C9716A', fontSize: 12, fontWeight: '700', marginLeft: 4 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject }, sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }, title: { fontSize: 18, fontWeight: '700', color: '#2C2420' }, itemBoxExpanded: { backgroundColor: '#F9F7F6', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0E8E4' }, expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, labelInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#2C2420', padding: 0 }, trashBtn: { padding: 4 }, selectedVendorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EFEB', marginBottom: 12 }, selectedVendorLabel: { fontSize: 11, color: '#8A7870', marginBottom: 3 }, selectedVendorName: { fontSize: 13, fontWeight: '700', color: '#2C2420' }, selectedVendorClear: { fontSize: 12, color: '#C9716A', fontWeight: '700' }, amountInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }, amountInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C2420' }, amountUnitLabel: { fontSize: 13, color: '#8A7870', fontWeight: '500' }, addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 10, borderWidth: 1, borderColor: '#C9716A', backgroundColor: '#FDF0EF', borderRadius: 12, gap: 6 }, addBtnText: { color: '#C9716A', fontWeight: '700', fontSize: 14 }, searchAssistBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, marginTop: 10, borderWidth: 1, borderColor: '#DCEBE4', backgroundColor: '#F4FAF7', borderRadius: 12, gap: 6 }, searchAssistBtnText: { color: '#7A9E8E', fontWeight: '700', fontSize: 14 }, vendorSearchRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6EFEB', marginBottom: 12 }, vendorSearchRowBtnText: { fontSize: 13, color: '#7A9E8E', fontWeight: '700' }, footer: { flexDirection: 'row', gap: 12, marginTop: 20 }, cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F1EE' }, cancelBtnText: { color: '#8A7870', fontWeight: '600' }, saveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#C9716A' }, saveBtnText: { color: '#fff', fontWeight: '700' }, emptyBox: { paddingVertical: 40, alignItems: 'center' }, emptyText: { fontSize: 13, color: '#B8A9A5', textAlign: 'center' },
});

const searchModalStyles = StyleSheet.create({
  fullOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', zIndex: 100, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  categoryHint: { marginTop: 4, fontSize: 12, color: '#8A7870' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginBottom: 10 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F7F6', paddingHorizontal: 14, borderRadius: 12, gap: 10, borderWidth: 1.5, borderColor: '#EAE2DF' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#2C2420', fontWeight: '500' },
  searchSubmitBtn: { backgroundColor: '#C9716A', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  searchSubmitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  helperText: { marginBottom: 8, paddingHorizontal: 4, fontSize: 12, color: '#8A7870' },
  vendorResultItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' },
  vendorResultName: { fontSize: 16, fontWeight: '700', color: '#2C2420' },
  vendorResultLoc: { fontSize: 13, color: '#8A7870', marginTop: 2 },
  selectBadge: { backgroundColor: '#EBF2EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  selectBadgeText: { fontSize: 11, color: '#7A9E8E', fontWeight: '700' },
  emptyResultBox: { paddingVertical: 40, alignItems: 'center' },
  emptyResultText: { fontSize: 13, color: '#B8A9A5' },
});

const costModalStyles = StyleSheet.create({
  tabRow: { flexDirection: 'row', backgroundColor: '#F5F1EE', borderRadius: 10, padding: 4, marginBottom: 16 }, tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, tabActive: { backgroundColor: '#fff' }, tabText: { fontSize: 13, color: '#8A7870' }, tabTextActive: { color: '#2C2420', fontWeight: '600' }, budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#FDF0EF', borderRadius: 10 }, budgetLabel: { fontSize: 14, color: '#2C2420' }, budgetInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 }, budgetInput: { borderBottomWidth: 1, borderColor: '#C9716A', fontSize: 16, fontWeight: '700', color: '#C9716A', minWidth: 50, textAlign: 'right' }, budgetUnit: { fontSize: 14, color: '#C9716A' }, toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#F0E8E4', backgroundColor: '#fff' }, toggleBtnOn: { borderColor: '#C9716A', backgroundColor: '#FDF0EF' }, toggleText: { fontSize: 12, color: '#8A7870' }, balanceEditCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F5F1EE' }, balanceEditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }, balanceEditTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420' }, dDayBadge: { fontSize: 11, color: '#C9716A', backgroundColor: '#FDF0EF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '600' }, balanceInputRow: { flexDirection: 'row', gap: 12 }, inputSubLabel: { fontSize: 11, color: '#A8928A', marginBottom: 6 }, balanceTextInput: { backgroundColor: '#F9F7F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#F0E8E4' }, balanceSubInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F7F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#F0E8E4' }, pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }, pickerBackdrop: { ...StyleSheet.absoluteFillObject }, pickerSheet: { backgroundColor: '#fff', borderRadius: 24, width: '90%', padding: 15, overflow: 'hidden' }, pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }, pickerTitle: { fontSize: 18, fontWeight: '700', color: '#2C2420' }, presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5, marginBottom: 5, paddingHorizontal: 4 }, presetChip: { backgroundColor: '#FDF0EF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FADEDC' }, presetChipText: { fontSize: 12, color: '#C9716A', fontWeight: '600' },
});

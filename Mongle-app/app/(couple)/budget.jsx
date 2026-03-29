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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatNumber, CATEGORY_MAP, CATEGORY_LABEL } from '../../lib/utils';
import { projectsApi, budgetsApi, vendorsApi } from '../../lib/api';
import BudgetOptimizationModal from '../../components/budget/BudgetOptimizationModal';
import { PDFService } from '../../lib/services/pdf/PDFService';

const { width } = Dimensions.get('window');

LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

const PRESET_CATEGORIES = ['웨딩홀', '스튜디오', '드레스', '메이크업', '본식스냅'];

const formatBalanceSub = (dueDateStr) => {
  if (!dueDateStr) return '일정 미지정';
  let cleanDate = dueDateStr;
  if (dueDateStr.length === 8 && !dueDateStr.includes('-')) {
    cleanDate = `${dueDateStr.slice(0, 4)}-${dueDateStr.slice(4, 6)}-${dueDateStr.slice(6, 8)}`;
  }
  const due = new Date(cleanDate);
  if (isNaN(due.getTime())) return '잘못된 날짜';
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
    case 'package': return 'briefcase-outline';
    default: return 'receipt-outline';
  }
};

const checkUrgent = (dueDateStr) => {
  if (!dueDateStr) return false;
  let cleanDate = dueDateStr;
  if (dueDateStr.length === 8 && !dueDateStr.includes('-')) {
    cleanDate = `${dueDateStr.slice(0, 4)}-${dueDateStr.slice(4, 6)}-${dueDateStr.slice(6, 8)}`;
  }
  const due = new Date(cleanDate);
  if (isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= 10;
};

export default function BudgetHubScreen() {
  const queryClient = useQueryClient();
  const [costEditModalVisible, setCostEditModalVisible] = useState(false);
  const [optimizationModalVisible, setOptimizationModalVisible] = useState(false);

  // 1. Fetch Current Project
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const activeProject = projects[0]; // Simplification for demo: use first project

  // 2. Fetch Budget for the Project
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', activeProject?.id],
    queryFn: () => budgetsApi.getBudgets(activeProject.id),
    enabled: !!activeProject?.id,
    select: (data) => data?.[0] || null, // Assume one main budget per project
  });

  // 3. Fetch Budget Items
  const { data: costItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['budgetItems', budgetData?.id],
    queryFn: () => budgetsApi.getBudgetItems(budgetData.id),
    enabled: !!budgetData?.id,
  });

  const isLoading = projectsLoading || budgetLoading || itemsLoading;

  const handleExportPDF = async () => {
    try {
      const pdfData = {
        totalBudget: (budgetData?.total_amount || 0) * 10000,
        spent: (budgetData?.spent || 0) * 10000,
        items: costItems
          .filter(item => item.label || item.value)
          .map(item => ({
            category: item.label || '기타',
            amount: (parseInt(item.value) || 0) * 10000
          }))
      };
      await PDFService.saveBudgetSummary(pdfData);
    } catch (error) {
      Alert.alert('오류', 'PDF 저장 중 문제가 발생했습니다.');
    }
  };

  const usedAmount = budgetData?.spent || 0;
  const budgetTotal = budgetData?.total_amount || 0;
  const progress = Math.min(100, Math.round((usedAmount / (budgetTotal || 1)) * 100));

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F5' }}>
        <ActivityIndicator size="large" color="#C9716A" />
      </View>
    );
  }

  // If no project exists yet (should not happen in this flow usually)
  if (!activeProject) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>생성된 웨딩 프로젝트가 없습니다.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>비용 관리</Text>
          <Text style={styles.headerSub}>결혼 준비 예산을 한눈에 확인하세요</Text>
        </View>

        {/* ── ① 예산 요약 ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>현재 총 지출</Text>
              <Text style={styles.summaryValue}>{formatNumber(usedAmount)}만원</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.detailBtn, { backgroundColor: '#EBF2EE' }]}
                onPress={handleExportPDF}
              >
                <Ionicons name="download-outline" size={14} color="#7A9E8E" />
                <Text style={[styles.detailBtnText, { color: '#7A9E8E', marginLeft: 4 }]}>PDF 저장</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailBtn}
                onPress={() => router.push('/(couple)/budget-dashboard')}
              >
                <Text style={styles.detailBtnText}>대시보드</Text>
                <Ionicons name="chevron-forward" size={14} color="#C9716A" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressSubText}>예산 {formatNumber(budgetTotal)}만원 중 {progress}% 사용</Text>
          </View>
        </View>

        {/* ── ② 주요 메뉴 ── */}
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(couple)/estimate-comparison')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FDF0EF' }]}>
              <Ionicons name="git-compare-outline" size={24} color="#C9716A" />
            </View>
            <Text style={styles.menuTitle}>견적 비교</Text>
            <Text style={styles.menuDesc}>업체별 견적서 합리적 비교</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(couple)/pdf-history')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#EBF2EE' }]}>
              <Ionicons name="document-text-outline" size={24} color="#7A9E8E" />
            </View>
            <Text style={styles.menuTitle}>PDF 내역</Text>
            <Text style={styles.menuDesc}>저장된 견적 리포트 확인</Text>
          </TouchableOpacity>
        </View>

        {/* ── ③ 상세 지출 리스트 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>상세 지출 내역</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={styles.aiBtn}
                onPress={() => setOptimizationModalVisible(true)}
              >
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.aiBtnText}>AI 최적화</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={() => setCostEditModalVisible(true)}>
                <Text style={styles.editBtnText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listCard}>
            {costItems.length > 0 && costItems.some(i => i.id && (i.label || i.value)) ? (
              costItems
                .filter(i => i.id && (i.label || i.value))
                .map((item) => (
                <View
                  key={item.id}
                  style={styles.costRowWrapper}
                >
                  <View style={styles.costRowIconBox}>
                    <Ionicons name={getCategoryIcon(item.label)} size={20} color="#8A7870" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.costLabel}>{item.label || '미지정 항목'}</Text>
                    {item.vendor_name && (
                      <Text style={styles.vendorLinkedText}>{item.vendor_name}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.costValue}>
                      {item.value ? `${formatNumber(item.value)}만원` : '미정'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={40} color="#F0E8E4" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>등록된 지출 내역이 없습니다.</Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setCostEditModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#C9716A" />
                  <Text style={styles.emptyAddBtnText}>상세 지출 항목 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── ④ 잔금 일정 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>잔금 결제 일정</Text>
          </View>
          <View style={styles.listCard}>
            {costItems
              .filter((item) => item.has_balance)
              .map(item => ({ ...item, isUrgent: checkUrgent(item.balance_due) }))
              .sort((a, b) => {
                if (!a.balance_due) return 1;
                if (!b.balance_due) return -1;
                return a.balance_due > b.balance_due ? 1 : -1;
              })
              .map((item, idx, arr) => (
                <View
                  key={item.id}
                  style={[
                    styles.balanceRow,
                    idx === arr.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={[styles.balanceDot, item.isUrgent && { backgroundColor: '#C9716A' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.balanceMainTitle}>
                      {item.vendor_name || item.label}
                    </Text>
                    <Text style={styles.balanceSub}>
                      {item.vendor_name ? `${item.label} · ` : ''}
                      {formatBalanceSub(item.balance_due)}
                    </Text>
                  </View>
                  <Text style={[styles.balanceAmount, item.isUrgent && { color: '#C9716A' }]}>
                    {item.balance_amount ? `${formatNumber(item.balance_amount)}만원` : '미정'}
                  </Text>
                </View>
              ))}
            {costItems.filter(i => i.has_balance).length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>등록된 잔금 일정이 없습니다</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <CostEditModal
        visible={costEditModalVisible}
        projectId={activeProject.id}
        budget={budgetData}
        items={costItems}
        onClose={() => setCostEditModalVisible(false)}
      />

      <BudgetOptimizationModal
        visible={optimizationModalVisible}
        onClose={() => setOptimizationModalVisible(false)}
        totalBudget={budgetTotal}
        costItems={costItems}
        onApplyPlan={(plan) => {
          Alert.alert('알림', 'AI 추천 플랜이 수립되었습니다. 명세서에 수동으로 반영해 주세요.');
          setOptimizationModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

// ── 보조 컴포넌트 (CostEditModal) ────────────────────────
function CostEditModal({ visible, projectId, budget, items, onClose }) {
  const queryClient = useQueryClient();
  const [draftItems, setDraftItems] = useState([]);
  const [draftBudget, setDraftBudget] = useState('0');
  const [activeTab, setActiveTab] = useState('cost');

  const [vendorSearchVisible, setVendorSearchVisible] = useState(false);
  const [vendorSearchResults, setVendorSearchResults] = useState([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [currentSearchIdx, setCurrentSearchIdx] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTargetIdx, setDatePickerTargetIdx] = useState(null);

  useEffect(() => {
    if (visible) {
      setDraftItems(items.map(i => ({ ...i })));
      setDraftBudget((budget?.total_amount || 0).toString());
      setActiveTab('cost');
    }
  }, [visible, items, budget]);

  // Mutations
  const createBudgetItemMutation = useMutation({
    mutationFn: budgetsApi.createBudgetItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgetItems'] }),
  });

  const updateBudgetItemMutation = useMutation({
    mutationFn: ({ id, data }) => budgetsApi.updateBudgetItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgetItems'] }),
  });

  const deleteBudgetItemMutation = useMutation({
    mutationFn: (id) => budgetsApi.deleteBudgetItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgetItems'] }),
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }) => budgetsApi.updateBudget(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budget'] }),
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data) => budgetsApi.createBudget(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budget'] }),
  });

  const handleSave = async () => {
    try {
      let currentBudgetId = budget?.id;
      
      // 1. Create Budget if not exists
      if (!currentBudgetId) {
        const resp = await createBudgetMutation.mutateAsync({
          project_id: projectId,
          total_amount: parseInt(draftBudget) || 0,
          spent: draftItems.reduce((acc, i) => acc + (parseInt(i.spent || i.value) || 0), 0)
        });
        currentBudgetId = resp[0]?.id;
      } else {
        // Update Budget
        await updateBudgetMutation.mutateAsync({
          id: currentBudgetId,
          data: {
            total_amount: parseInt(draftBudget) || 0,
            spent: draftItems.reduce((acc, i) => acc + (parseInt(i.spent || i.value) || 0), 0)
          }
        });
      }

      // 2. Sync Items
      // This is a simple implementation: 
      // Compare draft with server items and perform Create/Update/Delete.
      const originalIds = items.map(i => i.id);
      const draftIds = draftItems.map(i => i.id).filter(id => typeof id === 'string'); // UUIDs are strings, new IDs are timestamps

      // Delete
      const toDelete = items.filter(i => !draftItems.find(d => d.id === i.id));
      for (const item of toDelete) {
        await deleteBudgetItemMutation.mutateAsync(item.id);
      }

      // Create & Update
      for (const item of draftItems) {
        if (!item.label && !item.value) continue; // Skip empty items

        const itemData = {
          budget_id: currentBudgetId,
          label: item.label,
          value: parseInt(item.value) || 0,
          spent: item.spent || 0,
          has_balance: item.has_balance,
          balance_due: item.balance_due,
          balance_amount: parseInt(item.balance_amount) || 0,
          vendor_id: item.vendor_id,
          vendor_name: item.vendor_name
        };

        if (typeof item.id === 'string') {
          // Update
          await updateBudgetItemMutation.mutateAsync({ id: item.id, data: itemData });
        } else {
          // Create
          await createBudgetItemMutation.mutateAsync(itemData);
        }
      }

      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('저장 실패', '데이터를 저장하는 중 오류가 발생했습니다.');
    }
  };

  const updateField = (idx, field, value) => {
    const newItems = [...draftItems];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setDraftItems(newItems);
  };

  const deleteDraftItem = (idx) => {
    setDraftItems(draftItems.filter((_, i) => i !== idx));
  };

  const addCostItem = () => {
    setDraftItems([{
      id: Date.now(),
      label: '', value: '', has_balance: false,
      balance_due: '', balance_amount: '',
      vendor_id: null, vendor_name: null
    }, ...draftItems]);
  };

  const addPresetItem = (label) => {
    setDraftItems([{
      id: Date.now(),
      label, value: '', has_balance: false,
      balance_due: '', balance_amount: '',
      vendor_id: null, vendor_name: null
    }, ...draftItems]);
  };

  const handleVendorSearch = async (query, cat) => {
    setSearchLoading(true);
    try {
      const dbCat = CATEGORY_MAP[cat] || cat;
      const results = await vendorsApi.getVendors({ 
        category: dbCat === 'undefined' ? null : dbCat,
        query: query
      });
      setVendorSearchResults(results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectVendor = (vendor) => {
    if (currentSearchIdx !== null) {
      updateField(currentSearchIdx, 'vendor_id', vendor.id);
      updateField(currentSearchIdx, 'vendor_name', vendor.name);
    }
    setVendorSearchVisible(false);
  };

  const balanceItems = draftItems.filter(i => i.has_balance);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} />
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>비용 · 잔금 관리</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#B8A9A5" />
              </TouchableOpacity>
            </View>

            <View style={costModalStyles.tabRow}>
              {['cost', 'balance'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[costModalStyles.tab, activeTab === t && costModalStyles.tabActive]}
                  onPress={() => setActiveTab(t)}
                >
                  <Text style={[costModalStyles.tabText, activeTab === t && costModalStyles.tabTextActive]}>
                    {t === 'cost' ? '비용 항목' : '잔금 일정'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {activeTab === 'cost' ? (
                <>
                  <View style={costModalStyles.budgetRow}>
                    <Text style={costModalStyles.budgetLabel}>전체 예산</Text>
                    <View style={costModalStyles.budgetInputWrap}>
                      <TextInput
                        style={costModalStyles.budgetInput}
                        value={draftBudget}
                        onChangeText={setDraftBudget}
                        keyboardType="number-pad"
                      />
                      <Text style={costModalStyles.budgetUnit}>만원</Text>
                    </View>
                  </View>

                  <View style={costModalStyles.presetRow}>
                    {PRESET_CATEGORIES.map(cat => (
                      <TouchableOpacity 
                        key={cat} 
                        style={costModalStyles.presetChip}
                        onPress={() => addPresetItem(cat)}
                      >
                        <Text style={costModalStyles.presetChipText}>+ {cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={modalStyles.addBtn} onPress={addCostItem}>
                    <Ionicons name="add-circle-outline" size={20} color="#C9716A" />
                    <Text style={modalStyles.addBtnText}>기타 항목 추가하기</Text>
                  </TouchableOpacity>

                  <View style={{ height: 20 }} />

                  {draftItems.map((item, idx) => (
                    <View key={item.id} style={modalStyles.itemBoxExpanded}>
                      <View style={modalStyles.expandedHeader}>
                        <TextInput
                          style={[modalStyles.labelInput, { flex: 1 }]}
                          value={item.label}
                          onChangeText={v => updateField(idx, 'label', v)}
                          placeholder="항목명"
                          placeholderTextColor="#B8A9A5"
                        />
                        <TouchableOpacity onPress={() => deleteDraftItem(idx)} style={modalStyles.trashBtn}>
                          <Ionicons name="trash-outline" size={18} color="#B8A9A5" />
                        </TouchableOpacity>
                      </View>

                      {item.vendor_name ? (
                        <TouchableOpacity 
                          style={modalStyles.linkedVendorContainer}
                          onPress={() => {
                            setCurrentSearchIdx(idx);
                            setVendorSearchVisible(true);
                            handleVendorSearch('', item.label);
                          }}
                        >
                          <Ionicons name="checkmark-circle" size={16} color="#7A9E8E" />
                          <Text style={modalStyles.linkedVendorName}>{item.vendor_name}</Text>
                          <Text style={modalStyles.changeVendorText}>변경</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={modalStyles.vendorLinkActionBtn}
                          onPress={() => {
                            setCurrentSearchIdx(idx);
                            setVendorSearchVisible(true);
                            handleVendorSearch('', item.label);
                          }}
                        >
                          <Ionicons name="search-outline" size={16} color="#C9716A" />
                          <Text style={modalStyles.vendorLinkActionText}>계약 업체 검색 및 연결</Text>
                        </TouchableOpacity>
                      )}

                      <View style={modalStyles.amountInputRow}>
                        <TextInput
                          style={modalStyles.amountInput}
                          value={item.value?.toString()}
                          onChangeText={v => updateField(idx, 'value', v.replace(/\D/g, ''))}
                          placeholder="금액 입력"
                          placeholderTextColor="#B8A9A5"
                          keyboardType="number-pad"
                        />
                        <Text style={modalStyles.amountUnitLabel}>만원</Text>
                      </View>

                      <View style={modalStyles.expandedToggles}>
                        <TouchableOpacity
                          style={[costModalStyles.toggleBtn, item.has_balance && costModalStyles.toggleBtnOn]}
                          onPress={() => updateField(idx, 'has_balance', !item.has_balance)}
                        >
                          <Text style={[costModalStyles.toggleText, item.has_balance && { color: '#C9716A' }]}>잔금 설정함</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <View style={{ paddingBottom: 20 }}>
                  {balanceItems.length > 0 ? (
                    balanceItems.map((item) => {
                      const idx = draftItems.findIndex(d => d.id === item.id);
                      return (
                        <View key={item.id} style={costModalStyles.balanceEditCard}>
                          <View style={costModalStyles.balanceEditHeader}>
                            <Text style={costModalStyles.balanceEditTitle}>{item.label}</Text>
                            <Text style={costModalStyles.dDayBadge}>{formatBalanceSub(item.balance_due)}</Text>
                          </View>
                          <View style={costModalStyles.balanceInputRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={costModalStyles.inputSubLabel}>잔금액 (만원)</Text>
                              <TextInput
                                style={costModalStyles.balanceSubInput}
                                value={item.balance_amount?.toString()}
                                onChangeText={v => updateField(idx, 'balance_amount', v.replace(/\D/g, ''))}
                                placeholder="금액"
                                keyboardType="number-pad"
                              />
                            </View>
                            <View style={{ flex: 1.5 }}>
                              <Text style={costModalStyles.inputSubLabel}>예정일</Text>
                              <TouchableOpacity 
                                style={costModalStyles.balanceSubInput}
                                onPress={() => {
                                  setDatePickerTargetIdx(idx);
                                  setDatePickerVisible(true);
                                }}
                              >
                                <Text style={{ color: item.balance_due ? '#2C2420' : '#B8A9A5', fontSize: 13 }}>
                                  {item.balance_due || '날짜 선택'}
                                </Text>
                                <Ionicons name="calendar-outline" size={14} color="#C9716A" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={modalStyles.emptyBox}>
                      <Ionicons name="notifications-off-outline" size={32} color="#F0E8E4" style={{ marginBottom: 10 }} />
                      <Text style={modalStyles.emptyText}>비용 탭에서 '잔금 설정' 박스를{'\n'}체크한 항목들이 여기에 표시됩니다.</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={modalStyles.footer}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                <Text style={modalStyles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.saveBtn}
                onPress={handleSave}
                disabled={updateBudgetMutation.isPending || createBudgetItemMutation.isPending}
              >
                {updateBudgetMutation.isPending || createBudgetItemMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={modalStyles.saveBtnText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>

            <VendorSearchModal
              visible={vendorSearchVisible}
              onClose={() => setVendorSearchVisible(false)}
              query={vendorSearchQuery}
              setQuery={setVendorSearchQuery}
              onSearch={handleVendorSearch}
              results={vendorSearchResults}
              loading={searchLoading}
              onSelect={selectVendor}
              category={draftItems[currentSearchIdx]?.label}
            />

            <Modal visible={datePickerVisible} transparent animationType="fade">
              <View style={costModalStyles.pickerOverlay}>
                <TouchableOpacity style={costModalStyles.pickerBackdrop} onPress={() => setDatePickerVisible(false)} />
                <View style={costModalStyles.pickerSheet}>
                  <View style={costModalStyles.pickerHeader}>
                    <Text style={costModalStyles.pickerTitle}>날짜 선택</Text>
                    <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                      <Ionicons name="close" size={24} color="#B8A9A5" />
                    </TouchableOpacity>
                  </View>
                  <Calendar
                    onDayPress={day => {
                      updateField(datePickerTargetIdx, 'balance_due', day.dateString);
                      setDatePickerVisible(false);
                    }}
                    theme={{
                      todayTextColor: '#C9716A',
                      arrowColor: '#C9716A',
                      selectedDayBackgroundColor: '#C9716A',
                      textMonthFontWeight: '800',
                    }}
                  />
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </Modal>
    </>
  );
}

function VendorSearchModal({ visible, onClose, query, setQuery, onSearch, results, loading, onSelect, category }) {
  if (!visible) return null;
  return (
    <View style={searchModalStyles.fullOverlay}>
      <View style={searchModalStyles.overlayHeader}>
        <Text style={modalStyles.title}>업체 검색</Text>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color="#B8A9A5" />
        </TouchableOpacity>
      </View>
      <View style={searchModalStyles.searchBar}>
        <View style={searchModalStyles.searchInputWrap}>
          <Ionicons name="search" size={20} color="#C9716A" />
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
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#C9716A" size="large" style={{ marginTop: 40 }} />
        ) : results.map(v => (
          <TouchableOpacity key={v.id} style={searchModalStyles.vendorResultItem} onPress={() => onSelect(v)}>
            <View style={{ flex: 1 }}>
              <Text style={searchModalStyles.vendorResultName}>{v.name}</Text>
              <Text style={searchModalStyles.vendorResultLoc}>{v.location || '지역 정보 없음'}</Text>
            </View>
            <View style={searchModalStyles.selectBadge}>
              <Text style={searchModalStyles.selectBadgeText}>선택</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F5' },
  container: { padding: 20 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C2420' },
  headerSub: { fontSize: 14, color: '#8A7870', marginTop: 4 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 20, shadowColor: '#2C2420', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  summaryLabel: { fontSize: 13, color: '#8A7870', marginBottom: 5 },
  summaryValue: { fontSize: 26, fontWeight: '800', color: '#2C2420' },
  detailBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  detailBtnText: { fontSize: 12, fontWeight: '600', color: '#C9716A', marginRight: 2 },
  progressBar: { height: 8, backgroundColor: '#F5F1EE', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#C9716A', borderRadius: 4 },
  progressLabelRow: { marginTop: 10 },
  progressSubText: { fontSize: 12, color: '#8A7870' },
  menuGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  menuCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0E8E4' },
  menuIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420', marginBottom: 4 },
  menuDesc: { fontSize: 11, color: '#8A7870' },
  section: { paddingBottom: 24 },
  costRowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: '#F5F1EE', backgroundColor: '#fff' },
  costRowIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FAF7F6', justifyContent: 'center', alignItems: 'center' },
  costLabel: { fontSize: 16, fontWeight: '700', color: '#2C2420' },
  costValue: { fontSize: 16, fontWeight: '800', color: '#2C2420' },
  vendorLinkedText: { fontSize: 12, color: '#8A7870', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2C2420' },
  listCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F0E8E4' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' },
  balanceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAE2DF', marginRight: 12 },
  balanceMainTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420' },
  balanceSub: { fontSize: 12, color: '#8A7870', marginTop: 2 },
  balanceAmount: { fontSize: 16, fontWeight: '800', color: '#2C2420' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9716A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  aiBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  editBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  editBtnText: { fontSize: 12, color: '#B8A9A5' },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#B8A9A5', textAlign: 'center' },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#FADEDC' },
  emptyAddBtnText: { color: '#C9716A', fontSize: 12, fontWeight: '700', marginLeft: 4 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2420' },
  itemBoxExpanded: { backgroundColor: '#F9F7F6', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0E8E4' },
  expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#2C2420', padding: 0 },
  trashBtn: { padding: 4 },
  vendorLinkActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF0EF', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FADEDC', marginTop: 10, marginBottom: 10, gap: 8 },
  vendorLinkActionText: { fontSize: 13, color: '#C9716A', fontWeight: '700' },
  linkedVendorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9F7F6', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EAE2DF', marginTop: 10, marginBottom: 10, gap: 8 },
  linkedVendorName: { flex: 1, fontSize: 13, color: '#2C2420', fontWeight: '600' },
  changeVendorText: { fontSize: 11, color: '#7A9E8E', fontWeight: '700' },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  amountInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C2420' },
  amountUnitLabel: { fontSize: 13, color: '#8A7870', fontWeight: '500' },
  expandedToggles: { flexDirection: 'row', gap: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 10, borderStyle: 'solid', borderWidth: 1, borderColor: '#C9716A', backgroundColor: '#FDF0EF', borderRadius: 12, gap: 6 },
  addBtnText: { color: '#C9716A', fontWeight: '700', fontSize: 14 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F1EE' },
  cancelBtnText: { color: '#8A7870', fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#C9716A' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#B8A9A5', textAlign: 'center' },
});

const searchModalStyles = StyleSheet.create({
  fullOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', zIndex: 100, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginBottom: 10 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F7F6', paddingHorizontal: 14, borderRadius: 12, gap: 10, borderWidth: 1.5, borderColor: '#EAE2DF' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#2C2420', fontWeight: '500' },
  searchSubmitBtn: { backgroundColor: '#C9716A', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  searchSubmitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  vendorResultItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' },
  vendorResultName: { fontSize: 16, fontWeight: '700', color: '#2C2420' },
  vendorResultLoc: { fontSize: 13, color: '#8A7870' },
  selectBadge: { backgroundColor: '#EBF2EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  selectBadgeText: { fontSize: 11, color: '#7A9E8E', fontWeight: '700' },
});

const costModalStyles = StyleSheet.create({
  tabRow: { flexDirection: 'row', backgroundColor: '#F5F1EE', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, color: '#8A7870' },
  tabTextActive: { color: '#2C2420', fontWeight: '600' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#FDF0EF', borderRadius: 10 },
  budgetLabel: { fontSize: 14, color: '#2C2420' },
  budgetInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  budgetInput: { borderBottomWidth: 1, borderColor: '#C9716A', fontSize: 16, fontWeight: '700', color: '#C9716A', minWidth: 50, textAlign: 'right' },
  budgetUnit: { fontSize: 14, color: '#C9716A' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#F0E8E4', backgroundColor: '#fff' },
  toggleBtnOn: { borderColor: '#C9716A', backgroundColor: '#FDF0EF' },
  toggleText: { fontSize: 12, color: '#8A7870' },
  balanceEditCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F5F1EE' },
  balanceEditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  balanceEditTitle: { fontSize: 15, fontWeight: '700', color: '#2C2420' },
  dDayBadge: { fontSize: 11, color: '#C9716A', backgroundColor: '#FDF0EF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '600' },
  balanceInputRow: { flexDirection: 'row', gap: 12 },
  inputSubLabel: { fontSize: 11, color: '#A8928A', marginBottom: 6 },
  balanceSubInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F7F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#F0E8E4' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerBackdrop: { ...StyleSheet.absoluteFillObject },
  pickerSheet: { backgroundColor: '#fff', borderRadius: 24, width: '90%', padding: 15, overflow: 'hidden' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#2C2420' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5, marginBottom: 5, paddingHorizontal: 4 },
  presetChip: { backgroundColor: '#FDF0EF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FADEDC' },
  presetChipText: { fontSize: 12, color: '#C9716A', fontWeight: '600' },
});
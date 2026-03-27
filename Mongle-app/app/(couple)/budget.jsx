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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatNumber, CATEGORY_MAP, CATEGORY_LABEL } from '../../lib/utils';
import BudgetOptimizationModal from '../../components/budget/BudgetOptimizationModal';
import { PDFService } from '../../lib/services/pdf/PDFService';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

// ── 데이터 (timeline.jsx에서 이관) ────────────────────────
const PRESET_CATEGORIES = ['웨딩홀', '스튜디오', '드레스', '메이크업', '헤어 (추가 옵션)'];

const INITIAL_COST_ITEMS = [
  {
    id: 1,
    label: '웨딩홀',
    value: '380',
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
];

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

const sumValues = (items) => items.reduce((acc, item) => acc + (parseInt(item.value) || 0), 0);
// ────────────────────────────────────────────────────────

export default function BudgetHubScreen() {
  const [costItems, setCostItems] = useState(INITIAL_COST_ITEMS);
  const [budget, setBudget] = useState('1000');
  const [costEditModalVisible, setCostEditModalVisible] = useState(false);
  const [optimizationModalVisible, setOptimizationModalVisible] = useState(false);

  const handleExportPDF = async () => {
    try {
      const budgetData = {
        totalBudget: parseInt(budget) * 10000,
        spent: sumValues(costItems) * 10000,
        items: costItems.map(item => ({
             category: item.label,
             amount: parseInt(item.value) * 10000 || 0
        }))
      };
      await PDFService.saveBudgetSummary(budgetData);
    } catch (error) {
      Alert.alert('오류', 'PDF 저장 중 문제가 발생했습니다.');
    }
  };

  const usedAmount = sumValues(costItems);
  const progress = Math.min(100, Math.round((usedAmount / (parseInt(budget) || 1)) * 100));

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
            <Text style={styles.progressSubText}>예산 {formatNumber(budget)}만원 중 {progress}% 사용</Text>
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
            {costItems.map((item, idx) => (
              <View 
                key={item.id} 
                style={[
                    styles.costRow, 
                    idx === costItems.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text style={styles.costLabel}>{item.label}</Text>
                <Text
                  style={[
                    styles.costValue,
                    item.warn && { color: '#C9716A' },
                  ]}
                >
                  {item.warn ? '⚠ ' : ''}
                  {item.value ? `${formatNumber(item.value)}만원` : '미정'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── ④ 잔금 일정 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>잔금 결제 일정</Text>
          </View>
          <View style={styles.listCard}>
            {costItems
              .filter((item) => item.hasBalance)
              .sort((a, b) => (a.balanceDue > b.balanceDue ? 1 : -1))
              .map((item, idx, arr) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.balanceRow,
                    idx === arr.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={[styles.balanceDot, item.urgent && { backgroundColor: '#C9716A' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.balanceLabel}>{item.label} 잔금</Text>
                    <Text style={styles.balanceSub}>{formatBalanceSub(item.balanceDue)}</Text>
                  </View>
                  <Text style={[styles.balanceAmount, item.urgent && { color: '#C9716A' }]}>
                    {item.balanceAmount ? `${formatNumber(item.balanceAmount)}만원` : '미정'}
                  </Text>
                </View>
              ))}
              {costItems.filter(i => i.hasBalance).length === 0 && (
                <View style={styles.emptyBox}>
                   <Text style={styles.emptyText}>등록된 잔금 일정이 없습니다</Text>
                </View>
              )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 비용/잔금 수정 모달 */}
      <CostEditModal
        visible={costEditModalVisible}
        items={costItems}
        budget={budget}
        onClose={() => setCostEditModalVisible(false)}
        onSave={(updatedItems, updatedBudget) => {
          setCostItems(updatedItems);
          setBudget(updatedBudget);
          setCostEditModalVisible(false);
        }}
      />

      {/* AI 예산 최적화 모달 */}
      <BudgetOptimizationModal
        visible={optimizationModalVisible}
        onClose={() => setOptimizationModalVisible(false)}
        totalBudget={budget}
        costItems={costItems}
        onApplyPlan={(plan) => {
            const updated = costItems.map(item => {
              // Normalize for comparison
              const itemLabel = (item.label || '').normalize('NFC').trim();
              const itemKey = (CATEGORY_MAP[itemLabel] || itemLabel).toLowerCase();
              
              const change = plan.changes.find(c => {
                const changeCat = (c.category || '').normalize('NFC').trim().toLowerCase();
                // Map back to label then to key just in case
                const mappedLabel = (CATEGORY_LABEL[changeCat] || changeCat).normalize('NFC').trim();
                const mappedKey = (CATEGORY_MAP[mappedLabel] || mappedLabel).toLowerCase();
                
                return changeCat === itemKey || mappedKey === itemKey;
              });
              
              if (change) {
                return { ...item, value: change.to.price_min.toString() };
              }
              return item;
            });

            setCostItems(updated);
            if (plan.finalTotal) {
              setBudget(plan.finalTotal.toString());
            }
            setOptimizationModalVisible(false);
            Alert.alert('알림', 'AI 추천 플랜이 성공적으로 적용되었습니다.');
        }}
      />
    </SafeAreaView>
  );
}

// ── 보조 컴포넌트 (CostEditModal) ────────────────────────
function CostEditModal({ visible, items, budget, onClose, onSave }) {
  const [draft, setDraft] = useState([]);
  const [activeTab, setActiveTab] = useState('cost');
  const [budgetVal, setBudgetVal] = useState(budget);

  React.useEffect(() => {
    if (visible) {
      setDraft(items.map((i) => ({ ...i })));
      setBudgetVal(budget);
      setActiveTab('cost');
    }
  }, [visible, items, budget]);

  const updateField = (idx, field, value) => {
    setDraft((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const deleteItem = (idx) => {
    setDraft((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCostItem = () => {
    setDraft((prev) => [{
      id: Date.now(),
      label: '', value: '', warn: false, hasBalance: false,
      balanceDue: '', balanceAmount: '', urgent: false
    }, ...prev]);
  };

  const addPresetItem = (label) => {
    const newItem = {
      id: Date.now(),
      label, value: '', warn: false, hasBalance: false,
      balanceDue: '', balanceAmount: '', urgent: false
    };
    setDraft((prev) => [newItem, ...prev]);
  };

  const balanceItems = draft.filter((item) => item.hasBalance);

  return (
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
                      value={budgetVal}
                      onChangeText={setBudgetVal}
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

                {draft.map((item, idx) => (
                  <View key={item.id} style={modalStyles.itemBoxExpanded}>
                    <View style={modalStyles.expandedHeader}>
                      <TextInput
                        style={modalStyles.labelInput}
                        value={item.label}
                        onChangeText={v => updateField(idx, 'label', v)}
                        placeholder="항목명"
                        placeholderTextColor="#B8A9A5"
                      />
                      <TouchableOpacity onPress={() => deleteItem(idx)} style={modalStyles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#B8A9A5" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={modalStyles.amountInputRow}>
                      <TextInput
                        style={modalStyles.amountInput}
                        value={item.value}
                        onChangeText={v => updateField(idx, 'value', v.replace(/\D/g, ''))}
                        placeholder="금액 입력"
                        placeholderTextColor="#B8A9A5"
                        keyboardType="number-pad"
                      />
                      <Text style={modalStyles.amountUnitLabel}>만원</Text>
                    </View>

                    <View style={modalStyles.expandedToggles}>
                      <TouchableOpacity 
                        style={[costModalStyles.toggleBtn, item.warn && costModalStyles.toggleBtnOn]}
                        onPress={() => updateField(idx, 'warn', !item.warn)}
                      >
                        <Text style={[costModalStyles.toggleText, item.warn && { color: '#C9716A' }]}>주의</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[costModalStyles.toggleBtn, item.hasBalance && costModalStyles.toggleBtnOn]}
                        onPress={() => updateField(idx, 'hasBalance', !item.hasBalance)}
                      >
                        <Text style={[costModalStyles.toggleText, item.hasBalance && { color: '#C9716A' }]}>잔금 설정함</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={{ padding: 10 }}>
                {balanceItems.map(item => (
                  <View key={item.id} style={costModalStyles.balanceCard}>
                    <Text style={costModalStyles.balanceCardLabel}>{item.label} 잔금</Text>
                    <Text style={costModalStyles.balanceCardAmount}>{item.balanceAmount}만원</Text>
                  </View>
                ))}
                {balanceItems.length === 0 && (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>등록된 잔금 일정이 없습니다</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.saveBtn} onPress={() => onSave(draft, budgetVal)}>
              <Text style={modalStyles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F5' },
  container: { padding: 20 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C2420' },
  headerSub: { fontSize: 14, color: '#8A7870', marginTop: 4 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
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

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2C2420' },
  listCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' },
  costLabel: { fontSize: 14, color: '#6B5B55' },
  costValue: { fontSize: 14, fontWeight: '600', color: '#2C2420' },

  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' },
  balanceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2D7D1' },
  balanceLabel: { fontSize: 14, fontWeight: '500', color: '#2C2420' },
  balanceSub: { fontSize: 12, color: '#B8A9A5', marginTop: 2 },
  balanceAmount: { fontSize: 14, fontWeight: '700', color: '#2C2420' },

  aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9716A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  aiBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  editBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  editBtnText: { fontSize: 12, color: '#B8A9A5' },
  emptyBox: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#B8A9A5' },
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
    flex: 1 // Add this to allow children with flex: 1 (ScrollView) to expand
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2420' },
  itemBoxExpanded: { backgroundColor: '#F9F7F6', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0E8E4' },
  expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#2C2420', padding: 0 },
  trashBtn: { padding: 4 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: '#EAE2DF' },
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
  balanceCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F1EE' },
  balanceCardLabel: { fontSize: 14, color: '#2C2420' },
  balanceCardAmount: { fontSize: 14, fontWeight: '700', color: '#C9716A' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5, marginBottom: 5, paddingHorizontal: 4 },
  presetChip: { backgroundColor: '#FDF0EF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FADEDC' },
  presetChipText: { fontSize: 12, color: '#C9716A', fontWeight: '600' },
});
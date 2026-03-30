import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatNumber, CATEGORY_MAP, CATEGORY_LABEL } from '../../lib/utils';
import { useBudgetOptimization } from '../../hooks/useBudgetOptimization';



export default function BudgetOptimizationModal({
  visible,
  onClose,
  totalBudget,
  costItems,
  onApplyPlan,
}) {
  const { optimize, loading, result, error, setResult } = useBudgetOptimization();
  const [lockedCategories, setLockedCategories] = useState([]);
  const [priorities, setPriorities] = useState({}); // {category: 'high'|'mid'|'low'}
  const [step, setStep] = useState('settings'); // 'settings' | 'results'

  // Initialize priorities
  useEffect(() => {
    if (visible) {
      const initialPrios = {};
      costItems.forEach(item => {
        const cat = CATEGORY_MAP[item.label] || item.label;
        initialPrios[cat] = 'mid';
      });
      setPriorities(initialPrios);
      setStep('settings');
      setResult(null);
    }
  }, [visible, costItems]);

  const toggleLock = (cat) => {
    setLockedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const setPriority = (cat, p) => {
    setPriorities(prev => ({ ...prev, [cat]: p }));
  };

  const handleOptimize = async () => {
    const selectedVendors = {};
    const contractedIds = [];
    
    costItems.forEach(item => {
      const cat = CATEGORY_MAP[item.label] || item.label;
      // We send both the ID and the current price (value)
      // If item.value is a string, it's already in "만원" units in this component
      selectedVendors[cat] = {
        id: item.id.toString(),
        price: parseInt(item.value) || 0
      };
    });

    try {
      await optimize({
        totalBudget: parseInt(totalBudget),
        selectedVendors,
        categoryPriorities: priorities,
        lockedCategories,
        contractedVendorIds: contractedIds,
      });
      setStep('results');
    } catch (err) {
      // Error handled in hook
    }
  };

  const renderPlanCard = (plan) => {
    const isBestVal = plan.type === 'balanced' || plan.type === 'max_savings';
    
    return (
      <View key={plan.type} style={[styles.planCard, isBestVal && styles.bestPlanCard]}>
        {isBestVal && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>추천</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.planSubtitle}>최종 예산: {formatNumber(plan.finalTotal)}만원</Text>
          </View>
          <View style={styles.savingsTag}>
            <Text style={styles.planSaved}>-{formatNumber(plan.totalSaved)}만원</Text>
          </View>
        </View>

        <View style={styles.divider} />
        
        <Text style={styles.planExplanation}>{plan.explanation}</Text>
        
        <View style={styles.changeListHeader}>
          <Text style={styles.changeListTitle}>주요 변경 항목</Text>
          <View style={styles.changeCountBadge}>
            <Text style={styles.changeCountText}>{plan.changes.length}개</Text>
          </View>
        </View>

        <View style={styles.changeList}>
          {plan.changes.map((c, idx) => (
            <View key={idx} style={styles.changeRow}>
              <View style={styles.changeRowLeft}>
                <View style={styles.dot} />
                <Text style={styles.changeCat}>{CATEGORY_LABEL[c.category] || c.category}</Text>
              </View>
              <View style={styles.changePath}>
                <Text style={styles.oldPrice}>{formatNumber(c.from.price_min)}</Text>
                <Ionicons name="arrow-forward" size={12} color="#D4C9C5" style={{ marginHorizontal: 4 }} />
                <Text style={styles.newPrice}>{formatNumber(c.to.price_min)}만</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.applyBtn, isBestVal && styles.bestApplyBtn]}
          onPress={() => onApplyPlan(plan)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyBtnText}>이 플랜으로 적용하기</Text>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>AI 예산 최적화</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2C2420" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {step === 'settings' ? (
              <>
                <View style={styles.infoBanner}>
                  <Ionicons name="bulb-outline" size={18} color="#C9716A" />
                  <Text style={styles.infoText}>
                    중요도가 낮은 항목 위주로 예산을 재구성하여{'\n'}전체 목표 예산에 맞춰드립니다.
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>잠금 및 중요도 설정</Text>
                {costItems.map((item) => {
                  const cat = CATEGORY_MAP[item.label] || item.label;
                  const isLocked = lockedCategories.includes(cat);
                  const prio = priorities[cat];

                  return (
                    <View key={item.id} style={styles.settingRow}>
                      <View style={styles.rowLeft}>
                        <TouchableOpacity onPress={() => toggleLock(cat)}>
                          <Ionicons 
                            name={isLocked ? "lock-closed" : "lock-open-outline"} 
                            size={20} 
                            color={isLocked ? "#C9716A" : "#D4C9C5"} 
                          />
                        </TouchableOpacity>
                        <Text style={[styles.itemLabel, isLocked && styles.lockedText]}>{item.label}</Text>
                      </View>
                      
                      <View style={styles.prioGroup}>
                        {['low', 'mid', 'high'].map(p => (
                          <TouchableOpacity 
                            key={p}
                            style={[
                              styles.prioBtn, 
                              prio === p && styles.prioBtnActive,
                              isLocked && { opacity: 0.5 }
                            ]}
                            onPress={() => !isLocked && setPriority(cat, p)}
                            disabled={isLocked}
                          >
                            <Text style={[styles.prioText, prio === p && styles.prioTextActive]}>
                              {p === 'low' ? '낮음' : p === 'mid' ? '보통' : '높음'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </>
            ) : (
              <>
                {loading ? (
                  <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#C9716A" />
                    <Text style={styles.loadingText}>최적의 예산안을 구성 중입니다...</Text>
                  </View>
                ) : result && result.plans ? (
                  <View style={styles.resultsArea}>
                    <Text style={styles.resultSummary}>
                      현재 예산보다 <Text style={styles.highlight}>{formatNumber(result.overflow)}만원</Text> 초과되었습니다.{'\n'}
                      {result.plans && result.plans.length > 0 
                        ? `분석 결과 ${result.plans.length}가지 대안을 제안합니다.`
                        : "현재 조건에서 더 이상 추천할 대안이 없습니다."}
                    </Text>
                    {result.plans && result.plans.map(renderPlanCard)}
                  </View>
                ) : (
                  <View style={styles.errorArea}>
                    <Text style={styles.errorText}>{error || '결과를 불러올 수 없습니다.'}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('settings')}>
                      <Text style={styles.retryBtnText}>다시 설정하기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {step === 'settings' && !loading && (
            <TouchableOpacity style={styles.mainBtn} onPress={handleOptimize}>
              <Text style={styles.mainBtnText}>분석 시작하기</Text>
            </TouchableOpacity>
          )}

          {step === 'results' && !loading && (
            <TouchableOpacity style={styles.subBtn} onPress={() => setStep('settings')}>
              <Text style={styles.subBtnText}>설정 다시하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44,36,32,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2420',
  },
  body: {
    marginBottom: 20,
  },
  infoBanner: {
    backgroundColor: '#FDF0EF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#6B5B55',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2420',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EE',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemLabel: {
    fontSize: 14,
    color: '#2C2420',
    fontWeight: '500',
  },
  lockedText: {
    color: '#B8A9A5',
  },
  prioGroup: {
    flexDirection: 'row',
    backgroundColor: '#F5F0EE',
    borderRadius: 8,
    padding: 2,
  },
  prioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  prioBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  prioText: {
    fontSize: 12,
    color: '#B8A9A5',
    fontWeight: '500',
  },
  prioTextActive: {
    color: '#C9716A',
    fontWeight: '600',
  },
  loadingArea: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B5B55',
    fontWeight: '500',
  },
  resultsArea: {
    gap: 20,
    paddingBottom: 20,
  },
  resultSummary: {
    fontSize: 15,
    color: '#6B5B55',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  highlight: {
    color: '#C9716A',
    fontWeight: '800',
  },
  planCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0E8E4',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  bestPlanCard: {
    borderColor: '#C9716A20',
    backgroundColor: '#FCFAF9',
    borderWidth: 1.5,
  },
  bestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#C9716A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C2420',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 13,
    color: '#A8928A',
    fontWeight: '500',
  },
  savingsTag: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planSaved: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4A8F6A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E8E4',
    marginBottom: 16,
  },
  planExplanation: {
    fontSize: 14,
    color: '#6B5B55',
    lineHeight: 22,
    marginBottom: 20,
  },
  changeListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  changeListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C2420',
  },
  changeCountBadge: {
    backgroundColor: '#F5F0EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8928A',
  },
  changeList: {
    backgroundColor: '#FBF8F7',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4C9C5',
  },
  changeCat: {
    fontSize: 13,
    color: '#6B5B55',
    fontWeight: '600',
  },
  changePath: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldPrice: {
    fontSize: 13,
    color: '#D4C9C5',
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  newPrice: {
    fontSize: 13,
    color: '#C9716A',
    fontWeight: '800',
  },
  applyBtn: {
    backgroundColor: '#8A7870',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bestApplyBtn: {
    backgroundColor: '#C9716A',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  mainBtn: {
    backgroundColor: '#C9716A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#C9716A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  subBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  subBtnText: {
    color: '#A8928A',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorArea: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#D0534A',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: '#F0E8E4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 14,
    color: '#6B5B55',
    fontWeight: '600',
  },
});

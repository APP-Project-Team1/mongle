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
    return (
      <View key={plan.type} style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planSaved}>-{formatNumber(plan.totalSaved)}만원</Text>
        </View>
        <Text style={styles.planExplanation}>{plan.explanation}</Text>
        
        <View style={styles.changeList}>
          {plan.changes.map((c, idx) => (
            <View key={idx} style={styles.changeRow}>
              <Text style={styles.changeCat}>{CATEGORY_LABEL[c.category] || c.category}</Text>
              <View style={styles.changePath}>
                <Text style={styles.oldPrice}>{formatNumber(c.from.price_min)}</Text>
                <Ionicons name="arrow-forward" size={12} color="#B8A9A5" />
                <Text style={styles.newPrice}>{formatNumber(c.to.price_min)}만</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.applyBtn}
          onPress={() => onApplyPlan(plan)}
        >
          <Text style={styles.applyBtnText}>이 플랜 적용하기</Text>
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
                      분석 결과 3가지 대안을 제안합니다.
                    </Text>
                    {result.plans.map(renderPlanCard)}
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
    fontSize: 14,
    color: '#6B5B55',
  },
  resultsArea: {
    gap: 16,
  },
  resultSummary: {
    fontSize: 14,
    color: '#6B5B55',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  highlight: {
    color: '#C9716A',
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: '#FBF8F7',
    borderWidth: 1.5,
    borderColor: '#EDE5E2',
    borderRadius: 16,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2420',
  },
  planSaved: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7A9E8E',
  },
  planExplanation: {
    fontSize: 13,
    color: '#6B5B55',
    lineHeight: 18,
    marginBottom: 16,
  },
  changeList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeCat: {
    fontSize: 12,
    color: '#8A7870',
    fontWeight: '500',
  },
  changePath: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oldPrice: {
    fontSize: 12,
    color: '#B8A9A5',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 12,
    color: '#C9716A',
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#C9716A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mainBtn: {
    backgroundColor: '#C9716A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  subBtnText: {
    color: '#B8A9A5',
    fontSize: 14,
    fontWeight: '500',
  },
  errorArea: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#D0534A',
    marginBottom: 20,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: '#EDE5E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 13,
    color: '#6B5B55',
  },
});

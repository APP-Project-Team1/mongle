import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PDFService } from '../../../lib/services/pdf/PDFService';
import { useAuth } from '../../../context/AuthContext';
import { fetchCoupleBudgetBundle } from '../../../lib/coupleBudgetData';
import { resolveCoupleContext } from '../../../lib/coupleIdentity';
import { formatNumber } from '../../../lib/utils';

export default function BudgetDashboard() {
  const [saving, setSaving] = React.useState(false);
  const { couple_id, session } = useAuth();
  const [effectiveCoupleId, setEffectiveCoupleId] = React.useState(couple_id ?? null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const userId = session?.user?.id;
      if (!userId) return;
      try {
        const resolved = await resolveCoupleContext(userId, couple_id ?? null, session?.user?.email ?? null);
        if (active) setEffectiveCoupleId(resolved.coupleId ?? couple_id ?? null);
      } catch {
        if (active) setEffectiveCoupleId(couple_id ?? null);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [couple_id, session?.user?.id]);

  const { data, isLoading } = useQuery({
    queryKey: ['couple-budget-bundle', effectiveCoupleId],
    queryFn: () => fetchCoupleBudgetBundle(effectiveCoupleId),
    enabled: !!effectiveCoupleId,
  });

  const activeProject = data?.project || null;
  const budgetData = data?.budget || null;
  const costItems = data?.items || [];

  const handleSaveBudgetPDF = async () => {
    if (!budgetData) {
      Alert.alert('알림', '등록된 예산 정보가 없습니다.');
      return;
    }

    setSaving(true);

    const pdfData = {
      projectName: activeProject?.title || activeProject?.name || '웨딩 예산',
      weddingDate: '날짜 미정',
      totalBudget: (budgetData.total_amount || 0) * 10000,
      spentAmount: (budgetData.spent || 0) * 10000,
      remainingBudget: ((budgetData.total_amount || 0) - (budgetData.spent || 0)) * 10000,
      categories: costItems
        .filter((item) => item.label || item.value)
        .map((item) => ({
          title: item.label || '기타',
          budget: (parseInt(item.value, 10) || 0) * 10000,
          spent: (parseInt(item.spent || item.value, 10) || 0) * 10000,
        })),
    };

    const result = await PDFService.saveBudgetSummary(pdfData);
    setSaving(false);

    if (result.success) {
      Alert.alert('성공', '예산 명세서가 PDF로 생성되었습니다.');
    } else {
      Alert.alert('오류', 'PDF 생성 중 문제가 발생했습니다.');
    }
  };

  const menuItems = [
    {
      id: 'compare',
      title: '업체 견적 비교',
      desc: 'PDF 또는 사진 견적서를 비교 분석합니다.',
      icon: 'git-compare-outline',
      color: '#917878',
      route: '/(couple)/estimate-comparison',
    },
    {
      id: 'save_pdf',
      title: '예산 명세서 PDF 저장',
      desc: '현재 예산과 지출 내역을 문서로 정리합니다.',
      icon: 'document-text-outline',
      color: '#c9a98e',
      action: handleSaveBudgetPDF,
    },
    {
      id: 'history',
      title: 'PDF 생성 이력',
      desc: '저장한 문서 목록을 확인합니다.',
      icon: 'time-outline',
      color: '#B9B4B4',
      route: '/(couple)/pdf-history',
    },
  ];

  if (saving) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9716A" />
        <Text style={styles.loadingText}>명세서 생성 중...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9716A" />
      </View>
    );
  }

  const totalBudget = budgetData?.total_amount || 0;
  const spentAmount = budgetData?.spent || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>예산 대시보드</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.summaryLabel}>총 예산</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalBudget)}만원</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.summaryLabel}>사용 금액</Text>
            <Text style={[styles.summaryValue, { color: '#C9716A' }]}>
              {formatNumber(spentAmount)}만원
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>바로가기</Text>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => (item.action ? item.action() : item.route ? router.push(item.route) : null)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#DDD" />
          </TouchableOpacity>
        ))}

        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={20} color="#c9a98e" />
          <Text style={styles.tipText}>
            이 화면은 Supabase `budgets`, `budget_items` 테이블을 직접 읽습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  loadingText: { marginTop: 20, fontWeight: 'bold', color: '#2C2420' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#3a2e2a' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { padding: 20 },
  summaryCard: {
    backgroundColor: '#faf5f2',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e8ddd8',
  },
  summaryLabel: { fontSize: 13, color: '#8a7870', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#3a2e2a' },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#e8ddd8' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#3a2e2a', marginBottom: 16 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#3a2e2a', marginBottom: 4 },
  menuDesc: { fontSize: 13, color: '#8a7870', lineHeight: 18 },
  tipBox: {
    marginTop: 20,
    backgroundColor: '#fff9f5',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fdecec',
  },
  tipText: { flex: 1, fontSize: 13, color: '#917878', lineHeight: 18 },
});

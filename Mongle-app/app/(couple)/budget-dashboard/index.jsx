import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PDFService } from '../../../lib/services/pdf/PDFService';
import { projectsApi, budgetsApi } from '../../../lib/api';
import { formatNumber } from '../../../lib/utils';

export default function BudgetDashboard() {
  const [saving, setSaving] = React.useState(false);

  // 1. Fetch Current Project
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const activeProject = projects[0];

  // 2. Fetch Budget for the Project
  const { data: budgetResponse, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', activeProject?.id],
    queryFn: () => budgetsApi.getBudgets(activeProject.id),
    enabled: !!activeProject?.id,
  });

  const budgetData = budgetResponse?.[0] || null;

  // 3. Fetch Budget Items for PDF
  const { data: costItems = [] } = useQuery({
    queryKey: ['budgetItems', budgetData?.id],
    queryFn: () => budgetsApi.getBudgetItems(budgetData.id),
    enabled: !!budgetData?.id,
  });

  const handleSaveBudgetPDF = async () => {
    if (!budgetData) {
      Alert.alert('알림', '등록된 예산 정보가 없습니다.');
      return;
    }

    setSaving(true);
    
    const pdfData = {
      projectName: activeProject.title || "민지 & 하준의 결혼준비",
      weddingDate: "날짜 미정", // Could be from project/wedding table
      totalBudget: (budgetData.total_amount || 0) * 10000,
      spentAmount: (budgetData.spent || 0) * 10000,
      remainingBudget: (budgetData.total_amount - budgetData.spent) * 10000,
      categories: costItems
        .filter(item => item.label || item.value)
        .map(item => ({
          title: item.label || '기타',
          budget: (parseInt(item.value) || 0) * 10000,
          spent: (parseInt(item.spent || item.value) || 0) * 10000
        }))
    };

    const result = await PDFService.saveBudgetSummary(pdfData);
    setSaving(false);

    if (result.success) {
      Alert.alert('성공', '예산 명세서가 PDF로 생성되었습니다. 공유가 가능합니다.');
    } else {
      Alert.alert('오류', 'PDF 생성 중 문제가 발생했습니다.');
    }
  };

  const menuItems = [
    {
      id: 'compare',
      title: '업체 견적 비교',
      desc: '2~3개 견적서를 불러와 항목별로 비교해보세요.',
      icon: 'git-compare-outline',
      color: '#917878',
      route: '/(couple)/estimate-comparison'
    },
    {
      id: 'save_pdf',
      title: '예산 명세서 PDF 저장',
      desc: '현재까지의 예산 현황을 문서로 깔끔하게 정리합니다.',
      icon: 'document-text-outline',
      color: '#c9a98e',
      action: handleSaveBudgetPDF
    },
    {
      id: 'history',
      title: 'PDF 생성 이력',
      desc: '최근에 생성하고 공유한 문서 목록을 확인하세요.',
      icon: 'time-outline',
      color: '#B9B4B4',
      route: '/(couple)/pdf-history'
    }
  ];

  const isLoading = projectsLoading || budgetLoading;

  if (saving) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#C9716A" />
        <Text style={{ marginTop: 20, fontWeight: 'bold', color: '#2C2420' }}>명세서 생성 중...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
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
        <Text style={styles.headerTitle}>예산 & 견적 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.summaryLabel}>나의 총 예산</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalBudget)}만원</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.summaryLabel}>사용 금액</Text>
            <Text style={[styles.summaryValue, { color: '#C9716A' }]}>{formatNumber(spentAmount)}만원</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>스마트 도구</Text>
        
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuCard}
            onPress={() => item.action ? item.action() : item.route ? router.push(item.route) : null}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.color + '20' }]}>
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
            '비용 관리' 화면에서 입력하신 예산과 지출 내역이 실시간으로 여기에 반영됩니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4'
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
    borderColor: '#e8ddd8'
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
    elevation: 2
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
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
    borderColor: '#fdecec'
  },
  tipText: { flex: 1, fontSize: 13, color: '#917878', lineHeight: 18 }
});

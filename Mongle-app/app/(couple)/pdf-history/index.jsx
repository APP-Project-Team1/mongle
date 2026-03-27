import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { PDFService } from '../../../lib/services/pdf/PDFService';
import { HistoryService } from '../../../lib/services/history/HistoryService';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0e8e4' 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#3a2e2a' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  list: { padding: 20 },
  historyItem: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f0e8e4' 
  },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  info: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#3a2e2a', marginBottom: 4 },
  fileMeta: { fontSize: 12, color: '#8a7870' },
  shareBtn: { padding: 8 },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#B9B4B4' }
});

export default function PDFHistoryScreen() {
  const [historyData, setHistoryData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = await HistoryService.getHistory();
    setHistoryData(data);
  };

  const handleShare = async (item) => {
    try {
      if (item.type === '예산 명세서') {
        const dummyBudget = {
          totalBudget: 35000000,
          spent: 28400000,
          items: [
            { category: '웨딩홀', amount: 15000000 },
            { category: '스드메', amount: 8400000 },
          ]
        };
        await PDFService.saveBudgetSummary(dummyBudget);
      } else {
        const dummyAnalysis = {
          items: [
            { vendorName: '모던 스튜디오', totalPrice: 2200000, realCost: 2200000, optionsPrice: 0, discountPrice: 0, vatIncluded: true },
            { vendorName: '클래식 포토', totalPrice: 2500000, realCost: 2300000, optionsPrice: 300000, discountPrice: 500000, vatIncluded: false },
          ],
          summary: { cheapest: { vendorName: '모던 스튜디오' }, bestValue: { vendorName: '모던 스튜디오' } },
          insights: []
        };
        await PDFService.saveComparisonReport(dummyAnalysis);
      }
    } catch (error) {
      Alert.alert('오류', 'PDF를 준비하는 중 문제가 발생했습니다.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.iconBox}>
        <Ionicons name="document-text" size={24} color="#FF6B6B" />
      </View>
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fileMeta}>{item.date} | {item.type}</Text>
      </View>
      <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item)}>
        <Ionicons name="share-social-outline" size={20} color="#917878" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF 생성 이력</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={historyData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>저장된 PDF 이력이 없습니다.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

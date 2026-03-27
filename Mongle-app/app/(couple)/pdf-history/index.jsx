import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PDFHistoryScreen() {
  const historyData = [
    { id: '1', name: 'wedding-budget-2026-03-27.pdf', date: '2026.03.27 10:30', type: '예산 명세서' },
    { id: '2', name: 'estimation-comparison-2026-03-26.pdf', date: '2026.03.26 14:15', type: '견적 비교서' },
    { id: '3', name: 'wedding-budget-2026-03-20.pdf', date: '2026.03.20 18:40', type: '예산 명세서' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.iconBox}>
        <Ionicons name="document-text" size={24} color="#FF6B6B" />
      </View>
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fileMeta}>{item.date} | {item.type}</Text>
      </View>
      <TouchableOpacity style={styles.shareBtn}>
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

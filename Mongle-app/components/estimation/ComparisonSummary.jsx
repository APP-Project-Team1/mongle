import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Summary cards for the comparison screen
 */
export const ComparisonSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SummaryItem 
          label="최저가 업체" 
          value={summary.cheapest.vendorName} 
          icon="pricetag-outline" 
          color="#27AE60" 
        />
        <SummaryItem 
          label="가성비 추천" 
          value={summary.bestValue.vendorName} 
          icon="thumbs-up-outline" 
          color="#6C5CE7" 
        />
      </View>
      <View style={[styles.row, { marginTop: 12 }]}>
        <SummaryItem 
          label="추가금 위험" 
          value={summary.highestRisk.vendorName} 
          icon="alert-circle-outline" 
          color="#E67E22" 
        />
        <SummaryItem 
          label="예산 상태" 
          value={summary.budgetStatus === 'OK' ? '예산 내 적합' : '예산 초과 주의'} 
          icon="wallet-outline" 
          color={summary.budgetStatus === 'OK' ? '#27AE60' : '#E74C3C'} 
        />
      </View>
    </View>
  );
};

const SummaryItem = ({ label, value, icon, color }) => (
  <View style={styles.item}>
    <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: color }]} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  item: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4'
  },
  iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  label: { fontSize: 11, color: '#8a7870', marginBottom: 2 },
  value: { fontSize: 13, fontWeight: '700' }
});

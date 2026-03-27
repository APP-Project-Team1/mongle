import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

/**
 * Reusable Comparison Table
 */
export const ComparisonTable = ({ items }) => {
  const rows = [
    { key: 'productName', label: '상품명' },
    { key: 'realCost', label: '실지불 예상가', isPrice: true },
    { key: 'totalPrice', label: '기본 견적가', isPrice: true },
    { key: 'optionsPrice', label: '옵션 비용', isPrice: true },
    { key: 'discountPrice', label: '할인 금액', isPrice: true },
    { key: 'vatIncluded', label: 'VAT 포함', isBool: true },
    { key: 'capacity', label: '기준 인원' },
    { key: 'duration', label: '이용 시간' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>상세 항목 비교</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.tableRow}>
            <View style={styles.headerLabelCell}>
              <Text style={styles.headerText}>구분</Text>
            </View>
            {items.map(item => (
              <View key={item.id} style={styles.headerValueCell}>
                <Text style={styles.vendorNameText} numberOfLines={1}>{item.vendorName}</Text>
              </View>
            ))}
          </View>

          {/* Body */}
          {rows.map(row => (
            <View key={row.key} style={styles.tableRow}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>{row.label}</Text>
              </View>
              {items.map(item => {
                let value = item[row.key];
                if (row.isPrice) value = value.toLocaleString() + '원';
                if (row.isBool) value = value ? '포함' : '별도';

                const isHighlight = row.key === 'realCost' && item.realCost === Math.min(...items.map(i => i.realCost));

                return (
                  <View key={item.id} style={[styles.valueCell, isHighlight && styles.highlightCell]}>
                    <Text style={[styles.valueText, isHighlight && styles.highlightText]}>{value}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 30 },
  title: { fontSize: 16, fontWeight: '700', color: '#3a2e2a', marginBottom: 12 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0e8e4' },
  headerLabelCell: { width: 100, padding: 12, backgroundColor: '#faf5f2' },
  headerValueCell: { width: 140, padding: 12, backgroundColor: '#faf5f2', alignItems: 'center' },
  labelCell: { width: 100, padding: 12, backgroundColor: '#fff' },
  valueCell: { width: 140, padding: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerText: { fontSize: 12, fontWeight: '700', color: '#8a7870' },
  vendorNameText: { fontSize: 13, fontWeight: '700', color: '#3a2e2a' },
  labelText: { fontSize: 12, color: '#8a7870' },
  valueText: { fontSize: 13, color: '#3a2e2a' },
  highlightCell: { backgroundColor: '#fff9f5' },
  highlightText: { color: '#FF6B6B', fontWeight: 'bold' }
});

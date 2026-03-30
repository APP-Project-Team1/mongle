import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const SECTION_ROWS = [
  {
    section: '💰 비용',
    rows: [
      { key: 'productName', label: '상품명' },
      { key: 'realCost', label: '실지불 예상가', isPrice: true, isHighlightMin: true },
      { key: 'totalPrice', label: '기본 견적가', isPrice: true },
      { key: 'rentalFee', label: '대관료', isPrice: true },
      { key: 'totalFoodPrice', label: '식음료 총액', isPrice: true },
      { key: 'decorationPrice', label: '데코레이션', isPrice: true },
      { key: 'optionsPrice', label: '추가 옵션', isPrice: true },
      { key: 'discountPrice', label: '할인 금액', isPrice: true },
      { key: 'deposit', label: '계약금', isPrice: true },
    ]
  },
  {
    section: '👥 인원 및 조건',
    rows: [
      { key: 'guaranteedCapacity', label: '보증인원', isNumber: true, unit: '명' },
      { key: 'minCapacity', label: '최소인원', isNumber: true, unit: '명' },
      { key: 'capacity', label: '수용인원', isNumber: true, unit: '명' },
      { key: 'foodPricePerPerson', label: '1인 식대', isPrice: true },
      { key: 'hallName', label: '홀 이름' },
      { key: 'duration', label: '이용 시간' },
    ]
  },
  {
    section: '📋 세금 및 정책',
    rows: [
      { key: 'vatIncluded', label: 'VAT 포함', isBool: true },
      { key: 'serviceChargePercent', label: '봉사료', isNumber: true, unit: '%', zeroLabel: '없음' },
      { key: 'refundPolicy', label: '환불 정책', isLong: true },
    ]
  },
  {
    section: '📝 포함/불포함 항목',
    rows: [
      { key: 'includedItems', label: '포함 항목', isList: true },
      { key: 'excludedItems', label: '불포함 항목', isList: true },
    ]
  },
];

/**
 * Reusable Comparison Table
 */
export const ComparisonTable = ({ items }) => {
  const minRealCost = Math.min(...items.map(i => i.realCost));

  const renderCell = (item, row) => {
    let value = item[row.key];

    if (row.isList) {
      const list = Array.isArray(value) && value.length > 0 ? value : null;
      return (
        <View key={item.id} style={[styles.valueCell, styles.listCell]}>
          {list
            ? list.map((v, i) => (
                <Text key={i} style={styles.listItemText}>• {v}</Text>
              ))
            : <Text style={styles.emptyText}>-</Text>}
        </View>
      );
    }

    if (row.isLong) {
      return (
        <View key={item.id} style={[styles.valueCell, styles.listCell]}>
          <Text style={styles.valueText}>{value || '-'}</Text>
        </View>
      );
    }

    const isHighlight = row.isHighlightMin && item.realCost === minRealCost;

    if (row.isPrice) {
      const num = Number(value);
      value = num > 0 ? num.toLocaleString() + '원' : '-';
    } else if (row.isBool) {
      value = value ? '포함' : '별도';
    } else if (row.isNumber) {
      const num = Number(value);
      value = num > 0 ? `${num.toLocaleString()}${row.unit || ''}` : (row.zeroLabel || '-');
    } else {
      value = value || '-';
    }

    return (
      <View key={item.id} style={[styles.valueCell, isHighlight && styles.highlightCell]}>
        <Text style={[styles.valueText, isHighlight && styles.highlightText]}>{value}</Text>
      </View>
    );
  };

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

          {SECTION_ROWS.map(section => (
            <View key={section.section}>
              {/* Section header */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderText}>{section.section}</Text>
              </View>

              {section.rows.map(row => {
                const hasData = items.some(item => {
                  const v = item[row.key];
                  if (row.isList) return Array.isArray(v) && v.length > 0;
                  if (row.isPrice || row.isNumber) return Number(v) > 0;
                  return !!v;
                });
                if (!hasData) return null;

                return (
                  <View key={row.key} style={styles.tableRow}>
                    <View style={styles.labelCell}>
                      <Text style={styles.labelText}>{row.label}</Text>
                    </View>
                    {items.map(item => renderCell(item, row))}
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
  sectionHeaderRow: {
    backgroundColor: '#faf5f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4',
  },
  sectionHeaderText: { fontSize: 12, fontWeight: '700', color: '#917878' },
  headerLabelCell: { width: 110, padding: 12, backgroundColor: '#f5eeea' },
  headerValueCell: { width: 150, padding: 12, backgroundColor: '#f5eeea', alignItems: 'center' },
  labelCell: { width: 110, padding: 12, backgroundColor: '#fff' },
  valueCell: { width: 150, padding: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  listCell: { alignItems: 'flex-start', justifyContent: 'flex-start' },
  headerText: { fontSize: 12, fontWeight: '700', color: '#8a7870' },
  vendorNameText: { fontSize: 13, fontWeight: '700', color: '#3a2e2a' },
  labelText: { fontSize: 12, color: '#8a7870' },
  valueText: { fontSize: 13, color: '#3a2e2a' },
  listItemText: { fontSize: 12, color: '#3a2e2a', lineHeight: 20 },
  emptyText: { fontSize: 13, color: '#ccc' },
  highlightCell: { backgroundColor: '#fff9f5' },
  highlightText: { color: '#FF6B6B', fontWeight: 'bold' },
});

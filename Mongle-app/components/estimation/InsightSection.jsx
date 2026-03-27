import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Pros, Cons, and Questions section for each vendor
 */
export const InsightSection = ({ insights }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>업체별 심층 분석</Text>
      {insights.map((insight, idx) => (
        <View key={insight.vendorName} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.indexCircle}><Text style={styles.indexText}>{idx + 1}</Text></View>
            <Text style={styles.vendorName}>{insight.vendorName}</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ 장점</Text>
              {insight.pros.map((pro, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
                  <Text style={styles.listText}>{pro}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ 보완/주의</Text>
              {insight.cons.map((con, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="alert-circle" size={14} color="#E67E22" />
                  <Text style={styles.listText}>{con}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.section, { borderBottomWidth: 0 }]}>
              <Text style={styles.sectionTitle}>💬 꼭 확인해볼 질문</Text>
              {insight.questions.map((q, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="chatbox-ellipses-outline" size={14} color="#917878" />
                  <Text style={styles.listText}>{q}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 30 },
  title: { fontSize: 16, fontWeight: '700', color: '#3a2e2a', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0e8e4' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  indexCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#c9a98e', justifyContent: 'center', alignItems: 'center' },
  indexText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  vendorName: { fontSize: 16, fontWeight: '700', color: '#3a2e2a' },
  content: { gap: 12 },
  section: { borderBottomWidth: 1, borderBottomColor: '#f8f9fa', paddingBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8a7870', marginBottom: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  listText: { fontSize: 13, color: '#3a2e2a', flex: 1 }
});

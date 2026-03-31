import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';

import { EstimationParser } from '../../../lib/services/estimation/EstimationParser';
import { ComparisonEngine } from '../../../lib/services/estimation/ComparisonEngine';
import { PDFService } from '../../../lib/services/pdf/PDFService';
import { ComparisonSummary } from '../../../components/estimation/ComparisonSummary';
import { ComparisonTable } from '../../../components/estimation/ComparisonTable';
import { InsightSection } from '../../../components/estimation/InsightSection';
import { useAuth } from '../../../context/AuthContext';
import { fetchCoupleBudgetBundle } from '../../../lib/coupleBudgetData';
import { resolveCoupleContext } from '../../../lib/coupleIdentity';

export default function EstimateComparisonScreen() {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const { couple_id, session } = useAuth();
  const [effectiveCoupleId, setEffectiveCoupleId] = useState(couple_id ?? null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const userId = session?.user?.id;
      if (!userId) return;
      try {
        const resolved = await resolveCoupleContext(userId, couple_id ?? null);
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

  const { data } = useQuery({
    queryKey: ['couple-budget-bundle', effectiveCoupleId],
    queryFn: () => fetchCoupleBudgetBundle(effectiveCoupleId),
    enabled: !!effectiveCoupleId,
  });

  const budgetData = data?.budget || null;
  const userBudget = (budgetData?.total_amount || 3500) * 10000;

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        if (result.assets.length < 2) {
          Alert.alert('알림', '비교를 위해 최소 2개 이상의 파일을 선택해 주세요.');
          return;
        }
        if (result.assets.length > 3) {
          Alert.alert('알림', '최대 3개까지 비교 가능합니다.');
          return;
        }

        setSelectedFiles(result.assets);
        runAnalysis(result.assets);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '파일을 불러오는 중 문제가 발생했습니다.');
    }
  };

  const handlePickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 1,
      });

      if (!result.canceled) {
        if (result.assets.length < 2) {
          Alert.alert('알림', '비교를 위해 최소 2개 이상의 사진을 선택해 주세요.');
          return;
        }

        const assets = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}.jpg`,
          type: 'image',
        }));

        setSelectedFiles(assets);
        runAnalysis(assets);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '사진을 불러오는 중 문제가 발생했습니다.');
    }
  };

  const runAnalysis = async (files) => {
    setLoading(true);
    try {
      const parsedItems = await EstimationParser.parseFiles(files);
      const analysis = ComparisonEngine.analyze(parsedItems, userBudget);
      setAnalysisResult(analysis);
    } catch (err) {
      Alert.alert('분석 실패', '파일 분석에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analysisResult) return;
    setLoading(true);
    const res = await PDFService.saveComparisonReport(analysisResult);
    setLoading(false);
    if (!res.success) {
      Alert.alert('실패', 'PDF 생성 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9716A" />
        <Text style={styles.loadingText}>견적 분석 중...</Text>
        <Text style={styles.loadingSub}>예산 기준으로 견적서를 비교하고 있습니다.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>업체 견적 비교</Text>
        <TouchableOpacity
          onPress={handleExportPDF}
          disabled={!analysisResult}
          style={[styles.exportBtn, !analysisResult && { opacity: 0.3 }]}
        >
          <Ionicons name="share-outline" size={20} color="#C9716A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!analysisResult ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="camera-outline" size={32} color="#DDD" style={{ marginBottom: -10 }} />
              <Ionicons name="document-outline" size={50} color="#DDD" />
            </View>
            <Text style={styles.emptyTitle}>비교할 견적서를 불러오세요.</Text>
            <Text style={styles.emptyDesc}>
              PDF 파일 또는 사진 2~3개를 선택하면 현재 예산 기준으로 비교 분석합니다.
            </Text>

            <View style={styles.pickOptions}>
              <TouchableOpacity style={styles.pickBtn} onPress={handlePickFiles}>
                <Ionicons name="document-text-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.pickBtnText}>PDF 선택</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.pickBtn, { backgroundColor: '#917878' }]} onPress={handlePickPhotos}>
                <Ionicons name="images-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.pickBtnText}>사진 선택</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={16} color="#B8A9A5" />
              <Text style={styles.tipText}>
                현재 예산 기준값: {(userBudget / 10000).toLocaleString()}만원
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.fileList}>
              <Text style={styles.sectionLabel}>비교 대상 ({selectedFiles.length})</Text>
              <View style={styles.filePills}>
                {selectedFiles.map((f) => (
                  <View key={f.name} style={styles.filePill}>
                    <Ionicons
                      name={f.type === 'image' ? 'image' : 'document-text'}
                      size={12}
                      color="#917878"
                    />
                    <Text style={styles.filePillText} numberOfLines={1}>
                      {f.name}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.rePickBtn}
                  onPress={() => {
                    setSelectedFiles([]);
                    setAnalysisResult(null);
                  }}
                >
                  <Text style={styles.rePickText}>다시 선택</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ComparisonSummary summary={analysisResult.summary} />
            <ComparisonTable items={analysisResult.items} />
            <InsightSection insights={analysisResult.insights} />

            <View style={styles.confBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#27AE60" />
              <Text style={styles.confText}>현재 Supabase 예산을 기준으로 비교했습니다.</Text>
            </View>
          </>
        )}
      </ScrollView>

      {analysisResult && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.mainSaveBtn} onPress={handleExportPDF}>
            <Text style={styles.mainSaveBtnText}>비교 결과 PDF 저장</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 40 },
  loadingText: { fontSize: 18, fontWeight: '700', color: '#3a2e2a', marginTop: 20 },
  loadingSub: { fontSize: 13, color: '#8a7870', textAlign: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#3a2e2a' },
  exportBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 110 },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyIconWrap: { marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#3a2e2a', marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: '#8a7870', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  pickOptions: { width: '100%', gap: 12 },
  pickBtn: {
    backgroundColor: '#C9716A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  pickBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  tipBox: {
    marginTop: 18,
    backgroundColor: '#fff9f5',
    borderWidth: 1,
    borderColor: '#f3e5dd',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  tipText: { flex: 1, fontSize: 13, color: '#8a7870', lineHeight: 18 },
  fileList: { marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#3a2e2a', marginBottom: 10 },
  filePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filePill: {
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filePillText: { maxWidth: 160, fontSize: 12, color: '#6d5d58' },
  rePickBtn: { justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  rePickText: { color: '#C9716A', fontWeight: '700', fontSize: 12 },
  confBox: {
    marginTop: 16,
    backgroundColor: '#F4FCF6',
    borderWidth: 1,
    borderColor: '#DBF3E1',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confText: { color: '#2A7A48', fontSize: 13, flex: 1 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0e8e4',
  },
  mainSaveBtn: {
    backgroundColor: '#C9716A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  mainSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

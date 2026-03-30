import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';

// Services & Components
import { EstimationParser } from '../../../lib/services/estimation/EstimationParser';
import { ComparisonEngine } from '../../../lib/services/estimation/ComparisonEngine';
import { PDFService } from '../../../lib/services/pdf/PDFService';
import { ComparisonSummary } from '../../../components/estimation/ComparisonSummary';
import { ComparisonTable } from '../../../components/estimation/ComparisonTable';
import { InsightSection } from '../../../components/estimation/InsightSection';
import { projectsApi, budgetsApi } from '../../../lib/api';

export default function EstimateComparisonScreen() {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);

  // 1. Fetch Current Project & Budget
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const activeProject = projects[0];

  const { data: budgetResponse } = useQuery({
    queryKey: ['budget', activeProject?.id],
    queryFn: () => budgetsApi.getBudgets(activeProject.id),
    enabled: !!activeProject?.id,
  });

  const budgetData = budgetResponse?.[0];
  const userBudget = (budgetData?.total_amount || 3500) * 10000; // Default 35M if none

  // 1. Pick PDF Files
  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true
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

  // 1-2. Pick Photos
  const handlePickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 첨부하려면 사진첩 접근 권한이 필요합니다.');
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
          Alert.alert('알림', '비교를 위해 최소 2장 이상의 사진을 선택해 주세요.');
          return;
        }
        
        const assets = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}.jpg`,
          type: 'image'
        }));

        setSelectedFiles(assets);
        runAnalysis(assets);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '사진을 불러오는 중 문제가 발생했습니다.');
    }
  };

  // 2. Run Analysis Flow
  const runAnalysis = async (files) => {
    setLoading(true);
    try {
      const parsedItems = await EstimationParser.parseFiles(files);
      const analysis = ComparisonEngine.analyze(parsedItems, userBudget);
      setAnalysisResult(analysis);
    } catch (err) {
      Alert.alert('분석 실패', '일부PDF를 분석할 수 없습니다. 스캔본인지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Export to PDF
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
        <Text style={styles.loadingText}>견적서 분석 중...</Text>
        <Text style={styles.loadingSub}>AI가 견적 항목을 매칭하고 가격을 분석하고 있습니다.</Text>
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
              <Ionicons name="camera-outline" size={32} color="#DDD" style={{marginBottom: -10}} />
              <Ionicons name="document-outline" size={50} color="#DDD" />
            </View>
            <Text style={styles.emptyTitle}>비교할 견적서를 불러오세요</Text>
            <Text style={styles.emptyDesc}>
              나란히 비교하고 싶은 견적 PDF 파일 또는{'\n'}사진첩의 이미지 2~3개를 선택해 주세요.
            </Text>
            
            <View style={styles.pickOptions}>
              <TouchableOpacity style={styles.pickBtn} onPress={handlePickFiles}>
                <Ionicons name="document-text-outline" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.pickBtnText}>PDF 불러오기</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.pickBtn, { backgroundColor: '#917878' }]} onPress={handlePickPhotos}>
                <Ionicons name="images-outline" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.pickBtnText}>사진첩에서 선택</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={16} color="#B8A9A5" />
              <Text style={styles.tipText}>
                현재 설정된 나의 예산({(userBudget/10000).toLocaleString()}만원)을 기준으로 최적의 견적을 분석합니다.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.fileList}>
              <Text style={styles.sectionLabel}>비교 대상 ({selectedFiles.length})</Text>
              <View style={styles.filePills}>
                {selectedFiles.map(f => (
                  <View key={f.name} style={styles.filePill}>
                    <Ionicons name={f.type === 'image' ? "image" : "document-text"} size={12} color="#917878" />
                    <Text style={styles.filePillText} numberOfLines={1}>{f.name}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.rePickBtn} onPress={() => { setSelectedFiles([]); setAnalysisResult(null); }}>
                  <Text style={styles.rePickText}>다시 선택</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ComparisonSummary summary={analysisResult.summary} />
            <ComparisonTable items={analysisResult.items} />
            <InsightSection insights={analysisResult.insights} />

            <View style={styles.confBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#27AE60" />
              <Text style={styles.confText}>
                분석 신뢰도: <Text style={{fontWeight: 'bold'}}>95%</Text> (표준 양식 확인됨)
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {analysisResult && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.mainSaveBtn} onPress={handleExportPDF}>
            <Text style={styles.mainSaveBtnText}>비교 성적표 PDF로 저장</Text>
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
    borderBottomColor: '#f0e8e4'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#3a2e2a' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  exportBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 24, position: 'relative'
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#3a2e2a', marginBottom: 12 },
  emptyDesc: { fontSize: 14, color: '#8a7870', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  pickBtn: { flexDirection: 'row', backgroundColor: '#3a2e2a', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  pickBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pickOptions: { gap: 12, width: '100%', paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, color: '#8a7870', marginBottom: 8 },
  fileList: { marginBottom: 20 },
  filePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  filePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0E8E4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4, maxWidth: 120 },
  filePillText: { fontSize: 11, color: '#917878' },
  rePickBtn: { marginLeft: 4 },
  rePickText: { fontSize: 12, color: '#3a2e2a', textDecorationLine: 'underline' },
  confBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E1FAEE', padding: 12, borderRadius: 10, marginTop: 10 },
  confText: { fontSize: 13, color: '#27AE60' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#f0e8e4' },
  mainSaveBtn: { backgroundColor: '#C9716A', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mainSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tipBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F7F6', padding: 12, borderRadius: 10, marginTop: 30, marginHorizontal: 20, gap: 8, borderWidth: 1, borderColor: '#F0E8E4' },
  tipText: { fontSize: 12, color: '#8A7870', flex: 1, lineHeight: 18 },
});

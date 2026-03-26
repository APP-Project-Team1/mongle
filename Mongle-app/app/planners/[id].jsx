import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  BackHandler,
} from 'react-native';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import plannersData from './planners.json';

export default function PlannerDetailScreen() {
  const { id } = useLocalSearchParams();
  const selectedPlanner = plannersData.find(p => p.name === id);

  useEffect(() => {
    const handleBackPress = () => {
      router.replace('/(couple)');
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, []);

  if (!selectedPlanner) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>플래너를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderBottomTab = () => (
    <View style={tabStyles.container}>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)')}>
        <Ionicons name="home-outline" size={24} color="#c9a98e" />
        <Text style={[tabStyles.tabText, { color: '#c9a98e' }]}>홈</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)/timeline')}>
        <Ionicons name="calendar-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>일정</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)/chat')}>
        <Ionicons name="chatbubble-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>채팅</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.push('/(auth)/login')}>
        <Ionicons name="person-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>마이</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => router.replace('/(couple)')} style={styles.backBtnWrapper}>
          <Ionicons name="chevron-back" size={26} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>플래너 프로필</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Main Info */}
        <View style={styles.detailMainInfo}>
          <Image source={{ uri: selectedPlanner.profile_image_url }} style={styles.detailProfileImage} />
          <View style={styles.detailMainText}>
            <Text style={styles.detailBrand}>{selectedPlanner.brand_name}</Text>
            <Text style={styles.detailName}>{selectedPlanner.name} {selectedPlanner.title}</Text>
            <View style={styles.detailRatingRow}>
              <Ionicons name="star" size={14} color="#f0b452" />
              <Text style={styles.detailRatingText}>{selectedPlanner.rating} ({selectedPlanner.reviews?.length || 0})</Text>
            </View>
          </View>
        </View>

        <Text style={styles.detailOneLiner}>"{selectedPlanner.one_liner}"</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>총 경력</Text>
            <Text style={styles.statValue}>{selectedPlanner.career_years}년</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>전문 지역</Text>
            <Text style={styles.statValue}>{selectedPlanner.activity_regions.join(', ')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>성공적인 진행</Text>
            <Text style={styles.statValue}>{selectedPlanner.weddings_completed}건+</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {selectedPlanner.specialties.map((s) => (
            <View key={s} style={styles.tagBadge}>
              <Text style={styles.tagText}>#{s}</Text>
            </View>
          ))}
          {selectedPlanner.style_keywords.map((k) => (
            <View key={k} style={[styles.tagBadge, styles.tagBadgeStyle]}>
              <Text style={[styles.tagText, styles.tagTextStyle]}>#{k}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Base Price */}
        <Text style={styles.sectionTitle}>플래닝 예상 견적</Text>
        <View style={styles.priceWrap}>
          <Text style={styles.priceLabel}>스타터 패키지 기준</Text>
          <Text style={styles.priceText}>{selectedPlanner.base_price_krw.toLocaleString()}원</Text>
        </View>

        <View style={styles.divider} />

        {/* Service Core */}
        <Text style={styles.sectionTitle}>제공 서비스</Text>
        <View style={styles.servicesGrid}>
          {selectedPlanner.service_scope.included.map((item, i) => (
            <View key={i} style={styles.serviceItem}>
              <Ionicons name="checkmark-circle" size={16} color="#c9a98e" />
              <Text style={styles.serviceItemText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>주요 경력 & 특징</Text>
        {selectedPlanner.major_experiences.map((exp, i) => (
          <Text key={`exp-${i}`} style={styles.bulletText}>• {exp}</Text>
        ))}
        {selectedPlanner.service_features.map((feat, i) => (
          <Text key={`feat-${i}`} style={styles.bulletText}>• {feat}</Text>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>포트폴리오 스냅</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
          {selectedPlanner.portfolio_images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.portfolioImage} />
          ))}
        </ScrollView>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.ctaBottom}>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>{selectedPlanner.cta}</Text>
        </TouchableOpacity>
      </View>

      {renderBottomTab()}
    </SafeAreaView>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopColor: '#f0e8e4',
    borderTopWidth: 1,
    height: Platform.OS === 'android' ? 65 : 60,
    paddingBottom: Platform.OS === 'android' ? 12 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8a7870',
    marginTop: 2,
    marginBottom: Platform.OS === 'android' ? 4 : 0,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8a7870',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#c9a98e',
    fontWeight: 'bold',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4',
  },
  backBtnWrapper: {
    padding: 5,
    marginLeft: -5,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a2e2a',
  },
  detailContent: {
    flex: 1,
  },
  detailMainInfo: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
  },
  detailProfileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  detailMainText: {
    marginLeft: 20,
    justifyContent: 'center',
  },
  detailBrand: {
    fontSize: 13,
    color: '#c9a98e',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3a2e2a',
    marginBottom: 6,
  },
  detailRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
    marginLeft: 4,
  },
  detailOneLiner: {
    fontSize: 16,
    color: '#555050',
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#faf5f2',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8a7870',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3a2e2a',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e8ddd8',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  tagBadge: {
    borderWidth: 1,
    borderColor: '#c9a98e',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagBadgeStyle: {
    borderColor: '#8a7870',
  },
  tagText: {
    color: '#c9a98e',
    fontSize: 12,
  },
  tagTextStyle: {
    color: '#8a7870',
  },
  divider: {
    height: 8,
    backgroundColor: '#f6f3f0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a2e2a',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  priceWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#8a7870',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e87070',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '46%',
    gap: 6,
  },
  serviceItemText: {
    fontSize: 13,
    color: '#3a2e2a',
  },
  bulletText: {
    fontSize: 14,
    color: '#555050',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  portfolioScroll: {
    paddingLeft: 20,
  },
  portfolioImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f0f0',
  },
  ctaBottom: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0e8e4',
    backgroundColor: '#fff',
  },
  ctaButton: {
    backgroundColor: '#3a2e2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

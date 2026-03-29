import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Supabase 클라이언트 임포트
import { supabase } from '../../lib/supabase';

// 카테고리 ID와 Supabase 테이블 이름을 매칭하는 지도
const TABLE_MAP = {
  hall: 'hall_vendors',
  studio: 'studio_vendors',
  dress: 'dress_vendors',
  makeup: 'makeup_vendors',
  video_snap: 'video_snap_vendors',
  package: 'package_vendors',
};

const CATEGORIES = [
  { id: 'hall', label: '웨딩홀' },
  { id: 'studio', label: '스튜디오' },
  { id: 'dress', label: '드레스/한복' },
  { id: 'makeup', label: '메이크업' },
  { id: 'video_snap', label: '영상·스냅' },
  { id: 'package', label: '패키지' },
];

export default function VendorDetailScreen() {
  // 2. URL에서 id와 category를 받아옵니다.
  const { id, category } = useLocalSearchParams();

  // 3. 데이터를 저장할 상태(state) 선언
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorDetail();

    const handleBackPress = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(couple)');
      }
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [id, category]); // id나 category가 바뀔 때마다 실행

  // 4. Supabase에서 데이터를 가져오는 함수
  const fetchVendorDetail = async () => {
    try {
      setLoading(true);

      // 전달받은 category가 있으면 해당 테이블을 먼저 찾고, 없으면 hall부터 순서대로 찾습니다.
      let foundData = null;
      const tablesToSearch = category ? [TABLE_MAP[category]] : Object.values(TABLE_MAP);

      for (const tableName of tablesToSearch) {
        if (!tableName) continue;
        const { data } = await supabase
          .from(tableName)
          .select('*')
          .eq('vendor_id', id)
          .maybeSingle();

        if (data) {
          foundData = data;
          break;
        }
      }

      setSelectedVendor(foundData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPrice = (item) => {
    const category = item.basic_info?.category;
    const pricing = item.pricing;

    if (!pricing) return <Text style={styles.priceText}>가격 정보 없음</Text>;

    const formatMeal = (val) => `식대 ${(val / 10000).toLocaleString()}만원~`;
    const formatRental = (val) => `대관료 ${(val / 10000).toLocaleString()}만원~`;
    const formatRange = (min, max) => `${(min / 10000).toLocaleString()}~${(max / 10000).toLocaleString()}만원`;
    const formatMinOnly = (min) => `${(min / 10000).toLocaleString()}만원~`;

    try {
      switch (category) {
        case 'hall':
        case 'wedding_hall':
          return (
            <View>
              {pricing.meal_price_per_person && (
                <Text style={styles.priceTextSmall}>
                  {formatMeal(pricing.meal_price_per_person)}
                </Text>
              )}
              {pricing.rental_fee_base && (
                <Text style={styles.priceText}>
                  {formatRental(pricing.rental_fee_base)}
                </Text>
              )}
            </View>
          );
        case 'studio':
        case 'video_snap':
        case 'package':
          if (pricing.price_min && pricing.price_max) {
            return <Text style={styles.priceText}>{formatRange(pricing.price_min, pricing.price_max)}</Text>;
          } else if (pricing.price_min) {
            return <Text style={styles.priceText}>{formatMinOnly(pricing.price_min)}</Text>;
          }
          break;
        case 'dress':
          const dMin = pricing.rental_price_min || pricing.price_min || pricing.meal_price_per_person;
          const dMax = pricing.rental_price_max || pricing.price_max;
          if (dMin && dMax) {
            return <Text style={styles.priceText}>대여 {formatRange(dMin, dMax)}</Text>;
          } else if (dMin) {
            return <Text style={styles.priceText}>대여 {formatMinOnly(dMin)}</Text>;
          }
          break;
        case 'makeup':
          const mPrice = pricing.bride_hair_makeup_price || pricing.price_min || pricing.meal_price_per_person;
          if (mPrice) {
            return <Text style={styles.priceText}>신부 {formatMinOnly(mPrice)}</Text>;
          }
          break;
        default:
          if (pricing.meal_price_per_person && pricing.rental_fee_base) {
            return (
              <View>
                <Text style={styles.priceTextSmall}>{formatMeal(pricing.meal_price_per_person)}</Text>
                <Text style={styles.priceText}>{formatRental(pricing.rental_fee_base)}</Text>
              </View>
            );
          } else if (pricing.meal_price_per_person) {
            return <Text style={styles.priceText}>{formatMeal(pricing.meal_price_per_person)}</Text>;
          } else if (pricing.price_min && pricing.price_max) {
            return <Text style={styles.priceText}>{formatRange(pricing.price_min, pricing.price_max)}</Text>;
          } else if (pricing.price_min) {
            return <Text style={styles.priceText}>{formatMinOnly(pricing.price_min)}</Text>;
          }
      }
    } catch (e) {
      console.error('Price formatting error:', e);
    }

    return <Text style={styles.priceText}>가격 문의</Text>;
  };

  const renderDetailRow = (label, value) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{Array.isArray(value) ? value.join(', ') : value}</Text>
      </View>
    );
  };

  const renderBulletList = (title, items, color = '#3a2e2a') => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((item, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: color }]} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const handleCall = () => {
    const phoneNumber = selectedVendor?.basic_info?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      alert('업체 전화번호 정보가 없습니다.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.errorContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#c9a98e" />
        <Text style={{ marginTop: 10, color: '#8a7870' }}>데이터를 불러오는 중입니다...</Text>
      </View>
    );
  }

  // 2. 데이터가 없을 때 표시
  if (!selectedVendor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>업체를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderBottomTab = () => (
    <View style={tabStyles.container}>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)/timeline')}>
        <Ionicons name="calendar-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>일정</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)/budget')}>
        <Ionicons name="wallet-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>비용</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)')}>
        <Ionicons name="home-outline" size={24} color="#c9a98e" />
        <Text style={[tabStyles.tabText, { color: '#c9a98e' }]}>홈</Text>
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(couple)')}
          style={styles.backBtnWrapper}
        >
          <Ionicons name="chevron-back" size={26} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>업체 상세 정보</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: selectedVendor.content?.thumbnail_url?.startsWith('//') ? `https:${selectedVendor.content.thumbnail_url}` : (selectedVendor.content?.thumbnail_url || `https://picsum.photos/seed/${selectedVendor.basic_info.vendor_id}/800/500`) }}
          style={styles.detailMainImage}
        />

        <View style={styles.detailBody}>
          <View style={styles.detailTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailCategoryText}>{CATEGORIES.find(c => c.id === selectedVendor.basic_info.category)?.label}</Text>
              <Text style={styles.detailName}>{selectedVendor.basic_info.name}</Text>
            </View>
            {(selectedVendor.basic_info.rating || selectedVendor.content?.rating_info?.rating_avg) && (
              <View style={styles.detailRatingChip}>
                <Ionicons name="star" size={14} color="#f0b452" />
                <Text style={styles.detailRatingValue}>{selectedVendor.basic_info.rating || selectedVendor.content.rating_info.rating_avg}</Text>
              </View>
            )}
          </View>

          <Text style={styles.detailDescription}>{selectedVendor.content?.short_description}</Text>

          <View style={styles.tagRow}>
            {selectedVendor.content?.tags && selectedVendor.content.tags.map((s, idx) => (
              <View key={idx} style={styles.styleTag}>
                <Text style={styles.styleTagText}>#{s}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#8a7870" />
              <Text style={styles.infoText}>{selectedVendor.basic_info.address || selectedVendor.basic_info.region}</Text>
            </View>
            {selectedVendor.basic_info.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${selectedVendor.basic_info.phone}`)}>
                <Ionicons name="call-outline" size={20} color="#8a7870" />
                <Text style={[styles.infoText, { color: '#007AFF' }]}>{selectedVendor.basic_info.phone}</Text>
              </TouchableOpacity>
            )}
            {selectedVendor.basic_info.website_url && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(selectedVendor.basic_info.website_url)}>
                <Ionicons name="globe-outline" size={20} color="#8a7870" />
                <Text style={[styles.infoText, { color: '#007AFF' }]} numberOfLines={1}>{selectedVendor.basic_info.website_url}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.sectionTitle}>예상 가격대</Text>
            {renderPrice(selectedVendor)}
            <Text style={styles.priceSubText}>* {selectedVendor.pricing?.price_note || '실제 견적은 상담 내용에 따라 다를 수 있습니다.'}</Text>
          </View>

          {/* Detailed Info */}
          <View style={styles.divider} />
          <View style={styles.detailInfoSection}>
            <Text style={styles.sectionTitle}>상세 정보</Text>
            {renderDetailRow('홀 종류', selectedVendor.details?.hall_type)}
            {renderDetailRow('홀 개수', selectedVendor.details?.hall_count ? `${selectedVendor.details.hall_count}개` : null)}
            {renderDetailRow('예식 시간', selectedVendor.details?.ceremony_time_minutes ? `${selectedVendor.details.ceremony_time_minutes}분` : null)}
            {renderDetailRow('식사 형태', selectedVendor.details?.meal_type)}
            {renderDetailRow('식사 메모', selectedVendor.details?.meal_note)}
            {renderDetailRow('촬영 톤', selectedVendor.details?.shoot_tones)}
            {renderDetailRow('실내 촬영', selectedVendor.details?.indoor_shoot ? '가능' : null)}
            {renderDetailRow('실외 촬영', selectedVendor.details?.outdoor_shoot ? '가능' : null)}
            {renderDetailRow('드레스 스타일', selectedVendor.details?.dress_style)}
            {renderDetailRow('피팅 가능', selectedVendor.details?.fittings_available ? '가능' : null)}
          </View>

          {/* Specialties & Recommendations */}
          {renderBulletList('업체 특징', selectedVendor.details?.specialties, '#c9a98e')}
          {renderBulletList('추천 대상', selectedVendor.details?.recommended_for, '#8a7870')}

          {/* Review Summary */}
          <View style={styles.divider} />
          {renderBulletList('긍정적인 포인트', selectedVendor.content?.review_summary_positive, '#4CAF50')}
          {renderBulletList('주의할 포인트', selectedVendor.content?.review_summary_negative, '#F44336')}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.ctaBottom}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleCall}>
          <Text style={styles.ctaButtonText}>상담 예약하기</Text>
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
  detailMainImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f5f0f0',
  },
  detailBody: {
    padding: 24,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailCategoryText: {
    fontSize: 13,
    color: '#c9a98e',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3a2e2a',
  },
  detailRatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  detailRatingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d97706',
    marginLeft: 4,
  },
  detailDescription: {
    fontSize: 15,
    color: '#555050',
    lineHeight: 22,
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  styleTag: {
    backgroundColor: '#f6f3f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  styleTagText: {
    fontSize: 12,
    color: '#8a7870',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#faf5f2',
    borderRadius: 15,
    padding: 20,
    gap: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#3a2e2a',
    flex: 1,
  },
  priceSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a2e2a',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e87070',
    marginBottom: 4,
  },
  priceTextSmall: {
    fontSize: 14,
    color: '#8a7870',
    fontWeight: '500',
    marginBottom: 4,
  },
  priceSubText: {
    fontSize: 12,
    color: '#a09a98',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0e8e4',
    marginVertical: 20,
  },
  detailInfoSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f7f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8a7870',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#3a2e2a',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  listSection: {
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 14,
    color: '#555050',
    lineHeight: 20,
    flex: 1,
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

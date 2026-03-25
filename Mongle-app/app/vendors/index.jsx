import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  ScrollView,
  BackHandler,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import vendorsData from './vendors.json';

const CATEGORIES = [
  { id: 'hall', label: '웨딩홀', icon: 'business-outline', iconActive: 'business' },
  { id: 'studio', label: '스튜디오', icon: 'camera-outline', iconActive: 'camera' },
  { id: 'dress', label: '드레스/한복', icon: 'shirt-outline', iconActive: 'shirt' },
  { id: 'makeup', label: '메이크업', icon: 'color-palette-outline', iconActive: 'color-palette' },
];

export default function VendorsScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('hall');
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    const handleBackPress = () => {
      if (selectedVendor) {
        setSelectedVendor(null);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => {
      subscription.remove();
    };
  }, [selectedVendor]);

  const filteredVendors = useMemo(() => {
    return vendorsData.filter((vendor) => {
      const matchCategory = vendor.category === activeCategory;
      const matchSearch = vendor.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          (vendor.description && vendor.description.toLowerCase().includes(searchText.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [searchText, activeCategory]);

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

  if (selectedVendor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedVendor(null)} style={styles.backBtnWrapper}>
            <Ionicons name="chevron-back" size={26} color="#3a2e2a" />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>업체 상세 정보</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          <Image 
            source={{ uri: `https://picsum.photos/seed/${selectedVendor.kakao_id}/800/500` }} 
            style={styles.detailMainImage} 
          />
          
          <View style={styles.detailBody}>
            <View style={styles.detailTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCategoryText}>{CATEGORIES.find(c => c.id === selectedVendor.category)?.label}</Text>
                <Text style={styles.detailName}>{selectedVendor.name}</Text>
              </View>
              {selectedVendor.rating && (
                <View style={styles.detailRatingChip}>
                  <Ionicons name="star" size={14} color="#f0b452" />
                  <Text style={styles.detailRatingValue}>{selectedVendor.rating}</Text>
                </View>
              )}
            </View>

            <Text style={styles.detailDescription}>{selectedVendor.description}</Text>

            <View style={styles.tagRow}>
              {selectedVendor.style && selectedVendor.style.map((s, idx) => (
                <View key={idx} style={styles.styleTag}>
                  <Text style={styles.styleTagText}>#{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#8a7870" />
                <Text style={styles.infoText}>{selectedVendor.region}</Text>
              </View>
              {selectedVendor.phone && (
                <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${selectedVendor.phone}`)}>
                  <Ionicons name="call-outline" size={20} color="#8a7870" />
                  <Text style={[styles.infoText, { color: '#007AFF' }]}>{selectedVendor.phone}</Text>
                </TouchableOpacity>
              )}
              {selectedVendor.url && (
                <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(selectedVendor.url)}>
                  <Ionicons name="globe-outline" size={20} color="#8a7870" />
                  <Text style={[styles.infoText, { color: '#007AFF' }]} numberOfLines={1}>{selectedVendor.url}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.sectionTitle}>예상 가격대</Text>
              <Text style={styles.priceText}>
                {selectedVendor.price_min}만원 ~ {selectedVendor.price_max}만원
              </Text>
              <Text style={styles.priceSubText}>* 실제 견적은 상담 내용에 따라 다를 수 있습니다.</Text>
            </View>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.ctaBottom}>
          <TouchableOpacity style={styles.ctaButton} onPress={() => {}}>
            <Text style={styles.ctaButtonText}>상담 예약하기</Text>
          </TouchableOpacity>
        </View>

        {renderBottomTab()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrapper}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>준비 업체 찾기</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#B9B4B4" />
          <TextInput
            style={styles.searchInput}
            placeholder="업체명 또는 설명으로 검색"
            placeholderTextColor="#B9B4B4"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <View style={styles.categoryContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryBtn, activeCategory === cat.id && styles.categoryBtnActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Ionicons 
              name={activeCategory === cat.id ? cat.iconActive : cat.icon} 
              size={22} 
              color={activeCategory === cat.id ? "#fff" : "#8a7870"} 
            />
            <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.categoryLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.kakao_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.vendorCard} 
            onPress={() => setSelectedVendor(item)}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: `https://picsum.photos/seed/${item.kakao_id}/300/200` }} 
              style={styles.cardImg} 
            />
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.vendorName} numberOfLines={1}>{item.name}</Text>
                {item.rating && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#f0b452" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.vendorDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.vendorFooter}>
                <Text style={styles.vendorLocation}>{item.district || item.region.split(' ')[1]}</Text>
                <Text style={styles.vendorPrice}>{item.price_min}~{item.price_max}만원</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>해당하는 업체가 없습니다.</Text>
          </View>
        }
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backBtnWrapper: {
    padding: 5,
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3a2e2a',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3a2e2a',
    marginLeft: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '23%',
    paddingVertical: 10,
    backgroundColor: '#f6f3f0',
    borderRadius: 12,
  },
  categoryBtnActive: {
    backgroundColor: '#c9a98e',
  },
  categoryLabel: {
    fontSize: 10,
    color: '#8a7870',
    marginTop: 4,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  vendorCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0e8e4',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImg: {
    width: '100%',
    height: 150,
    backgroundColor: '#f5f0f0',
  },
  cardInfo: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3a2e2a',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  vendorDesc: {
    fontSize: 13,
    color: '#8a7870',
    lineHeight: 18,
    marginBottom: 12,
  },
  vendorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f9f7f5',
    paddingTop: 10,
  },
  vendorLocation: {
    fontSize: 12,
    color: '#a09a98',
  },
  vendorPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e87070',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#8a7870',
  },

  /* Detail View */
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
  priceSubText: {
    fontSize: 12,
    color: '#a09a98',
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

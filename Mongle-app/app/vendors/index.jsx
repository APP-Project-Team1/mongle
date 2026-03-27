import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
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

// Import New Vendor Data
import hallData from './data/hall.json';
import studioData from './data/studio.json';
import dressData from './data/dress.json';
import makeupData from './data/makeup.json';
import videoSnapData from './data/video_snap.json';
import packageData from './data/package.json';

const VENDOR_DATA_MAP = {
  hall: hallData,
  studio: studioData,
  dress: dressData,
  makeup: makeupData,
  video_snap: videoSnapData,
  package: packageData,
};

const CATEGORIES = [
  { id: 'hall', label: '웨딩홀', icon: 'business-outline', iconActive: 'business' },
  { id: 'studio', label: '스튜디오', icon: 'camera-outline', iconActive: 'camera' },
  { id: 'dress', label: '드레스/한복', icon: 'shirt-outline', iconActive: 'shirt' },
  { id: 'makeup', label: '메이크업', icon: 'color-palette-outline', iconActive: 'color-palette' },
  { id: 'video_snap', label: '영상·스냅', icon: 'videocam-outline', iconActive: 'videocam' },
  { id: 'package', label: '패키지', icon: 'cube-outline', iconActive: 'cube' },
];

const FILTER_KEYS = [
  { id: 'location', label: '지역' },
  { id: 'style', label: '스타일' },
  { id: 'price', label: '가격대' },
];

const PRICE_RANGES = [
  { label: '~100만원', min: 0, max: 1000000 },
  { label: '100~200만원', min: 1000000, max: 2000000 },
  { label: '200~300만원', min: 2000000, max: 3000000 },
  { label: '300만원~', min: 3000000, max: 999999999 },
];

export default function VendorsScreen() {
  const { category } = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(
    category && VENDOR_DATA_MAP[category] ? category : 'hall'
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterKey, setActiveFilterKey] = useState('district');
  const [selectedFilters, setSelectedFilters] = useState({
    location: [],
    style: [],
    price: [],
  });

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

  const filterOptions = useMemo(() => {
    const districts = new Set();
    const styles = new Set();
    const currentData = VENDOR_DATA_MAP[activeCategory] || [];

    currentData.forEach((v) => {
      if (v.basic_info.district) districts.add(v.basic_info.district);
      const styleList = v.search_filters?.style_concepts || v.content?.tags || [];
      styleList.forEach((s) => styles.add(s));
    });

    return {
      location: Array.from(districts).sort(),
      style: Array.from(styles).sort(),
      price: PRICE_RANGES.map((r) => r.label),
    };
  }, [activeCategory]);

  const toggleFilter = (category, value) => {
    setSelectedFilters((prev) => {
      const currentList = prev[category];
      if (currentList.includes(value)) {
        return { ...prev, [category]: currentList.filter((v) => v !== value) };
      } else {
        return { ...prev, [category]: [...currentList, value] };
      }
    });
  };

  const resetFilters = () => {
    setSelectedFilters({
      location: [],
      style: [],
      price: [],
    });
  };

  const filteredVendors = useMemo(() => {
    const currentData = VENDOR_DATA_MAP[activeCategory] || [];
    return currentData.filter((vendor) => {
      // 1. Search match
      const name = vendor.basic_info.name || '';
      const desc = vendor.content?.short_description || '';
      const matchSearch =
        name.toLowerCase().includes(searchText.toLowerCase()) ||
        desc.toLowerCase().includes(searchText.toLowerCase());
      if (!matchSearch) return false;

      // 2. Location match
      if (selectedFilters.location.length > 0) {
        if (!selectedFilters.location.includes(vendor.basic_info.location || vendor.basic_info.district)) return false;
      }

      // 3. Style match
      if (selectedFilters.style.length > 0) {
        const vendorStyles = vendor.search_filters?.style_concepts || vendor.content?.tags || [];
        if (!selectedFilters.style.some((s) => vendorStyles.includes(s))) return false;
      }

      // 4. Price match
      if (selectedFilters.price.length > 0) {
        const vendorMin = vendor.pricing?.price_min || 0;
        const vendorMax = vendor.pricing?.price_max || 999999999;
        const matchPrice = selectedFilters.price.some((label) => {
          const range = PRICE_RANGES.find((r) => r.label === label);
          if (!range) return false;
          return vendorMin < range.max && vendorMax >= range.min;
        });
        if (!matchPrice) return false;
      }

      return true;
    });
  }, [searchText, activeCategory, selectedFilters]);

  const renderPrice = (item, isDetail = false) => {
    const category = item.basic_info?.category;
    const pricing = item.pricing;

    if (!pricing) return <Text style={isDetail ? styles.priceText : styles.vendorPrice}>가격 정보 없음</Text>;

    const formatMeal = (val) => `식대 ${(val / 10000).toLocaleString()}만원~`;
    const formatRental = (val) => `대관료 ${(val / 10000).toLocaleString()}만원~`;
    const formatRange = (min, max) => `${(min / 10000).toLocaleString()}~${(max / 10000).toLocaleString()}만원`;
    const formatMinOnly = (min) => `${(min / 10000).toLocaleString()}만원~`;

    try {
      switch (category) {
        case 'hall':
        case 'wedding_hall':
          return (
            <View style={styles.vendorPriceContainer}>
              {pricing.meal_price_per_person && (
                <Text style={isDetail ? styles.priceTextSmall : styles.vendorPriceSmall}>
                  {formatMeal(pricing.meal_price_per_person)}
                </Text>
              )}
              {pricing.rental_fee_base && (
                <Text style={isDetail ? styles.priceText : styles.vendorPrice}>
                  {formatRental(pricing.rental_fee_base)}
                </Text>
              )}
            </View>
          );
        case 'studio':
        case 'video_snap':
        case 'package':
          if (pricing.price_min && pricing.price_max) {
            return <Text style={isDetail ? styles.priceText : styles.vendorPrice}>{formatRange(pricing.price_min, pricing.price_max)}</Text>;
          } else if (pricing.price_min) {
            return <Text style={isDetail ? styles.priceText : styles.vendorPrice}>{formatMinOnly(pricing.price_min)}</Text>;
          }
          break;
        case 'dress':
          const dMin = pricing.rental_price_min || pricing.price_min || pricing.meal_price_per_person;
          const dMax = pricing.rental_price_max || pricing.price_max;
          if (dMin && dMax) {
            return (
              <View style={styles.vendorPriceContainer}>
                <Text style={isDetail ? styles.priceText : styles.vendorPrice}>대여 {formatRange(dMin, dMax)}</Text>
              </View>
            );
          } else if (dMin) {
            return <Text style={isDetail ? styles.priceText : styles.vendorPrice}>대여 {formatMinOnly(dMin)}</Text>;
          }
          break;
        case 'makeup':
          const mPrice = pricing.bride_hair_makeup_price || pricing.price_min || pricing.meal_price_per_person;
          if (mPrice) {
            return <Text style={isDetail ? styles.priceText : styles.vendorPrice}>신부 {formatMinOnly(mPrice)}</Text>;
          }
          break;
        default:
          if (pricing.meal_price_per_person && pricing.rental_fee_base) {
            return (
              <View style={styles.vendorPriceContainer}>
                <Text style={styles.vendorPriceSmall}>{formatMeal(pricing.meal_price_per_person)}</Text>
                <Text style={styles.vendorPrice}>{formatRental(pricing.rental_fee_base)}</Text>
              </View>
            );
          } else if (pricing.meal_price_per_person) {
            return <Text style={styles.vendorPrice}>{formatMeal(pricing.meal_price_per_person)}</Text>;
          } else if (pricing.price_min && pricing.price_max) {
            return <Text style={styles.vendorPrice}>{formatRange(pricing.price_min, pricing.price_max)}</Text>;
          } else if (pricing.price_min) {
            return <Text style={styles.vendorPrice}>{formatMinOnly(pricing.price_min)}</Text>;
          }
      }
    } catch (e) {
      console.error('Price formatting error:', e);
    }

    return <Text style={isDetail ? styles.priceText : styles.vendorPrice}>가격 문의</Text>;
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  };



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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(couple)')} style={styles.backBtnWrapper}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>준비 업체 찾기</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={filteredVendors}
        keyExtractor={(item) => item.basic_info.vendor_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
              contentContainerStyle={styles.categoryContent}
              snapToInterval={100} // width(88) + gap(12)
              decelerationRate="fast"
            >
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
            </ScrollView>

            <View style={styles.filterTopRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFilterScroll}>
                {Object.entries(selectedFilters).every(([_, list]) => list.length === 0) ? (
                  <Text style={styles.emptyFilterText}>조건을 선택하여 딱 맞는 업체를 찾아보세요.</Text>
                ) : (
                  Object.entries(selectedFilters).map(([cat, list]) =>
                    list.map((val, idx) => (
                      <TouchableOpacity
                        key={`${cat}-${idx}`}
                        style={styles.activeChip}
                        onPress={() => toggleFilter(cat, val)}
                      >
                        <Text style={styles.activeChipText}>{val}</Text>
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    ))
                  )
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.filterToggleButton}
                onPress={() => setIsFilterOpen(!isFilterOpen)}
                activeOpacity={0.7}
              >
                <Ionicons name="options" size={20} color={isFilterOpen ? "#c9a98e" : "#8a7870"} />
              </TouchableOpacity>
            </View>

            {isFilterOpen && (
              <View style={styles.filterExpandedArea}>
                <View style={styles.filterKeyRow}>
                  <View style={styles.filterKeyList}>
                    {FILTER_KEYS.map((fk) => (
                      <TouchableOpacity
                        key={fk.id}
                        style={[styles.filterKeyBtn, activeFilterKey === fk.id && styles.filterKeyBtnActive]}
                        onPress={() => setActiveFilterKey(fk.id)}
                      >
                        <Text style={[styles.filterKeyText, activeFilterKey === fk.id && styles.filterKeyTextActive]}>
                          {fk.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                    <Ionicons name="refresh-outline" size={14} color="#8a7870" />
                    <Text style={styles.resetText}>초기화</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.filterValueArea} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <View style={styles.filterValueWrap}>
                    {filterOptions[activeFilterKey].map((val) => {
                      const isSelected = selectedFilters[activeFilterKey].includes(val);
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[styles.filterValueChip, isSelected && styles.filterValueChipActive]}
                          onPress={() => toggleFilter(activeFilterKey, val)}
                        >
                          <Text style={[styles.filterValueText, isSelected && styles.filterValueTextActive]}>
                            {val}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.vendorCard}
            onPress={() => router.push(`/vendors/${item.basic_info.vendor_id}`)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.content?.thumbnail_url?.startsWith('//') ? `https:${item.content.thumbnail_url}` : (item.content?.thumbnail_url || `https://picsum.photos/seed/${item.basic_info.vendor_id}/300/200`) }}
              style={styles.cardImg}
            />
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.vendorName} numberOfLines={1}>{item.basic_info.name}</Text>
                {(item.basic_info.rating || item.content?.rating_info?.rating_avg) && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#f0b452" />
                    <Text style={styles.ratingText}>{item.basic_info.rating || item.content.rating_info.rating_avg}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.vendorDesc} numberOfLines={2}>{item.content?.short_description}</Text>
              <View style={styles.vendorFooter}>
                <Text style={styles.vendorLocation}>{item.basic_info.location || item.basic_info.district || item.basic_info.region}</Text>
                {renderPrice(item)}
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

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop} activeOpacity={0.8}>
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}
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
    height: 90,
    marginBottom: 15,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  categoryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 88,
    height: 72,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0e8e4',
    // Subtle shadow for premium feel
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryBtnActive: {
    backgroundColor: '#c9a98e',
    borderColor: '#c9a98e',
    elevation: 4,
    shadowOpacity: 0.2,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#8a7870',
    marginTop: 6,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: '#fff',
  },
  filterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  activeFilterScroll: {
    flex: 1,
    marginRight: 10,
  },
  emptyFilterText: {
    fontSize: 13,
    color: '#a09a98',
    alignSelf: 'center',
    marginTop: 5,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8a7870',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 4,
  },
  activeChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f6f3f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterExpandedArea: {
    backgroundColor: '#faf5f2',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0e8e4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterKeyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterKeyList: {
    flexDirection: 'row',
    gap: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8ddd8',
  },
  resetText: {
    fontSize: 11,
    color: '#8a7870',
    fontWeight: '500',
  },
  filterKeyBtn: {
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterKeyBtnActive: {
    borderBottomColor: '#c9a98e',
  },
  filterKeyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8a7870',
  },
  filterKeyTextActive: {
    color: '#3a2e2a',
    fontWeight: '700',
  },
  filterValueArea: {
    maxHeight: 120,
  },
  filterValueWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterValueChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ddd8',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  filterValueChipActive: {
    backgroundColor: '#c9a98e',
    borderColor: '#c9a98e',
  },
  filterValueText: {
    fontSize: 13,
    color: '#8a7870',
  },
  filterValueTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  vendorPriceContainer: {
    alignItems: 'flex-end',
  },
  vendorPriceSmall: {
    fontSize: 11,
    color: '#8a7870',
    fontWeight: '400',
    marginBottom: 2,
  },
  priceTextSmall: {
    fontSize: 14,
    color: '#8a7870',
    fontWeight: '500',
    marginBottom: 4,
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
  scrollTopButton: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'android' ? 85 : 80,
    backgroundColor: '#c9a98e',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

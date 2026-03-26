import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import plannersData from './planners.json';

const FILTER_KEYS = [
  { id: 'activity_regions', label: '지역' },
  { id: 'specialties', label: '전문분야' },
  { id: 'style_keywords', label: '스타일' },
];

export default function PlannersScreen() {
  const [searchText, setSearchText] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterKey, setActiveFilterKey] = useState('activity_regions');

  const [selectedFilters, setSelectedFilters] = useState({
    activity_regions: [],
    specialties: [],
    style_keywords: [],
  });

  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    const handleBackPress = () => {
      router.replace('/(couple)');
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const filterOptions = useMemo(() => {
    const regions = new Set();
    const specialties = new Set();
    const styles = new Set();

    plannersData.forEach((planner) => {
      planner.activity_regions.forEach((r) => regions.add(r));
      planner.specialties.forEach((s) => specialties.add(s));
      planner.style_keywords.forEach((k) => styles.add(k));
    });

    return {
      activity_regions: Array.from(regions),
      specialties: Array.from(specialties),
      style_keywords: Array.from(styles),
    };
  }, []);

  const filteredPlanners = useMemo(() => {
    return plannersData.filter((planner) => {
      if (searchText && !planner.name.includes(searchText) && !planner.brand_name.includes(searchText)) {
        return false;
      }

      if (selectedFilters.activity_regions.length > 0) {
        if (!selectedFilters.activity_regions.some((r) => planner.activity_regions.includes(r))) {
          return false;
        }
      }

      if (selectedFilters.specialties.length > 0) {
        if (!selectedFilters.specialties.some((s) => planner.specialties.includes(s))) {
          return false;
        }
      }

      if (selectedFilters.style_keywords.length > 0) {
        if (!selectedFilters.style_keywords.some((k) => planner.style_keywords.includes(k))) {
          return false;
        }
      }

      return true;
    });
  }, [searchText, selectedFilters]);

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
      activity_regions: [],
      specialties: [],
      style_keywords: [],
    });
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

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  };

  const allSelectedChips = [
    ...selectedFilters.activity_regions.map((v) => ({ cat: 'activity_regions', val: v })),
    ...selectedFilters.specialties.map((v) => ({ cat: 'specialties', val: v })),
    ...selectedFilters.style_keywords.map((v) => ({ cat: 'style_keywords', val: v })),
  ];


  // --- List View return ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(couple)')} style={styles.backBtnWrapper}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>웨딩플래너 찾기</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#B9B4B4" />
          <TextInput
            style={styles.searchInput}
            placeholder="플래너 이름 또는 브랜드명 검색"
            placeholderTextColor="#B9B4B4"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <View style={styles.filterTopRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFilterScroll}>
          {allSelectedChips.length === 0 ? (
            <Text style={styles.emptyFilterText}>조건을 선택하여 딱 맞는 플래너를 찾아보세요.</Text>
          ) : (
            allSelectedChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.activeChip}
                onPress={() => toggleFilter(chip.cat, chip.val)}
              >
                <Text style={styles.activeChipText}>{chip.val}</Text>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            ))
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

      <FlatList
        ref={flatListRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={filteredPlanners}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.plannerCard}
            onPress={() => router.push(`/planners/${item.name}`)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.profile_image_url }} style={styles.cardProfileImg} />
            <View style={styles.cardInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardName}>{item.name} <Text style={styles.cardTitleText}>{item.title}</Text></Text>
                <View style={styles.cardRatingRow}>
                  <Ionicons name="star" size={12} color="#f0b452" />
                  <Text style={styles.cardRating}>{item.rating}</Text>
                </View>
              </View>

              <Text style={styles.cardOneLiner} numberOfLines={1}>"{item.one_liner}"</Text>

              <View style={styles.cardMetaRow}>
                <Text style={styles.cardMetaText}>{item.activity_regions.join(', ')}</Text>
                <View style={styles.metaDot} />
                <Text style={styles.cardMetaText}>경력 {item.career_years}년</Text>
              </View>

              <View style={styles.cardTagsRow}>
                {item.specialties.slice(0, 3).map((s, idx) => (
                  <View key={idx} style={styles.smallTag}>
                    <Text style={styles.smallTagText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>일치하는 플래너가 없습니다.</Text>}
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
    gap: 16,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#8a7870',
  },
  plannerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  cardProfileImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f0f0',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a2e2a',
  },
  cardTitleText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8a7870',
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardRating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3a2e2a',
  },
  cardOneLiner: {
    fontSize: 13,
    color: '#555050',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#8a7870',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#dcd3ce',
    marginHorizontal: 6,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  smallTag: {
    backgroundColor: '#f6f3f0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  smallTagText: {
    fontSize: 10,
    color: '#8a7870',
  },

  /* Detail View Styles */
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
    paddingHorizontal: 20,
    marginBottom: 8,
    lineHeight: 20,
  },
  portfolioScroll: {
    paddingLeft: 20,
  },
  portfolioImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
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

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── 임시 데이터 ──────────────────────────────────────────
const CATEGORY_TABS = ['스튜디오', '드레스', '메이크업', '패키지'];
const SUB_TABS = ['웨딩홀', '영상·스냅', '웨딩플래너'];

const BANNER_DATA = [
  { id: '1', label: '봄 웨딩 특집', image: require('../../assets/images/banner_01.jpg') },
  { id: '2', label: '허니문 패키지', image: require('../../assets/images/banner_02.jpg') },
  { id: '3', label: '드레스 할인전', image: require('../../assets/images/banner_03.jpg') },
];

// 카테고리 탭별 업체 데이터
const CATEGORY_VENDOR_DATA = {
  0: [
    // 스튜디오
    { id: "1426961148", name: "클레스튜디오", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1426961148/400/300" },
    { id: "1364569871", name: "소르아웨딩", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1364569871/400/300" },
    { id: "1662835744", name: "버드투 블룸스튜디오 1호점", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1662835744/400/300" },
    { id: "1500860601", name: "메종드힐", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1500860601/400/300" },
    { id: "14613533", name: "21그램", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/14613533/400/300" },
    { id: "1847910964", name: "메리드스튜디오", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1847910964/400/300" }
  ],

  1: [
    // 드레스
    { id: "26423739", name: "황정아웨딩드레스 앤 부티크샵", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/26423739/400/300" },
    { id: "10665200", name: "이명순웨딩드레스", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/10665200/400/300" },
    { id: "1713506307", name: "현대웨딩드레스", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1713506307/400/300" },
    { id: "4971408", name: "이명순웨딩드레스", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/4971408/400/300" },
    { id: "8350073", name: "리젠시웨딩드레스", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/8350073/400/300" },
    { id: "1617676855", name: "리아나웨딩드레스", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1617676855/400/300" }
  ],

  2: [
    // 메이크업
    { id: "2107233652", name: "어썸메이크업", tag: "내추럴", rating: 4.5, image: "https://picsum.photos/seed/2107233652/400/300" },
    { id: "665872775", name: "현정메이크업", tag: "내추럴", rating: 4.5, image: "https://picsum.photos/seed/665872775/400/300" },
    { id: "506591326", name: "조아메이크업헤어", tag: "내추럴", rating: 4.5, image: "https://picsum.photos/seed/506591326/400/300" },
    { id: "121010473", name: "제이바이루나", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/121010473/400/300" },
    { id: "853258195", name: "베리키트", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/853258195/400/300" },
    { id: "2141761580", name: "에이미어블", tag: "로맨틱", rating: 4.5, image: "https://picsum.photos/seed/2141761580/400/300" }
  ],

  3: [
    // 패키지
    {
      id: 'c4-1',
      name: '올인원 웨딩패키지',
      tag: '스드메',
      rating: 4.8,
      image: null,
    },
    {
      id: 'c4-2',
      name: '드림 패키지샵',
      tag: '토탈',
      rating: 4.7,
      image: null,
    },
    {
      id: 'c4-3',
      name: '웨딩 토탈케어',
      tag: '프리미엄',
      rating: 4.9,
      image: null,
    },
    {
      id: 'c4-4',
      name: '해피데이 패키지',
      tag: '가성비',
      rating: 4.6,
      image: null,
    },
    {
      id: 'c4-5',
      name: '럭셔리 웨딩팩',
      tag: '럭셔리',
      rating: 4.8,
      image: null,
    },
    {
      id: 'c4-6',
      name: '심플리 패키지',
      tag: '소규모',
      rating: 4.7,
      image: null,
    },
  ],
};

const SUB_VENDOR_DATA = {
  0: [
    // 웨딩홀
    { id: "10660163", name: "엘타워", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/10660163/400/300" },
    { id: "1447239442", name: "엘리에나호텔 웨딩홀", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1447239442/400/300" },
    { id: "1992754829", name: "더채플앳논현", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1992754829/400/300" },
    { id: "2009675378", name: "상록아트홀", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/2009675378/400/300" },
    { id: "23182563", name: "더채플앳 청담", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/23182563/400/300" },
    { id: "1948333104", name: "그랜드힐컨벤션", tag: "모던", rating: 4.5, image: "https://picsum.photos/seed/1948333104/400/300" }
  ],

  1: [
    // 영상·스냅 (기존 데이터 유지)
    {
      id: 's2-1',
      name: '모먼트 스냅',
      tag: '감성스냅',
      rating: 4.9,
      image: null,
    },
    {
      id: 's2-2',
      name: '데이바이데이 필름',
      tag: '웨딩영상',
      rating: 4.8,
      image: null,
    },
    {
      id: 's2-3',
      name: '러브로그 스튜디오',
      tag: '본식스냅',
      rating: 4.7,
      image: null,
    },
    {
      id: 's2-4',
      name: '필름데이 웨딩',
      tag: '시네마틱',
      rating: 4.8,
      image: null,
    },
    {
      id: 's2-5',
      name: '화이트데이 스냅',
      tag: '프리미엄',
      rating: 4.9,
      image: null,
    },
    {
      id: 's2-6',
      name: '온리모먼트',
      tag: '하이라이트',
      rating: 4.6,
      image: null,
    },
  ],

  2: [
    // 웨딩플래너
    { id: "문지안", name: "문지안", tag: "럭셔리웨딩", rating: 5, image: "https://picsum.photos/seed/planner-15/400/400" },
    { id: "한유진", name: "한유진", tag: "야외웨딩", rating: 4.9, image: "https://picsum.photos/seed/planner-6/400/400" },
    { id: "신하율", name: "신하율", tag: "럭셔리웨딩", rating: 4.9, image: "https://picsum.photos/seed/planner-10/400/400" },
    { id: "강다은", name: "강다은", tag: "럭셔리웨딩", rating: 4.9, image: "https://picsum.photos/seed/planner-11/400/400" },
    { id: "최예나", name: "최예나", tag: "럭셔리웨딩", rating: 4.9, image: "https://picsum.photos/seed/planner-24/400/400" },
    { id: "신지우", name: "신지우", tag: "호텔웨딩", rating: 4.9, image: "https://picsum.photos/seed/planner-30/400/400" }
  ],
};
// ──────────────────────────────────────────────────────────

const CARD_WIDTH = width * 0.38;
const MAX_VISIBLE = 5;

// Persist tab state across re-mounts within the same session
let persistedCategoryTab = 0;
let persistedSubTab = 0;
let persistedSearchText = '';

export default function HomeScreen() {
  const [activeCategoryTab, setActiveCategoryTabState] = useState(persistedCategoryTab);
  const [activeSubTab, setActiveSubTabState] = useState(persistedSubTab);
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchText, setSearchTextState] = useState(persistedSearchText);
  const bannerRef = useRef(null);

  const setActiveCategoryTab = (index) => {
    persistedCategoryTab = index;
    setActiveCategoryTabState(index);
  };

  const setActiveSubTab = (index) => {
    persistedSubTab = index;
    setActiveSubTabState(index);
  };

  const setSearchText = (text) => {
    persistedSearchText = text;
    setSearchTextState(text);
  };

  const onBannerScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
    setActiveBanner(index);
  };

  // 카테고리 탭 데이터
  const categoryVendors = (CATEGORY_VENDOR_DATA[activeCategoryTab] ?? []).slice(0, MAX_VISIBLE);
  const categoryHasMore = (CATEGORY_VENDOR_DATA[activeCategoryTab] ?? []).length > MAX_VISIBLE;

  // 서브 탭 데이터
  const subVendors = (SUB_VENDOR_DATA[activeSubTab] ?? []).slice(0, MAX_VISIBLE);
  const subHasMore = (SUB_VENDOR_DATA[activeSubTab] ?? []).length > MAX_VISIBLE;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── 헤더 ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.plannerBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/(planner)/dashboard')}
        >
          <Ionicons name="briefcase-outline" size={16} color="#917878" />
          <Text style={styles.plannerBtnText}>플래너</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Mongle</Text>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color="#3a2e2a" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* ── 검색바 ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#B9B4B4" />
          <TextInput
            style={styles.searchInput}
            placeholder="스튜디오, 드레스, 웨딩홀 검색"
            placeholderTextColor="#B9B4B4"
            value={searchText}
            onChangeText={setSearchText}
          />
          <Ionicons name="options-outline" size={16} color="#B9B4B4" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── 배너 ── */}
        <View style={styles.bannerWrap}>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onBannerScroll}
            scrollEventThrottle={16}
          >
            {BANNER_DATA.map((item) => (
              <View key={item.id} style={styles.bannerItem}>
                <Image source={item.image} style={styles.bannerImage} />
              </View>
            ))}
          </ScrollView>

          {/* 배너 인디케이터 */}
          <View style={styles.dotsWrap}>
            {BANNER_DATA.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeBanner && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── 카테고리 탭 ── */}
        <View style={styles.subTabRow}>
          {CATEGORY_TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveCategoryTab(i)}
              style={styles.subTab}
              activeOpacity={0.7}
            >
              <Text style={[styles.subTabText, i === activeCategoryTab && styles.subTabTextActive]}>
                {tab}
              </Text>
              {i === activeCategoryTab && <View style={styles.subTabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 업체 카드 수평 스크롤 (최대 5개 + 더보기 카드) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          style={styles.horizontalScroll}
        >
          {categoryVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onPress={() => router.push(`/vendors/${vendor.id}`)}
            />
          ))}
          {categoryHasMore && (
            <TouchableOpacity
              style={styles.moreCard}
              onPress={() => router.push('/vendors')}
              activeOpacity={0.8}
            >
              <View style={styles.moreCardInner}>
                <Ionicons name="grid-outline" size={24} color="#c9a98e" />
                <Text style={styles.moreCardText}>더보기</Text>
                <Ionicons name="chevron-forward" size={14} color="#c9a98e" />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ── 서브 탭 ── */}
        <View style={styles.subTabRow}>
          {SUB_TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveSubTab(i)}
              style={styles.subTab}
              activeOpacity={0.7}
            >
              <Text style={[styles.subTabText, i === activeSubTab && styles.subTabTextActive]}>
                {tab}
              </Text>
              {i === activeSubTab && <View style={styles.subTabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 서브 탭 카드 수평 스크롤 ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          style={styles.horizontalScroll}
        >
          {subVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onPress={() => {
                const route = activeSubTab === 2 ? `/planners/${vendor.id}` : `/vendors/${vendor.id}`;
                router.push(route);
              }}
            />
          ))}
          {subHasMore && (
            <TouchableOpacity
              style={styles.moreCard}
              onPress={() => {
                if (activeSubTab === 2) {
                  router.push('/planners');
                } else {
                  router.push('/vendors');
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.moreCardInner}>
                <Ionicons name="grid-outline" size={24} color="#c9a98e" />
                <Text style={styles.moreCardText}>더보기</Text>
                <Ionicons name="chevron-forward" size={14} color="#c9a98e" />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 업체 카드 컴포넌트 ────────────────────────────────────
function VendorCard({ vendor, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardImageWrap}>
        {vendor.image != null ? (
          <Image
            source={typeof vendor.image === 'string' ? { uri: vendor.image } : vendor.image}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.cardImagePlaceholder} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {vendor.name}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardTag}>{vendor.tag}</Text>
          <View style={styles.metaDot} />
          <Ionicons name="star" size={11} color="#f0b452" />
          <Text style={styles.cardRating}> {vendor.rating} reviews</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── 스타일 ────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // 헤더
  header: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logo: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#917878',
    letterSpacing: 1,
  },
  notifBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    backgroundColor: '#e87070',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // 검색바
  searchWrap: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#B9B4B4',
    borderWidth: 1,
    borderRadius: 40,
    paddingHorizontal: 15,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#555050',
    paddingVertical: 0,
    marginRight: 5,
  },

  // 배너
  bannerWrap: {
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    height: 120,
  },
  bannerItem: {
    width: width - 40,
    height: 120,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },

  // 수평 스크롤 리스트
  horizontalScroll: {
    marginBottom: 8,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 14,
  },

  // 카드
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  cardImageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#e8ddd8',
    borderRadius: 14,
  },
  cardBody: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3a2e2a',
    marginBottom: 5,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTag: {
    fontSize: 11,
    color: '#8a7870',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8a7870',
    marginHorizontal: 5,
  },
  cardRating: {
    fontSize: 11,
    color: '#8a7870',
  },

  // 더보기 카드
  moreCard: {
    width: CARD_WIDTH * 0.6,
    height: 120 + 10 + 19 + 5 + 15 + 10, // 이미지 + 패딩 + 이름 + gap + 메타 + 패딩
    backgroundColor: '#faf5f2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e8ddd8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCardInner: {
    alignItems: 'center',
    gap: 6,
  },
  moreCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c9a98e',
  },

  // 서브 탭
  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4',
    marginBottom: 14,
    marginTop: 8,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    position: 'relative',
  },
  subTabText: {
    fontSize: 14,
    color: '#8a7870',
    fontWeight: '400',
  },
  subTabTextActive: {
    color: '#3a2e2a',
    fontWeight: '600',
  },
  subTabUnderline: {
    position: 'absolute',
    bottom: -1,
    width: '40%',
    height: 2,
    backgroundColor: '#c9a98e',
    borderRadius: 1,
  },
});

import React, { useState, useRef, useEffect } from 'react';
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
import { useNotifications } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

// ── Vendor & Planner Data ──────────────────────────────────────────
import hallData from '../../vendors/data/hall.json';
import studioData from '../../vendors/data/studio.json';
import dressData from '../../vendors/data/dress.json';
import makeupData from '../../vendors/data/makeup.json';
import videoSnapData from '../../vendors/data/video_snap.json';
import packageData from '../../vendors/data/package.json';
import plannersData from '../../planners/planners.json';

const mapVendor = (v) => ({
  id: v.basic_info.vendor_id,
  name: v.basic_info.name,
  tag: v.content?.tags?.[0] || '추천',
  rating: v.basic_info.rating || v.content?.rating_info?.rating_avg || 4.5,
  image: v.content?.thumbnail_url?.startsWith('//')
    ? `https:${v.content.thumbnail_url}`
    : v.content?.thumbnail_url || `https://picsum.photos/seed/${v.basic_info.vendor_id}/400/300`,
});

const mapPlanner = (p) => ({
  id: p.name,
  name: p.name,
  tag: p.specialties?.[0] || '동행',
  rating: 4.8,
  image: p.profile_image_url,
});

const CATEGORY_TABS = ['스튜디오', '드레스', '메이크업', '패키지'];
const CATEGORY_IDS = ['studio', 'dress', 'makeup', 'package'];
const SUB_TABS = ['웨딩홀', '영상·스냅', '웨딩플래너'];
const SUB_IDS = ['hall', 'video_snap'];

const BANNER_DATA = [
  { id: '1', label: '봄 웨딩 특집', image: require('../../../assets/images/banner_01.jpg') },
  { id: '2', label: '허니문 패키지', image: require('../../../assets/images/banner_02.jpg') },
  { id: '3', label: '드레스 할인전', image: require('../../../assets/images/banner_03.jpg') },
];

const CATEGORY_VENDOR_DATA = {
  0: studioData.slice(0, 6).map(mapVendor),
  1: dressData.slice(0, 6).map(mapVendor),
  2: makeupData.slice(0, 6).map(mapVendor),
  3: packageData.slice(0, 6).map(mapVendor),
};

const SUB_VENDOR_DATA = {
  0: hallData.slice(0, 6).map(mapVendor),
  1: videoSnapData.slice(0, 6).map(mapVendor),
  2: plannersData.slice(0, 6).map(mapPlanner),
};
// ──────────────────────────────────────────────────────────

const CARD_WIDTH = width * 0.38;
const MAX_VISIBLE = 5;

// 탭 상태 세션 유지
let persistedCategoryTab = 0;
let persistedSubTab = 0;
let persistedSearchText = '';

export default function HomeScreen() {
  const [activeCategoryTab, setActiveCategoryTabState] = useState(persistedCategoryTab);
  const [activeSubTab, setActiveSubTabState] = useState(persistedSubTab);
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchText, setSearchTextState] = useState(persistedSearchText);
  const bannerRef = useRef(null);

  // ── 알림 연동 ─────────────────────────────────────────
  const { unreadCount, setUserId } = useNotifications();
  // couple_id를 AuthContext에서 가져옴
  // AuthContext가 user_id / couple_id 등 다른 키를 쓸 경우 아래 변수명을 맞춰주세요
  const auth = useAuth();
  const coupleUserId = auth?.couple_id ?? auth?.user_id ?? null;

  useEffect(() => {
    // couple 유저의 ID를 Context에 등록 → notifications 테이블 fetch + 실시간 구독 시작
    if (coupleUserId) {
      setUserId(coupleUserId);
    }
    // 화면 언마운트 시 ID를 초기화하지 않음:
    // 탭 이동 후 돌아와도 알림 상태가 유지되어야 하므로 의도적으로 cleanup 생략
  }, [coupleUserId]);
  // ──────────────────────────────────────────────────────

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

  const categoryVendors = (CATEGORY_VENDOR_DATA[activeCategoryTab] ?? []).slice(0, MAX_VISIBLE);
  const categoryHasMore = (CATEGORY_VENDOR_DATA[activeCategoryTab] ?? []).length > MAX_VISIBLE;
  const subVendors = (SUB_VENDOR_DATA[activeSubTab] ?? []).slice(0, MAX_VISIBLE);
  const subHasMore = (SUB_VENDOR_DATA[activeSubTab] ?? []).length > MAX_VISIBLE;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── 헤더 ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>Mongle</Text>

        {/* 알림 버튼 — unreadCount 기반 dot + 알림 화면 라우팅 */}
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/(couple)/notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color="#3a2e2a" />
          {unreadCount > 0 && <View style={styles.notifDot} />}
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
              onPress={() => router.push(`/vendors?category=${CATEGORY_IDS[activeCategoryTab]}`)}
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
                const route =
                  activeSubTab === 2 ? `/planners/${vendor.id}` : `/vendors/${vendor.id}`;
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
                  router.push(`/vendors?category=${SUB_IDS[activeSubTab]}`);
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
    marginLeft: 40,
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
    height: 120 + 10 + 19 + 5 + 15 + 10,
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

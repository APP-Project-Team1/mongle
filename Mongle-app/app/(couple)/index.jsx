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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── 임시 데이터 ──────────────────────────────────────────
const CATEGORY_TABS = ['스튜디오', '웨딩홀', '드레스', '메이크업'];
const SUB_TABS = ['본식', '패키지', '웨딩플래너'];

const BANNER_DATA = [
  { id: '1', label: '봄 웨딩 특집' },
  { id: '2', label: '허니문 패키지' },
  { id: '3', label: '드레스 할인전' },
];

const VENDOR_DATA = [
  { id: '1', name: 'Starbuck Borobudur', distance: '1.0 km', rating: 4.8, image: null },
  { id: '2', name: 'Baegopa Suhat', distance: '500 m', rating: 4.8, image: null },
  { id: '3', name: 'Starbuck Borobudur', distance: '1.0 km', rating: 4.8, image: null },
  { id: '4', name: 'Starbuck Borobudur', distance: '1.0 km', rating: 4.8, image: null },
];
// ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [activeCategoryTab, setActiveCategoryTab] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchText, setSearchText] = useState('');
  const bannerRef = useRef(null);

  const onBannerScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
    setActiveBanner(index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── 헤더 ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>Mongle</Text>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color="#3a2e2a" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* ── 검색바 ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#8a7870" />
          <TextInput
            style={styles.searchInput}
            placeholder="스튜디오, 드레스, 웨딩홀 검색"
            placeholderTextColor="#8a7870"
            value={searchText}
            onChangeText={setSearchText}
          />
          <Ionicons name="options-outline" size={16} color="#8a7870" />
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
                <View style={styles.bannerPlaceholder}>
                  <Text style={styles.bannerPlaceholderText}>🌸 {item.label}</Text>
                </View>
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

        {/* ── 카테고리 탭 + 더보기 ── */}
        <View style={styles.categoryRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {CATEGORY_TABS.map((tab, i) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveCategoryTab(i)}
                style={styles.categoryTab}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    i === activeCategoryTab && styles.categoryTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
                {i === activeCategoryTab && <View style={styles.categoryUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 더보기 — 업체 목록 화면으로 이동 */}
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => router.push('/vendors')}
            activeOpacity={0.7}
          >
            <Text style={styles.moreBtnText}>더보기</Text>
            <Ionicons name="chevron-forward" size={12} color="#c9a98e" />
          </TouchableOpacity>
        </View>

        {/* ── 업체 카드 그리드 (상단 2개) ── */}
        <View style={styles.grid}>
          {VENDOR_DATA.slice(0, 2).map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onPress={() => router.push(`/vendors/${vendor.id}`)}
            />
          ))}
        </View>

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

        {/* ── 서브 탭 카드 그리드 (하단 2개) ── */}
        <View style={styles.grid}>
          {VENDOR_DATA.slice(2, 4).map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onPress={() => router.push(`/vendors/${vendor.id}`)}
            />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 업체 카드 컴포넌트 ────────────────────────────────────
function VendorCard({ vendor, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {vendor.image ? (
        <Image source={{ uri: vendor.image }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {vendor.name}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDistance}>{vendor.distance}</Text>
          <View style={styles.metaDot} />
          <Ionicons name="star" size={12} color="#f0b452" />
          <Text style={styles.cardRating}>{vendor.rating} reviews</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logo: {
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#6b4c4c',
    letterSpacing: 1,
  },
  notifBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#f5f0ee',
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
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0ee',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#3a2e2a',
  },

  // 배너
  bannerWrap: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    height: 180,
  },
  bannerItem: {
    width: width - 40,
    height: 180,
  },
  bannerPlaceholder: {
    flex: 1,
    backgroundColor: '#f2e8e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerPlaceholderText: {
    fontSize: 18,
    color: '#8a6a5a',
    fontStyle: 'italic',
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

  // 카테고리 탭
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    marginBottom: 14,
  },
  categoryTab: {
    marginRight: 24,
    paddingBottom: 6,
    alignItems: 'center',
  },
  categoryTabText: {
    fontSize: 15,
    color: '#8a7870',
    fontWeight: '400',
  },
  categoryTabTextActive: {
    color: '#3a2e2a',
    fontWeight: '600',
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#c9a98e',
    borderRadius: 1,
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 2,
  },
  moreBtnText: {
    fontSize: 12,
    color: '#c9a98e',
  },

  // 그리드
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 8,
  },

  // 카드
  card: {
    width: (width - 54) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#b4968c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
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
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a2e2a',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDistance: {
    fontSize: 11,
    color: '#8a7870',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8a7870',
  },
  cardRating: {
    fontSize: 11,
    color: '#8a7870',
    marginLeft: 2,
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

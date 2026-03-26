import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const CATEGORY_LABEL = {
  studio: '스튜디오',
  dress: '드레스',
  makeup: '메이크업',
  hall: '웨딩홀',
  planner: '플래너',
  package: '패키지',
  video_snap: '스냅/영상',
};

function VendorCard({ item }) {
  const isPlanner = item.category === 'planner';
  const md = item.metadata || {};

  const handlePress = () => {
    if (item.source_id) {
      if (isPlanner) {
        router.push(`/planners/${item.source_id}`);
      } else {
        router.push(`/vendors/${item.source_id}`);
      }
    } else if (item.url) {
      // 혹시 V1 모의 데이터 url이 있다면
    }
  };

  const getPriceText = () => {
    if (isPlanner) {
      return md.price ? `기본 ${(md.price / 10000).toFixed(0)}만원` : '가격 문의';
    } else {
      const pl = md.price_level;
      if (pl === 'premium') return '프리미엄';
      if (pl === 'high') return '고급';
      if (pl === 'mid_high') return '중고급';
      if (pl === 'mid') return '중급';
      if (pl === 'low') return '가성비';
      if (item.price_min != null) return `${item.price_min}~${item.price_max}만원`;
      return '가격 문의';
    }
  };

  const categoryLabel =
    CATEGORY_LABEL[item.category] || CATEGORY_LABEL[md.category] || item.category;

  return (
    <TouchableOpacity style={styles.vendorCard} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.vendorCardInner}>
        <View style={styles.vendorRow}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {item.title || item.brand_name || item.name}
          </Text>
          {item.rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#c9a98e" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {isPlanner ? (
          <>
            <Text style={styles.vendorSub} numberOfLines={1}>
              {md.region ? md.region.join(', ') : item.name}
            </Text>
            <Text style={styles.vendorPrice}>{getPriceText()}</Text>
          </>
        ) : (
          <>
            <Text style={styles.vendorSub} numberOfLines={1}>
              {md.district || md.region || item.district || item.region}
            </Text>
            <Text style={styles.vendorPrice}>{getPriceText()}</Text>
          </>
        )}

        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!message.isStreaming) return;
    const interval = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(interval);
  }, [message.isStreaming]);

  const displayText = message.isStreaming
    ? (message.displayText || '') + (showCursor ? '|' : ' ')
    : message.displayText || '';

  if (isUser) {
    return (
      <View style={styles.rowMe}>
        <View style={styles.bubbleMe}>
          <Text style={styles.textMe}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowOther}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={styles.aiContent}>
        <View style={styles.bubbleOther}>
          <Text style={styles.textOther}>{displayText}</Text>
        </View>
        {!message.isStreaming && message.vendors && message.vendors.length > 0 && (
          <View style={styles.vendorSection}>
            <Text style={styles.vendorSectionTitle}>추천 업체</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vendorList}
            >
              {message.vendors.map((vendor, idx) => (
                <VendorCard key={vendor.kakao_id || vendor.brand_name || idx} item={vendor} />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowMe: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  rowOther: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#c9a98e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  aiContent: {
    flex: 1,
  },
  bubbleMe: {
    maxWidth: '75%',
    backgroundColor: '#c9a98e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f5f0ee',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  textMe: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  textOther: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3a2e2a',
  },
  vendorSection: {
    marginTop: 8,
  },
  vendorSectionTitle: {
    fontSize: 12,
    color: '#8a7870',
    marginBottom: 6,
    marginLeft: 2,
  },
  vendorList: {
    gap: 10,
    paddingRight: 8,
  },
  vendorCard: {
    width: 180,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f5f0ee',
    borderLeftWidth: 3,
    borderLeftColor: '#c9a98e',
    overflow: 'hidden',
  },
  vendorCardInner: {
    padding: 12,
    gap: 3,
  },
  vendorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a2e2a',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#8a7870',
  },
  vendorSub: {
    fontSize: 11,
    color: '#8a7870',
  },
  vendorPrice: {
    fontSize: 12,
    color: '#c9a98e',
    fontWeight: '500',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f0ee',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 10,
    color: '#8a7870',
  },
});

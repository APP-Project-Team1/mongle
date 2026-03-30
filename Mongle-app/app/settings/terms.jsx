import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const SECTIONS = [
  {
    num: '1',
    title: '목적',
    content:
      '본 약관은 "몽글(Mongle)" 서비스 이용과 관련하여 회사와 이용자의 권리 및 의무를 규정합니다.',
  },
  {
    num: '2',
    title: '서비스 내용',
    content:
      '회사는 다음 서비스를 제공합니다:',
    bullets: [
      '웨딩 견적 비교 서비스',
      '가격 범위 제공',
      '업체 탐색 및 정보 제공',
      '데이터 기반 추천',
    ],
  },
  {
    num: '3',
    title: '회원가입',
    bullets: [
      '이메일 기반 회원가입 가능',
      '허위 정보 입력 금지',
      '계정은 본인만 사용 가능',
    ],
  },
  {
    num: '4',
    title: '서비스 이용',
    content: '이용자는 다음 행위를 해서는 안 됩니다:',
    bullets: [
      '타인의 개인정보 업로드 (동의 없이)',
      '불법 데이터 공유',
      '서비스 악용',
    ],
  },
  {
    num: '5',
    title: '견적 데이터 관련 조항',
    highlight: true,
    content: '이용자는 다음 사항에 동의합니다:',
    subItems: [
      {
        label: '업로드하는 견적 데이터',
        detail: '본인이 제공 권한을 가진 정보여야 함',
      },
      {
        label: '회사의 데이터 활용',
        detail: '통계 및 분석 목적에 활용 가능',
      },
      {
        label: '회사의 보장 사항',
        details: ['개인정보 비식별 처리', '원본 공개 금지'],
      },
    ],
  },
  {
    num: '6',
    title: '서비스 책임 제한',
    content: '회사는 다음에 대해 책임지지 않습니다:',
    bullets: [
      '업체 실제 가격과 서비스 내 정보 차이',
      '이용자의 판단에 따른 계약 결과',
      '제3자(업체) 서비스 품질',
    ],
    note: '서비스는 "정보 제공" 목적입니다',
  },
  {
    num: '7',
    title: '지식재산권',
    bullets: [
      '서비스 내 모든 콘텐츠는 회사에 귀속',
      '무단 복제/배포 금지',
    ],
  },
  {
    num: '8',
    title: '서비스 변경 및 중단',
    content: '회사는 다음 경우 서비스 변경 가능:',
    bullets: ['시스템 점검', '정책 변경', '사업 전략 변경'],
  },
  {
    num: '9',
    title: '계약 해지',
    bullets: [
      '이용자는 언제든 탈퇴 가능',
      '회사는 약관 위반 시 이용 제한 가능',
    ],
  },
  {
    num: '10',
    title: '준거법',
    content: '본 약관은 대한민국 법을 따릅니다.',
  },
];

function SectionCard({ section }) {
  return (
    <View style={[styles.card, section.highlight && styles.highlightCard]}>
      {/* 섹션 헤더 */}
      <View style={styles.cardHeader}>
        <View style={[styles.numBadge, section.highlight && styles.numBadgeHighlight]}>
          <Text style={[styles.numText, section.highlight && styles.numTextHighlight]}>
            {section.num}
          </Text>
        </View>
        <Text style={[styles.cardTitle, section.highlight && styles.cardTitleHighlight]}>
          {section.title}
          {section.highlight && (
            <Text style={styles.importantTag}> (중요)</Text>
          )}
        </Text>
      </View>

      {/* 본문 */}
      {section.content && (
        <Text style={styles.cardContent}>{section.content}</Text>
      )}

      {/* 일반 불릿 리스트 */}
      {section.bullets && section.bullets.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}

      {/* 서브 아이템 (5조 전용) */}
      {section.subItems && section.subItems.map((item, i) => (
        <View key={i} style={styles.subItem}>
          <View style={styles.subItemHeader}>
            <Ionicons name="chevron-forward" size={13} color="#C9716A" />
            <Text style={styles.subItemLabel}>{item.label}</Text>
          </View>
          {item.detail && (
            <Text style={styles.subItemDetail}>→ {item.detail}</Text>
          )}
          {item.details && item.details.map((d, j) => (
            <Text key={j} style={styles.subItemDetail}>→ {d}</Text>
          ))}
        </View>
      ))}

      {/* 노트 (6조 전용) */}
      {section.note && (
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={14} color="#7A9E8E" />
          <Text style={styles.noteText}>※ {section.note}</Text>
        </View>
      )}
    </View>
  );
}

export default function TermsScreen() {
  const scrollRef = useRef(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>이용약관</Text>
          <Text style={styles.headerSub}>Terms of Service</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 히어로 배너 */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="document-text" size={32} color="#C9716A" />
          </View>
          <Text style={styles.heroTitle}>몽글 서비스 이용약관</Text>
          <Text style={styles.heroDate}>최종 업데이트: 2025년 1월 1일</Text>
          <Text style={styles.heroDesc}>
            몽글(Mongle)을 이용해 주셔서 감사합니다.{'\n'}
            아래 약관을 꼭 읽어보세요.
          </Text>
        </View>

        {/* 섹션 카드들 */}
        {SECTIONS.map((section) => (
          <SectionCard key={section.num} section={section} />
        ))}

        {/* 푸터 */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={14} color="#C9716A" />
          <Text style={styles.footerText}>
            © 2025 Mongle Inc. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F5',
  },

  // ── 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3a2e2a',
  },
  headerSub: {
    fontSize: 10,
    color: '#B8A9A5',
    marginTop: 1,
    letterSpacing: 0.5,
  },

  // ── 스크롤 내용
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── 히어로 배너
  heroBanner: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#C9716A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5EAE9',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3a2e2a',
    marginBottom: 6,
  },
  heroDate: {
    fontSize: 11,
    color: '#B8A9A5',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  heroDesc: {
    fontSize: 13,
    color: '#8A7870',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── 섹션 카드
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  highlightCard: {
    borderColor: '#F5C5C0',
    backgroundColor: '#FFFAFA',
    shadowColor: '#C9716A',
    shadowOpacity: 0.1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5EAE9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  numBadgeHighlight: {
    backgroundColor: '#C9716A',
  },
  numText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C9716A',
  },
  numTextHighlight: {
    color: '#fff',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3a2e2a',
    flex: 1,
  },
  cardTitleHighlight: {
    color: '#C9716A',
  },
  importantTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C9716A',
  },
  cardContent: {
    fontSize: 13,
    color: '#6B5B55',
    lineHeight: 20,
    marginBottom: 8,
  },

  // ── 불릿
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D4B4B1',
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#6B5B55',
    lineHeight: 20,
  },

  // ── 서브 아이템 (5조)
  subItem: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  subItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a2e2a',
    marginLeft: 4,
  },
  subItemDetail: {
    fontSize: 12,
    color: '#8A7870',
    lineHeight: 18,
    paddingLeft: 18,
    marginBottom: 2,
  },

  // ── 노트
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#EBF2EE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#5A7E6E',
    fontWeight: '500',
    flex: 1,
  },

  // ── 푸터
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 11,
    color: '#B8A9A5',
  },
});

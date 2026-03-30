import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const SECTIONS = [
  {
    num: '1',
    title: '총칙',
    paragraphs: [
      '본 서비스 "몽글(Mongle)"(이하 "회사")은 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.',
      '회사는 개인정보 처리방침을 통해 이용자의 개인정보가 어떠한 목적과 방식으로 이용되는지 안내합니다.',
    ],
  },
  {
    num: '2',
    title: '수집하는 개인정보 항목',
    content: '회사는 다음의 개인정보를 수집할 수 있습니다.',
    groups: [
      {
        label: '(1) 회원 가입 및 서비스 이용 시',
        items: ['이메일', '닉네임', '로그인 정보(OAuth 등)'],
      },
      {
        label: '(2) 견적 데이터 제공(업로드) 시',
        items: [
          '결혼 관련 정보 (예식 날짜, 지역 등)',
          '견적서 내 포함된 정보 (단, 업로드 시 마스킹 처리 권장)',
        ],
      },
      {
        label: '(3) 자동 수집 정보',
        items: ['IP 주소', '기기 정보', '앱 사용 로그'],
      },
    ],
  },
  {
    num: '3',
    title: '개인정보 수집 및 이용 목적',
    content: '회사는 다음 목적을 위해 개인정보를 이용합니다.',
    bullets: [
      '회원 관리 (가입, 인증, 계정 유지)',
      '서비스 제공 (견적 비교, 데이터 분석)',
      '통계 및 서비스 개선',
      '고객 문의 대응',
    ],
    note: '견적 데이터는 "통계적 분석 및 가격 범위 제공" 목적으로만 활용됩니다.',
  },
  {
    num: '4',
    title: '견적 데이터 처리 방식',
    highlight: true,
    subtitle: '핵심 조항',
    content: '회사는 다음 원칙을 준수합니다:',
    bullets: [
      '개인정보는 마스킹 또는 비식별 처리 후 저장',
      '개별 견적서 원본은 외부에 공개하지 않음',
    ],
    subGroup: {
      label: '서비스 내 제공 정보는 다음 형태로만 제공:',
      items: ['가격 "범위"', '통계 데이터 (평균, 분포 등)'],
    },
    note: '이는 영업비밀 침해 및 개인정보 보호를 위한 조치입니다',
  },
  {
    num: '5',
    title: '개인정보 보유 및 이용 기간',
    infoRows: [
      { icon: 'person-outline', label: '회원 정보', value: '탈퇴 시까지' },
      { icon: 'time-outline', label: '서비스 이용 기록', value: '최대 3년' },
    ],
    subGroup: {
      label: '법령에 따른 보존:',
      items: ['계약 관련 기록: 5년', '소비자 분쟁 기록: 3년'],
    },
  },
  {
    num: '6',
    title: '개인정보 제3자 제공',
    content: '회사는 원칙적으로 개인정보를 외부에 제공하지 않습니다.',
    subGroup: {
      label: '단, 다음의 경우 예외:',
      items: ['이용자 동의가 있는 경우', '법령에 의한 요청'],
    },
  },
  {
    num: '7',
    title: '개인정보 처리 위탁',
    content: '회사는 서비스 운영을 위해 일부 업무를 외부에 위탁할 수 있습니다.',
    subGroup: {
      label: '예:',
      items: ['클라우드 서버 (AWS, Supabase 등)', '결제 시스템'],
    },
  },
  {
    num: '8',
    title: '이용자의 권리',
    content: '이용자는 언제든지:',
    bullets: ['개인정보 조회', '수정', '삭제 요청 가능'],
  },
  {
    num: '9',
    title: '개인정보 보호 조치',
    content: '회사는 다음과 같은 보안 조치를 적용합니다:',
    bullets: ['데이터 암호화', '접근 권한 제한', '로그 기록 및 모니터링'],
  },
  {
    num: '10',
    title: '책임자',
    contact: true,
  },
];

function SectionCard({ section }) {
  return (
    <View style={[styles.card, section.highlight && styles.highlightCard]}>
      {/* 헤더 */}
      <View style={styles.cardHeader}>
        <View style={[styles.numBadge, section.highlight && styles.numBadgeHighlight]}>
          <Text style={[styles.numText, section.highlight && styles.numTextHighlight]}>
            {section.num}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, section.highlight && styles.cardTitleHighlight]}>
            {section.title}
          </Text>
          {section.subtitle && (
            <Text style={styles.subtitleTag}>{section.subtitle}</Text>
          )}
        </View>
      </View>

      {/* 단락 텍스트 (1조) */}
      {section.paragraphs && section.paragraphs.map((p, i) => (
        <Text key={i} style={[styles.cardContent, { marginBottom: i < section.paragraphs.length - 1 ? 8 : 0 }]}>
          {p}
        </Text>
      ))}

      {/* 본문 */}
      {section.content && (
        <Text style={styles.cardContent}>{section.content}</Text>
      )}

      {/* 그룹 리스트 (2조) */}
      {section.groups && section.groups.map((group, gi) => (
        <View key={gi} style={styles.groupBlock}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          {group.items.map((item, ii) => (
            <View key={ii} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      ))}

      {/* 불릿 리스트 */}
      {section.bullets && section.bullets.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}

      {/* 서브 그룹 */}
      {section.subGroup && (
        <View style={styles.subGroupBlock}>
          <Text style={styles.subGroupLabel}>{section.subGroup.label}</Text>
          {section.subGroup.items.map((item, i) => (
            <View key={i} style={styles.subBulletRow}>
              <Ionicons name="chevron-forward" size={12} color="#7A9E8E" style={{ marginTop: 3 }} />
              <Text style={styles.subBulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 정보 행 (5조) */}
      {section.infoRows && section.infoRows.map((row, i) => (
        <View key={i} style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Ionicons name={row.icon} size={14} color="#B8A9A5" />
            <Text style={styles.infoLabelText}>{row.label}</Text>
          </View>
          <Text style={styles.infoValue}>{row.value}</Text>
        </View>
      ))}

      {/* 연락처 (10조) */}
      {section.contact && (
        <View style={styles.contactCard}>
          <View style={styles.contactIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color="#7A9E8E" />
          </View>
          <Text style={styles.contactTitle}>개인정보 보호 책임자</Text>
          <View style={styles.contactEmailRow}>
            <Ionicons name="mail-outline" size={14} color="#C9716A" />
            <Text style={styles.contactEmail}>support@mongle.app</Text>
          </View>
        </View>
      )}

      {/* 노트 */}
      {section.note && (
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={14} color="#7A9E8E" />
          <Text style={styles.noteText}>※ {section.note}</Text>
        </View>
      )}
    </View>
  );
}

export default function PrivacyScreen() {
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
          <Text style={styles.headerTitle}>개인정보 처리방침</Text>
          <Text style={styles.headerSub}>Privacy Policy</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 히어로 배너 */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={32} color="#7A9E8E" />
          </View>
          <Text style={styles.heroTitle}>개인정보 처리방침</Text>
          <Text style={styles.heroDate}>최종 업데이트: 2025년 1월 1일</Text>
          <Text style={styles.heroDesc}>
            몽글은 이용자의 개인정보를 소중히 다룹니다.{'\n'}
            아래 방침을 꼭 읽어보세요.
          </Text>
        </View>

        {/* 섹션 카드들 */}
        {SECTIONS.map((section) => (
          <SectionCard key={section.num} section={section} />
        ))}

        {/* 푸터 */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={14} color="#7A9E8E" />
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

  // ── 스크롤
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── 히어로
  heroBanner: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#7A9E8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EBF2EE',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF2EE',
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
    borderColor: '#B8D8CA',
    backgroundColor: '#F8FCFA',
    shadowColor: '#7A9E8E',
    shadowOpacity: 0.1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5EAE9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  numBadgeHighlight: {
    backgroundColor: '#7A9E8E',
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
  },
  cardTitleHighlight: {
    color: '#4A7A6A',
  },
  subtitleTag: {
    fontSize: 11,
    color: '#7A9E8E',
    fontWeight: '600',
    marginTop: 2,
  },
  cardContent: {
    fontSize: 13,
    color: '#6B5B55',
    lineHeight: 20,
    marginBottom: 10,
  },

  // ── 그룹 블록 (2조)
  groupBlock: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A4E4A',
    marginBottom: 6,
    backgroundColor: '#F5F0EE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
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

  // ── 서브 그룹
  subGroupBlock: {
    marginTop: 8,
    backgroundColor: '#F5F0EE',
    borderRadius: 10,
    padding: 12,
  },
  subGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A4E4A',
    marginBottom: 8,
  },
  subBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  subBulletText: {
    flex: 1,
    fontSize: 12,
    color: '#6B5B55',
    lineHeight: 18,
  },

  // ── 정보 행 (5조)
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
    marginBottom: 4,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabelText: {
    fontSize: 13,
    color: '#6B5B55',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a2e2a',
  },

  // ── 연락처 (10조)
  contactCard: {
    backgroundColor: '#EBF2EE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  contactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#7A9E8E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3a2e2a',
    marginBottom: 8,
  },
  contactEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contactEmail: {
    fontSize: 13,
    color: '#C9716A',
    fontWeight: '600',
  },

  // ── 노트
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    lineHeight: 18,
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

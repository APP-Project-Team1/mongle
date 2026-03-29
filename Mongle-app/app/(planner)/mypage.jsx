import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────────
//  MyPage — role: 'planner' | 'couple'
// ─────────────────────────────────────────────────────────────────
export default function MyPage() {
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);

    // ✅ 핵심 수정: 초기값 false → 세션 확인 전에 로딩 스피너로 화면이 막히지 않도록
    const [loading, setLoading] = useState(false);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // ── 1. 세션 감지 ─────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            // ✅ 핵심 수정: 세션 없어도 redirect 하지 않음
            // → _layout.jsx 에서 tabBarButton 제거했으므로 Expo Router가 정상 처리
            if (!session) return;
            setSession(session);
            setLoading(true);
            loadProfile(session.user.id);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setLoading(true);
                loadProfile(session.user.id);
            } else {
                setRole(null);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // ── 2. 프로필 2단계 조회 ─────────────────────────────────────
    //  1단계: user_profiles 테이블 → role, planner_id / couple_id 확인
    //  2단계: planner → wedding_planners 테이블  (planner_id = id)
    //         couple  → couples 테이블           (couple_id  = id)
    const loadProfile = async (userId) => {
        try {
            // 1단계
            const { data: profileRow, error: profileError } = await supabase
                .from('user_profiles')
                .select('role, planner_id, couple_id')
                .eq('id', userId)
                .single();
            if (profileError) throw profileError;

            const { role, planner_id, couple_id } = profileRow;
            setRole(role);

            // 2단계
            if (role === 'planner' && planner_id) {
                const { data, error } = await supabase
                    .from('wedding_planners')
                    .select(
                        'name, brand_name, title, one_liner, specialties, style_keywords, career_years, weddings_completed, major_experiences, profile_image_url',
                    )
                    .eq('id', planner_id)
                    .single();
                if (error) throw error;
                setProfile(data);
            } else if (role === 'couple' && couple_id) {
                const { data, error } = await supabase
                    .from('couples')
                    .select('groom_name, bride_name, email, phone')
                    .eq('id', couple_id)
                    .single();
                if (error) throw error;
                setProfile(data);
            }
        } catch (e) {
            console.error('프로필 로드 실패:', e.message);
        } finally {
            setLoading(false);
        }
    };

    // ── 3. 로그아웃 ──────────────────────────────────────────────
    const handleLogout = () => {
        Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '로그아웃',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    // ── 4. 회원 탈퇴 ─────────────────────────────────────────────
    const handleDeleteAccount = async () => {
        if (confirmText !== '탈퇴합니다') {
            Alert.alert('확인 문구를 정확히 입력해주세요.');
            return;
        }
        try {
            const { error } = await supabase.from('user_profiles').delete().eq('id', session.user.id);
            if (error) throw error;
            await supabase.auth.signOut();
            setDeleteModalVisible(false);
            Alert.alert('탈퇴 완료', '그동안 Mongle을 이용해주셔서 감사했습니다.', [
                { text: '확인', onPress: () => router.replace('/(auth)/login') },
            ]);
        } catch (e) {
            Alert.alert('탈퇴 실패', e.message);
        }
    };

    // ── 로딩 ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#c9a98e" />
                </View>
            </SafeAreaView>
        );
    }

    const isPlanner = role === 'planner';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ── 헤더 ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color="#3a2e2a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>마이페이지</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* ── 프로필 카드 (공통) ── */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={36} color="#917878" />
                        </View>
                    </View>

                    <View
                        style={[styles.roleBadge, isPlanner ? styles.roleBadgePlanner : styles.roleBadgeCouple]}
                    >
                        <Ionicons
                            name={isPlanner ? 'briefcase-outline' : 'heart-outline'}
                            size={11}
                            color={isPlanner ? '#917878' : '#c9a98e'}
                        />
                        <Text
                            style={[
                                styles.roleBadgeText,
                                isPlanner ? styles.roleBadgeTextPlanner : styles.roleBadgeTextCouple,
                            ]}
                        >
                            {isPlanner ? '웨딩 플래너' : '커플'}
                        </Text>
                    </View>

                    <Text style={styles.profileName}>{profile?.name ?? '-'}</Text>
                    {isPlanner && profile?.brand_name ? (
                        <Text style={styles.profileBrand}>{profile.brand_name}</Text>
                    ) : null}
                    <Text style={styles.profileEmail}>{session?.user?.email ?? ''}</Text>
                </View>

                {/* ══════════════════════════════════════════
            PLANNER 전용 섹션
            출처: wedding_planners 테이블
        ══════════════════════════════════════════ */}
                {isPlanner && (
                    <>
                        {/* 한 줄 소개 */}
                        {!!profile?.one_liner && (
                            <View style={styles.oneLinerWrap}>
                                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#c9a98e" />
                                <Text style={styles.oneLinerText}>"{profile.one_liner}"</Text>
                            </View>
                        )}

                        {/* 경력 · 성사 웨딩 통계 */}
                        <View style={styles.statsRow}>
                            <StatBox
                                icon="calendar-outline"
                                value={profile?.career_years != null ? `${profile.career_years}년` : '-'}
                                label="경력"
                            />
                            <View style={styles.statDivider} />
                            <StatBox
                                icon="heart-circle-outline"
                                value={
                                    profile?.weddings_completed != null ? `${profile.weddings_completed}건` : '-'
                                }
                                label="성사 웨딩"
                            />
                        </View>

                        {/* 전문 분야 */}
                        {profile?.specialties?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>전문 분야</Text>
                                <View style={styles.chipWrap}>
                                    {profile.specialties.map((s) => (
                                        <View key={s} style={[styles.chip, styles.chipPrimary]}>
                                            <Text style={styles.chipTextPrimary}>{s}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* 스타일 키워드 */}
                        {profile?.style_keywords?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>스타일 키워드</Text>
                                <View style={styles.chipWrap}>
                                    {profile.style_keywords.map((k) => (
                                        <View key={k} style={styles.chip}>
                                            <Text style={styles.chipText}>{k}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* 주요 경험 */}
                        {profile?.major_experiences?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>주요 경험</Text>
                                <View style={styles.infoCard}>
                                    {profile.major_experiences.map((exp, i) => (
                                        <React.Fragment key={exp}>
                                            <View style={styles.expRow}>
                                                <View style={styles.expDot} />
                                                <Text style={styles.expText}>{exp}</Text>
                                            </View>
                                            {i < profile.major_experiences.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* 플래너 설정 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>설정</Text>
                            <View style={styles.menuCard}>
                                <MenuRow
                                    icon="create-outline"
                                    label="프로필 편집"
                                    onPress={() => router.push('/(planner)/edit-profile')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="notifications-outline"
                                    label="알림 설정"
                                    onPress={() => router.push('/settings/notifications')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="lock-closed-outline"
                                    label="비밀번호 변경"
                                    onPress={() => router.push('/settings/password')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="shield-checkmark-outline"
                                    label="개인정보 처리방침"
                                    onPress={() => router.push('/settings/privacy')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="document-text-outline"
                                    label="이용약관"
                                    onPress={() => router.push('/settings/terms')}
                                />
                            </View>
                        </View>
                    </>
                )}

                {/* ══════════════════════════════════════════
            COUPLE 전용 섹션
            출처: couples 테이블
        ══════════════════════════════════════════ */}
                {!isPlanner && (
                    <>
                        {/* 계정 정보 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>계정 정보</Text>
                            <View style={styles.infoCard}>
                                {/* couples 테이블의 groom_name / bride_name 둘 다 표시 */}
                                {profile?.groom_name ? (
                                    <>
                                        <InfoRow icon="person-outline" label="신랑" value={profile.groom_name} />
                                        <Divider />
                                        <InfoRow
                                            icon="person-outline"
                                            label="신부"
                                            value={profile?.bride_name ?? '-'}
                                        />
                                        <Divider />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow icon="person-outline" label="이름" value={profile?.name ?? '-'} />
                                        <Divider />
                                    </>
                                )}
                                <InfoRow icon="mail-outline" label="이메일" value={session?.user?.email ?? '-'} />
                            </View>
                        </View>

                        {/* 커플 설정 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>설정</Text>
                            <View style={styles.menuCard}>
                                <MenuRow
                                    icon="person-circle-outline"
                                    label="프로필 설정"
                                    onPress={() => router.push('/settings/profile')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="notifications-outline"
                                    label="알림 설정"
                                    onPress={() => router.push('/settings/notifications')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="lock-closed-outline"
                                    label="비밀번호 변경"
                                    onPress={() => router.push('/settings/password')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="shield-checkmark-outline"
                                    label="개인정보 처리방침"
                                    onPress={() => router.push('/settings/privacy')}
                                />
                                <Divider />
                                <MenuRow
                                    icon="document-text-outline"
                                    label="이용약관"
                                    onPress={() => router.push('/settings/terms')}
                                />
                            </View>
                        </View>
                    </>
                )}

                {/* ── 로그아웃 (공통) ── */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={18} color="#917878" />
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>

                {/* ── 회원 탈퇴 (공통) ── */}
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => setDeleteModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.deleteText}>회원 탈퇴</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── 회원 탈퇴 확인 모달 ── */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="warning-outline" size={32} color="#e87070" />
                        </View>
                        <Text style={styles.modalTitle}>정말 탈퇴하시겠어요?</Text>
                        <Text style={styles.modalDesc}>
                            탈퇴하면 모든 데이터가 삭제되며{'\n'}복구할 수 없습니다.
                        </Text>
                        <Text style={styles.modalHint}>
                            계속하려면 <Text style={{ fontWeight: '700', color: '#e87070' }}>'탈퇴합니다'</Text>를
                            입력하세요.
                        </Text>
                        <TextInput
                            style={styles.confirmInput}
                            placeholder="탈퇴합니다"
                            placeholderTextColor="#C5BFBF"
                            value={confirmText}
                            onChangeText={setConfirmText}
                        />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setConfirmText('');
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalDeleteBtn,
                                    confirmText !== '탈퇴합니다' && styles.modalDeleteBtnDisabled,
                                ]}
                                onPress={handleDeleteAccount}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalDeleteText}>탈퇴하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────────────────────────
//  서브 컴포넌트
// ─────────────────────────────────────────────────────────────────
function StatBox({ icon, value, label }) {
    return (
        <View style={styles.statBox}>
            <Ionicons name={icon} size={20} color="#c9a98e" style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
                <Ionicons name={icon} size={16} color="#917878" />
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function MenuRow({ icon, label, onPress }) {
    return (
        <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.infoLeft}>
                <Ionicons name={icon} size={16} color="#917878" />
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C5BFBF" />
        </TouchableOpacity>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

// ─────────────────────────────────────────────────────────────────
//  스타일
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF7F5' },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // 헤더
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0E8E4',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#3a2e2a', letterSpacing: 0.3 },

    scrollContent: { paddingBottom: 20 },

    // 프로필 카드
    profileCard: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 24,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0E8E4',
    },
    avatarWrap: { marginBottom: 12 },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#F5EFEC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E8DDD8',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 10,
    },
    roleBadgePlanner: { backgroundColor: '#F5F0EE', borderColor: '#E8DDD8' },
    roleBadgeCouple: { backgroundColor: '#FFF5F0', borderColor: '#F5D9CE' },
    roleBadgeText: { fontSize: 11, fontWeight: '600' },
    roleBadgeTextPlanner: { color: '#917878' },
    roleBadgeTextCouple: { color: '#c9a98e' },

    profileName: { fontSize: 20, fontWeight: '700', color: '#3a2e2a', marginBottom: 2 },
    profileBrand: { fontSize: 13, color: '#c9a98e', fontWeight: '500', marginBottom: 2 },
    profileEmail: { fontSize: 13, color: '#917878' },

    // 한 줄 소개
    oneLinerWrap: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F0E8E4',
    },
    oneLinerText: { flex: 1, fontSize: 13, color: '#8a7870', lineHeight: 20, fontStyle: 'italic' },

    // 통계
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0E8E4',
        overflow: 'hidden',
    },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 20 },
    statDivider: { width: 1, backgroundColor: '#F0E8E4', marginVertical: 14 },
    statValue: { fontSize: 18, fontWeight: '700', color: '#3a2e2a', marginBottom: 2 },
    statLabel: { fontSize: 11, color: '#917878' },

    // 칩
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E8DDD8',
    },
    chipPrimary: { backgroundColor: '#FFF5F0', borderColor: '#F5D9CE' },
    chipText: { fontSize: 12, color: '#8a7870' },
    chipTextPrimary: { fontSize: 12, color: '#c9a98e', fontWeight: '600' },

    // 주요 경험
    expRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 13 },
    expDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c9a98e', marginTop: 5 },
    expText: { flex: 1, fontSize: 13, color: '#3a2e2a', lineHeight: 20 },

    // 섹션
    section: { marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#B9B4B4',
        letterSpacing: 0.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },

    // 공통 카드
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F0E8E4',
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoLabel: { fontSize: 14, color: '#3a2e2a', fontWeight: '500' },
    infoValue: { fontSize: 14, color: '#8a7870', maxWidth: '55%', textAlign: 'right' },

    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F0E8E4',
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    menuLabel: { fontSize: 14, color: '#3a2e2a', fontWeight: '400' },

    divider: { height: 1, backgroundColor: '#F5F0EE' },

    // 로그아웃
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 10,
        height: 50,
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E8DDD8',
    },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#917878' },

    // 회원 탈퇴
    deleteBtn: { alignItems: 'center', paddingVertical: 12, marginHorizontal: 20 },
    deleteText: { fontSize: 13, color: '#C5BFBF', textDecorationLine: 'underline' },

    // 모달
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(58,46,42,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    modalBox: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
    },
    modalIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#3a2e2a', marginBottom: 8 },
    modalDesc: {
        fontSize: 14,
        color: '#8a7870',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 16,
    },
    modalHint: {
        fontSize: 13,
        color: '#8a7870',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 19,
    },
    confirmInput: {
        width: '100%',
        height: 44,
        borderWidth: 1.5,
        borderColor: '#E8DDD8',
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 14,
        color: '#3a2e2a',
        marginBottom: 20,
        backgroundColor: '#FAF7F5',
    },
    modalBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
    modalCancelBtn: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#F5F0EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, fontWeight: '600', color: '#8a7870' },
    modalDeleteBtn: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#e87070',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalDeleteBtnDisabled: { backgroundColor: '#F0C8C8' },
    modalDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { getPostAuthRoute, signIn, signOut, waitForResolvedAuth } from '../../lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPlanner, setIsPlanner] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showAlert = (message) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const renderBottomTab = () => (
    <View style={tabStyles.container}>
      <TouchableOpacity
        style={tabStyles.tabItem}
        onPress={() => router.replace('/(couple)/(tabs)/timeline')}
      >
        <Ionicons name="calendar-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>일정</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tabStyles.tabItem}
        onPress={() => router.replace('/(couple)/(tabs)/budget')}
      >
        <Ionicons name="wallet-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>비용</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)')}>
        <Ionicons name="home-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>홈</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tabStyles.tabItem}
        onPress={() => router.replace('/(couple)/(tabs)/chat')}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>채팅</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem}>
        <Ionicons name="person-outline" size={24} color="#c9a98e" />
        <Text style={[tabStyles.tabText, { color: '#c9a98e' }]}>마이</Text>
      </TouchableOpacity>
    </View>
  );

  // ── 로그인 처리 ──────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      // Supabase 로그인
      const data = await signIn(email, password);

      // user_metadata에서 role 확인 (DB 쿼리 없이)
      const userRole = data.user.user_metadata?.role;

      if (!userRole) {
        await signOut();
        setLoading(false);
        showAlert('계정 정보를 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.');
        return;
      }

      // 선택한 탭과 실제 role이 다를 경우 안내 후 로그아웃
      if (userRole === 'planner' && !isPlanner) {
        await signOut();
        setLoading(false);
        showAlert('웨딩 플래너 계정입니다.\n웨딩 플래너 탭을 선택해주세요.');
        return;
      }
      if (userRole === 'couple' && isPlanner) {
        await signOut();
        setLoading(false);
        showAlert('예비 신혼 계정입니다.\n예비 신혼 탭을 선택해주세요.');
        return;
      }

      // 로그인이 성공적으로 완료되면 전역 상태(_layout.jsx의 AuthGate)에서
      // session 변경을 감지하고 자동으로 role에 맞는 화면으로 전환함.
      // 직접 router.replace를 호출하면 Expo Router 컴포넌트 라우팅 충돌로 멈춤(Freeze) 발생
      if (Platform.OS === 'ios') {
        const { route } = await waitForResolvedAuth({ expectedRole: userRole });
        setLoading(false);
        router.replace(route || getPostAuthRoute(userRole));
        return;
      }
    } catch (e) {
      setLoading(false);
      showAlert('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(couple)')}
      >
        <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>Mongle</Text>
          <Text style={styles.logoSub}>웨딩의 모든 것을 한 곳에서</Text>
        </View>

        <LottieView
          source={require('../../assets/lottie/Animated_leaves.json')}
          autoPlay
          loop
          style={{ width: 140, height: 140, left: 80 }}
        />

        <View style={styles.form}>
          {/* 로그인 유형 선택 탭 */}
          <View style={styles.roleTabContainer}>
            <TouchableOpacity
              style={[styles.roleTab, !isPlanner && styles.activeRoleTab]}
              onPress={() => setIsPlanner(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleTabText, !isPlanner && styles.activeRoleTabText]}>
                예비 신혼
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleTab, isPlanner && styles.activeRoleTab]}
              onPress={() => setIsPlanner(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleTabText, isPlanner && styles.activeRoleTabText]}>
                웨딩 플래너
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={16} color="#8a7870" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력해주세요."
              placeholderTextColor="#8a7870"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color="#8a7870"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#8a7870"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons
                name={showPw ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color="#8a7870"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtnWrapper, styles.shadow, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#d6a6a6', '#d5d1b3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginBtnGradient}
            >
              <Text style={styles.loginBtnText}>{loading ? '로그인 중...' : '로그인'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.authLinksRow}>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.authLinkText}>회원가입</Text>
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity onPress={() => showAlert('비밀번호 찾기 기능은 준비 중입니다.')}>
            <Text style={styles.authLinkText}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 커스텀 모달 */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>알림</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              activeOpacity={0.85}
              onPress={() => setModalVisible(false)}
            >
              <LinearGradient
                colors={['#c89494', '#ccc79e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalBtnGradient}
              >
                <Text style={styles.modalBtnText}>확인</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderBottomTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 16, paddingBottom: 0 },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 10 },
  logo: {
    fontFamily: 'serif',
    fontSize: 36,
    fontStyle: 'italic',
    color: '#917878',
    letterSpacing: 2,
    marginBottom: 8,
  },
  logoSub: { fontSize: 13, color: '#B49191', letterSpacing: 0.5 },
  form: { gap: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderColor: '#e3dcd7',
    borderWidth: 1,
  },
  inputIcon: { marginHorizontal: 10 },
  input: { flex: 1, fontSize: 14, color: '#3a2e2a' },
  eyeBtn: { padding: 4 },
  loginBtnWrapper: {
    width: '100%',
    height: 56,
    marginTop: 20,
    borderRadius: 10,
  },
  loginBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  loginBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.5 },
  shadow: {
    shadowColor: '#c1a8a8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  authLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  authLinkText: {
    fontSize: 13,
    color: '#B49191',
    fontWeight: '600',
  },
  linkDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#e8dcd7',
  },
  roleTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeRoleTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8a7870',
  },
  activeRoleTabText: {
    color: '#917878',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3a2e2a',
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 14,
    color: '#8a7870',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBtn: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    marginTop: 8,
  },
  modalBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopColor: '#f0e8e4',
    borderTopWidth: 1,
    height: Platform.OS === 'android' ? 65 : 60,
    paddingBottom: Platform.OS === 'ios' ? 15 : 10,
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: 11,
    color: '#8a7870',
    marginTop: 4,
    fontWeight: '500',
  },
});

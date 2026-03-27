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
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPlanner, setIsPlanner] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: null });
  
  const signUp = useAuthStore((state) => state.signUp);

  const renderBottomTab = () => (
    <View style={tabStyles.container}>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)')}>
        <Ionicons name="home-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>홈</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tabStyles.tabItem}
        onPress={() => router.replace('/(couple)/timeline')}
      >
        <Ionicons name="calendar-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>일정</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.replace('/(couple)/chat')}>
        <Ionicons name="chatbubble-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>채팅</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.push('/(auth)/login')}>
        <Ionicons name="person-outline" size={24} color="#c9a98e" />
        <Text style={[tabStyles.tabText, { color: '#c9a98e' }]}>마이</Text>
      </TouchableOpacity>
    </View>
  );

  const showModal = (title, message, onConfirm = null) => {
    setModalConfig({ title, message, onConfirm });
    setModalVisible(true);
  };

  // 이메일 형식 검사
  const handleVerifyEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal('알림', '유효한 이메일 형식을 입력해주세요.');
      return;
    }
    showModal('알림', '이메일 확인이 완료되었습니다.', () => {
      setIsEmailVerified(true);
    });
  };

  // 비밀번호 유효성: 영문 대/소문자, 숫자, 특수문자 포함 8~16자
  const isValidPassword = (pw) => {
    const pwRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/;
    return pwRegex.test(pw);
  };

  const isSignUpEnabled = isEmailVerified && isValidPassword(password);

  const handleRegister = async () => {
    if (!isSignUpEnabled) return;

    try {
      setLoading(true);
      const role = isPlanner ? 'planner' : 'couple';
      const { data, error } = await signUp(email, password, role);

      if (error) {
        if (error.message?.includes('already registered')) {
          showModal('알림', '이미 가입된 이메일입니다.');
        } else {
          showModal('알림', error.message || '회원가입 중 오류가 발생했습니다.');
        }
      } else {
        const roleText = isPlanner ? '웨딩 플래너' : '예비 신혼';
        showModal(
          '환영합니다!',
          `${roleText} 가입이 완료되었습니다.`,
          () => router.replace('/(auth)/login'),
        );
      }
    } catch (e) {
      showModal('알림', '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>Mongle</Text>
            <Text style={styles.logoSub}>새로운 시작을 함께하세요</Text>
          </View>

          <View style={styles.form}>
            {/* 가입 유형 선택 탭 */}
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

            {/* 이메일 입력 & 형식 확인 */}
            <View style={styles.emailContainer}>
              <View style={[styles.inputWrap, styles.emailInputWrap]}>
                <Ionicons name="mail-outline" size={16} color="#8a7870" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="아이디 (이메일)"
                  placeholderTextColor="#8a7870"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setIsEmailVerified(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isEmailVerified}
                />
              </View>
              <TouchableOpacity
                style={[styles.verifyBtn, isEmailVerified && styles.verifyBtnDisabled]}
                onPress={handleVerifyEmail}
                disabled={isEmailVerified}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.verifyBtnText, isEmailVerified && styles.verifyBtnTextDisabled]}
                >
                  {isEmailVerified ? '확인완료' : '확인'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 비밀번호 입력 */}
            <View style={styles.pwContainer}>
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
              <Text
                style={[
                  styles.hintText,
                  password.length > 0 && !isValidPassword(password)
                    ? { color: '#d77875' }
                    : password.length > 0 && isValidPassword(password)
                      ? { color: '#94b381' }
                      : null,
                ]}
              >
                * 영문 대문자, 소문자, 숫자, 특수문자 최소 하나 포함 (8~16자)
              </Text>
            </View>

            {/* 가입하기 버튼 */}
            <TouchableOpacity
              style={[
                styles.registerBtnWrapper,
                (!isSignUpEnabled || loading) && styles.registerBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={!isSignUpEnabled || loading}
            >
              <LinearGradient
                colors={
                  isSignUpEnabled && !loading ? ['#c89494', '#ccc79e'] : ['#e5e3e3', '#e8e7e2']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.registerBtnGradient}
              >
                <Text style={styles.registerBtnText}>
                  {loading ? '가입 중...' : '가입하기'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              activeOpacity={0.85}
              onPress={() => {
                setModalVisible(false);
                modalConfig.onConfirm?.();
              }}
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
  inner: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logo: {
    fontFamily: 'serif',
    fontSize: 36,
    fontStyle: 'italic',
    color: '#917878',
    letterSpacing: 2,
    marginBottom: 8,
  },
  logoSub: { fontSize: 13, color: '#B49191', letterSpacing: 0.5 },
  form: { gap: 16 },
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
  emailContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailInputWrap: { flex: 1 },
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
  verifyBtn: {
    backgroundColor: '#9d7878',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#c8c0bd',
    borderWidth: 1,
  },
  verifyBtnDisabled: { backgroundColor: '#e8e0dc' },
  verifyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  verifyBtnTextDisabled: { color: '#8a7870' },
  pwContainer: { gap: 8 },
  eyeBtn: { padding: 4 },
  hintText: { fontSize: 12, color: '#8a7870', marginLeft: 4 },
  registerBtnWrapper: {
    width: '100%',
    height: 50,
    marginTop: 20,
    borderRadius: 10,
  },
  registerBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.5 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 36,
  },
  loginText: { fontSize: 13, color: '#8a7870' },
  loginLink: { fontSize: 13, color: '#B49191', fontWeight: '600' },
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

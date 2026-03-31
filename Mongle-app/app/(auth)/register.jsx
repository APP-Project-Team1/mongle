import { useState } from 'react';
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
import { supabase } from '../../lib/supabase';
import {
  checkEmailAvailable,
  getPostAuthRoute,
  signUpCouple,
  signUpPlanner,
  verifySignupOtp,
  waitForResolvedAuth,
} from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const { setRegistrationPending } = useAuth();

  const [isPlanner, setIsPlanner] = useState(false);

  // Step 1: 이메일
  const [email, setEmail] = useState('');
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null); // null | true | false

  // Step 2~4: OTP 발송 / 인증
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 6~8: 비밀번호
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [finalLoading, setFinalLoading] = useState(false);

  // 모달
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: null });

  const showModal = (title, message, onConfirm = null) => {
    setModalConfig({ title, message, onConfirm });
    setModalVisible(true);
  };

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPassword = (pw) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(pw);

  // 이메일 변경 시 하위 단계 초기화
  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailAvailable(null);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setPassword('');
    setPasswordConfirm('');
  };

  // Step 1: 이메일 확인 (형식 + 중복 체크)
  const handleCheckEmail = async () => {
    if (!isValidEmail(email)) {
      showModal('알림', '유효한 이메일 형식을 입력해주세요.');
      return;
    }
    try {
      setEmailCheckLoading(true);
      const available = await checkEmailAvailable(email);
      if (available) {
        setEmailAvailable(true);
      } else {
        setEmailAvailable(false);
        showModal('알림', '이미 사용 중인 이메일입니다.');
      }
    } catch (e) {
      showModal('오류', e.message || '이메일 확인 중 오류가 발생했습니다.');
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Step 3: 인증번호 발송
  const handleSendOtp = async () => {
    try {
      setOtpSending(true);
      // 임시 비밀번호로 계정 생성 (OTP 이메일 발송 트리거)
      const tempPw = `Tx${Math.random().toString(36).slice(2, 10)}!9A`;
      const data = isPlanner
        ? await signUpPlanner(email, tempPw)
        : await signUpCouple(email, tempPw);

      // identities가 비어있으면 이미 등록된 이메일 (race condition 방어)
      if (data?.user?.identities?.length === 0) {
        setEmailAvailable(false);
        showModal('알림', '이미 사용 중인 이메일입니다.\n로그인해주세요.');
        return;
      }
      setOtpSent(true);
    } catch (e) {
      showModal('오류', e.message || '인증번호 발송에 실패했습니다.');
    } finally {
      setOtpSending(false);
    }
  };

  // Step 5: OTP 인증
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      showModal('알림', '인증번호를 입력해주세요.');
      return;
    }
    try {
      setOtpVerifying(true);
      // 리디렉션 방지 플래그 먼저 설정 (verifyOtp 성공 시 세션 생성 → onAuthStateChange 방어)
      setRegistrationPending(true);
      await verifySignupOtp(email, otpCode.trim());
      setOtpVerified(true);
      showModal('알림', '인증이 완료되었습니다.');
    } catch (e) {
      setRegistrationPending(false);
      showModal('알림', e.message || '인증번호가 올바르지 않거나 만료되었습니다.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Step 8: 회원가입 완료 (비밀번호 설정)
  const handleFinalSignup = async () => {
    if (!isValidPassword(password)) {
      showModal(
        '알림',
        '비밀번호 조건을 확인해주세요.\n(영문 대소문자, 숫자, 특수문자 포함 8~16자)',
      );
      return;
    }
    if (password !== passwordConfirm) {
      showModal('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      setFinalLoading(true);
      // 현재 세션(verifyOtp로 생성)을 사용해 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // 전역 가입 대기 상태 해제.
      // _layout.jsx의 AuthGate에서 자동으로 role에 맞게 라우팅(화면 이동)함.
      // 직접 router.replace를 호출하면 Expo Router 내비게이션 충돌로 멈춤(Freezing) 발생
      setRegistrationPending(false);

      if (Platform.OS === 'ios') {
        const expectedRole = isPlanner ? 'planner' : 'couple';
        const { route } = await waitForResolvedAuth({ expectedRole });
        setFinalLoading(false);
        router.replace(route || getPostAuthRoute(expectedRole));
        return;
      }

      // 버튼을 '처리 중...' 상태로 둔 채 화면이 자동으로 넘어갈 때까지 대기
    } catch (e) {
      setFinalLoading(false);
      showModal('오류', e.message || '비밀번호 설정에 실패했습니다.');
    }
  };

  const isFinalEnabled = isValidPassword(password) && password === passwordConfirm && !finalLoading;

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
      <TouchableOpacity style={tabStyles.tabItem} onPress={() => router.push('/(auth)/login')}>
        <Ionicons name="person-outline" size={24} color="#8a7870" />
        <Text style={tabStyles.tabText}>마이</Text>
      </TouchableOpacity>
    </View>
  );

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
            {/* 가입 유형 선택 (OTP 발송 전까지만 변경 가능) */}
            <View style={styles.roleTabContainer}>
              <TouchableOpacity
                style={[styles.roleTab, !isPlanner && styles.activeRoleTab]}
                onPress={() => !otpSent && setIsPlanner(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleTabText, !isPlanner && styles.activeRoleTabText]}>
                  예비 신혼
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleTab, isPlanner && styles.activeRoleTab]}
                onPress={() => !otpSent && setIsPlanner(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleTabText, isPlanner && styles.activeRoleTabText]}>
                  웨딩 플래너
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step 1: 이메일 입력 + 확인 버튼 */}
            <View style={styles.emailContainer}>
              <View style={[styles.inputWrap, styles.emailInputWrap]}>
                <Ionicons name="mail-outline" size={16} color="#8a7870" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="아이디 (이메일)"
                  placeholderTextColor="#8a7870"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!otpSent}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  (emailAvailable === true || emailCheckLoading || otpSent) &&
                    styles.verifyBtnDisabled,
                ]}
                onPress={handleCheckEmail}
                disabled={emailAvailable === true || emailCheckLoading || otpSent}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.verifyBtnText,
                    (emailAvailable === true || otpSent) && styles.verifyBtnTextDisabled,
                  ]}
                >
                  {emailCheckLoading ? '확인중' : emailAvailable === true ? '완료' : '확인'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 이메일 사용 가능 메시지 */}
            {emailAvailable === true && (
              <Text style={styles.successText}>✓ 사용 가능한 이메일입니다.</Text>
            )}

            {/* Step 2~3: 인증번호 발송 버튼 */}
            {emailAvailable === true && !otpSent && (
              <TouchableOpacity
                style={[styles.sendOtpBtn, otpSending && styles.sendOtpBtnDisabled]}
                onPress={handleSendOtp}
                disabled={otpSending}
                activeOpacity={0.8}
              >
                <Text style={styles.sendOtpBtnText}>
                  {otpSending ? '발송 중...' : '인증번호 발송'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Step 4~5: OTP 입력 + 인증 버튼 */}
            {otpSent && !otpVerified && (
              <View style={{ gap: 8 }}>
                <View style={styles.emailContainer}>
                  <View style={[styles.inputWrap, styles.emailInputWrap]}>
                    <Ionicons
                      name="key-outline"
                      size={16}
                      color="#8a7870"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="이메일 인증번호 입력"
                      placeholderTextColor="#8a7870"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      maxLength={8}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.verifyBtn, otpVerifying && styles.verifyBtnDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={otpVerifying}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyBtnText}>{otpVerifying ? '확인중' : '인증'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>* 이메일로 받은 인증번호를 입력해주세요.</Text>
              </View>
            )}

            {/* 인증 완료 메시지 */}
            {otpVerified && <Text style={styles.successText}>✓ 인증이 완료되었습니다.</Text>}

            {/* Step 6~8: 비밀번호 설정 (인증 완료 후 노출) */}
            {otpVerified && (
              <>
                {/* 비밀번호 */}
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

                {/* 비밀번호 확인 */}
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
                      placeholder="비밀번호 확인"
                      placeholderTextColor="#8a7870"
                      value={passwordConfirm}
                      onChangeText={setPasswordConfirm}
                      secureTextEntry={!showPwConfirm}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPwConfirm(!showPwConfirm)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPwConfirm ? 'eye-outline' : 'eye-off-outline'}
                        size={16}
                        color="#8a7870"
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordConfirm.length > 0 && (
                    <Text
                      style={[
                        styles.hintText,
                        password === passwordConfirm ? { color: '#94b381' } : { color: '#d77875' },
                      ]}
                    >
                      {password === passwordConfirm
                        ? '✓ 비밀번호가 일치합니다.'
                        : '✗ 비밀번호가 일치하지 않습니다.'}
                    </Text>
                  )}
                </View>

                {/* 회원가입 버튼 */}
                <TouchableOpacity
                  style={[styles.registerBtnWrapper, !isFinalEnabled && styles.registerBtnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleFinalSignup}
                  disabled={!isFinalEnabled}
                >
                  <LinearGradient
                    colors={isFinalEnabled ? ['#c89494', '#ccc79e'] : ['#e5e3e3', '#e8e7e2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.registerBtnGradient}
                  >
                    <Text style={styles.registerBtnText}>
                      {finalLoading ? '처리 중...' : '회원가입'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}>
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
  roleTabText: { fontSize: 14, fontWeight: '500', color: '#8a7870' },
  activeRoleTabText: { color: '#917878', fontWeight: '700' },
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
  sendOtpBtn: {
    backgroundColor: '#9d7878',
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#c8c0bd',
    borderWidth: 1,
  },
  sendOtpBtnDisabled: { backgroundColor: '#e8e0dc' },
  sendOtpBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  successText: { fontSize: 12, color: '#94b381', marginLeft: 4 },
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
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#3a2e2a', letterSpacing: 0.3 },
  modalMessage: { fontSize: 14, color: '#8a7870', textAlign: 'center', lineHeight: 20 },
  modalBtn: { width: '100%', height: 46, borderRadius: 10, marginTop: 8 },
  modalBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  modalBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.5 },
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
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabText: { fontSize: 11, color: '#8a7870', marginTop: 4, fontWeight: '500' },
});

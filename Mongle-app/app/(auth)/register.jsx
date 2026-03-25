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
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // 이메일 정규식 검사
  const handleVerifyEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('알림', '유효한 이메일 형식을 입력해주세요.');
      return;
    }
    // 이메일 인증 완료 처리
    Alert.alert('알림', '이메일 인증이 완료되었습니다.');
    setIsEmailVerified(true);
  };

  // 비밀번호 정규식: 영문 대/소문자, 숫자, 특수문자 포함 8~16자
  const isValidPassword = (pw) => {
    const pwRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/;
    return pwRegex.test(pw);
  };

  const isSignUpEnabled = isEmailVerified && isValidPassword(password);

  const handleRegister = () => {
    if (isSignUpEnabled) {
      Alert.alert('환영합니다!', '회원가입이 완료되었습니다.', [
        { text: '확인', onPress: () => router.replace('/(auth)/login') }
      ]);
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
            {/* 이메일(아이디) 입력 & 인증 */}
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
                    setIsEmailVerified(false); // 이메일 변경 시 인증 초기화
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
                <Text style={[styles.verifyBtnText, isEmailVerified && styles.verifyBtnTextDisabled]}>
                  {isEmailVerified ? '인증완료' : '인증'}
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
              <Text style={[
                styles.hintText,
                password.length > 0 && !isValidPassword(password) ? { color: '#d9534f' } :
                  password.length > 0 && isValidPassword(password) ? { color: '#4caf50' } : null
              ]}>
                * 영문 대문자, 소문자, 숫자, 특수문자 최소 하나 포함 (8~16자)
              </Text>
            </View>

            {/* 가입하기 버튼 */}
            <TouchableOpacity
              style={[styles.registerBtn, !isSignUpEnabled && styles.registerBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={!isSignUpEnabled}
            >
              <Text style={styles.registerBtnText}>가입하기</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 16, paddingBottom: 0 },
  inner: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingVertical: 20, flexGrow: 1, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logo: {
    fontFamily: 'serif',
    fontSize: 36,
    fontStyle: 'italic',
    color: '#6b4c4c',
    letterSpacing: 2,
    marginBottom: 8,
  },
  logoSub: { fontSize: 13, color: '#8a7870', letterSpacing: 0.5 },
  form: { gap: 16 },
  emailContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailInputWrap: { flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0ee',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#3a2e2a' },
  verifyBtn: {
    backgroundColor: '#c9a98e',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnDisabled: {
    backgroundColor: '#e8e0dc',
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  verifyBtnTextDisabled: {
    color: '#8a7870',
  },
  pwContainer: { gap: 8 },
  eyeBtn: { padding: 4 },
  hintText: {
    fontSize: 12,
    color: '#8a7870',
    marginLeft: 4,
  },
  registerBtn: {
    backgroundColor: '#c9a98e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  registerBtnDisabled: {
    backgroundColor: '#e8e0dc',
  },
  registerBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.5 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 36,
  },
  loginText: { fontSize: 13, color: '#8a7870' },
  loginLink: { fontSize: 13, color: '#c9a98e', fontWeight: '600' },
});

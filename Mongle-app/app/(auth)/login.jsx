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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useAuthStore } from '../../stores/authStore';
import { Alert } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);

    if (error) {
      Alert.alert('로그인 실패', error.message || '이메일 또는 비밀번호를 확인해주세요.');
      setLoading(false);
    } else {
      router.replace('/(couple)');
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
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>Mongle</Text>
          <Text style={styles.logoSub}>웨딩의 모든 것을 한 곳에서</Text>
        </View>

        <LottieView
          source={require('../../assets/lottie/Animated_leaves.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200, left: 100 }}
        />

        <View style={styles.form}>
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
            style={[styles.loginBtnWrapper, styles.shadow]}
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
              <Text style={styles.loginBtnText}>
                {loading ? '로그인 중...' : '로그인'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>아직 계정이 없으신가요?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loginBtn: {
    backgroundColor: '#c9a98e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },

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
    // iOS
    shadowColor: '#c1a8a8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,

    // Android
    elevation: 6,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: '#e8e0dc' },
  dividerText: { fontSize: 12, color: '#8a7870' },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  kakaoBtnText: { fontSize: 15, fontWeight: '600', color: '#3a2e2a', letterSpacing: 0.5 },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 36,
  },
  registerText: { fontSize: 13, color: '#8a7870' },
  registerLink: { fontSize: 13, color: '#B49191', fontWeight: '600' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

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

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={16} color="#8a7870" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이메일"
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
            style={styles.loginBtn}
            activeOpacity={0.85}
            onPress={() => router.replace('/(couple)')}
          >
            <Text style={styles.loginBtnText}>로그인</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.kakaoBtn} activeOpacity={0.85}>
            <Text style={styles.kakaoBtnText}>카카오로 계속하기</Text>
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
  form: { gap: 12 },
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
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: '#c9a98e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.5 },
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
  registerLink: { fontSize: 13, color: '#c9a98e', fontWeight: '600' },
});

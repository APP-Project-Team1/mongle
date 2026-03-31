import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function PasswordSettingsScreen() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 비밀번호 표시 토글
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isValidPassword = (pw) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(pw);

  const isFormValid =
    currentPassword.length > 0 &&
    isValidPassword(newPassword) &&
    newPassword === confirmPassword;

  const handleSave = async () => {
    if (!session?.user?.email) return;

    try {
      setSaving(true);

      const sbUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const sbKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!sbUrl || !sbKey) {
        throw new Error('Supabase 설정 정보 누락 (Metro 환경변수 미인식)');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${sbUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sbKey,
        },
        body: JSON.stringify({
          email: session.user.email,
          password: currentPassword,
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error('현재 비밀번호가 일치하지 않습니다.');
      }

      if (currentPassword === newPassword) {
        throw new Error('새 비밀번호는 현재 비밀번호와 다르게 설정해주세요.');
      }

      // 3. 비밀번호 업데이트 승인 (gotrue-js 로딩 에러 방지를 위해 직접 PUT 요청)
      const updateRes = await fetch(`${sbUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: sbKey,
          Authorization: `Bearer ${data.access_token}`
        },
        body: JSON.stringify({
          password: newPassword,
        }),
        signal: controller.signal
      });

      const updateData = await updateRes.json();

      if (!updateRes.ok || updateData.error) {
        throw new Error('새 비밀번호 업데이트 중 문제가 발생했습니다.');
      }

      // 비밀번호가 변경되면 발급받은 새 토큰으로 로컬 세션 갱신
      if (updateData.access_token && updateData.refresh_token) {
        await supabase.auth.setSession({
          access_token: updateData.access_token,
          refresh_token: updateData.refresh_token
        });
      }

      Alert.alert('완료', '비밀번호가 성공적으로 변경되었습니다.', [
        { text: '확인', onPress: () => setTimeout(() => router.back(), 100) },
      ]);
    } catch (e) {
      let errorMsg = e.message || '알 수 없는 오류가 발생했습니다.';
      if (e.name === 'AbortError') errorMsg = '네트워크 응답이 지연되어 취소되었습니다.';
      Alert.alert('오류', errorMsg);
    } finally {
      setTimeout(() => setSaving(false), 200);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#c9a98e" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#3a2e2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>비밀번호 변경</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.formSection}>

            {/* 현재 비밀번호 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>현재 비밀번호</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="key-outline" size={18} color="#8a7870" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="현재 사용 중인 비밀번호"
                  placeholderTextColor="#C5BFBF"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} style={styles.eyeBtn}>
                  <Ionicons name={showCurrentPw ? 'eye-outline' : 'eye-off-outline'} size={18} color="#8a7870" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 새 비밀번호 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#8a7870" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="새로운 비밀번호 입력"
                  placeholderTextColor="#C5BFBF"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={styles.eyeBtn}>
                  <Ionicons name={showNewPw ? 'eye-outline' : 'eye-off-outline'} size={18} color="#8a7870" />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.hintText,
                  newPassword.length > 0 && !isValidPassword(newPassword)
                    ? { color: '#d77875' }
                    : newPassword.length > 0 && isValidPassword(newPassword)
                      ? { color: '#94b381' }
                      : null,
                ]}
              >
                * 영문 대소문자, 숫자, 특수문자 포함 (8~16자)
              </Text>
            </View>

            {/* 새 비밀번호 확인 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호 확인</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#8a7870" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="새 비밀번호 다시 입력"
                  placeholderTextColor="#C5BFBF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPw ? 'eye-outline' : 'eye-off-outline'} size={18} color="#8a7870" />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && (
                <Text
                  style={[
                    styles.hintText,
                    newPassword === confirmPassword ? { color: '#94b381' } : { color: '#d77875' },
                  ]}
                >
                  {newPassword === confirmPassword
                    ? '✓ 비밀번호가 일치합니다.'
                    : '✗ 비밀번호가 일치하지 않습니다.'}
                </Text>
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.bottomBtnRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, (!isFormValid || saving) && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={!isFormValid || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>변경하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F5' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { flex: 1 },
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
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#3a2e2a', letterSpacing: 0.3 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 100 },
  formSection: { gap: 28 },
  inputGroup: { gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#3a2e2a', marginBottom: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#E8DDD8',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#3a2e2a' },
  eyeBtn: { padding: 6, marginLeft: 4 },
  hintText: { fontSize: 12, color: '#8a7870', marginLeft: 4 },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0E8E4',
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F5F0EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#8a7870' },
  saveBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#c9a98e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

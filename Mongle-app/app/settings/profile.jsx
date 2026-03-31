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
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileSettingsScreen() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState(null); // 로컬 선택 또는 기존 원격 URL
  const [originalImage, setOriginalImage] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name, profile_image_url')
        .eq('id', userId)
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        const { name: fetchedName, profile_image_url } = data[0];
        setName(fetchedName || '');
        setImageUri(profile_image_url || null);
        setOriginalImage(profile_image_url || null);
      }
    } catch (error) {
      console.error('프로필 로드 에러:', error);
      Alert.alert('오류', '프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!uri) return null;
    // 이미 기존에 등록된 원격 URL이라면 새로 업로드할 필요 없음
    if (uri.startsWith('http')) return uri;

    try {
      // 확장자 추출 (기본 jpg)
      let fileExt = 'jpeg';
      const match = uri.match(/\.([a-zA-Z0-9]+)$/);
      if (match) fileExt = match[1];

      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // React Native 환경에서는 fetch(blob) 객체 생성보다 FormData 전송이 훨씬 안정적입니다.
      const formData = new FormData();
      formData.append('files', {
        uri: uri,
        name: fileName,
        type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Public URL 가져오기
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return publicData.publicUrl;
    } catch (e) {
      console.error('이미지 업로드 실패:', e);
      throw new Error(`이미지 업로드 오류: ${e.message}\n(SQL 설정이 안되어있을 수도 있습니다)`);
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    try {
      setSaving(true);
      let newImageUrl = imageUri;

      // 이미지가 변경되었다면 업로드 수행
      if (imageUri !== originalImage) {
        newImageUrl = await uploadImage(imageUri);
      }

      // DB 업데이트
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: name.trim() || null,
          profile_image_url: newImageUrl,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      Alert.alert('완료', '프로필이 성공적으로 업데이트되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('저장 실패', e.message);
    } finally {
      setSaving(false);
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
        <Text style={styles.headerTitle}>프로필 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* 프로필 이미지 섹션 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="#917878" />
                </View>
              )}
              <View style={styles.camIconWrap}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>사진을 눌러 변경하기</Text>
          </View>

          {/* 입력 필드 섹션 */}
          <View style={styles.formSection}>
            <Text style={styles.label}>이름 (닉네임)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#8a7870" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이름을 입력해주세요"
                placeholderTextColor="#C5BFBF"
                value={name}
                onChangeText={setName}
                maxLength={20}
              />
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
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>저장</Text>
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
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5EFEC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8DDD8',
    position: 'relative',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 60 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
  camIconWrap: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#917878',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: { fontSize: 13, color: '#917878', marginTop: 12 },
  formSection: { gap: 10 },
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

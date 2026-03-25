import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 개발 서버의 호스트 IP를 자동으로 추출
// 실기기에서 localhost는 기기 자신을 가리키기 때문에 Expo의 hostUri에서 IP를 가져옴
function getBaseUrl() {
  if (Platform.OS === 'android') {
    // Android 에뮬레이터: 호스트 머신 = 10.0.2.2
    const host = Constants.expoConfig?.hostUri?.split(':').shift();
    return host ? `http://${host}:8000` : 'http://10.0.2.2:8000';
  }
  // iOS 실기기 / 시뮬레이터: Expo manifest에서 호스트 IP 추출
  const host = Constants.expoConfig?.hostUri?.split(':').shift();
  return host ? `http://${host}:8000` : 'http://localhost:8000';
}

export const BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  chat: `${BASE_URL}/api/chat`,
};

// app/(couple)/_layout.jsx
import { Tabs } from 'expo-router';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function CoupleLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // tabBarShowLabel: false,
        tabBarActiveTintColor: '#c9a98e',
        tabBarInactiveTintColor: '#8a7870',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0e8e4',
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 65 : 85,
          paddingBottom: Platform.OS === 'android' ? 12 : 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: '일정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: '채팅',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="docs" options={{ href: null }} />
      <Tabs.Screen name="vendors" options={{ href: null }} />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={() => router.push('/(auth)/login')} />
          ),
        }}
      />
    </Tabs>
  );
}

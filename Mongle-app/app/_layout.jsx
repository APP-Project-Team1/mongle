// app/_layout.jsx
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from '../context/NotificationContext';
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <StatusBar style="dark" />
        <Slot initialRouteName="(couple)" />
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

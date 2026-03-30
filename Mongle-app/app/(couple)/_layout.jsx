// app/(couple)/_layout.jsx
import { Stack } from 'expo-router';

export default function CoupleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="budget-dashboard" />
      <Stack.Screen name="estimate-comparison" />
      <Stack.Screen name="pdf-history" />
    </Stack>
  );
}

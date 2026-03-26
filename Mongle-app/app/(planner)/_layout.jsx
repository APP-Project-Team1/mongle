import { Stack } from 'expo-router';

export default function PlannerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="planner_todo_list" />
      <Stack.Screen name="couple_list" />
      <Stack.Screen name="wedding_vendor_partners" />
      <Stack.Screen name="planner_budget" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

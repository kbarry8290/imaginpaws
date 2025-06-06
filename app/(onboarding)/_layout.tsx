import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="photo-upload" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="transforming" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
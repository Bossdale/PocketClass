// app/_layout.tsx  ← NEW FILE
import "../global.css";  // ← imports your styles for the whole app
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="Onboarding" />
      <Stack.Screen name="DiagnosticTest" />
      <Stack.Screen name="LessonView" />
      <Stack.Screen name="SubjectView" />
      <Stack.Screen name="QuarterlyExam" />
    </Stack>
  );
}
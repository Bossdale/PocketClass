// app/_layout.tsx  ← NEW FILE
import "../global.css";  // ← imports your styles for the whole app
import { Stack } from 'expo-router';
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { initializeDatabase, seedDatabaseFromJSON } from '../lib/database';


export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // 1. Create the tables
        await initializeDatabase();
        // 2. Populate the tables with the JSON data
        await seedDatabaseFromJSON();
        // 3. Mark as ready so the UI can render
        setIsDbReady(true);
      } catch (error) {
        console.error("Database setup failed:", error);
      }
    };

    setupDatabase();
  }, []);

  // Prevent the rest of the app from loading until the DB is ready
  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading PocketClass Data...</Text>
      </View>
    );
  }
  
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
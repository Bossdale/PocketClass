import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getProfile } from '../lib/store';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function checkUser() {
      // We must AWAIT the profile because mobile storage is asynchronous
      const profile = await getProfile();
      setHasProfile(!!profile);
      setIsLoading(false);
    }
    checkUser();
  }, []);

  // Show a loading spinner while checking the mobile hard drive
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Route the user using Expo Router
  if (hasProfile) {
    return <Redirect href="/(tabs)" />; // Goes to Dashboard
  }
  
  return <Redirect href="/onboarding" />; // Goes to Setup
}
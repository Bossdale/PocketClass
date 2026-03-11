import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Route the user using Expo Router
  if (hasProfile) {
    return <Redirect href="/(tabs)" />; // Goes to Dashboard
  }
  
  return <Redirect href="/Onboarding" />; // Goes to Setup
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff', // Use '#111827' if you want the dark mode color
  },
});
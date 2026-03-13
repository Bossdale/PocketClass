import { Redirect } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Image, Text, Animated } from 'react-native';
import { getProfile } from '../lib/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  
  // Create an animated value for a smooth fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the fade-in animation immediately on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    async function checkUser() {
      // Promise.all ensures the splash screen stays visible for at least 2 seconds 
      // even if fetching the profile from AsyncStorage is instantaneous.
      await AsyncStorage.clear(); 
      
      const [profile] = await Promise.all([
        getProfile(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      setHasProfile(!!profile);
      setIsLoading(false);
    }
    checkUser();
  },[]);

  // Display the custom Splash Screen while loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.splashContent, { opacity: fadeAnim }]}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.logoTitle}>PocketClass</Text>
        </Animated.View>
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
    backgroundColor: '#ffffff', 
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  }
});
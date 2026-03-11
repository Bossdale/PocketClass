import React from 'react';
import { Tabs } from 'expo-router';
import { Home } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        // We hide the default header because your Dashboard has its own custom header!
        headerShown: false, 
        tabBarActiveTintColor: '#3b82f6', // Your PocketClass primary blue color
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
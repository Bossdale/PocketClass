
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, StatusBar } from 'react-native';
import { ShieldCheck, LogOut } from 'lucide-react-native';

interface LayoutProps {
  children: React.ReactNode;
  onDisconnect: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onDisconnect }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.iconWrapper}>
            <Image 
              source={require('../assets/images/pillsync-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.logoText}><Text style={styles.logoHighlight}>MedSync</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={onDisconnect} style={styles.logoutButton}>
          {/* Fix: use stroke instead of color for lucide-react-native types */}
          <LogOut size={20} stroke="#94a3b8" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.main}>
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 2,
    marginRight: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  logoHighlight: {
    color: '#2563eb',
  },
  logoutButton: {
    padding: 8,
  },
  main: {
    paddingBottom: 40,
  },
});
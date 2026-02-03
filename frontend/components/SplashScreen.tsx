
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        {/* Fix: use stroke instead of color for lucide-react-native types */}
        <ShieldCheck size={80} stroke="#fff" strokeWidth={1.5} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>MedBox</Text>
        <Text style={styles.subtitle}>SMART IOT ECOSYSTEM</Text>
      </View>
      <View style={styles.loader}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotDelayed]} />
        <View style={[styles.dot, styles.dotMoreDelayed]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  logoWrapper: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 32, borderRadius: 48 },
  textContainer: { marginTop: 32, alignItems: 'center' },
  title: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 12, fontWeight: 'bold', color: '#dbeafe', letterSpacing: 2, marginTop: 8 },
  loader: { position: 'absolute', bottom: 64, flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, backgroundColor: '#fff', borderRadius: 4 },
  dotDelayed: { opacity: 0.6 },
  dotMoreDelayed: { opacity: 0.3 }
});

export default SplashScreen;
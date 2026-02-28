import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Card from '../components/Card';
import { Colors } from '../constants/Colors';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.greeting}>Hello, Student</Text>
        <View style={styles.offlinePill}>
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.lessonCard}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Lesson 1: Plant Anatomy</Text>
            <TouchableOpacity onPress={() => router.push('/lesson')}>
              <Text style={styles.startReading}>Start Reading →</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.syncFooter}>
        <Text style={styles.syncText}>Wi-Fi Sync: Waiting for stable connection...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, marginTop: 20 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  offlinePill: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  offlineText: { color: Colors.surface, fontSize: 12, fontWeight: 'bold' },
  container: { paddingHorizontal: 24 },
  lessonCard: { borderLeftWidth: 6, borderLeftColor: Colors.primary, padding: 20 },
  cardContent: { gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  startReading: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  syncFooter: { padding: 16, alignItems: 'center' },
  syncText: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
});
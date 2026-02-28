import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Card from '../components/Card';
import { Colors } from '../constants/Colors'; // Fixed from Colors to Color

// Firebase imports
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfigs'; // Make sure this path is correct based on where you put firebaseConfig.ts

export default function DashboardScreen() {
  const [studentName, setStudentName] = useState('Student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetching the specific student document (+639123456789) from your 'students' collection
        const docRef = doc(db, "students", "+639123456789");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Fetched data:", data);
          
          // Assuming your Firestore document has a 'name' or 'firstName' field.
          // Adjust "data.name" if your database field is named differently (e.g., data.fullName)
          if (data.name) {
            setStudentName(data.name);
          }
        } else {
          console.log("No student document found!");
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        {/* Dynamic greeting based on Firestore data */}
        <Text style={styles.greeting}>
          {loading ? "Loading..." : `Hello, ${studentName}`}
        </Text>
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
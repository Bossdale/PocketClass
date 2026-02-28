import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../constants/Colors';

export default function LessonScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.minimalHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Lesson 1: Plant Anatomy & Photosynthesis</Text>

        <Text style={styles.bodyText}>
          Plants are essential to life on Earth. They are the only living things that can make their own food. To do this, they rely on a process called photosynthesis.
        </Text>
        <Text style={styles.bodyText}>
          The roots of a plant anchor it to the ground and absorb water and nutrients from the soil. The stem provides structure and carries the water up to the leaves.
        </Text>
        <Text style={styles.bodyText}>
          Leaves are the food factories of the plant. They capture sunlight and use it to turn carbon dioxide and water into glucose (sugar) and oxygen. This is the miracle of photosynthesis.
        </Text>

        <View style={styles.ctaContainer}>
          <PrimaryButton
            title="Take the Self-Check Quiz"
            onPress={() => router.push('/quiz')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface }, // Pure white for reading
  minimalHeader: { padding: 16, paddingLeft: 24 },
  backButton: { padding: 8, marginLeft: -8 },
  backText: { fontSize: 18, color: Colors.textSecondary, fontWeight: '500' },
  container: { padding: 24, paddingBottom: 60 },
  h1: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 24, lineHeight: 36 },
  bodyText: { fontSize: 18, color: Colors.textPrimary, lineHeight: 28, marginBottom: 20 },
  ctaContainer: { marginTop: 40 },
});
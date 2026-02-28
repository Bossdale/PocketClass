import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import TierBadge from '../components/TierBadge';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../constants/Colors';

export default function QuizScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Self-Check: Plant Anatomy</Text>
        <Text style={styles.subHeader}>Solve these on a piece of scratch paper.</Text>

        {/* Section 1: EASY */}
        <View style={styles.section}>
          <TierBadge tier="Easy" label="Foundational" />
          <Text style={styles.question}>1. What part of the plant absorbs water from the soil?</Text>
          <Text style={styles.options}>A) Leaves   B) Roots   C) Stem   D) Flowers</Text>

          <Text style={styles.question}>2. Which gas do plants need for photosynthesis?</Text>
          <Text style={styles.options}>A) Oxygen   B) Nitrogen   C) Carbon Dioxide   D) Hydrogen</Text>
        </View>

        {/* Section 2: MEDIUM */}
        <View style={styles.section}>
          <TierBadge tier="Medium" label="Application" />
          <Text style={styles.question}>5. If a plant's stem is damaged, what process is most directly affected first?</Text>
          <Text style={styles.options}>A) Sun absorption   B) Water transport   C) Pollination</Text>
        </View>

        {/* Section 3: HARD */}
        <View style={styles.section}>
          <TierBadge tier="Hard" label="Complex" />
          <Text style={styles.question}>9. Explain the relationship between cellular respiration in humans and photosynthesis in plants.</Text>
          <Text style={styles.options}>(Write a brief paragraph on your paper)</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomActionArea}>
        <Text style={styles.instructionText}>
          Finished? Text <Text style={styles.bold}>BIO5-Q2-L1</Text> to <Text style={styles.bold}>09123456789</Text> to get your answer key & AI guide.
        </Text>
        <PrimaryButton
          title="Return to Dashboard"
          onPress={() => router.navigate('/dashboard')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 24, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  subHeader: { fontSize: 16, color: Colors.textSecondary, marginBottom: 32 },
  section: { marginBottom: 32 },
  question: { fontSize: 18, color: Colors.textPrimary, fontWeight: '500', marginTop: 16, lineHeight: 26 },
  options: { fontSize: 16, color: Colors.textSecondary, marginTop: 8, lineHeight: 24, paddingLeft: 16 },
  bottomActionArea: {
    padding: 24, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 5
  },
  instructionText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  bold: { fontWeight: 'bold', color: Colors.textPrimary },
});
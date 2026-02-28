import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import Card from '../components/Card';
import CustomCheckbox from '../components/CustomCheckbox';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../constants/Colors';

const MOCK_MODULES = [
  { id: '1', title: 'Lesson 1: Plant Anatomy', subtitle: 'Roots, stems, and leaves.' },
  { id: '2', title: 'Lesson 2: Photosynthesis', subtitle: 'How plants make food.' },
  { id: '3', title: 'Lesson 3: Ecosystems', subtitle: 'Interactions in nature.' },
];

export default function SelectionScreen() {
  const [selected, setSelected] = useState<string[]>(['1']); // Default select first

  const toggleSelection = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Available Modules (Grade 5 Biology)</Text>

        {MOCK_MODULES.map(mod => (
          <Card key={mod.id} style={styles.cardLayout}>
            <CustomCheckbox
              isChecked={selected.includes(mod.id)}
              onToggle={() => toggleSelection(mod.id)}
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              <Text style={styles.cardSubtitle}>{mod.subtitle}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.selectionCount}>{selected.length} Lesson{selected.length !== 1 ? 's' : ''} Selected</Text>
        <PrimaryButton
          title="Create Dashboard"
          onPress={() => router.push('/dashboard')}
          style={styles.buttonWidth}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 24 },
  header: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginBottom: 20 },
  cardLayout: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardText: { marginLeft: 16, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.border
  },
  selectionCount: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  buttonWidth: { width: '50%' },
});
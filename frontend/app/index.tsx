import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../constants/Colors';

export default function OnboardingScreen() {
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Offline Learn.</Text>
          <Text style={styles.subtitle}>Let's set up your offline classroom.</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Student Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />
          <CustomInput
            label="Select School"
            placeholder="Rural High A"
            isDropdown
          />
          <CustomInput
            label="Grade Level"
            placeholder="Grade 5"
            isDropdown
          />
          <CustomInput
            label="Quarter"
            placeholder="Quarter 2"
            isDropdown
          />
          <CustomInput
            label="Subject"
            placeholder="Biology"
            isDropdown
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Find My Lessons"
          onPress={() => router.push('/selection')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 24, flexGrow: 1 },
  header: { marginBottom: 32, marginTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary },
  form: { flex: 1 },
  footer: { padding: 24, backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.border },
});
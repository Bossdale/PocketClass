import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Globe, GraduationCap, ArrowRight } from 'lucide-react-native';

import { saveProfile, initializeSubjectProgress, generateId } from '../lib/store';
import { getCurriculumName, type Country } from '../lib/types';

const COUNTRIES: { id: Country; name: string; flag: string }[] =[
  { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩' },
  { id: 'malaysia', name: 'Malaysia', flag: '🇲🇾' },
  { id: 'brunei', name: 'Brunei', flag: '🇧🇳' },
];

const colors = {
  primary: '#3b82f6',
  primaryLight: '#eff6ff',
  primaryDark: '#1d4ed8',
  primaryMuted: '#93c5fd',
  foreground: '#0f172a',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  white: '#ffffff',
};

export default function Onboarding() {
  const router = useRouter(); 
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const[grade, setGrade] = useState<number | null>(null);

  const canContinue = step === 0 ? name.trim().length > 0 : step === 1 ? country !== null : grade !== null;

  const handleContinue = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else if (name && country && grade) {
      await saveProfile({
        id: generateId(),
        name: name.trim(),
        country,
        grade,
        createdAt: new Date().toISOString(),
      });
      await initializeSubjectProgress();
      
      router.replace('/(tabs)'); 
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoTitleRow}>
              <View style={styles.logoIconBox}>
                <GraduationCap size={28} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.logoTitle}>PocketClass</Text>
            </View>
            <Text style={styles.logoSubtitle}>Your AI tutor, always with you</Text>
          </View>

          {/* Step Card */}
          <View style={styles.card}>
            
            {step === 0 && (
              <View>
                <View style={styles.stepHeader}>
                  <User size={22} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.stepTitle}>What's your name?</Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.textInput}
                  onSubmitEditing={() => canContinue && handleContinue()}
                  returnKeyType="next"
                  autoFocus
                />
              </View>
            )}

            {step === 1 && (
              <View>
                <View style={styles.stepHeader}>
                  <Globe size={22} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.stepTitle}>Where are you from?</Text>
                </View>
                <View style={styles.listContainer}>
                  {COUNTRIES.map(c => {
                    const isSelected = country === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        activeOpacity={0.7}
                        onPress={() => setCountry(c.id)}
                        style={[
                          styles.listItem,
                          isSelected && styles.listItemSelected
                        ]}
                      >
                        <View style={styles.flagBox}>
                          <Text style={styles.flagText}>{c.flag}</Text>
                        </View>
                        <View>
                          <Text style={[styles.countryName, isSelected && styles.textSelected]}>
                            {c.name}
                          </Text>
                          <Text style={[styles.curriculumText, isSelected && styles.subTextSelected]}>
                            {getCurriculumName(c.id)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <View style={styles.stepHeader}>
                  <GraduationCap size={22} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.stepTitle}>Select your grade</Text>
                </View>
                
                {/* UPGRADED UNIFORM GRID */}
                <View style={styles.gridContainer}>
                  {[7, 8, 9, 10, 11, 12].map(g => {
                    const isSelected = grade === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        activeOpacity={0.7}
                        onPress={() => setGrade(g)}
                        style={[
                          styles.gridItem,
                          isSelected && styles.gridItemSelected
                        ]}
                      >
                        <Text style={[
                          styles.gradeText, 
                          isSelected && styles.gradeTextSelected
                        ]}>
                          Grade {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleContinue}
            disabled={!canContinue}
            style={[
              styles.continueButton,
              { backgroundColor: canContinue ? colors.primary : colors.primaryMuted }
            ]}
          >
            <Text style={styles.continueButtonText}>
              {step === 2 ? 'Start Learning' : 'Continue'}
            </Text>
            {step === 2 && <ArrowRight size={20} color={colors.white} strokeWidth={2.5} />}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 15,
    color: colors.mutedForeground,
    fontWeight: '500',
  },

  // Main Card
  card: {
    backgroundColor: colors.cardBackground,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },

  // Step 0: Name Input
  textInput: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
    borderWidth: 2,
    borderColor: colors.border,
  },

  // Step 1: Country List
  listContainer: {
    gap: 12,
  },
  listItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  listItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  flagBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 22,
  },
  countryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  curriculumText: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  textSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  subTextSelected: {
    color: colors.primary,
  },

  // Step 2: Upgraded Grade Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, 
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', // Ensures exactly 2 columns
    height: 72,   // Fixed height guarantees all boxes are strictly the same size
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  gradeTextSelected: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 17, // Slight pop effect when selected
  },

  // Continue Button
  continueButton: {
    width: '100%',
    marginTop: 32,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
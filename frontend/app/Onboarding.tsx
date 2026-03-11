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

// Assuming these are your local imports
import { saveProfile, initializeSubjectProgress, generateId } from '../lib/store';
import { getCurriculumName, type Country } from '../lib/types';

const COUNTRIES: { id: Country; name: string; flag: string }[] = [
  { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩' },
  { id: 'malaysia', name: 'Malaysia', flag: '🇲🇾' },
  { id: 'brunei', name: 'Brunei', flag: '🇧🇳' },
];

const colors = {
  primary: '#3b82f6',
  primaryLight: 'rgba(59, 130, 246, 0.1)',
  primaryMuted: 'rgba(59, 130, 246, 0.5)',
  foreground: '#111827',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  cardBackground: '#ffffff', // Maps to secondary/20 or white depending on theme
  white: '#ffffff',
};

export default function Onboarding() {
  const router = useRouter(); 
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [grade, setGrade] = useState<number | null>(null);

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
                <GraduationCap size={24} color={colors.primary} />
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
                  <User size={20} color={colors.primary} />
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
                  <Globe size={20} color={colors.primary} />
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
                          isSelected ? styles.listItemSelected : styles.listItemUnselected
                        ]}
                      >
                        <Text style={styles.flagText}>{c.flag}</Text>
                        <View>
                          <Text style={styles.countryName}>{c.name}</Text>
                          <Text style={styles.curriculumText}>{getCurriculumName(c.id)}</Text>
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
                  <GraduationCap size={20} color={colors.primary} />
                  <Text style={styles.stepTitle}>Select your grade</Text>
                </View>
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
                          isSelected ? styles.listItemSelected : styles.listItemUnselected
                        ]}
                      >
                        <Text style={[
                          styles.gradeText, 
                          { color: isSelected ? colors.primary : colors.foreground }
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
            {step === 2 && <ArrowRight size={20} color={colors.white} />}
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
    marginBottom: 32,
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500/20
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  logoSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
  },

  // Main Card
  card: {
    backgroundColor: colors.cardBackground,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },

  // Step 0: Name Input
  textInput: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Step 1: Country List
  listContainer: {
    gap: 8, // Requires RN 0.71+
  },
  listItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  listItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  listItemUnselected: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  flagText: {
    fontSize: 24,
  },
  countryName: {
    fontWeight: '500',
    color: colors.foreground,
  },
  curriculumText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },

  // Step 2: Grade Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // Requires RN 0.71+
    justifyContent: 'space-between',
  },
  gridItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    width: '31%', // Fits 3 in a row with gap
    alignItems: 'center',
  },
  gradeText: {
    fontWeight: '500',
  },

  // Continue Button
  continueButton: {
    width: '100%',
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 18,
  },
});
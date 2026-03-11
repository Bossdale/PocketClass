import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useDiagnostic } from '../hooks/use-diagnostic';
import { saveDiagnosticResult, getProfile, getDiagnosticResults, generateId } from '../lib/store';
import { SUBJECTS, QUARTER_TOPICS } from '../lib/types';
// Note: getCountryClass typically returns a Tailwind string, so it's omitted from RN styling here
import DiagnosticResultCard from '../components/DiagnosticResultCard';
import type { Profile, DiagnosticResult } from '../lib/types';

const colors = {
  primary: '#3b82f6',
  primaryLight: '#eff6ff',
  primaryDark: '#2563eb',
  success: '#22c55e',
  successLight: '#f0fdf4',
  successDark: '#15803d',
  destructive: '#ef4444',
  destructiveLight: '#fef2f2',
  destructiveDark: '#b91c1c',
  foreground: '#111827',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
};

export default function DiagnosticTest() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [finalResult, setFinalResult] = useState<DiagnosticResult | null>(null);

  const subject = SUBJECTS.find(s => s.id === subjectId);

  useEffect(() => {
    async function loadProfile() {
      const p = await getProfile();
      setProfile(p);
    }
    loadProfile();
  }, []);

  const {
    questions, loading, currentIndex, answers, showQuarterIntro,
    currentQuarter, isCompleted, answerQuestion, beginQuarter, getQuarterScores,
  } = useDiagnostic(subjectId || '', subject?.name || '');

  useEffect(() => {
    async function processResults() {
      if (isCompleted && profile && !finalResult && subjectId) {
        const scores = getQuarterScores();
        const overall = Math.round((scores.q1 + scores.q2 + scores.q3 + scores.q4) / 4);
        
        const prevResults = await getDiagnosticResults(subjectId);
        
        const result: DiagnosticResult = {
          id: generateId(),
          userId: profile.id,
          subjectId,
          q1Score: scores.q1,
          q2Score: scores.q2,
          q3Score: scores.q3,
          q4Score: scores.q4,
          overallScore: overall,
          completedAt: new Date().toISOString(),
          attemptNumber: prevResults.length + 1,
        };
        
        await saveDiagnosticResult(result);
        setFinalResult(result);
      }
    }
    processResults();
  }, [isCompleted, profile, finalResult, subjectId]);

  if (!subject || !subjectId || !profile) {
    return <View style={styles.container} />;
  }

  const currentQuestion = questions[currentIndex];

  // Helper for dynamic option styling
  const getOptionStyle = (isAnswered: boolean, isSelected: boolean, isCorrect: boolean) => {
    if (!isAnswered) {
      return { 
        borderColor: colors.border, 
        backgroundColor: 'transparent', 
        textColor: colors.foreground 
      };
    }
    if (isCorrect) {
      return { 
        borderColor: colors.success, 
        backgroundColor: colors.successLight, 
        textColor: colors.successDark 
      };
    }
    if (isSelected) {
      return { 
        borderColor: colors.destructive, 
        backgroundColor: colors.destructiveLight, 
        textColor: colors.destructiveDark 
      };
    }
    return { 
      borderColor: colors.border, 
      backgroundColor: 'transparent', 
      textColor: colors.mutedForeground 
    };
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <ArrowLeft size={20} color={colors.mutedForeground} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{subject.emoji}</Text>
        <View>
          <Text style={styles.headerTitle}>{subject.name}</Text>
          <Text style={styles.headerSubtitle}>Diagnostic Test</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!loading && !isCompleted && (
        <View>
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            {questions.map((q, i) => {
              let bgColor = colors.border;
              if (i === currentIndex) bgColor = colors.primary;
              else if (i < currentIndex) {
                bgColor = answers[i] === q.correctOption ? colors.success : colors.destructive;
              }
              return <View key={i} style={[styles.progressSegment, { backgroundColor: bgColor }]} />;
            })}
          </View>

          {showQuarterIntro ? (
            <View style={styles.card}>
              <Text style={styles.quarterTitle}>Quarter {currentQuarter}</Text>
              <Text style={styles.quarterDescription}>
                {QUARTER_TOPICS[subjectId]?.[currentQuarter - 1]}
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={beginQuarter} 
              >
                <Text style={styles.primaryButtonText}>Begin</Text>
              </TouchableOpacity>
            </View>
          ) : currentQuestion ? (
            <View>
              <View style={styles.questionMetaContainer}>
                <View style={styles.questionMetaBadge}>
                  <Text style={styles.questionMetaText}>
                    Q{((currentIndex % 5) + 1)} of 5 — Quarter {currentQuarter}
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.questionText}>
                  {currentQuestion.questionText}
                </Text>
                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((opt, i) => {
                    const answered = answers[currentIndex] !== null;
                    const isSelected = answers[currentIndex] === i;
                    const isCorrect = i === currentQuestion.correctOption;
                    
                    const optionStyle = getOptionStyle(answered, isSelected, isCorrect);

                    return (
                      <TouchableOpacity
                        key={i}
                        activeOpacity={0.7}
                        onPress={() => !answered && answerQuestion(i)}
                        style={[
                          styles.optionButton,
                          { 
                            borderColor: optionStyle.borderColor,
                            backgroundColor: optionStyle.backgroundColor,
                          }
                        ]}
                      >
                        <Text style={[styles.optionText, { color: optionStyle.textColor }]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Completion State */}
      {isCompleted && finalResult && (
        <View>
          <DiagnosticResultCard result={finalResult} />
          
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 24 }]}
            onPress={() => router.replace(`/SubjectView?subjectId=${subjectId}`)}
          >
            <Text style={[styles.primaryButtonText, { fontSize: 18 }]}>
              Start Learning {subject.name}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && !finalResult && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.savingText}>Saving your results...</Text>
        </View>
      )}
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerEmoji: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  card: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 24,
  },
  
  // Progress Bar
  progressBarContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 24,
  },
  progressSegment: {
    height: 8,
    flex: 1,
    borderRadius: 4,
  },

  // Quarter Intro
  quarterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  quarterDescription: {
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },

  // Question UI
  questionMetaContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  questionMetaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: colors.primaryLight,
  },
  questionMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryDark,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
    textAlign: 'left',
    width: '100%',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Saving State
  savingText: {
    color: colors.mutedForeground,
    marginTop: 16,
  },
});
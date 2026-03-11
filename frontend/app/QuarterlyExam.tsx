import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react-native';

// Assuming local imports
import { getProfile, saveQuarterlyExamResult, getQuarterlyExamResults, generateId, getLessonsBySubject } from '../lib/store';
import { SUBJECTS, QUARTER_TOPICS } from '../lib/types';
// Note: getCountryClass typically returns a Tailwind string, so it's omitted from RN styling
import { generateQuarterlyExam } from '../lib/quizService';
import type { QuizQuestion, Profile } from '../lib/types';

import QuizRenderer from '../components/QuizRenderer';

const colors = {
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  primaryDark: '#2563eb',
  success: '#22c55e',
  successLight: '#dcfce7',
  successDark: '#15803d',
  warning: '#eab308',
  warningLight: '#fef9c3',
  warningDark: '#a16207',
  destructive: '#ef4444',
  destructiveLight: '#fee2e2',
  destructiveDark: '#b91c1c',
  foreground: '#111827',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  orange100: '#ffedd5',
};

export default function QuarterlyExam() {
  const { subjectId, quarter: quarterStr } = useLocalSearchParams<{ subjectId: string; quarter: string }>();
  const router = useRouter();
  
  const quarter = parseInt(quarterStr || '1');
  const subject = SUBJECTS.find(s => s.id === subjectId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<'intro' | 'exam' | 'complete'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [easyScore, setEasyScore] = useState(0);
  const [mediumScore, setMediumScore] = useState(0);
  const [hardScore, setHardScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      setProfile(p);
    }
    load();
  }, []);

  if (!subject || !subjectId || !profile) {
    return <View style={styles.container} />;
  }
  
  const topic = QUARTER_TOPICS[subjectId]?.[quarter - 1] || '';

  const startExam = async () => {
    setLoading(true);
    setMode('exam');
    const lessonCount = getLessonsBySubject(subjectId as string)
      .filter(l => l.quarter === quarter && !l.isQuarterlyExam).length;
    const qs = await generateQuarterlyExam(subject.name, quarter, topic, profile.grade, profile.country, lessonCount);
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setEasyScore(0);
    setMediumScore(0);
    setHardScore(0);
    setLoading(false);
  };

  const handleAnswer = async (correct: boolean) => {
    let newScore = score;
    let newEasy = easyScore;
    let newMedium = mediumScore;
    let newHard = hardScore;

    const q = questions[currentQ];
    if (correct) {
      newScore += 1;
      setScore(newScore);
      if (q.difficulty === 'easy') { newEasy += 1; setEasyScore(newEasy); }
      else if (q.difficulty === 'medium') { newMedium += 1; setMediumScore(newMedium); }
      else { newHard += 1; setHardScore(newHard); }
    }

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      const finalScore = correct ? score + 1 : score;
      const prevResults = await getQuarterlyExamResults(subjectId as string, quarter);
      
      await saveQuarterlyExamResult({
        id: generateId(),
        userId: profile.id,
        subjectId: subjectId as string,
        quarter,
        score: finalScore,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString(),
        attemptNumber: prevResults.length + 1,
      });
      
      setScore(finalScore);
      setMode('complete');
    }
  };

  const totalPct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const stars = totalPct >= 80 ? 3 : totalPct >= 50 ? 2 : 1;

  // Helper for dynamic difficulty badge styles
  const getDifficultyStyle = (difficulty: string) => {
    if (difficulty === 'easy') return { bg: colors.successLight, text: colors.successDark };
    if (difficulty === 'medium') return { bg: colors.warningLight, text: colors.warningDark };
    return { bg: colors.destructiveLight, text: colors.destructiveDark };
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentWrapper}>
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}

        >
          <ArrowLeft size={20} color={colors.mutedForeground} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{subject.emoji}</Text>
          <View>
            <Text style={styles.headerTitle}>{subject.name} — Q{quarter} Exam</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>Quarter {quarter} Exam</Text>
            </View>
          </View>
        </View>

        {/* Mode: Intro */}
        {mode === 'intro' && (
          <View style={styles.card}>
            <View style={styles.trophyIconContainer}>
              <Text style={{ fontSize: 24 }}>🏆</Text>
            </View>
            <Text style={styles.introTitle}>Quarter {quarter} Exam</Text>
            <Text style={styles.introSubtitle}>
              Test your knowledge of all lessons in this quarter
            </Text>
            
            <View style={styles.introPillsContainer}>
              <View style={styles.pill}><Text style={styles.pillText}>15 Questions</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>Mixed Types</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>All Levels</Text></View>
            </View>
            
            <TouchableOpacity style={styles.primaryButton} onPress={startExam}>
              <Text style={styles.primaryButtonText}>Start Exam</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mode: Exam */}
        {mode === 'exam' && (
          <View>
            {loading ? (
              <View style={styles.card}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Generating Exam...</Text>
              </View>
            ) : questions.length > 0 && currentQ < questions.length ? (
              <View>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  {questions.map((_, i) => {
                    let bgColor = colors.gray200;
                    if (i === currentQ) bgColor = colors.primary;
                    else if (i < currentQ) bgColor = colors.success;
                    return <View key={i} style={[styles.progressSegment, { backgroundColor: bgColor }]} />;
                  })}
                </View>

                {/* Difficulty Badge */}
                <View style={styles.difficultyBadgeContainer}>
                  {(() => {
                    const diffStyle = getDifficultyStyle(questions[currentQ].difficulty);
                    return (
                      <View style={[styles.difficultyBadge, { backgroundColor: diffStyle.bg }]}>
                        <Text style={[styles.difficultyBadgeText, { color: diffStyle.text }]}>
                          {questions[currentQ].difficulty}
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                <Text style={styles.questionTrackerText}>
                  Question {currentQ + 1} of {questions.length}
                </Text>

                {/* Question Card */}
                <View style={[styles.card, { padding: 20 }]}>
                  <QuizRenderer question={questions[currentQ]} onAnswer={handleAnswer} />
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Mode: Complete */}
        {mode === 'complete' && (
          <View style={styles.card}>
            <View style={[styles.trophyIconContainer, { marginBottom: 12 }]}>
              <Text style={{ fontSize: 24 }}>🏆</Text>
            </View>
            <Text style={styles.completeTitle}>Quarter {quarter} Exam Complete!</Text>
            <Text style={styles.completeScore}>{totalPct}%</Text>
            
            {/* Stars */}
            <View style={styles.starsContainer}>
              {[1, 2, 3].map(s => (
                <Star 
                  key={s} 
                  size={28} 
                  color={s <= stars ? colors.warning : colors.border} 
                  fill={s <= stars ? colors.warning : "transparent"} 
                />
              ))}
            </View>
            
            {/* Breakdown Pills */}
            <View style={styles.breakdownContainer}>
              <View style={[styles.breakdownPill, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.breakdownText, { color: colors.successDark }]}>Easy: {easyScore}</Text>
              </View>
              <View style={[styles.breakdownPill, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.breakdownText, { color: colors.warningDark }]}>Med: {mediumScore}</Text>
              </View>
              <View style={[styles.breakdownPill, { backgroundColor: colors.destructiveLight }]}>
                <Text style={[styles.breakdownText, { color: colors.destructiveDark }]}>Hard: {hardScore}</Text>
              </View>
            </View>
            
            {/* Action Buttons */}
            <TouchableOpacity
              onPress={() => router.replace(`/SubjectView?subjectId=${subjectId}`)}
              style={[styles.primaryButton, { marginBottom: 12 }]}
            >
              <Text style={styles.primaryButtonText}>Back to Subject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={startExam} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Retake Exam</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 64,
  },
  
  // Navigation
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerEmoji: {
    fontSize: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  headerBadgeText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '500',
  },

  // General Card
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
  },

  // Intro specific
  trophyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 16,
  },
  introPillsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pillText: {
    color: colors.mutedForeground,
    fontSize: 12,
  },

  // Exam Specific
  loadingText: {
    marginTop: 16,
    color: colors.mutedForeground,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  progressSegment: {
    height: 6,
    flex: 1,
    borderRadius: 3,
  },
  difficultyBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  questionTrackerText: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Complete Specific
  completeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  completeScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  breakdownPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  breakdownText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Buttons
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
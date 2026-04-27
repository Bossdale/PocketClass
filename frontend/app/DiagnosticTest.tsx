import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

// --- IMPORT YOUR AI GENERATOR ---
import { generateAssessmentStream } from '../ai_engine/features/generateAssessment';

import { saveDiagnosticResult, getProfile, getDiagnosticResults, generateId, saveStudyPlan, getLessonsBySubject } from '../lib/store';
import { getStudyPlan } from '../lib/quizService';
import { SUBJECTS, QUARTER_TOPICS } from '../lib/types';
import DiagnosticResultCard from '../components/DiagnosticResultCard';
import type { Profile, DiagnosticResult, StudyPlan } from '../lib/types';

const colors = {
  primary: '#3b82f6', primaryLight: '#eff6ff', primaryDark: '#2563eb',
  success: '#22c55e', successLight: '#f0fdf4', successDark: '#15803d',
  destructive: '#ef4444', destructiveLight: '#fef2f2', destructiveDark: '#b91c1c',
  foreground: '#111827', mutedForeground: '#6b7280', border: '#e5e7eb',
  background: '#f9fafb', white: '#ffffff',
};

export default function DiagnosticTest() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  
  const subject = SUBJECTS.find(s => s.id === subjectId);
  
  // -- STATE MANAGEMENT --
  const [profile, setProfile] = useState<Profile | null>(null);
  const [finalResult, setFinalResult] = useState<DiagnosticResult | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);

  // AI & Quiz State
  const [questions, setQuestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // 1. Initial Load & AI Generation
  useEffect(() => {
    async function initializeTest() {
      // Load Profile & Check Retakes
      const p = await getProfile();
      setProfile(p);
      if (subjectId) {
        const existing = await getDiagnosticResults(subjectId as string);
        if (existing.length > 0) {
          router.replace(`/SubjectView?subjectId=${subjectId}`);
          return;
        }
      }

      // Generate AI Questions for Quarter 1
      setIsGenerating(true);
      try {
        const stream = generateAssessmentStream('diagnostic', 'Q1'); 
        const generatedItems = [];
        
        for await (const q of stream) {
          if (q) {
            // --- LOG THE EXACT AI OUTPUT TO THE TERMINAL ---
            console.log(`\n✅ AI Generated Item ${q.item_number}:`);
            console.log(`Question: ${q.question}`);
            console.log(`Options: ${JSON.stringify(q.options)}`);
            console.log(`Absolute Correct Answer: ${q.correct_answer}`);

            // --- MAP TO UI STATE ---
            generatedItems.push({
              ...q,
              questionText: q.question,
              // Map the string answer back to its exact index in the shuffled array
              correctOption: q.options.indexOf(q.correct_answer) 
            });
          }
        }
        setQuestions(generatedItems);
        setAnswers(new Array(generatedItems.length).fill(null));
      } catch (error) {
        console.error("AI Generation Error:", error);
      } finally {
        setIsGenerating(false);
      }
    }
    initializeTest();
  }, [subjectId]);

  // 2. Handle Answering & Auto-Advance
  const answerQuestion = (selectedIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedIndex;
    setAnswers(newAnswers);

    // Wait 2.5 seconds so the user can read the rationale before moving on!
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsCompleted(true);
      }
    }, 2500); 
  };

  // 3. Process Results upon Completion
  useEffect(() => {
    async function processResults() {
      if (isCompleted && profile && !finalResult && subjectId) {
        // Calculate Score for the 10 items
        let correctCount = 0;
        answers.forEach((ans, i) => {
          if (ans === questions[i].correctOption) correctCount++;
        });
        
        const q1Score = Math.round((correctCount / questions.length) * 100);
        const prevResults = await getDiagnosticResults(subjectId);
        
        const result: DiagnosticResult = {
          id: generateId(),
          userId: profile.id,
          subjectId,
          q1Score: q1Score,
          q2Score: 0, 
          q3Score: 0,
          q4Score: 0,
          overallScore: q1Score, 
          completedAt: new Date().toISOString(),
          attemptNumber: prevResults.length + 1,
        };
        
        await saveDiagnosticResult(result);
        setFinalResult(result);

        // Generate Study Plan
        const allLessons = getLessonsBySubject(subjectId);
        const q1Lessons = allLessons.filter(l => l.quarter === 1).map(l => l.title);
        
        const plan = await getStudyPlan(q1Score, q1Lessons, 0, [], 0, [], 0, []);
        if (plan) {
          await saveStudyPlan(subjectId, plan);
          setStudyPlan(plan);
        }
      }
    }
    processResults();
  }, [isCompleted, profile, finalResult, subjectId, answers, questions]);

  if (!subject || !subjectId || !profile) {
    return <View style={styles.container} />;
  }

  const currentQuestion = questions[currentIndex];

  const getOptionStyle = (isAnswered: boolean, isSelected: boolean, isCorrect: boolean) => {
    if (!isAnswered) return { borderColor: colors.border, backgroundColor: 'transparent', textColor: colors.foreground };
    if (isCorrect) return { borderColor: colors.success, backgroundColor: colors.successLight, textColor: colors.successDark };
    if (isSelected) return { borderColor: colors.destructive, backgroundColor: colors.destructiveLight, textColor: colors.destructiveDark };
    return { borderColor: colors.border, backgroundColor: 'transparent', textColor: colors.mutedForeground };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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

      {/* AI GENERATION STATE */}
      {isGenerating && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.savingText}>AI is generating your custom diagnostic test...</Text>
        </View>
      )}

      {/* ACTIVE TEST STATE */}
      {!isGenerating && !isCompleted && (
        <View>
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

          {showIntro ? (
            <View style={styles.card}>
              <Text style={styles.quarterTitle}>Quarter 1</Text>
              <Text style={styles.quarterDescription}>
                {QUARTER_TOPICS[subjectId]?.[0] || 'Materials and Matter'}
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowIntro(false)}>
                <Text style={styles.primaryButtonText}>Begin Test</Text>
              </TouchableOpacity>
            </View>
          ) : currentQuestion ? (
            <View>
              <View style={styles.questionMetaContainer}>
                <View style={styles.questionMetaBadge}>
                  <Text style={styles.questionMetaText}>
                    Question {currentIndex + 1} of {questions.length}
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
                
                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((opt: string, i: number) => {
                    const answered = answers[currentIndex] !== null;
                    const isSelected = answers[currentIndex] === i;
                    const isCorrect = i === currentQuestion.correctOption;
                    const optionStyle = getOptionStyle(answered, isSelected, isCorrect);

                    return (
                      <TouchableOpacity
                        key={i}
                        activeOpacity={0.7}
                        onPress={() => !answered && answerQuestion(i)}
                        style={[styles.optionButton, { borderColor: optionStyle.borderColor, backgroundColor: optionStyle.backgroundColor }]}
                      >
                        <Text style={[styles.optionText, { color: optionStyle.textColor }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* --- NEW RATIONALE DISPLAY --- */}
                {answers[currentIndex] !== null && (
                  <View style={styles.rationaleContainer}>
                    <Text style={styles.rationaleTitle}>Explanation:</Text>
                    <Text style={styles.rationaleText}>{currentQuestion.rationale}</Text>
                  </View>
                )}

              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* COMPLETION STATE */}
      {isCompleted && finalResult && (
        <View>
          <DiagnosticResultCard result={finalResult} studyPlan={studyPlan} />
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 24 }]}
            onPress={() => router.replace(`/SubjectView?subjectId=${subjectId}`)}
          >
            <Text style={[styles.primaryButtonText, { fontSize: 18 }]}>Start Learning {subject.name}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && !finalResult && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.savingText}>Calculating your results...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 64, paddingBottom: 100 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backText: { fontSize: 14, color: colors.mutedForeground },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  headerEmoji: { fontSize: 36 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.foreground },
  headerSubtitle: { fontSize: 14, color: colors.mutedForeground },
  card: { backgroundColor: colors.white, padding: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 24 },
  progressBarContainer: { flexDirection: 'row', gap: 4, marginBottom: 24 },
  progressSegment: { height: 8, flex: 1, borderRadius: 4 },
  quarterTitle: { fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginBottom: 8 },
  quarterDescription: { color: colors.mutedForeground, textAlign: 'center', marginBottom: 24 },
  primaryButton: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  questionMetaContainer: { alignItems: 'center', marginBottom: 16 },
  questionMetaBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, backgroundColor: colors.primaryLight },
  questionMetaText: { fontSize: 12, fontWeight: '500', color: colors.primaryDark },
  questionText: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 16, textAlign: 'left', width: '100%' },
  optionsContainer: { width: '100%', gap: 12 },
  optionButton: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 2, justifyContent: 'center' },
  optionText: { fontSize: 14, fontWeight: '500' },
  rationaleContainer: { marginTop: 16, padding: 16, backgroundColor: colors.successLight, borderRadius: 8, borderWidth: 1, borderColor: colors.success, width: '100%' },
  rationaleTitle: { fontWeight: 'bold', color: colors.successDark, marginBottom: 4 },
  rationaleText: { color: colors.successDark, lineHeight: 20 },
  savingText: { color: colors.mutedForeground, marginTop: 16 },
});